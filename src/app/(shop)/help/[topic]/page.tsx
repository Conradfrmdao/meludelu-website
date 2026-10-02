import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProsePage, SimpleTable } from "@/components/shop/prose";
import { formatUGX } from "@/lib/format";
import { getSettings, type StoreSettings } from "@/lib/settings";

export const revalidate = 300;

const topics = {
  delivery: { title: "Delivery", intro: "Where we deliver, what it costs and how long it takes." },
  returns: { title: "Returns & exchanges", intro: "If something isn't right, we'll help you put it right." },
  paying: { title: "Paying with Mobile Money", intro: "How payment works, step by step." },
  "size-guide": { title: "Size guide", intro: "Measurements are in centimetres. If you're between sizes, message us." },
} as const;

type Topic = keyof typeof topics;

export function generateStaticParams() {
  return Object.keys(topics).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: PageProps<"/help/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  const t = topics[topic as Topic];
  return t ? { title: t.title, description: t.intro, alternates: { canonical: `/help/${topic}` } } : {};
}

function Delivery({ settings }: { settings: StoreSettings }) {
  const { zones, freeOver, internationalLeadTime } = settings.delivery;
  return (
    <>
      <SimpleTable
        head={["Area", "Delivery time", "Fee"]}
        rows={zones.map((z) => [z.label, z.eta, formatUGX(z.fee)])}
      />
      {freeOver && <p>Delivery is free on orders over {formatUGX(freeOver)}.</p>}
      <h2>Pieces in our studio</h2>
      <p>
        Items marked <strong>In stock</strong> are with us in {settings.contact.city}. Once your payment is confirmed we
        prepare the order and a rider brings it to you. We call before setting off.
      </p>
      <h2>Pieces ordered in for you</h2>
      <p>
        Items marked <strong>Ships from abroad</strong> or <strong>Made to order</strong> are not on our shelves. We order
        them from our makers once you have paid, and they usually reach you in <strong>{internationalLeadTime}</strong>. We
        say this on the product page, in your bag and at checkout so there are no surprises. If a piece is delayed, we
        call you and you can choose to wait or have your money back.
      </p>
      <p>If your order mixes both, we deliver everything together unless you ask us to send the in-stock pieces first.</p>
    </>
  );
}

function Returns() {
  return (
    <>
      <p>
        If something doesn&apos;t fit, tell us within <strong>7 days</strong> of delivery and we&apos;ll exchange it for
        another size or colour, or give you store credit.
      </p>
      <ul>
        <li>Items must be unworn, unwashed and have their tags on.</li>
        <li>For hygiene, we can&apos;t take back baby bodysuits, sleepsuits or booties once opened, unless they arrive faulty.</li>
        <li>If something arrives damaged or isn&apos;t what you ordered, we&apos;ll replace it or refund you in full, including delivery.</li>
        <li>Refunds go back to the Mobile Money number you paid from.</li>
      </ul>
      <p>
        To start an exchange, message or call us with your order number. You can find it on your order page or under{" "}
        <Link href="/account">Track an order</Link>.
      </p>
    </>
  );
}

function Paying({ settings }: { settings: StoreSettings }) {
  const { mtn, airtel } = settings.payments;
  return (
    <>
      <ol>
        <li>Place your order. No money moves at this point, and we hold your pieces for you.</li>
        <li>
          On the next screen, tap <strong>Dial</strong>. Your phone opens its dialler with our {mtn.label} or {airtel.label}{" "}
          merchant code ready. Press call.
        </li>
        <li>Follow the prompts, check the amount and our business name, and enter your PIN.</li>
        <li>Tap <strong>I&apos;ve paid</strong> on your order page, and add the transaction ID from your SMS if you have it.</li>
        <li>We check the payment and call you to confirm your order and agree delivery.</li>
      </ol>
      <h2>Keeping you safe</h2>
      <ul>
        <li>You only ever enter your PIN on your own phone, in the official Mobile Money menu.</li>
        <li>We will never call or message to ask for your PIN.</li>
        <li>Check the business name shown before you confirm. If it doesn&apos;t say Meludelu, stop and call us.</li>
      </ul>
      <h2>Shopping on a computer?</h2>
      <p>
        A computer has no dialler, so the button won&apos;t work there. Dial the code shown on your order page from your
        phone, and use the merchant code, amount and reference listed there.
      </p>
    </>
  );
}

function SizeGuide() {
  return (
    <>
      <h2>Women</h2>
      <SimpleTable
        head={["Size", "UK", "Bust", "Waist", "Hip"]}
        rows={[
          ["XS", "6", "80–83", "62–65", "88–91"],
          ["S", "8–10", "84–89", "66–71", "92–97"],
          ["M", "12", "90–95", "72–77", "98–103"],
          ["L", "14–16", "96–103", "78–85", "104–111"],
          ["XL", "18", "104–109", "86–91", "112–117"],
        ]}
      />
      <p>Knitwear in S/M and L/XL is cut loose. Take your usual size, or size down for a closer fit.</p>
      <h2>Baby</h2>
      <SimpleTable
        head={["Size", "Height", "Weight"]}
        rows={[
          ["Newborn", "up to 56 cm", "up to 4.5 kg"],
          ["0–3M", "56–62 cm", "4.5–6 kg"],
          ["3–6M", "62–68 cm", "6–8 kg"],
          ["6–12M", "68–80 cm", "8–10 kg"],
          ["12–18M", "80–86 cm", "10–11.5 kg"],
          ["18–24M", "86–92 cm", "11.5–13 kg"],
        ]}
      />
      <p>Babies grow quickly. If you&apos;re buying a gift and aren&apos;t sure, the next size up is usually the safer choice.</p>
    </>
  );
}

export default async function HelpPage({ params }: PageProps<"/help/[topic]">) {
  const { topic } = await params;
  const t = topics[topic as Topic];
  if (!t) notFound();
  const settings = await getSettings();

  return (
    <ProsePage title={t.title} intro={t.intro}>
      {topic === "delivery" && <Delivery settings={settings} />}
      {topic === "returns" && <Returns />}
      {topic === "paying" && <Paying settings={settings} />}
      {topic === "size-guide" && <SizeGuide />}
    </ProsePage>
  );
}
