from rest_framework import serializers

from .models import Plan, PlanPurchase


class PlanSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()
    role_label = serializers.CharField(source="get_role_to_assign_display", read_only=True)

    class Meta:
        model = Plan
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "details",
            "features",
            "role_to_assign",
            "role_label",
            "amount_cents",
            "amount",
            "currency",
            "billing_type",
            "stripe_price_id",
            "highlight_text",
            "is_active",
            "display_order",
        )

    def get_amount(self, obj):
        return round(obj.amount_cents / 100, 2)


class CreateCheckoutSessionSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField(min_value=1)


class PlanPurchaseSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name", read_only=True)

    class Meta:
        model = PlanPurchase
        fields = (
            "id",
            "plan",
            "plan_name",
            "stripe_checkout_session_id",
            "stripe_payment_intent_id",
            "stripe_customer_id",
            "amount_total_cents",
            "currency",
            "payment_status",
            "role_assigned",
            "paid_at",
            "created_at",
            "updated_at",
        )
