import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";

import { getApiBaseUrl } from "../lib/apiBaseUrl";
import { getAccessRoleLabel } from "../utils/roleUtils";

type BillingPlan = {
  id: number;
  name: string;
  slug: string;
  description: string;
  details: string;
  features: string[];
  role_to_assign: string;
  role_label: string;
  amount: number;
  amount_cents: number;
  currency: string;
  billing_type: "one_time" | "monthly" | "yearly";
  highlight_text: string;
};

const API_BASE_URL = getApiBaseUrl();

const toApiUrl = (path: string): string => `${API_BASE_URL}${path}`;

const normalizeFeatures = (features: unknown): string[] => {
  if (!Array.isArray(features)) {
    return [];
  }

  return features
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const formatPrice = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
};

const readCurrentRoleFromStorage = (): string => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return "User";
  }

  try {
    const parsedUser = JSON.parse(userStr);
    return getAccessRoleLabel(parsedUser?.role, "User");
  } catch {
    return "User";
  }
};

const Plans: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingPlanId, setBuyingPlanId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>(() =>
    readCurrentRoleFromStorage(),
  );

  const refreshUserProfile = useCallback(async (token: string) => {
    const response = await fetch(toApiUrl("/api/accounts/profile/"), {
      headers: { Authorization: `Token ${token}` },
    });

    if (!response.ok) {
      return;
    }

    const userProfile = await response.json();
    localStorage.setItem("user", JSON.stringify(userProfile));
    setCurrentRole(readCurrentRoleFromStorage());
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(toApiUrl("/api/billing/plans/"));
      if (!response.ok) {
        throw new Error("Could not load plans");
      }

      const data = await response.json();
      const normalized = Array.isArray(data)
        ? data.map((plan) => ({
            ...plan,
            features: normalizeFeatures(plan.features),
          }))
        : [];

      setPlans(normalized);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load plans";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCheckoutSession = useCallback(
    async (sessionId: string) => {
      const token = localStorage.getItem("token");
      if (!token) {
        setStatusMessage("Login is required to verify payment status.");
        return;
      }

      setIsVerifying(true);
      setError("");

      try {
        const response = await fetch(
          toApiUrl(
            `/api/billing/checkout-session-status/?session_id=${encodeURIComponent(sessionId)}`,
          ),
          {
            headers: { Authorization: `Token ${token}` },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to verify checkout session");
        }

        await refreshUserProfile(token);
        setStatusMessage(
          `Payment confirmed. Your role is now ${getAccessRoleLabel(data?.user_role, "updated")}.`,
        );

        navigate("/plans", { replace: true });
      } catch (verifyError) {
        const message =
          verifyError instanceof Error
            ? verifyError.message
            : "Unable to verify payment";
        setError(message);
      } finally {
        setIsVerifying(false);
      }
    },
    [navigate, refreshUserProfile],
  );

  const startCheckout = useCallback(
    async (planId: number) => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setBuyingPlanId(planId);
      setError("");

      try {
        const response = await fetch(toApiUrl("/api/billing/checkout-session/"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ plan_id: planId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Could not start checkout");
        }

        if (!data.checkout_url) {
          throw new Error("Stripe checkout URL not received from server");
        }

        window.location.href = data.checkout_url;
      } catch (checkoutError) {
        const message =
          checkoutError instanceof Error
            ? checkoutError.message
            : "Checkout failed";
        setError(message);
        setBuyingPlanId(null);
      }
    },
    [navigate],
  );

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const checkout = query.get("checkout");
    const sessionId = query.get("session_id");

    if (checkout === "success" && sessionId) {
      void verifyCheckoutSession(sessionId);
      return;
    }

    if (checkout === "cancel") {
      setStatusMessage("Payment was cancelled. No changes were made to your role.");
      navigate("/plans", { replace: true });
    }
  }, [location.search, navigate, verifyCheckoutSession]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2FBF7] via-[#EAF8F2] to-white px-4 py-10 dark:from-[#071E17] dark:via-[#0A2C22] dark:to-[#071E17]">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 rounded-2xl border border-emerald-200/60 bg-white/85 p-6 shadow-sm dark:border-emerald-900/70 dark:bg-[#071C16]/80">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Access Plans
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            Choose your learning plan
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Your current role: <span className="font-semibold">{currentRole}</span>
          </p>
        </div>

        {statusMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">{statusMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/25 dark:text-red-200">
            {error}
          </div>
        )}

        {(loading || isVerifying) && (
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isVerifying ? "Verifying payment status..." : "Loading plans..."}
          </div>
        )}

        {!loading && plans.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700 dark:border-gray-800 dark:bg-[#101010] dark:text-gray-200">
            No active plans available right now. Add plans from Django admin.
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isBuying = buyingPlanId === plan.id;

            return (
              <article
                key={plan.id}
                className="relative flex h-full flex-col rounded-2xl border border-emerald-200/60 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-emerald-900/70 dark:bg-[#071C16]/80">
                {plan.highlight_text && (
                  <span className="absolute top-4 right-4 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    {plan.highlight_text}
                  </span>
                )}

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>

                {plan.details && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{plan.details}</p>
                )}

                <div className="mt-5">
                  <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatPrice(plan.amount, plan.currency)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {plan.billing_type.replace("_", " ")} • role: {plan.role_label || plan.role_to_assign}
                  </p>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                  {plan.features.map((feature) => (
                    <li key={`${plan.id}-${feature}`} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => void startCheckout(plan.id)}
                  disabled={isBuying || isVerifying}
                  className="mt-auto rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400">
                  {isBuying ? "Redirecting to Stripe..." : `Buy ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Plans;
