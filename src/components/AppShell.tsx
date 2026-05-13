import { ReactNode, useState, useEffect } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, ListChecks, Tv, Sparkles, Crown, LogOut, Lock, Users, 
  Settings as SettingsIcon, Shield, Receipt, Target, Star, Trophy, Tag, 
  UserCircle2, Percent, Menu, ArrowUp, Calendar, Scissors,
  Home, Briefcase, Wrench, Settings2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/contexts/ThemeContext";
import { useVertical } from "@/contexts/VerticalContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "./Breadcrumbs";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  locked?: boolean;
};

export const AppShell = ({ children, minimal = false }: { children: ReactNode, minimal?: boolean }) => {
  const { signOut, user } = useAuth();
  const { loading, profile, salon, plan, isMasterAdmin, can, isOwner, isManager, isProfessionalOnly } = usePermissions();
  const { logoUrl, isCustomBranded } = useTheme();
  const { t } = useVertical();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const allItems: (NavItem & { roles: ("owner" | "manager" | "professional")[], group: "main" | "management" | "tools" | "admin" })[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "professional"], group: "main" },
    { to: "/agendamentos", label: "Agenda", icon: Calendar, roles: ["owner", "manager", "professional"], group: "main" },
    { to: "/lancamentos", label: "Financeiro", icon: Receipt, roles: ["owner", "professional"], group: "main" },
    { to: "/clientes", label: t.clients, icon: UserCircle2, roles: ["owner", "manager", "professional"], group: "management" },
    { to: "/profissionais", label: t.professionals, icon: Users, roles: ["owner", "manager"], group: "management" },
    { to: "/servicos", label: "Serviços", icon: Scissors, roles: ["owner", "manager"], group: "management" },
    { to: "/categorias", label: t.categories, icon: Tag, roles: ["owner", "manager"], group: "management" },
    { to: "/comissoes", label: "Comissões", icon: Percent, roles: ["owner"], group: "management" },
    { to: "/metas", label: "Metas & KPIs", icon: Target, roles: ["owner", "manager"], group: "management" },
    { to: "/checklists", label: "Auditoria de Qualidade", icon: ListChecks, roles: ["owner", "manager"], group: "tools" },
    { to: "/gamificacao", label: "Metas & Conquistas", icon: Trophy, roles: ["owner", "manager", "professional"], group: "tools" },
    // Ocultados para o MVP focado:
    // { to: "/avaliacoes", label: "Avaliações", icon: Star, roles: ["owner", "manager"], group: "management" },
    // { to: "/modo-tv", label: "Modo TV", icon: Tv, locked: !can.useTVMode, roles: ["owner"], group: "tools" },
    // { to: "/insights", label: "Lumière IA", icon: Sparkles, locked: !can.useAIInsights, roles: ["owner"], group: "tools" },
    { to: "/configuracoes", label: "Configurações", icon: SettingsIcon, roles: ["owner", "manager", "professional"], group: "admin" },
  ];

  let filteredItems: (NavItem & { group: string })[];
  if (isMasterAdmin || isOwner) {
    filteredItems = allItems;
  } else if (isManager) {
    filteredItems = allItems.filter((i) => i.roles.includes("manager"));
  } else if (isReceptionist) {
    filteredItems = allItems.filter((i) => ["/dashboard", "/agendamentos", "/lancamentos", "/clientes", "/profissionais", "/servicos", "/checklists", "/configuracoes"].includes(i.to));
  } else if (isProfessionalOnly) {
    filteredItems = allItems.filter((i) => ["/dashboard", "/lancamentos", "/gamificacao", "/configuracoes"].includes(i.to));
  } else {
    filteredItems = allItems.filter((i) => i.roles.includes("professional"));
  }

  if (isMasterAdmin) {
    filteredItems = [...filteredItems, { to: "/master", label: "Painel Master", icon: Shield, group: "admin" }];
  }

  const groups = [
    { id: "main", label: "Principal", icon: Home },
    { id: "management", label: "Gestão", icon: Briefcase },
    { id: "tools", label: "Ferramentas", icon: Wrench },
    { id: "admin", label: "Sistema", icon: Settings2 },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <Link to="/dashboard" aria-label="Ir para o painel principal" className="mb-8 flex items-center gap-3 transition-all hover:opacity-80 active:scale-95 group">
        <div className="relative">
          {logoUrl ? (
            <img src={logoUrl} alt={salon?.name ?? "Logo"} className="h-10 w-10 rounded-xl object-cover shadow-2xl ring-1 ring-white/10" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
          )}
          {!salon && (
            <Skeleton className="absolute inset-0 rounded-xl bg-white/5 animate-pulse" />
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <div className="font-display text-xl leading-none text-gradient-gold">Lumière.io</div>
          <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
            {salon ? (
              <span className="truncate text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80">
                {salon.name}
              </span>
            ) : (
              <Skeleton className="h-2 w-24 bg-white/5" />
            )}
          </div>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {groups.map((group) => {
          const groupItems = filteredItems.filter(i => i.group === group.id);
          if (groupItems.length === 0) return null;

          return (
            <div key={group.id} className="space-y-1">
              <h3 className="px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40 mb-2 mt-4 flex items-center gap-1.5">
                {group.icon && <group.icon className="h-3.5 w-3.5" />}
                {group.label}
              </h3>
              <div className="space-y-1">
                {groupItems.map((it) => {
                  const active = loc.pathname === it.to;
                  return (
                      <NavLink
                      key={it.to}
                      to={it.to}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-4 py-3 sm:py-2.5 text-sm sm:text-sm transition-all duration-200 active:scale-95",
                        active
                          ? "bg-secondary text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                        it.locked && "opacity-50 cursor-not-allowed",
                      )}
                      aria-label={it.label}
                      aria-current={active ? "page" : undefined}
                      onClick={(e) => {
                        if (it.locked) {
                          e.preventDefault();
                        } else {
                          setOpen(false);
                        }
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <it.icon className="h-4 w-4" />
                        {it.label}
                      </span>
                      {it.locked && <Lock className="h-3 w-3 text-accent" />}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-6 space-y-4 px-1">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {plan ? (
                <Badge variant={plan === "elite" ? "default" : "secondary"} className={cn(
                  "rounded-full px-2 text-[9px] uppercase tracking-wider",
                  plan === "elite" && "bg-gradient-gold text-accent-foreground border-0"
                )}>
                  {isMasterAdmin ? "Master Admin" : `Plano ${plan === "elite" ? "Elite" : "Studio"}`}
                </Badge>
              ) : (
                <Skeleton className="h-4 w-16 bg-white/5 rounded-full" />
              )}
              {isMasterAdmin && <Crown className="h-3 w-3 text-accent animate-pulse" />}
            </div>
            
            {plan === "studio" && !isMasterAdmin && (
              <Badge variant="outline" className="h-4 rounded-full border-accent/20 bg-accent/5 px-1.5 text-[8px] text-accent animate-pulse">Upgrade</Badge>
            )}
          </div>
          
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-8 w-8 shrink-0">
              <Skeleton className="h-full w-full rounded-full bg-white/5" />
              <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-[#0D0D0D] bg-emerald-500" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <div className="truncate text-xs font-medium text-foreground">
                {profile?.display_name ?? user?.email?.split('@')[0]}
              </div>
              <div className="truncate text-[9px] text-muted-foreground/50 tracking-wide">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          aria-label="Sair do sistema"
          className="w-full h-12 sm:h-9 justify-start gap-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive group transition-all" 
          onClick={() => {
            setOpen(false);
            signOut();
          }}
        >
          <LogOut className="h-5 w-5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Sair do Sistema</span>
        </Button>
      </div>
    </div>
  );

  if (minimal) {
    return (
      <main className="min-h-screen bg-background overflow-x-hidden">
        <div className="mx-auto w-full px-5 py-8 md:px-10">
          {children}
        </div>

        {showScrollTop && (
          <Button
            variant="hero"
            size="icon"
            className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg transition-all active:scale-95"
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row bg-[#0A0A0A]">
        {/* Mobile Header Skeleton */}
        <header className="flex h-16 items-center justify-between border-b border-border/40 px-5 md:hidden bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg bg-white/5" />
            <Skeleton className="h-4 w-24 bg-white/5" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
        </header>

        {/* Desktop Sidebar Skeleton */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border/40 bg-[#0D0D0D] p-6 md:flex">
          <div className="mb-10 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 bg-white/5" />
              <Skeleton className="h-3 w-16 bg-white/5" />
            </div>
          </div>
          <nav className="flex-1 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg bg-white/5" />
                <Skeleton className="h-4 w-full rounded-md bg-white/5" />
              </div>
            ))}
          </nav>
          <div className="mt-auto pt-6 border-t border-white/5">
            <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
          </div>
        </aside>

        {/* Content Skeleton */}
        <main className="flex-1 overflow-x-hidden bg-[#0A0A0A]">
          <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
            <div className="mb-10 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-12 bg-white/5" />
                <div className="h-1 w-1 rounded-full bg-white/10" />
                <Skeleton className="h-3 w-20 bg-white/5" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-64 bg-white/5" />
                <Skeleton className="h-10 w-32 bg-white/5" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Skeleton className="h-32 rounded-3xl bg-white/5" />
              <Skeleton className="h-32 rounded-3xl bg-white/5" />
              <Skeleton className="h-32 rounded-3xl bg-white/5" />
            </div>
            
            <div className="mt-8">
              <Skeleton className="h-[450px] w-full rounded-3xl bg-white/5" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="flex h-16 items-center justify-between border-b border-border/60 px-5 md:hidden">
        <Link to="/dashboard" aria-label="Ir para o painel principal" className="flex items-center gap-2 active:scale-95 transition-transform">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded-lg" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-gold">
              <Sparkles className="h-3 w-3 text-accent-foreground" />
            </div>
          )}
          <span className="font-display text-lg text-gradient-gold">Lumière.io</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu de navegação" className="active:scale-95">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-t border-border/60 p-6 bg-background/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de Navegação</SheetTitle>
              <SheetDescription>Acesse as diferentes seções do sistema.</SheetDescription>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/80 p-5 backdrop-blur md:flex">
        <SidebarContent />
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-10">
          <Breadcrumbs />
          {children}
        </div>
      </main>

      {showScrollTop && (
        <Button
          variant="hero"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg transition-all active:scale-95"
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

