# Plano: Fluxo SaaS Lumière

Escopo grande. Vou organizar em fases, sem alterar identidade visual e sem tocar em módulos existentes (Dashboard, Metas, Checklists, Profissionais, Clientes, Serviços, Agendamentos).

## 1. Banco de dados (migração única)

**Tabela `salons` — novos campos:**
- `plan` expandido: enum passa a aceitar `start | studio | performance | network | founder` (substituindo `studio | elite`)
- `subscription_status`: `trial | active | suspended | canceled` (default `trial`)
- `trial_ends_at`: timestamptz
- `founder_started_at`: timestamptz (para migração automática founder→studio em 90 dias)
- `city`, `state`, `professional_count_estimate`: text/int (dados do cadastro)

**Tabela `user_roles` — novo papel:**
- Adicionar `platform_admin` ao enum `app_role` (substituindo/coexistindo com `master_admin`)
- Função `is_platform_admin(uuid)` análoga à `is_master_admin`

**Tabela `founder_codes`:**
- `code` (text PK), `max_uses`, `uses`, `active`
- Seed inicial: `ESSENZAFOUNDER`
- RLS: só platform_admin lê/escreve; validação via RPC pública

**RPC `validate_founder_code(code)`:** retorna boolean (SECURITY DEFINER, sem expor dados).

**RPC `admin_update_salon(salon_id, payload)`:** só platform_admin pode chamar — usado pelo Painel Master para aprovar/bloquear/mudar plano.

**Atualizar `handle_new_user`** para ler `plan`, `city`, `state`, `professional_count_estimate`, `founder_code` do raw_user_meta_data e aplicar status/trial corretos.

## 2. Frontend — rotas novas

Todas em `artifacts/salon-app/src/`:

- `pages/Landing.tsx` — atualizar seção de planos (4 cards públicos, sem Founder). Botões linkam `/cadastro?plan=<slug>`.
- `pages/Cadastro.tsx` (nova) — lê `?plan=` e `?code=`; formulário completo; valida founder code antes de criar conta; chama `supabase.auth.signUp` passando metadata; redireciona para `/onboarding/equipe`.
- `pages/onboarding/Equipe.tsx`, `Servicos.tsx`, `Meta.tsx`, `Checklist.tsx` (novas) — wizard de 5 etapas reaproveitando componentes existentes (não duplicar lógica das páginas atuais; usar forms enxutos e CTAs "Pular").
- `pages/MasterPanel.tsx` — expandir: listagem com filtros, ações (aprovar / bloquear / cancelar / reativar / mudar plano / marcar Founder).
- `pages/Upgrade.tsx` (nova) — tela de bloqueio quando recurso fora do plano.

Rotas adicionadas em `App.tsx`:
- `/cadastro`, `/onboarding/equipe`, `/onboarding/servicos`, `/onboarding/meta`, `/onboarding/checklist`, `/upgrade`.

Mantém `/auth` existente (login).

## 3. Controle de acesso por plano

`src/lib/planFeatures.ts` (novo):
```ts
export const PLAN_FEATURES = {
  start:       { maxPros: 3,  comissoes:false, avaliacoes:false, gamificacao:false, insightsAI:false, categorias:false, multiunidade:false },
  studio:      { maxPros: 10, comissoes:false, avaliacoes:false, gamificacao:false, insightsAI:false, categorias:true,  multiunidade:false },
  performance: { maxPros: 20, comissoes:true,  avaliacoes:true,  gamificacao:true,  insightsAI:true,  categorias:true,  multiunidade:false },
  network:     { maxPros: Infinity, comissoes:true, avaliacoes:true, gamificacao:true, insightsAI:true, categorias:true, multiunidade:true },
  founder:     { /* = studio */ promo:true },
};
```

Refatorar `usePermissions.ts` para derivar `can.*` e `limits.*` a partir desse mapa (mantendo a API atual `can.useAIInsights` etc. para não quebrar consumidores).

Wrapper `<FeatureGate feature="comissoes">` que redireciona para `/upgrade` se bloqueado — aplicar em rotas sensíveis sem mudar conteúdo das páginas.

## 4. Painel Master

- Gate em `ProtectedRoute` / rota `/master`: somente `platform_admin` ou `master_admin`. Outros → `/dashboard`.
- UI: tabela com colunas (Salão, Responsável, Email, WhatsApp, Cidade, Plano, Status, Profissionais, Cadastro). Ações via RPC `admin_update_salon`.

## 5. Segurança

- RLS continua só permitindo dono do salão alterar dados próprios.
- Mudanças administrativas só via RPC `SECURITY DEFINER` com checagem `is_platform_admin(auth.uid())`.
- Sem service role no frontend. Sem novos secrets.
- Founder code validado por RPC; nunca exposto.

## 6. O que NÃO vou mexer

- Identidade visual (cores, fontes, tokens em `src/index.css`).
- Páginas Dashboard, Metas, Checklists, Profissionais, Clientes, Serviços, Agendamentos — apenas envolvidas em `<FeatureGate>` quando aplicável.
- Sem gateway de pagamento.

## Ordem de execução

1. Migração SQL (planos, status, founder_codes, RPCs, role platform_admin, update handle_new_user).
2. `planFeatures.ts` + refator `usePermissions`.
3. Landing (apenas seção de planos).
4. Página Cadastro + wizard Onboarding.
5. Painel Master.
6. FeatureGate + página Upgrade.
7. Smoke test do build.

## Confirmação necessária

Posso prosseguir com este plano? Em particular:
- (a) Posso **renomear o enum `salon_plan`** de `studio|elite` para `start|studio|performance|network|founder`? Salões existentes em `elite` viram `performance`; em `studio` permanecem. (alternativa: manter `elite` como alias)
- (b) Posso usar `platform_admin` como o novo papel, mantendo `master_admin` como sinônimo para não invalidar seu acesso atual?
