import React from "react";
import { Gem, ShieldCheck, Sparkles } from "lucide-react";

import Pricing from "../components/sections/pricing/default";
import { PricingColumnProps } from "../components/ui/pricing-column";
import { getAccessRoleLabel } from "../utils/roleUtils";

const plans: PricingColumnProps[] = [
  {
    name: "Lite",
    icon: <Sparkles className="size-4" />,
    description: "Basic chat access for everyday learning support.",
    price: 4,
    priceNote: "Monthly equivalent shown. Contact admin for activation.",
    cta: {
      variant: "default",
      label: "Choose Lite",
      href: "/contact-admin?reason=Upgrade%20request%20for%20Lite%20plan",
    },
    features: [
      "Access to /chat page",
      "1:1 member messaging",
      "AI assistant in chat workspace",
    ],
    variant: "default",
  },
  {
    name: "Pro",
    icon: <Gem className="size-4" />,
    description: "Best for active students who need full chat productivity.",
    price: 9,
    priceNote: "Monthly equivalent shown. Contact admin for activation.",
    cta: {
      variant: "glow",
      label: "Choose Pro",
      href: "/contact-admin?reason=Upgrade%20request%20for%20Pro%20plan",
    },
    features: [
      "Everything in Lite",
      "Priority AI response routing",
      "Extended chat history workflows",
    ],
    variant: "glow-brand",
  },
  {
    name: "Enterprise",
    icon: <ShieldCheck className="size-4" />,
    description: "For institutions and premium teams needing scale.",
    price: 29,
    priceNote: "Monthly equivalent shown. Contact admin for activation.",
    cta: {
      variant: "default",
      label: "Choose Enterprise",
      href: "/contact-admin?reason=Upgrade%20request%20for%20Enterprise%20plan",
    },
    features: [
      "Everything in Pro",
      "Higher operational limits",
      "Enterprise support channel",
    ],
    variant: "glow",
  },
];

const Plans: React.FC = () => {
  const userStr = localStorage.getItem("user");
  let currentRole = "User";

  if (userStr) {
    try {
      const parsedUser = JSON.parse(userStr);
      currentRole = getAccessRoleLabel(parsedUser?.role, "User");
    } catch {
      currentRole = "User";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2FBF7] via-[#EAF8F2] to-white dark:from-[#071E17] dark:via-[#0A2C22] dark:to-[#071E17]">
      <div className="mx-auto max-w-7xl py-8">
        

        <Pricing
          title="Choose your access plan"
          description="Lite, Pro, and Enterprise roles unlock the /chat experience."
          plans={plans}
          className="pb-16"
        />
      </div>
    </div>
  );
};

export default Plans;
