import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyStaffSession } from "@/lib/wheel/core";
import { wheelRuntime, STAFF_COOKIE } from "@/lib/wheel/runtime";
import StaffLogin from "./StaffLogin";
import StaffDashboard from "./StaffDashboard";

export const metadata: Metadata = {
  title: "Coco Wheel — staff",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/wheel/staff" },
};
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const rt = wheelRuntime();
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  const signedIn = Boolean(rt && verifyStaffSession(token, rt.ctx.secret, rt.ctx.now()));
  return (
    <section className="wrap staff">
      <p className="eyebrow">STAFF ONLY</p>
      <h1>Coco Wheel till tools</h1>
      {!rt ? <p className="wheel-note">The wheel isn’t set up on this deployment yet (Redis and WHEEL_SECRET are missing).</p>
        : signedIn ? <StaffDashboard demo={rt.demo} /> : <StaffLogin demo={rt.demo} />}
    </section>
  );
}
