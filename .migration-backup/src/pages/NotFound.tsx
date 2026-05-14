import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A0A0A] p-6 selection:bg-accent/30 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] -top-[10%] h-[70%] w-[70%] rounded-full bg-accent/[0.03] blur-[150px]" />
        <div className="absolute -right-[5%] bottom-[0%] h-[60%] w-[60%] rounded-full bg-primary/[0.08] blur-[120px]" />
      </div>
      <div className="relative text-center max-w-sm">
        <div className="mb-6 inline-flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-soft">Lumière</span>
        </div>
        <h1 className="mb-4 font-display text-8xl text-gradient-gold">404</h1>
        <p className="mb-8 text-lg font-light text-muted-foreground/80">Oops! O conteúdo que você busca não está aqui ou foi movido para outra dimensão.</p>
        <Link to="/">
          <Button variant="outline" className="rounded-none uppercase tracking-[0.3em] text-[10px] h-12 px-8 border-accent/20 hover:bg-accent/5">
            <ArrowLeft className="mr-2 h-3 w-3" /> Voltar ao Início
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
