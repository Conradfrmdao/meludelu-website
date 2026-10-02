// SupplierAdapter (PRD 7.11): the seam where an official supplier API can plug in later.
// Scraping supplier websites is out of scope. Until a supplier offers an API or an
// authorised integration, the owner sets availability by hand in the admin.

export interface SupplierAvailability {
  supplierProductId: string;
  status: "available_to_order" | "ships_from_china" | "out_of_stock";
  /** Only filled when the supplier's API reports a reliable number. */
  quantity: number | null;
  leadTimeDays: number | null;
}

export interface SupplierAdapter {
  id: string;
  fetchAvailability(supplierProductIds: string[]): Promise<SupplierAvailability[]>;
  placeOrder?(lines: { supplierProductId: string; quantity: number }[]): Promise<{ reference: string }>;
}

/** Default adapter: nothing is fetched automatically; the admin's manual status is the source of truth. */
export const manualSupplierAdapter: SupplierAdapter = {
  id: "manual",
  async fetchAvailability() {
    return [];
  },
};
