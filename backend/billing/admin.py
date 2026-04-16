from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import Plan, PlanPurchase, SystemHealthStatus


@admin.register(Plan)
class PlanAdmin(ModelAdmin):
    list_display = (
        "name",
        "slug",
        "role_to_assign",
        "amount_cents",
        "currency",
        "billing_type",
        "is_active",
        "display_order",
        "updated_at",
    )
    list_filter = ("role_to_assign", "billing_type", "currency", "is_active")
    list_editable = ("is_active", "display_order")
    search_fields = ("name", "slug", "description", "details")
    prepopulated_fields = {"slug": ("name",)}

    fieldsets = (
        (
            "Plan Basics",
            {
                "fields": (
                    "name",
                    "slug",
                    "description",
                    "details",
                    "features",
                    "highlight_text",
                )
            },
        ),
        (
            "Access & Price",
            {
                "fields": (
                    "role_to_assign",
                    "amount_cents",
                    "currency",
                    "billing_type",
                    "stripe_price_id",
                )
            },
        ),
        (
            "Display",
            {"fields": ("is_active", "display_order")},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )

    readonly_fields = ("created_at", "updated_at")


@admin.register(PlanPurchase)
class PlanPurchaseAdmin(ModelAdmin):
    list_display = (
        "stripe_checkout_session_id",
        "user",
        "plan",
        "payment_status",
        "amount_total_cents",
        "currency",
        "role_assigned",
        "paid_at",
        "created_at",
    )
    list_filter = ("payment_status", "currency", "role_assigned", "created_at")
    search_fields = (
        "stripe_checkout_session_id",
        "stripe_payment_intent_id",
        "stripe_customer_id",
        "user__username",
        "user__email",
        "plan__name",
    )

    readonly_fields = (
        "user",
        "plan",
        "stripe_checkout_session_id",
        "stripe_payment_intent_id",
        "stripe_customer_id",
        "amount_total_cents",
        "currency",
        "payment_status",
        "role_assigned",
        "event_payload",
        "paid_at",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False


@admin.register(SystemHealthStatus)
class SystemHealthStatusAdmin(ModelAdmin):
    list_display = (
        "name",
        "environment_label",
        "database_target",
        "database_is_healthy",
        "redis_is_healthy",
        "checked_at",
    )
    readonly_fields = (
        "name",
        "environment_label",
        "database_target",
        "database_engine",
        "database_name",
        "database_host",
        "database_port",
        "database_is_healthy",
        "database_error",
        "redis_url",
        "redis_is_healthy",
        "redis_error",
        "checked_at",
    )
    actions = ["refresh_selected_health_checks"]

    def has_add_permission(self, request):
        return not SystemHealthStatus.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Refresh selected health checks")
    def refresh_selected_health_checks(self, request, queryset):
        if not queryset.exists():
            queryset = SystemHealthStatus.objects.filter(pk=SystemHealthStatus.ensure_singleton().pk)

        refreshed_count = 0
        for status_row in queryset:
            status_row.refresh_status(save=True)
            refreshed_count += 1

        self.message_user(request, f"Refreshed {refreshed_count} health record(s).")

    def changelist_view(self, request, extra_context=None):
        SystemHealthStatus.ensure_singleton().refresh_status(save=True)
        return super().changelist_view(request, extra_context=extra_context)
