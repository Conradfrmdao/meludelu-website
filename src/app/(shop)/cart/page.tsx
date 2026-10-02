import type { Metadata } from "next";
import { CartPageView } from "@/components/shop/cart-page-view";
import { Container } from "@/components/shop/section";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <Container className="pb-24 pt-6 lg:pt-12">
      <h1 className="font-serif text-[48px] leading-none lg:text-[68px]">Your bag</h1>
      <CartPageView />
    </Container>
  );
}
