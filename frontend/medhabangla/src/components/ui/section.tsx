import React from "react";

import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {}

export function Section({ className, children, ...props }: SectionProps) {
  return (
    <section
      className={cn("w-full px-4 py-10 sm:px-6 lg:px-8", className)}
      {...props}>
      {children}
    </section>
  );
}
