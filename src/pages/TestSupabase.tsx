import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Shield, Database } from 'lucide-react';

export default function TestSupabase() {
  const { user } = useAuth();
  const [salons, setSalons] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Querying 'salons' which exists in the schema
        const { data, error: sbError } = await supabase.from('salons').select('*').limit(5);
        
        if (sbError) throw sbError;
        setSalons(data || []);
      } catch (e: unknown) {
        console.error("Supabase test error:", e);
        setError(e.message || "Erro desconhecido ao conectar com Supabase");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display tracking-tight flex items-center gap-3">
          <Database className="text-accent" />
          Status da Integração Supabase
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" /> Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="flex items-center gap-2 text-emerald-500 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Sessão Ativa: {user.email}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive font-medium">
                <XCircle className="h-4 w-4" />
                Nenhum usuário logado
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" /> Conexão de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <span className="text-muted-foreground animate-pulse">Testando conexão...</span>
            ) : error ? (
              <div className="flex flex-col gap-1 text-destructive">
                <div className="flex items-center gap-2 font-medium">
                  <XCircle className="h-4 w-4" /> Falha na Conexão
                </div>
                <span className="text-xs opacity-80">{error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-500 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Banco de Dados Conectado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/10 mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Dados da Tabela 'salons'</CardTitle>
          <p className="text-sm text-muted-foreground">Isso verifica se as políticas de RLS permitem leitura.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-white/5 animate-pulse rounded" />)}
            </div>
          ) : salons.length > 0 ? (
            <div className="divide-y divide-white/5">
              {salons.map((salon) => (
                <div key={salon.id} className="py-3 flex justify-between items-center">
                  <span className="font-medium">{salon.name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {salon.id.split('-')[0]}...
                  </Badge>
                </div>
              ))}
            </div>
          ) : !error ? (
            <div className="text-center py-8 text-muted-foreground italic">
              Nenhum salão encontrado na base.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
