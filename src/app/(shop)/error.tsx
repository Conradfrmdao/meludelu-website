"use client";

import { useEffect } from "react";
import { Container } from "@/components/shop/section";
import { Button } from "@/components/ui/button";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-24 text-center lg:py-36">
      <h1 className="font-serif text-[44px] leading-none lg:text-[64px]">Something went wrong</h1>
      <p className="mx-auto mt-4 max-w-md text-[15.5px] text-muted">
        This page didn&apos;t load properly. It&apos;s usually a brief connection problem.
      </p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </Container>
  );
}
