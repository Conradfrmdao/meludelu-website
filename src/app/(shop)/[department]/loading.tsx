import { CatalogSkeleton } from "@/components/shop/catalog-view";
import { Container } from "@/components/shop/section";

export default function Loading() {
  return (
    <Container className="pb-24">
      <div className="pb-8 pt-6 lg:pb-10 lg:pt-12">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton mt-5 h-12 w-56 rounded-full lg:h-16" />
        <div className="skeleton mt-5 h-4 w-80 max-w-full rounded-full" />
      </div>
      <CatalogSkeleton />
    </Container>
  );
}
