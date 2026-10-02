import type { Metadata } from "next";
import { ProsePage } from "@/components/shop/prose";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy" intro="What we collect, why, and what we do with it.">
      <h2>What we collect</h2>
      <p>
        When you order, we ask for your name, phone number, delivery address and, if you choose, your email. We need these
        to confirm your order, take payment and deliver it. We don&apos;t ask for anything else.
      </p>
      <p>
        Your bag and wishlist are saved in your own browser, not on our servers. Clearing your browser data removes them.
      </p>
      <h2>Payments</h2>
      <p>
        You pay through MTN Mobile Money or Airtel Money on your own phone. We never see or store your PIN. We keep the
        transaction ID you give us so we can match your payment to your order.
      </p>
      <h2>Who sees your details</h2>
      <p>
        Only the Meludelu team and the rider delivering your order. We don&apos;t sell or share your details with anyone
        else. If you join our email list, you can leave at any time by replying to any email.
      </p>
      <h2>Your choices</h2>
      <p>You can ask us to show you, correct or delete the details we hold about you. Message or call us to do this.</p>
    </ProsePage>
  );
}
