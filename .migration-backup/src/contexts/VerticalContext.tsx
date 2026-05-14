import { createContext, ReactNode, useContext, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { BusinessType, VerticalDict, verticalDict } from "@/lib/vertical";

type Ctx = { type: BusinessType; t: VerticalDict; isClinic: boolean; isSalon: boolean };

const VerticalCtx = createContext<Ctx>({
  type: "salon",
  t: verticalDict("salon"),
  isClinic: false,
  isSalon: true,
});

export const VerticalProvider = ({ children }: { children: ReactNode }) => {
  const { salon } = usePermissions();
  // business_type vem do banco (default 'salon')
  const type: BusinessType =
    ((salon as unknown as { business_type?: BusinessType } | null)?.business_type) ?? "salon";

  const value = useMemo<Ctx>(
    () => ({ type, t: verticalDict(type), isClinic: type === "clinic", isSalon: type === "salon" }),
    [type],
  );
  return <VerticalCtx.Provider value={value}>{children}</VerticalCtx.Provider>;
};

export const useVertical = () => useContext(VerticalCtx);
