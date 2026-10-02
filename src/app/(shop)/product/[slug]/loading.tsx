import { Container } from "@/components/shop/section";

export default function Loading() {
  return (
    <Container className="pb-24 pt-4 lg:pt-8" >
      <div className="skeleton h-3 w-48 rounded-full" />
      <div className="mt-5 grid gap-8 lg:mt-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16" aria-busy="true" aria-label="Loading product">
        <div className="skeleton aspect-[4/5] rounded-[var(--radius-panel)]" />
        <div>
          <div className="skeleton h-10 w-3/4 rounded-full" />
          <div className="skeleton mt-4 h-6 w-32 rounded-full" />
          <div className="mt-10 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
          <div className="skeleton mt-8 h-13 rounded-full" />
        </div>
      </div>
    </Container>
  );
}
