"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type PortalBrand = {
  whiteLabel: boolean;
  name: string;
  logoUrl: string;
};

const empty: PortalBrand = { whiteLabel: false, name: "", logoUrl: "" };

const PortalBrandContext = createContext<{
  brand: PortalBrand;
  setBrand: (brand: PortalBrand | null) => void;
}>({ brand: empty, setBrand: () => {} });

export function PortalBrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrandState] = useState<PortalBrand>(empty);
  const setBrand = useCallback((next: PortalBrand | null) => {
    setBrandState(next && next.whiteLabel ? next : empty);
  }, []);
  const value = useMemo(() => ({ brand, setBrand }), [brand, setBrand]);
  return <PortalBrandContext.Provider value={value}>{children}</PortalBrandContext.Provider>;
}

export function usePortalBrand() {
  return useContext(PortalBrandContext);
}
