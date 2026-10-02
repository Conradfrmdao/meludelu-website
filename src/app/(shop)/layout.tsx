import { CartDrawer } from "@/components/shop/cart-drawer";
import { Footer } from "@/components/shop/footer";
import { Header } from "@/components/shop/header";
import { StoreProvider } from "@/components/shop/store-provider";
import { TabBar } from "@/components/shop/tab-bar";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <StoreProvider>
      <Header />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <TabBar />
      <CartDrawer />
    </StoreProvider>
  );
}
