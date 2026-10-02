import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/shop/prose";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <ProsePage title="Terms" intro="The plain-language rules for buying from Meludelu.">
      <h2>Prices</h2>
      <p>All prices are in Uganda shillings. Delivery is shown separately at checkout, before you place your order.</p>
      <h2>Your order</h2>
      <p>
        Placing an order reserves the pieces for you. The order is confirmed once we have received your Mobile Money
        payment and spoken to you. If we can&apos;t reach you or don&apos;t receive payment within 48 hours, we may cancel
        the order and release the pieces.
      </p>
      <h2>Pieces ordered in for you</h2>
      <p>
        Items marked as shipping from abroad or made to order are bought for you after payment. Delivery times are
        estimates. If a piece is delayed or becomes unavailable, we will tell you and offer a full refund.
      </p>
      <h2>Exchanges and refunds</h2>
      <p>
        See <Link href="/help/returns">Returns &amp; exchanges</Link>.
      </p>
    </ProsePage>
  );
}
