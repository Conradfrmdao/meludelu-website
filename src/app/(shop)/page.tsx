import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/shop/newsletter-form";
import { Container, ProductGrid, ProductRail, SectionHeader } from "@/components/shop/section";
import { buttonClass } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { getBestSellers, getFeatured, getNewArrivals } from "@/lib/catalog";
import { siteImages } from "@/lib/images";

export const revalidate = 60;

function Arch({
  href,
  label,
  note,
  image,
  tone,
}: {
  href: string;
  label: string;
  note: string;
  image: { url: string; alt: string };
  tone: string;
}) {
  return (
    <Link href={href} className="group block" aria-label={`Shop ${label}`}>
      <div className={`arch relative aspect-[3/4.3] overflow-hidden ${tone}`}>
        <Image
          src={image.url}
          alt={image.alt}
          fill
          priority
          sizes="(min-width: 1024px) 22vw, 46vw"
          className="object-cover transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="font-serif text-[28px] leading-none lg:text-[34px]">{label}</p>
          <p className="mt-1.5 text-[13px] text-muted">{note}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-full border border-line-strong transition-colors duration-200 group-hover:border-charcoal group-hover:bg-charcoal group-hover:text-ivory">
          <ArrowRightIcon size={17} />
        </span>
      </div>
    </Link>
  );
}

function FeaturePanel({
  eyebrow,
  title,
  body,
  href,
  cta,
  image,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  image: { url: string; alt: string };
  reverse?: boolean;
}) {
  return (
    <div className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] lg:aspect-[5/6]">
        <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
      </div>
      <div className="max-w-md">
        <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-taupe">{eyebrow}</p>
        <h2 className="mt-4 font-serif text-[42px] leading-[1.02] lg:text-[60px]">{title}</h2>
        <p className="mt-5 text-[16px] leading-relaxed text-ink-soft">{body}</p>
        <Link href={href} className={buttonClass("primary", "lg", "mt-8")}>
          {cta}
        </Link>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [women, baby, newArrivals, bestSellers] = await Promise.all([
    getFeatured("women", 4),
    getFeatured("baby", 4),
    getNewArrivals(8),
    getBestSellers(4),
  ]);

  return (
    <>
      {/* Hero: the two arches are the way in to Women and Baby. */}
      <section className="pb-16 pt-6 lg:pb-28 lg:pt-14">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-end lg:gap-16">
          <div className="lg:pb-20">
            <h1 className="font-serif text-[46px] leading-[0.98] sm:text-[64px] lg:text-[84px]">
              Soft, simple clothes <em className="text-taupe">for you</em> and your little one.
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-soft lg:text-[17px]">
              Linen dresses, easy knits and baby basics. Priced in shillings, delivered across Uganda, paid with
              Mobile Money.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <Arch href="/women" label="Women" note="Dresses, knits, coats" image={siteImages.heroWomen} tone="bg-women" />
            <Arch
              href="/baby"
              label="Baby"
              note="Newborn to 2 years"
              image={siteImages.heroBaby}
              tone="bg-baby"
            />
          </div>
        </Container>
      </section>

      <section className="bg-women py-16 lg:py-28">
        <Container>
          <FeaturePanel
            eyebrow="Women"
            title="Linen for hot days, knits for cool evenings"
            body="Pieces in quiet colours that work with what you already own. Every item is checked before it leaves us."
            href="/women"
            cta="Shop women"
            image={siteImages.womenFeature}
          />
          {women.length > 0 && (
            <div className="mt-16 lg:mt-24">
              <ProductRail products={women} href="/women" linkLabel="All women's clothing" />
            </div>
          )}
        </Container>
      </section>

      <section className="bg-baby py-16 lg:py-28">
        <Container>
          <FeaturePanel
            eyebrow="Baby"
            title="Gentle on new skin, easy at 3am"
            body="Soft cotton and fine knits with poppers where you need them. Sizes from newborn to two years."
            href="/baby"
            cta="Shop baby"
            image={siteImages.babyFeature}
            reverse
          />
          {baby.length > 0 && (
            <div className="mt-16 lg:mt-24">
              <ProductRail products={baby} href="/baby" linkLabel="All baby clothing" />
            </div>
          )}
        </Container>
      </section>

      {newArrivals.length > 0 && (
        <section className="py-16 lg:py-28">
          <Container>
            <SectionHeader title="New arrivals" intro="The latest pieces to reach us." href="/new-arrivals" />
            <ProductRail products={newArrivals.slice(0, 8)} href="/new-arrivals" />
          </Container>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="pb-16 lg:pb-28">
          <Container>
            <SectionHeader title="Most loved" intro="What customers come back for." />
            <ProductGrid products={bestSellers} />
          </Container>
        </section>
      )}

      {/* Editorial */}
      <section className="pb-16 lg:pb-28">
        <Container>
          <Link
            href="/collections/knits"
            className="group relative block overflow-hidden rounded-[var(--radius-panel)] bg-cream"
          >
            <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
              <Image
                src={siteImages.editorial.url}
                alt={siteImages.editorial.alt}
                fill
                sizes="(min-width: 1400px) 1320px, 100vw"
                className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-soft)] group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-charcoal/10 to-transparent sm:bg-gradient-to-r sm:from-charcoal/50 sm:via-charcoal/10" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-7 text-ivory sm:inset-y-0 sm:flex sm:max-w-lg sm:flex-col sm:justify-end sm:p-12 lg:p-16">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-ivory/80">The knit edit</p>
              <p className="mt-3 font-serif text-[38px] leading-[1.02] lg:text-[56px]">Layers for cool mornings</p>
              <span className="mt-6 inline-flex items-center gap-2 text-[14px]">
                Explore knitwear <ArrowRightIcon size={16} />
              </span>
            </div>
          </Link>
        </Container>
      </section>

      {/* Brand story */}
      <section className="border-t border-line py-16 lg:py-28">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
          <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)] lg:order-1 lg:aspect-[4/5]">
            <Image src={siteImages.story.url} alt={siteImages.story.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <div className="order-1 max-w-lg lg:order-2">
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-taupe">About Meludelu</p>
            <p className="mt-5 font-serif text-[32px] leading-[1.12] lg:text-[44px]">
              A short list of good pieces, chosen with care and priced honestly.
            </p>
            <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">
              Some of what you see is on our shelves and goes out within a day or two. Other pieces we order in from
              makers abroad, and we tell you plainly how long that takes before you pay.
            </p>
            <Link href="/about" className={buttonClass("secondary", "md", "mt-8")}>
              Our story
            </Link>
          </div>
        </Container>
      </section>

      {/* Newsletter */}
      <section className="pb-20 lg:pb-28">
        <Container>
          <div className="rounded-[var(--radius-panel)] bg-charcoal px-7 py-12 text-ivory sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-16 lg:py-16">
            <div className="max-w-md">
              <h2 className="font-serif text-[36px] leading-[1.05] lg:text-[46px]">Hear about new pieces first</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ivory/70">
                An occasional email when something new arrives. No daily messages.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 lg:w-[420px]">
              <NewsletterForm tone="dark" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
