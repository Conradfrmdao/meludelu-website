"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type ProductFormState, saveProduct } from "@/app/actions/admin-products";
import { Button } from "@/components/ui/button";
import { CloseIcon, PlusIcon } from "@/components/ui/icons";
import type { EditableProduct, EditableVariant } from "@/lib/admin/queries";
import { blankVariant } from "@/lib/admin/product-defaults";
import { formatUGX } from "@/lib/format";
import { marginPercent, markupPrice } from "@/lib/pricing";

const input =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14px] focus:border-charcoal focus:outline-none aria-[invalid=true]:border-danger";
const label = "mb-1.5 block text-[13px] text-ink-soft";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] bg-ivory p-5 ring-1 ring-line lg:p-6">
      <h2 className="text-[15px] font-medium">{title}</h2>
      {intro && <p className="mt-1 text-[13px] text-muted">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function numberOrNull(value: string): number | null {
  const n = Number(value.replace(/[^\d.]/g, ""));
  return value.trim() === "" || Number.isNaN(n) ? null : Math.round(n);
}

export function ProductForm({
  initial,
  categories,
  suppliers,
  isOwner,
}: {
  initial: EditableProduct;
  categories: { id: string; label: string }[];
  suppliers: string[];
  isOwner: boolean;
}) {
  const [p, setP] = useState<EditableProduct>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [bulkSizes, setBulkSizes] = useState("");
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, { error: null, fieldErrors: {} });
  const fe = state.fieldErrors;
  const stocked = p.supplierType === "MELUDELU_STOCK";

  const set = <K extends keyof EditableProduct>(key: K, value: EditableProduct[K]) => setP((cur) => ({ ...cur, [key]: value }));
  const setVariant = (i: number, patch: Partial<EditableVariant>) =>
    setP((cur) => ({ ...cur, variants: cur.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  const suggested = (cost: number | null) =>
    cost && p.markupMultiplier ? markupPrice(cost, p.markupMultiplier, p.priceRounding) : null;

  const applyMarkupToAll = () =>
    setP((cur) => ({
      ...cur,
      variants: cur.variants.map((v) => {
        const s = suggested(v.supplierCost);
        return s ? { ...v, retailPrice: s } : v;
      }),
    }));

  const addSizes = () => {
    const sizes = bulkSizes.split(",").map((s) => s.trim()).filter(Boolean);
    if (!sizes.length) return;
    const template = p.variants[p.variants.length - 1] ?? blankVariant();
    const existing = p.variants.filter((v) => v.size || v.colorName || v.retailPrice);
    set("variants", [
      ...existing,
      ...sizes.map((size) => blankVariant({ ...template, id: null, sku: "", size, quantity: 0 })),
    ]);
    setBulkSizes("");
  };

  return (
    <form action={action} className="space-y-6 pb-28">
      <input type="hidden" name="payload" value={JSON.stringify(p)} />

      {state.error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger">
          {state.error}
          {Object.keys(fe).length > 0 && (
            <span className="mt-1 block text-[13px]">
              {Object.entries(fe)
                .slice(0, 4)
                .map(([k, v]) => `${k.replace(/\.(\d+)\./, " $1: ")}: ${v}`)
                .join(" · ")}
            </span>
          )}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Section title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="pf-name" className={label}>
                  Name
                </label>
                <input
                  id="pf-name"
                  value={p.name}
                  aria-invalid={!!fe.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                  className={input}
                  placeholder="e.g. Oat Linen Shift Dress"
                />
              </div>
              <div>
                <label htmlFor="pf-slug" className={label}>
                  Web address
                </label>
                <div className="flex items-center rounded-xl border border-line bg-white pl-3.5 text-[14px] focus-within:border-charcoal">
                  <span className="shrink-0 text-muted">/product/</span>
                  <input
                    id="pf-slug"
                    value={p.slug}
                    aria-invalid={!!fe.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", slugify(e.target.value));
                    }}
                    className="h-11 min-w-0 flex-1 bg-transparent pr-3 focus:outline-none"
                  />
                </div>
                {fe.slug && <p className="mt-1 text-[12.5px] text-danger">{fe.slug}</p>}
              </div>
              <div>
                <label htmlFor="pf-category" className={label}>
                  Category
                </label>
                <select id="pf-category" value={p.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={input}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="pf-description" className={label}>
                  Description
                </label>
                <textarea
                  id="pf-description"
                  value={p.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  className={`${input} h-auto py-3`}
                  placeholder="Two or three sentences: what it is, how it feels, how to wear it."
                />
              </div>
              <div>
                <label htmlFor="pf-details" className={label}>
                  Details <span className="text-muted">(one per line)</span>
                </label>
                <textarea
                  id="pf-details"
                  value={p.details}
                  onChange={(e) => set("details", e.target.value)}
                  rows={4}
                  className={`${input} h-auto py-3`}
                  placeholder={"100% linen\nSide pockets"}
                />
              </div>
              <div>
                <label htmlFor="pf-care" className={label}>
                  Care
                </label>
                <textarea
                  id="pf-care"
                  value={p.care}
                  onChange={(e) => set("care", e.target.value)}
                  rows={4}
                  className={`${input} h-auto py-3`}
                  placeholder="Machine wash cold."
                />
              </div>
            </div>
          </Section>

          <Section title="Photos" intro="Paste image links (https://…). The first photo is the main one. Describe each photo for people using screen readers.">
            <ul className="space-y-3">
              {p.images.map((img, i) => (
                <li key={i} className="flex gap-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {img.url.startsWith("https://") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="grid min-w-0 flex-1 gap-2">
                    <input
                      aria-label={`Photo ${i + 1} link`}
                      value={img.url}
                      onChange={(e) => set("images", p.images.map((x, j) => (j === i ? { ...x, url: e.target.value.trim() } : x)))}
                      placeholder="https://…"
                      className={input}
                    />
                    <input
                      aria-label={`Photo ${i + 1} description`}
                      value={img.alt}
                      onChange={(e) => set("images", p.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                      placeholder="Describe the photo, e.g. Woman in an oat linen dress"
                      className={input}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => {
                        const next = [...p.images];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        set("images", next);
                      }}
                      className="grid size-8 place-items-center rounded-full text-muted hover:bg-cream disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => set("images", p.images.filter((_, j) => j !== i))}
                      className="grid size-8 place-items-center rounded-full text-muted hover:bg-cream"
                    >
                      <CloseIcon size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => set("images", [...p.images, { url: "", alt: "" }])}
              disabled={p.images.length >= 12}
            >
              <PlusIcon size={15} /> Add photo
            </Button>
          </Section>

          <Section
            title="Sizes, colours and prices"
            intro={
              stocked
                ? "Each row is one option a customer can buy. Stock is counted per row."
                : "Each row is one option. Ordered-in items show an availability status instead of a count."
            }
          >
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <div className="min-w-48 flex-1">
                <label htmlFor="pf-bulk" className={label}>
                  Quick add sizes
                </label>
                <input
                  id="pf-bulk"
                  value={bulkSizes}
                  onChange={(e) => setBulkSizes(e.target.value)}
                  placeholder="XS, S, M, L"
                  className={input}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSizes();
                    }
                  }}
                />
              </div>
              <Button variant="secondary" onClick={addSizes}>
                Add sizes
              </Button>
              {isOwner && p.pricingMode === "markup" && (
                <Button variant="secondary" onClick={applyMarkupToAll}>
                  Apply markup to all
                </Button>
              )}
            </div>

            <ul className="space-y-3">
              {p.variants.map((v, i) => {
                const s = suggested(v.supplierCost);
                const margin = marginPercent(v.retailPrice, v.supplierCost);
                return (
                  <li key={i} className="rounded-2xl border border-line bg-white p-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <label className={label} htmlFor={`v${i}-size`}>
                          Size
                        </label>
                        <input id={`v${i}-size`} value={v.size} onChange={(e) => setVariant(i, { size: e.target.value })} className={input} placeholder="M" />
                      </div>
                      <div>
                        <label className={label} htmlFor={`v${i}-color`}>
                          Colour
                        </label>
                        <input
                          id={`v${i}-color`}
                          value={v.colorName}
                          onChange={(e) => setVariant(i, { colorName: e.target.value })}
                          className={input}
                          placeholder="Oat"
                        />
                      </div>
                      <div>
                        <label className={label} htmlFor={`v${i}-hex`}>
                          Swatch
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            aria-label="Pick swatch colour"
                            value={v.colorHex || "#d8cbb8"}
                            onChange={(e) => setVariant(i, { colorHex: e.target.value.toUpperCase() })}
                            className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1"
                          />
                          <input
                            id={`v${i}-hex`}
                            value={v.colorHex}
                            onChange={(e) => setVariant(i, { colorHex: e.target.value })}
                            className={input}
                            placeholder="#D8CBB8"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={label} htmlFor={`v${i}-sku`}>
                          SKU
                        </label>
                        <input id={`v${i}-sku`} value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} className={input} placeholder="Auto" />
                      </div>

                      {isOwner && (
                        <div>
                          <label className={label} htmlFor={`v${i}-cost`}>
                            Supplier cost
                          </label>
                          <input
                            id={`v${i}-cost`}
                            inputMode="numeric"
                            value={v.supplierCost ?? ""}
                            onChange={(e) => setVariant(i, { supplierCost: numberOrNull(e.target.value) })}
                            className={input}
                            placeholder="UGX"
                          />
                        </div>
                      )}
                      <div>
                        <label className={label} htmlFor={`v${i}-price`}>
                          Price
                        </label>
                        <input
                          id={`v${i}-price`}
                          inputMode="numeric"
                          value={v.retailPrice || ""}
                          aria-invalid={!!fe[`variants.${i}.retailPrice`]}
                          onChange={(e) => setVariant(i, { retailPrice: numberOrNull(e.target.value) ?? 0 })}
                          className={input}
                          placeholder="UGX"
                        />
                      </div>
                      <div>
                        <label className={label} htmlFor={`v${i}-compare`}>
                          Was price
                        </label>
                        <input
                          id={`v${i}-compare`}
                          inputMode="numeric"
                          value={v.compareAtPrice ?? ""}
                          onChange={(e) => setVariant(i, { compareAtPrice: numberOrNull(e.target.value) })}
                          className={input}
                          placeholder="Optional"
                        />
                      </div>
                      {stocked ? (
                        <>
                          <div>
                            <label className={label} htmlFor={`v${i}-qty`}>
                              In stock
                            </label>
                            <input
                              id={`v${i}-qty`}
                              type="number"
                              min={0}
                              value={v.quantity}
                              onChange={(e) => setVariant(i, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                              className={input}
                            />
                          </div>
                          <div>
                            <label className={label} htmlFor={`v${i}-low`}>
                              Low stock at
                            </label>
                            <input
                              id={`v${i}-low`}
                              type="number"
                              min={0}
                              value={v.lowStockThreshold}
                              onChange={(e) => setVariant(i, { lowStockThreshold: Math.max(0, Number(e.target.value) || 0) })}
                              className={input}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 sm:col-span-1">
                          <label className={label} htmlFor={`v${i}-status`}>
                            Availability
                          </label>
                          <select
                            id={`v${i}-status`}
                            value={v.stockStatus}
                            onChange={(e) => setVariant(i, { stockStatus: e.target.value as EditableVariant["stockStatus"] })}
                            className={input}
                          >
                            <option value="ships_from_china">Ships from abroad</option>
                            <option value="available_to_order">Made to order</option>
                            <option value="out_of_stock">Sold out</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-muted">
                      <span>
                        {isOwner && margin !== null && `Margin ${formatUGX(v.retailPrice - (v.supplierCost ?? 0))} (${margin}%)`}
                        {isOwner && p.pricingMode === "markup" && s && s !== v.retailPrice && (
                          <button
                            type="button"
                            onClick={() => setVariant(i, { retailPrice: s })}
                            className="ml-2 font-medium text-warning underline underline-offset-2"
                          >
                            Markup suggests {formatUGX(s)}, use it
                          </button>
                        )}
                      </span>
                      <span className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setP((cur) => ({
                              ...cur,
                              variants: [...cur.variants.slice(0, i + 1), { ...v, id: null, sku: "", size: "" }, ...cur.variants.slice(i + 1)],
                            }))
                          }
                          className="hover:text-charcoal"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          disabled={p.variants.length === 1}
                          onClick={() => set("variants", p.variants.filter((_, j) => j !== i))}
                          className="hover:text-danger disabled:opacity-30"
                        >
                          Remove
                        </button>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => set("variants", [...p.variants, blankVariant(p.variants[p.variants.length - 1] && { ...p.variants[p.variants.length - 1], id: null, sku: "", size: "", quantity: 0 })])}>
              <PlusIcon size={15} /> Add option
            </Button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Visibility">
            <div className="grid gap-2">
              {(
                [
                  ["active", "Live", "Shown in the shop"],
                  ["draft", "Draft", "Hidden while you work on it"],
                  ["archived", "Archived", "Hidden; kept for past orders"],
                ] as const
              ).map(([value, title, note]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 ${
                    p.status === value ? "border-charcoal bg-white" : "border-line"
                  }`}
                >
                  <input type="radio" name="pf-status" checked={p.status === value} onChange={() => set("status", value)} className="accent-charcoal" />
                  <span>
                    <span className="block text-[14px]">{title}</span>
                    <span className="block text-[12.5px] text-muted">{note}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 space-y-2.5 text-[14px]">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={p.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="size-4 accent-charcoal" />
                Feature on the homepage
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={p.isNew} onChange={(e) => set("isNew", e.target.checked)} className="size-4 accent-charcoal" />
                Show in New arrivals
              </label>
            </div>
          </Section>

          <Section title="Where it comes from">
            <div className="grid gap-2">
              {(
                [
                  ["MELUDELU_STOCK", "In our studio", "We hold it; stock is counted"],
                  ["EXTERNAL_SUPPLIER", "Ordered in", "Bought from a supplier after the customer pays"],
                ] as const
              ).map(([value, title, note]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 ${
                    p.supplierType === value ? "border-charcoal bg-white" : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="pf-source"
                    checked={p.supplierType === value}
                    onChange={() => setP((cur) => ({ ...cur, supplierType: value, shippingType: value === "MELUDELU_STOCK" ? "local" : "international" }))}
                    className="accent-charcoal"
                  />
                  <span>
                    <span className="block text-[14px]">{title}</span>
                    <span className="block text-[12.5px] text-muted">{note}</span>
                  </span>
                </label>
              ))}
            </div>
            {isOwner && !stocked && (
              <div className="mt-4 grid gap-3">
                <div>
                  <label htmlFor="pf-supplier" className={label}>
                    Supplier <span className="text-muted">(private)</span>
                  </label>
                  <input
                    id="pf-supplier"
                    list="supplier-names"
                    value={p.supplierName}
                    onChange={(e) => set("supplierName", e.target.value)}
                    className={input}
                  />
                  <datalist id="supplier-names">
                    {suppliers.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="pf-supplier-id" className={label}>
                    Supplier&apos;s product ID or link <span className="text-muted">(private)</span>
                  </label>
                  <input id="pf-supplier-id" value={p.supplierProductId} onChange={(e) => set("supplierProductId", e.target.value)} className={input} />
                </div>
              </div>
            )}
          </Section>

          {isOwner && (
            <Section title="Pricing" intro="Customers only ever see the price. Cost and margin stay in the admin.">
              <div className="grid grid-cols-2 gap-2">
                {(["manual", "markup"] as const).map((mode) => (
                  <label
                    key={mode}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-[14px] ${
                      p.pricingMode === mode ? "border-charcoal bg-white" : "border-line"
                    }`}
                  >
                    <input type="radio" name="pf-pricing" checked={p.pricingMode === mode} onChange={() => set("pricingMode", mode)} className="accent-charcoal" />
                    {mode === "manual" ? "I set the price" : "Markup on cost"}
                  </label>
                ))}
              </div>
              {p.pricingMode === "markup" && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pf-mult" className={label}>
                      Multiply cost by
                    </label>
                    <input
                      id="pf-mult"
                      type="number"
                      step="0.1"
                      min={1}
                      value={p.markupMultiplier ?? ""}
                      onChange={(e) => set("markupMultiplier", e.target.value ? Number(e.target.value) : null)}
                      className={input}
                    />
                  </div>
                  <div>
                    <label htmlFor="pf-round" className={label}>
                      Round up to
                    </label>
                    <select
                      id="pf-round"
                      value={p.priceRounding}
                      onChange={(e) => set("priceRounding", Number(e.target.value) as EditableProduct["priceRounding"])}
                      className={input}
                    >
                      <option value={1000}>UGX 1,000</option>
                      <option value={500}>UGX 500</option>
                      <option value={0}>No rounding</option>
                    </select>
                  </div>
                  <p className="col-span-2 text-[12.5px] text-muted">
                    Prices don&apos;t change on their own. When cost changes, you&apos;ll see a suggestion to accept.
                  </p>
                </div>
              )}
            </Section>
          )}

          <Section title="Search engines" intro="Optional. Leave blank to use the name and description.">
            <div className="grid gap-3">
              <div>
                <label htmlFor="pf-seo-title" className={label}>
                  Page title
                </label>
                <input id="pf-seo-title" value={p.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={input} maxLength={120} />
              </div>
              <div>
                <label htmlFor="pf-seo-desc" className={label}>
                  Description
                </label>
                <textarea
                  id="pf-seo-desc"
                  value={p.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  rows={3}
                  maxLength={300}
                  className={`${input} h-auto py-3`}
                />
              </div>
            </div>
          </Section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/90 px-5 py-3 backdrop-blur-xl lg:left-[240px] lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-[13px] text-muted sm:block" role="status">
            {pending ? "Saving…" : state.saved ? "Saved. The shop updates within a minute." : p.id ? "Changes aren't saved until you press Save." : "New product"}
          </p>
          <div className="flex gap-2">
            {p.id && p.status === "active" && (
              <Link href={`/product/${p.slug}`} target="_blank" className="inline-flex h-11 items-center px-4 text-[14px] text-muted hover:text-charcoal">
                View in shop
              </Link>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : p.id ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
