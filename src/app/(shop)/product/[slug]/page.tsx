import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shop/page-intro";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { Container, ProductRail, SectionHeader } from "@/components/shop/section";
import { PlaneIcon, ReturnIcon, TruckIcon } from "@/components/ui/icons";
import { getProduct, getRelated } from "@/lib/catalog";
import { formatUGX } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Not found" };
  const description = product.seoDescription ?? product.description.slice(0, 155);
  return {
    title: product.seoTitle ?? product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt })),
    },
  };
}

function structuredData(product: Product) {
  const availability = (status: string) =>
    status === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : status === "in_stock" || status === "low_stock"
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "Meludelu" },
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      price: v.price,
      priceCurrency: "UGX",
      availability: availability(v.stockStatus),
      url: `${siteUrl()}/product/${product.slug}`,
    })),
  };
}

function InfoRow({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-4">
      <span className="mt-0.5 text-taupe">{icon}</span>
      <div>
        <p className="text-[14px] font-medium">{title}</p>
        <div className="mt-1 text-[13.5px] leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}

function Disclosure({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[15px] [&::-webkit-details-marker]:hidden">
        {title}
        <span className="relative size-3.5" aria-hidden="true">
          <span className="absolute inset-x-0 top-1/2 h-px bg-charcoal" />
          <span className="absolute inset-y-0 left-1/2 w-px bg-charcoal transition-transform duration-200 group-open:scale-y-0" />
        </span>
      </summary>
      <div className="pb-6 text-[14.5px] leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([getRelated(product, 4), getSettings()]);
  const external = product.supplierType === "EXTERNAL_SUPPLIER";
  const leadTime = settings.delivery.internationalLeadTime;
  const zones = settings.delivery.zones;
  const cheapestZone = zones.reduce((min, z) => (z.fee < min ? z.fee : min), zones[0]?.fee ?? 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(product)).replace(/</g, "\\u003c") }}
      />
      <Container className="pb-16 pt-4 lg:pb-24 lg:pt-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: `/${product.department}`, label: product.departmentName },
            { href: `/${product.department}/${product.categorySlug}`, label: product.categoryName },
            { href: `/product/${product.slug}`, label: product.name },
          ]}
        />
        <div className="mt-5 grid gap-8 lg:mt-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductPurchase product={product} leadTime={leadTime} />

            <div className="mt-8 divide-y divide-line border-y border-line">
              {external ? (
                <InfoRow icon={<PlaneIcon />} title="Ordered in for you">
                  We order this piece from our maker abroad once you&apos;ve paid. It usually reaches you in {leadTime}.
                  We&apos;ll call you if anything changes.
                </InfoRow>
              ) : (
                <InfoRow icon={<TruckIcon />} title="Ready to send">
                  In our Kampala studio now. Delivery in Kampala takes {zones[0]?.eta ?? "1–2 working days"}
                  {cheapestZone ? `, from ${formatUGX(cheapestZone)}` : ""}.
                </InfoRow>
              )}
              <InfoRow icon={<ReturnIcon />} title="Exchanges">
                Not the right size? Tell us within 7 days of delivery. <Link href="/help/returns" className="underline underline-offset-4">How exchanges work</Link>
              </InfoRow>
            </div>

            <div className="mt-2">
              <Disclosure title="Description" open>
                <p>{product.description}</p>
              </Disclosure>
              {product.details && (
                <Disclosure title="Details">
                  <ul className="list-disc space-y-1 pl-5 marker:text-taupe">
                    {product.details.split("\n").filter(Boolean).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </Disclosure>
              )}
              {product.care && (
                <Disclosure title="Care">
                  <p>{product.care}</p>
                </Disclosure>
              )}
              <Disclosure title="Delivery">
                <ul className="space-y-1.5">
                  {zones.map((z) => (
                    <li key={z.id} className="flex justify-between gap-4">
                      <span>
                        {z.label} <span className="text-muted">· {z.eta}</span>
                      </span>
                      <span className="tabular-nums">{formatUGX(z.fee)}</span>
                    </li>
                  ))}
                </ul>
                {external && <p className="mt-3 text-muted">Add {leadTime} for pieces ordered in from abroad.</p>}
              </Disclosure>
            </div>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-line py-16 lg:py-24">
          <Container>
            <SectionHeader title="You may also like" href={`/${product.department}`} linkLabel={`More ${product.departmentName.toLowerCase()}`} />
            <ProductRail products={related} />
          </Container>
        </section>
      )}
    </>
  );
}
