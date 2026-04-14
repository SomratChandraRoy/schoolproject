import React from "react";
import { Link, useSearchParams } from "react-router-dom";

const ContactAdmin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reason =
    searchParams.get("reason") ||
    "Access is currently restricted for your account.";

  const mailSubject = encodeURIComponent("Access Request for SOPAN Account");
  const mailBody = encodeURIComponent(
    `Hello Admin,%0D%0A%0D%0AMy account is currently restricted. Please review and help me regain access.%0D%0A%0D%0AReason shown:%0D%0A${reason}`,
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.35),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(217,119,6,0.28),transparent_45%),linear-gradient(145deg,#020617_0%,#0f172a_50%,#111827_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md md:p-12">
          <p className="mb-4 inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            SOPAN Access Control
          </p>

          <h1 className="text-4xl font-black leading-tight text-white md:text-5xl">
            Your Account Is Restricted
          </h1>

          <p className="mt-4 max-w-2xl text-base text-slate-200 md:text-lg">
            This account currently has the ban role. Please contact the admin
            team for access review.
          </p>

          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-200">
              Reason
            </p>
            <p className="mt-2 text-red-100">{reason}</p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href={`mailto:info@bipul.tech?subject=${mailSubject}&body=${mailBody}`}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.01]">
              Email Admin: info@bipul.tech
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Return To Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactAdmin;
