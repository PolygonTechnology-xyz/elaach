import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import { IRetroStore } from "@/store/retro.store";

export const useRetro = (): IRetroStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCycle must be used within StoreProvider");
  return context.retro;
};
