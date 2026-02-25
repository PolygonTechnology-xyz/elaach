import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IRetroFilterStore } from "@/store/retro_filter.store";

export const useRetroFilter = (): IRetroFilterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useRetroFilter must be used within StoreProvider");
  return context.retroFilter;
}