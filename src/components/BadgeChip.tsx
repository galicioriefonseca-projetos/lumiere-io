import { Award, Crown, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP: Record<string, { icon: typeof Award; label: string; cls: string }> = {
  goal_110: { icon: Crown, label: "Meta 110%", cls: "bg-gradient-gold text-accent-foreground shadow-gold" },
  excellence_5: { icon: Star, label: "Excelência 5.0", cls: "bg-accent/15 text-accent border border-accent/40" },
};

export const BadgeChip = ({ code, label, className }: { code: string; label?: string; className?: string }) => {
  const meta = MAP[code] ?? { icon: Sparkles, label: label ?? code, cls: "bg-secondary text-foreground" };
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", meta.cls, className)}>
      <Icon className="h-3 w-3" />
      {label ?? meta.label}
    </span>
  );
};
