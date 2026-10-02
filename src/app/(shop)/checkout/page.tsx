import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { Container } from "@/components/shop/section";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const settings = await getSettings();
  const methods = (["mtn", "airtel"] as const)
    .filter((m) => settings.payments[m].enabled)
    .map((m) => ({ id: m, label: settings.payments[m].label }));

  return (
    <Container className="pb-24 pt-6 lg:pt-12">
      <h1 className="font-serif text-[48px] leading-none lg:text-[68px]">Checkout</h1>
      <p className="mt-3 text-[15px] text-muted">No account needed. It takes about a minute.</p>
      <CheckoutForm
        zones={settings.delivery.zones}
        freeOver={settings.delivery.freeOver}
        methods={methods}
        leadTime={settings.delivery.internationalLeadTime}
      />
    </Container>
  );
}
