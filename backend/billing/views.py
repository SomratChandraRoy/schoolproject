import json
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from .models import Plan, PlanPurchase
from .serializers import CreateCheckoutSessionSerializer, PlanPurchaseSerializer, PlanSerializer

try:
    import stripe
except Exception:  # pragma: no cover - handled by runtime configuration response
    stripe = None


def _append_query_params(url, params, safe=""):
    parsed = urlparse(url)
    existing = dict(parse_qsl(parsed.query, keep_blank_values=True))
    existing.update(params)
    return urlunparse(parsed._replace(query=urlencode(existing, safe=safe)))


def _stripe_is_configured():
    return bool(stripe and getattr(settings, "STRIPE_SECRET_KEY", ""))


def _apply_plan_role(user, role_to_assign):
    valid_roles = {value for value, _ in User.ROLE_CHOICES}

    if role_to_assign not in valid_roles:
        return

    user.role = role_to_assign

    member_roles = {User.ROLE_LITE, User.ROLE_PRO, User.ROLE_ENTERPRISE}
    user.is_member = role_to_assign in member_roles

    if role_to_assign != User.ROLE_BAN:
        user.is_banned = False
        user.ban_reason = None

        if not user.is_teacher and not user.is_admin:
            user.is_student = True

    user.save(update_fields=["role", "is_member", "is_banned", "ban_reason", "is_student"])


def _to_session_dict(session_obj):
    if isinstance(session_obj, dict):
        return session_obj

    if hasattr(session_obj, "to_dict_recursive"):
        return session_obj.to_dict_recursive()

    return {}


def _sync_purchase_from_session(session_obj):
    session_data = _to_session_dict(session_obj)
    metadata = session_data.get("metadata") or {}

    checkout_session_id = session_data.get("id", "")
    if not checkout_session_id:
        return None

    user_id = metadata.get("user_id") or session_data.get("client_reference_id")
    plan_id = metadata.get("plan_id")

    user = User.objects.filter(id=user_id).first() if user_id else None
    plan = Plan.objects.filter(id=plan_id).first() if plan_id else None

    stripe_status = session_data.get("payment_status", "")
    mapped_status = PlanPurchase.STATUS_PENDING

    if stripe_status in {"paid", "no_payment_required"}:
        mapped_status = PlanPurchase.STATUS_PAID
    elif stripe_status in {"unpaid", "requires_payment_method"}:
        mapped_status = PlanPurchase.STATUS_PENDING

    defaults = {
        "user": user,
        "plan": plan,
        "stripe_payment_intent_id": session_data.get("payment_intent") or "",
        "stripe_customer_id": session_data.get("customer") or "",
        "amount_total_cents": session_data.get("amount_total") or 0,
        "currency": session_data.get("currency") or "usd",
        "payment_status": mapped_status,
        "event_payload": session_data,
    }

    purchase, _ = PlanPurchase.objects.update_or_create(
        stripe_checkout_session_id=checkout_session_id,
        defaults=defaults,
    )

    if mapped_status == PlanPurchase.STATUS_PAID:
        role_to_assign = metadata.get("role_to_assign") or (plan.role_to_assign if plan else "")

        if user and role_to_assign:
            _apply_plan_role(user, role_to_assign)
            purchase.role_assigned = role_to_assign

        if not purchase.paid_at:
            purchase.paid_at = timezone.now()

        purchase.payment_status = PlanPurchase.STATUS_PAID
        purchase.save(update_fields=["role_assigned", "paid_at", "payment_status", "updated_at"])

    return purchase


def _mark_purchase_status(session_id, target_status):
    if not session_id:
        return

    PlanPurchase.objects.filter(stripe_checkout_session_id=session_id).update(
        payment_status=target_status,
        updated_at=timezone.now(),
    )


class BillingConfigView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        publishable_key = getattr(settings, "STRIPE_PUBLISHABLE_KEY", "")

        return Response(
            {
                "publishable_key": publishable_key,
                "checkout_enabled": bool(publishable_key and _stripe_is_configured()),
            }
        )


class PlanListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = Plan.objects.filter(is_active=True).order_by("display_order", "id")
        serializer = PlanSerializer(queryset, many=True)
        return Response(serializer.data)


class CreateCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not _stripe_is_configured():
            return Response(
                {"error": "Stripe is not configured on server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = Plan.objects.filter(id=serializer.validated_data["plan_id"], is_active=True).first()
        if not plan:
            return Response({"error": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)

        stripe.api_key = settings.STRIPE_SECRET_KEY

        success_url = _append_query_params(
            settings.STRIPE_SUCCESS_URL,
            {"checkout": "success", "session_id": "{CHECKOUT_SESSION_ID}"},
            safe="{}",
        )
        cancel_url = _append_query_params(
            settings.STRIPE_CANCEL_URL,
            {"checkout": "cancel"},
        )

        line_item = (
            {"price": plan.stripe_price_id, "quantity": 1}
            if plan.stripe_price_id
            else {
                "price_data": {
                    "currency": plan.currency.lower(),
                    "unit_amount": plan.amount_cents,
                    "product_data": {
                        "name": plan.name,
                        "description": plan.description,
                    },
                },
                "quantity": 1,
            }
        )

        try:
            session = stripe.checkout.Session.create(
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                line_items=[line_item],
                customer_email=request.user.email or None,
                client_reference_id=str(request.user.id),
                metadata={
                    "plan_id": str(plan.id),
                    "user_id": str(request.user.id),
                    "role_to_assign": plan.role_to_assign,
                },
                allow_promotion_codes=True,
            )
        except Exception as exc:
            return Response(
                {"error": f"Stripe checkout session failed: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _sync_purchase_from_session(session)
        session_dict = _to_session_dict(session)

        return Response(
            {
                "checkout_url": session_dict.get("url"),
                "session_id": session_dict.get("id"),
            },
            status=status.HTTP_201_CREATED,
        )


class CheckoutSessionStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get("session_id", "").strip()
        if not session_id:
            return Response({"error": "session_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not _stripe_is_configured():
            return Response(
                {"error": "Stripe is not configured on server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except Exception as exc:
            return Response(
                {"error": f"Failed to read checkout session: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_data = _to_session_dict(session)
        metadata = session_data.get("metadata") or {}
        owner_id = metadata.get("user_id") or session_data.get("client_reference_id")

        if owner_id and str(owner_id) != str(request.user.id):
            return Response(
                {"error": "This checkout session does not belong to the current user."},
                status=status.HTTP_403_FORBIDDEN,
            )

        purchase = _sync_purchase_from_session(session)
        request.user.refresh_from_db(fields=["role", "is_member", "is_banned", "ban_reason"])

        if purchase is None:
            return Response(
                {"error": "Checkout session payload is missing session id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "checkout_status": session_data.get("status"),
                "payment_status": session_data.get("payment_status"),
                "purchase": PlanPurchaseSerializer(purchase).data,
                "user_role": request.user.role,
                "is_member": request.user.is_member,
            }
        )


class MyPlanPurchasesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        purchases = PlanPurchase.objects.filter(user=request.user).order_by("-created_at")[:50]
        serializer = PlanPurchaseSerializer(purchases, many=True)
        return Response(serializer.data)


class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not _stripe_is_configured():
            return Response(
                {"error": "Stripe is not configured on server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY

        payload = request.body
        signature = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            if settings.STRIPE_WEBHOOK_SECRET:
                event = stripe.Webhook.construct_event(
                    payload=payload,
                    sig_header=signature,
                    secret=settings.STRIPE_WEBHOOK_SECRET,
                )
            else:
                event = json.loads(payload.decode("utf-8"))
        except Exception as exc:
            return Response(
                {"error": f"Invalid webhook payload: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = event.get("type")
        event_object = (event.get("data") or {}).get("object") or {}
        session_id = event_object.get("id", "")

        if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
            _sync_purchase_from_session(event_object)

        if event_type in {"checkout.session.expired"}:
            _mark_purchase_status(session_id, PlanPurchase.STATUS_EXPIRED)

        if event_type in {"checkout.session.async_payment_failed"}:
            _mark_purchase_status(session_id, PlanPurchase.STATUS_FAILED)

        return Response({"received": True})
