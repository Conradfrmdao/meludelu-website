import type { Metadata } from "next";
import { setTeamMemberActive } from "@/app/actions/admin-store";
import { AdminHeader, Panel } from "@/components/admin/layout-bits";
import { SettingsForm } from "@/components/admin/settings-form";
import { AddTeamMemberForm, ChangePasswordForm } from "@/components/admin/team-forms";
import { listAdmins } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const owner = admin.role === "owner";
  const [settings, team] = await Promise.all([getSettings(), owner ? listAdmins() : Promise.resolve([])]);

  return (
    <>
      <AdminHeader title="Settings" intro={owner ? "Payments, delivery, contact details and team access." : "Your account."} />
      <div className="space-y-6">
        {owner && <SettingsForm initial={settings} />}

        {owner && (
          <Panel title="Team">
            <ul className="mb-6 divide-y divide-line">
              {team.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <div className="min-w-0 flex-1">
                    <p className={`text-[14.5px] ${m.is_active ? "" : "text-muted line-through"}`}>{m.name}</p>
                    <p className="text-[12.5px] text-muted">
                      {m.email} · <span className="capitalize">{m.role}</span>
                      {m.last_login_at && ` · last in ${formatDate(m.last_login_at)}`}
                    </p>
                  </div>
                  {m.id !== admin.id && (
                    <form action={setTeamMemberActive}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="active" value={String(!m.is_active)} />
                      <button type="submit" className="text-[13px] text-muted underline underline-offset-4 hover:text-charcoal">
                        {m.is_active ? "Remove access" : "Restore access"}
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <AddTeamMemberForm />
          </Panel>
        )}

        <Panel title="Your password">
          <ChangePasswordForm />
        </Panel>
      </div>
    </>
  );
}
