from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def seed_initial_data(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    SystemHealthStatus = apps.get_model("billing", "SystemHealthStatus")

    initial_plans = [
        {
            "name": "Lite",
            "slug": "lite",
            "description": "Essential learning access for students.",
            "details": "Best for regular learners who need affordable access.",
            "features": [
                "Chat access",
                "Basic AI learning help",
                "Member support",
            ],
            "role_to_assign": "lite",
            "amount_cents": 400,
            "currency": "usd",
            "billing_type": "one_time",
            "highlight_text": "Starter",
            "is_active": True,
            "display_order": 10,
        },
        {
            "name": "Pro",
            "slug": "pro",
            "description": "Advanced access for active students and power users.",
            "details": "Recommended plan for users needing full premium workflow.",
            "features": [
                "Everything in Lite",
                "Priority AI access",
                "Higher usage limits",
            ],
            "role_to_assign": "pro",
            "amount_cents": 900,
            "currency": "usd",
            "billing_type": "one_time",
            "highlight_text": "Most Popular",
            "is_active": True,
            "display_order": 20,
        },
        {
            "name": "Enterprise",
            "slug": "enterprise",
            "description": "Premium access for institutions and teams.",
            "details": "For schools and organizations requiring enterprise support.",
            "features": [
                "Everything in Pro",
                "Enterprise workflows",
                "Dedicated support",
            ],
            "role_to_assign": "enterprise",
            "amount_cents": 2900,
            "currency": "usd",
            "billing_type": "one_time",
            "highlight_text": "Institution",
            "is_active": True,
            "display_order": 30,
        },
    ]

    for plan_data in initial_plans:
        Plan.objects.update_or_create(slug=plan_data["slug"], defaults=plan_data)

    SystemHealthStatus.objects.get_or_create(name="Runtime")


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0012_user_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="Plan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(unique=True)),
                ("description", models.TextField()),
                ("details", models.TextField(blank=True)),
                ("features", models.JSONField(blank=True, default=list)),
                ("role_to_assign", models.CharField(choices=[("lite", "Lite"), ("pro", "Pro"), ("enterprise", "Enterprise"), ("user", "User")], max_length=20)),
                ("amount_cents", models.PositiveIntegerField(help_text="Price in smallest currency unit.")),
                ("currency", models.CharField(default="usd", max_length=10)),
                ("billing_type", models.CharField(choices=[("one_time", "One Time"), ("monthly", "Monthly"), ("yearly", "Yearly")], default="one_time", max_length=20)),
                ("stripe_price_id", models.CharField(blank=True, help_text="Optional: use existing Stripe Price ID instead of inline price data.", max_length=120)),
                ("highlight_text", models.CharField(blank=True, max_length=150)),
                ("is_active", models.BooleanField(default=True)),
                ("display_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["display_order", "id"]},
        ),
        migrations.CreateModel(
            name="SystemHealthStatus",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(default="Runtime", max_length=80, unique=True)),
                ("environment_label", models.CharField(blank=True, max_length=120)),
                ("database_target", models.CharField(blank=True, max_length=120)),
                ("database_engine", models.CharField(blank=True, max_length=120)),
                ("database_name", models.CharField(blank=True, max_length=255)),
                ("database_host", models.CharField(blank=True, max_length=255)),
                ("database_port", models.CharField(blank=True, max_length=20)),
                ("database_is_healthy", models.BooleanField(default=False)),
                ("database_error", models.TextField(blank=True)),
                ("redis_url", models.CharField(blank=True, max_length=255)),
                ("redis_is_healthy", models.BooleanField(default=False)),
                ("redis_error", models.TextField(blank=True)),
                ("checked_at", models.DateTimeField(auto_now=True)),
            ],
            options={"verbose_name": "System Health", "verbose_name_plural": "System Health"},
        ),
        migrations.CreateModel(
            name="PlanPurchase",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("stripe_checkout_session_id", models.CharField(max_length=255, unique=True)),
                ("stripe_payment_intent_id", models.CharField(blank=True, max_length=255)),
                ("stripe_customer_id", models.CharField(blank=True, max_length=255)),
                ("amount_total_cents", models.PositiveIntegerField(default=0)),
                ("currency", models.CharField(default="usd", max_length=10)),
                ("payment_status", models.CharField(choices=[("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed"), ("expired", "Expired"), ("refunded", "Refunded")], default="pending", max_length=20)),
                ("role_assigned", models.CharField(blank=True, max_length=20)),
                ("event_payload", models.JSONField(blank=True, default=dict)),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("plan", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="purchases", to="billing.plan")),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="plan_purchases", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.RunPython(seed_initial_data, migrations.RunPython.noop),
    ]
