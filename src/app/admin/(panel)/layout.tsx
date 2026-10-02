import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Meludelu admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const settings = await getSettings();
  const missingMerchant = !settings.payments.mtn.merchantCode && !settings.payments.airtel.merchantCode;

  return (
    <AdminShell admin={{ name: admin.name, role: admin.role }}>
      {missingMerchant && admin.role === "owner" && (
        <div className="mb-6 rounded-2xl bg-warning-soft px-4 py-3 text-[14px] text-warning">
          No Mobile Money merchant codes yet. Customers are told you&apos;ll call them to arrange payment.{" "}
          <Link href="/admin/settings" className="font-medium underline underline-offset-4">
            Add merchant codes
          </Link>
        </div>
      )}
      {children}
    </AdminShell>
  );
}
