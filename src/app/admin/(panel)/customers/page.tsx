import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/layout-bits";
import { getNewsletterCount, listCustomers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { displayPhone, formatDate, formatUGX } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const [customers, subscribers] = await Promise.all([listCustomers(q), getNewsletterCount()]);

  return (
    <>
      <AdminHeader
        title="Customers"
        intro={`Everyone who has placed an order. ${subscribers} ${subscribers === 1 ? "person has" : "people have"} joined the email list.`}
      />
      <form role="search" className="mb-5">
        <label htmlFor="cust-q" className="sr-only">
          Search customers
        </label>
        <input
          id="cust-q"
          name="q"
          defaultValue={q}
          placeholder="Name, phone or email"
          className="h-10 w-full rounded-full border border-line bg-white px-4 text-[14px] focus:border-charcoal focus:outline-none sm:w-72"
        />
      </form>
      {customers.length === 0 ? (
        <div className="rounded-[var(--radius-card)] bg-ivory px-6 py-16 text-center ring-1 ring-line">
          <p className="font-serif text-[26px]">No customers yet</p>
          <p className="mt-1 text-[14px] text-muted">They appear here after their first order.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-ivory ring-1 ring-line">
          {customers.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px]">{c.name}</p>
                <p className="text-[12.5px] text-muted">
                  <a href={`tel:+${c.phone}`} className="tabular-nums hover:text-charcoal">
                    {displayPhone(c.phone)}
                  </a>
                  {c.email && ` · ${c.email}`}
                </p>
              </div>
              <div className="text-right text-[13.5px]">
                <Link href={`/admin/orders?filter=all&q=${c.phone}`} className="hover:underline">
                  {c.orders} {c.orders === 1 ? "order" : "orders"}
                </Link>
                <p className="text-[12.5px] tabular-nums text-muted">{formatUGX(c.spent)} paid</p>
              </div>
              <p className="w-28 text-right text-[12.5px] text-muted">{c.last_order ? formatDate(c.last_order) : "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
