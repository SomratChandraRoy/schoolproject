from django.urls import path

from .views import (
    BillingConfigView,
    CheckoutSessionStatusView,
    CreateCheckoutSessionView,
    MyPlanPurchasesView,
    PlanListView,
    StripeWebhookView,
)

urlpatterns = [
    path("config/", BillingConfigView.as_view(), name="billing-config"),
    path("plans/", PlanListView.as_view(), name="billing-plans"),
    path("checkout-session/", CreateCheckoutSessionView.as_view(), name="billing-checkout-session"),
    path("checkout-session-status/", CheckoutSessionStatusView.as_view(), name="billing-checkout-session-status"),
    path("purchases/", MyPlanPurchasesView.as_view(), name="billing-purchases"),
    path("webhook/", StripeWebhookView.as_view(), name="billing-webhook"),
]
