import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/shop/order-lookup-form";
import { Container } from "@/components/shop/section";

export const metadata: Metadata = {
  title: "Track an order",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <Container className="pb-24 pt-8 lg:pt-16">
      <div className="mx-auto max-w-md">
        <h1 className="font-serif text-[46px] leading-none lg:text-[60px]">Track an order</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          You don&apos;t need an account to shop with us. Enter your order number and the phone number you used at checkout.
        </p>
        <OrderLookupForm />
      </div>
    </Container>
  );
}
