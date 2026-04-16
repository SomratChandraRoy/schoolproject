import os

from django.conf import settings
from django.db import connections, models

from accounts.models import User


def _env_bool(value):
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


class Plan(models.Model):
    ROLE_CHOICES = [
        (User.ROLE_LITE, "Lite"),
        (User.ROLE_PRO, "Pro"),
        (User.ROLE_ENTERPRISE, "Enterprise"),
        (User.ROLE_USER, "User"),
    ]

    BILLING_TYPE_ONE_TIME = "one_time"
    BILLING_TYPE_MONTHLY = "monthly"
    BILLING_TYPE_YEARLY = "yearly"
    BILLING_TYPE_CHOICES = [
        (BILLING_TYPE_ONE_TIME, "One Time"),
        (BILLING_TYPE_MONTHLY, "Monthly"),
        (BILLING_TYPE_YEARLY, "Yearly"),
    ]

    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    details = models.TextField(blank=True)
    features = models.JSONField(default=list, blank=True)
    role_to_assign = models.CharField(max_length=20, choices=ROLE_CHOICES)

    amount_cents = models.PositiveIntegerField(help_text="Price in smallest currency unit.")
    currency = models.CharField(max_length=10, default="usd")
    billing_type = models.CharField(
        max_length=20,
        choices=BILLING_TYPE_CHOICES,
        default=BILLING_TYPE_ONE_TIME,
    )

    stripe_price_id = models.CharField(
        max_length=120,
        blank=True,
        help_text="Optional: use existing Stripe Price ID instead of inline price data.",
    )

    highlight_text = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"{self.name} ({self.currency.upper()} {self.amount_cents / 100:.2f})"


class PlanPurchase(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PAID = "paid"
    STATUS_FAILED = "failed"
    STATUS_EXPIRED = "expired"
    STATUS_REFUNDED = "refunded"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="plan_purchases",
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchases",
    )

    stripe_checkout_session_id = models.CharField(max_length=255, unique=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True)

    amount_total_cents = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=10, default="usd")
    payment_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    role_assigned = models.CharField(max_length=20, blank=True)
    event_payload = models.JSONField(default=dict, blank=True)

    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.stripe_checkout_session_id} - {self.payment_status}"


class SystemHealthStatus(models.Model):
    name = models.CharField(max_length=80, unique=True, default="Runtime")

    environment_label = models.CharField(max_length=120, blank=True)

    database_target = models.CharField(max_length=120, blank=True)
    database_engine = models.CharField(max_length=120, blank=True)
    database_name = models.CharField(max_length=255, blank=True)
    database_host = models.CharField(max_length=255, blank=True)
    database_port = models.CharField(max_length=20, blank=True)
    database_is_healthy = models.BooleanField(default=False)
    database_error = models.TextField(blank=True)

    redis_url = models.CharField(max_length=255, blank=True)
    redis_is_healthy = models.BooleanField(default=False)
    redis_error = models.TextField(blank=True)

    checked_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System Health"
        verbose_name_plural = "System Health"

    def __str__(self):
        return self.name

    @classmethod
    def ensure_singleton(cls):
        obj, _ = cls.objects.get_or_create(name="Runtime")
        return obj

    @staticmethod
    def _resolve_database_target(engine, host):
        host_lower = (host or "").lower()

        if "sqlite3" in (engine or ""):
            return "Local SQLite"

        if "ondigitalocean.com" in host_lower:
            return "DigitalOcean Managed PostgreSQL"

        if host in {"db", "postgres", "postgresql"}:
            return "Docker PostgreSQL"

        if host in {"localhost", "127.0.0.1"}:
            if _env_bool(os.getenv("DOCKER_ENV")):
                return "Local Docker PostgreSQL"
            return "Local PostgreSQL"

        if host:
            return "Custom PostgreSQL"

        return "Unknown"

    @staticmethod
    def _resolve_environment_label(database_target):
        debug = bool(getattr(settings, "DEBUG", False))
        is_docker = _env_bool(os.getenv("DOCKER_ENV"))

        if database_target == "DigitalOcean Managed PostgreSQL":
            return "DigitalOcean Production" if not debug else "DigitalOcean (Debug)"

        if debug and is_docker:
            return "Local Docker"

        if debug:
            return "Development"

        if is_docker:
            return "Docker Production"

        return "Production"

    @staticmethod
    def _check_database_health():
        try:
            with connections["default"].cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            return True, ""
        except Exception as exc:
            return False, str(exc)

    @staticmethod
    def _check_redis_health(redis_url):
        if not redis_url:
            return False, "REDIS_URL is not configured"

        try:
            import redis

            client = redis.Redis.from_url(
                redis_url,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            client.ping()
            return True, ""
        except Exception as exc:
            return False, str(exc)

    def refresh_status(self, save=True):
        db_config = settings.DATABASES.get("default", {})

        engine = str(db_config.get("ENGINE", ""))
        name = str(db_config.get("NAME", ""))
        host = str(db_config.get("HOST", ""))
        port = str(db_config.get("PORT", ""))
        redis_url = str(getattr(settings, "REDIS_URL", "") or os.getenv("REDIS_URL", "")).strip()

        self.database_engine = engine
        self.database_name = name
        self.database_host = host
        self.database_port = port
        self.database_target = self._resolve_database_target(engine, host)
        self.environment_label = self._resolve_environment_label(self.database_target)

        db_ok, db_error = self._check_database_health()
        self.database_is_healthy = db_ok
        self.database_error = db_error

        redis_ok, redis_error = self._check_redis_health(redis_url)
        self.redis_url = redis_url
        self.redis_is_healthy = redis_ok
        self.redis_error = redis_error

        if save:
            self.save()

        return self
