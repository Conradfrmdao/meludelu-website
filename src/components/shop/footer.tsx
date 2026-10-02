import Link from "next/link";
import { helpNav } from "./nav-links";

const shopLinks = [
  { href: "/women", label: "Women" },
  { href: "/baby", label: "Baby" },
  { href: "/new-arrivals", label: "New arrivals" },
  { href: "/collections", label: "Collections" },
  { href: "/wishlist", label: "Wishlist" },
];

const aboutLinks = [
  { href: "/about", label: "About Meludelu" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-[12px] font-medium uppercase tracking-[0.14em] text-taupe">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[14px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink-soft transition-colors hover:text-charcoal">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-cream/60 pb-28 lg:pb-0">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10 lg:py-20">
        <div className="max-w-xs">
          <p className="font-serif text-[28px] tracking-[0.2em]">MELUDELU</p>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            Clothing for women and babies. Priced in shillings, delivered across Uganda, paid for with Mobile Money.
          </p>
        </div>
        <Column title="Shop" links={shopLinks} />
        <Column title="Help" links={helpNav} />
        <Column title="Meludelu" links={aboutLinks} />
      </div>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 border-t border-line px-5 py-6 text-[12.5px] text-muted sm:flex-row sm:justify-between sm:px-6 lg:px-10">
        <p>© {new Date().getFullYear()} Meludelu</p>
        <p>Prices in Uganda shillings (UGX)</p>
      </div>
    </footer>
  );
}
