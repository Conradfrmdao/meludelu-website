import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/shop/section";
import { buttonClass } from "@/components/ui/button";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "About",
  description: "Meludelu is a small Ugandan boutique for women's and baby clothing.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    title: "Fewer, better pieces",
    body: "We keep the range small so we can check every item ourselves before it reaches you.",
  },
  {
    title: "Honest about timing",
    body: "In-stock pieces go out within a day or two. Pieces we order in are clearly marked, with a realistic delivery time, before you pay.",
  },
  {
    title: "Paying the way you already do",
    body: "Mobile Money from your own phone, a quick call to confirm, and no account to set up.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Container className="pb-16 pt-8 lg:pb-24 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end lg:gap-20">
          <h1 className="font-serif text-[52px] leading-[0.98] lg:text-[88px]">
            Clothes we&apos;d choose for ourselves, and for the little ones we love.
          </h1>
          <p className="max-w-md text-[17px] leading-relaxed text-ink-soft lg:pb-3">
            Meludelu is a small boutique for women&apos;s and baby clothing in Uganda. We look for soft natural fabrics,
            simple shapes and colours that last beyond one season, and we price everything clearly in shillings.
          </p>
        </div>
      </Container>
      <Container>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)] sm:aspect-[21/9]">
          <Image src={siteImages.editorial.url} alt={siteImages.editorial.alt} fill priority sizes="100vw" className="object-cover" />
        </div>
      </Container>
      <Container className="py-16 lg:py-28">
        <ul className="grid gap-10 md:grid-cols-3 md:gap-12">
          {principles.map((p, i) => (
            <li key={p.title}>
              <p className="font-serif text-[20px] text-taupe">0{i + 1}</p>
              <h2 className="mt-3 font-serif text-[30px] leading-tight">{p.title}</h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">{p.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-16 flex flex-wrap gap-3">
          <Link href="/women" className={buttonClass("primary", "lg")}>
            Shop women
          </Link>
          <Link href="/baby" className={buttonClass("secondary", "lg")}>
            Shop baby
          </Link>
        </div>
      </Container>
    </>
  );
}
