import type { Metadata } from "next";
import { Container } from "@/components/shop/section";
import { WishlistView } from "@/components/shop/wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <Container className="pb-24 pt-6 lg:pt-12">
      <h1 className="font-serif text-[48px] leading-none lg:text-[68px]">Wishlist</h1>
      <p className="mt-3 text-[15px] text-muted">Saved on this device. Tap the heart on any piece to add or remove it.</p>
      <WishlistView />
    </Container>
  );
}
