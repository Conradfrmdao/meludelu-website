import Link from "next/link";
import { Container } from "@/components/shop/section";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="py-24 text-center lg:py-36">
      <p className="text-[13px] tracking-[0.14em] text-taupe uppercase">Page not found</p>
      <h1 className="mt-4 font-serif text-[48px] leading-none lg:text-[72px]">We couldn&apos;t find that</h1>
      <p className="mx-auto mt-4 max-w-md text-[15.5px] text-muted">
        The piece may have sold out and been taken down, or the link has changed.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/women" className={buttonClass("primary")}>
          Shop women
        </Link>
        <Link href="/baby" className={buttonClass("secondary")}>
          Shop baby
        </Link>
      </div>
    </Container>
  );
}
