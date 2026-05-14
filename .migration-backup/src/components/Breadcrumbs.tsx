import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeMap: Record<string, string> = {
  professionals: "Profissionais",
  lancamentos: "Lançamentos",
  categorias: "Categorias",
  servicos: "Serviços",
  agendamentos: "Agendamentos",
  comissoes: "Comissões",
  metas: "Metas",
  checklists: "Checklists",
  clientes: "Clientes",
  avaliacoes: "Avaliações",
  gamificacao: "Gamificação",
  insights: "Insights",
  configuracoes: "Configurações",
  setup: "Configuração Inicial",
  "modo-tv": "Modo TV",
};

export const Breadcrumbs = ({ className }: { className?: string }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-2 text-xs uppercase tracking-widest text-muted-foreground/60 mb-6", className)}
    >
      <Link 
        to="/dashboard" 
        className="flex items-center hover:text-accent transition-colors"
        aria-label="Ir para o Início"
      >
        <Home className="h-3 w-3 mr-1" />
        <span>Início</span>
      </Link>
      
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const label = routeMap[value] || value;

        return (
          <div key={to} className="flex items-center space-x-2">
            <ChevronRight className="h-3 w-3 opacity-40" />
            {last ? (
              <span className="text-accent font-medium" aria-current="page">
                {label}
              </span>
            ) : (
              <Link 
                to={to} 
                className="hover:text-accent transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
