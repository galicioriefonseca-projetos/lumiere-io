# Plano — Lumière.io SaaS Licensing & Hierarquia

## 1. Banco de dados (migration única)

**`salons`**
- Adicionar `is_active boolean NOT NULL DEFAULT true`
- Adicionar `owner_name text` (nome do dono coletado no onboarding)
- Tornar `plan` efetivamente nullable lógico via novo valor: manter enum atual mas adicionar coluna `activation_status text DEFAULT 'pending'` (`pending` | `active` | `suspended`). Plano nulo = `pending`.
- `handle_new_user`: criar salão com `activation_status='pending'`, `is_active=true`, `onboarded_at=null`. Master admin entra direto como `active` + `elite`.

**`enforce_pro_limit` (atualizar função)**
- Studio: máximo **5 profissionais ativos** (mantém regra atual). 
- Limite de **6 usuários por salão** (5 professional + 1 manager) é validado por novo trigger em `user_roles` (count de roles `professional` + `manager` no mesmo `salon_id` ≤ 6 quando plano = studio).

**RLS — bloqueio por `is_active=false`**
- Criar função `public.salon_is_active(_salon uuid) returns boolean security definer` → retorna `is_active` do salão.
- Atualizar policies de leitura/escrita das tabelas operacionais (`achievements`, `evaluations`, `client_records`, `commissions`, `service_categories`, `salon_goals`, `professionals`, `checklist_*`) para exigir `salon_is_active(salon_id)` — exceto Master Admin (mantém bypass).
- `salons` SELECT continua liberado para membros (precisamos ler status para mostrar tela de suspensão).

## 2. Onboarding obrigatório (formulário, não wizard opcional)

Refatorar `OnboardingWizard.tsx` para:
- Bloquear navegação enquanto `salons.onboarded_at IS NULL` (modal não-fechável).
- **Passo 0 (novo, obrigatório)**: Nome do Dono, Nome do Salão/Clínica, Tipo (`salon` | `clinic`).
- Categorias preset, meta e equipe demo permanecem como passos opcionais.
- Salva `owner_name`, `name`, `business_type`, `onboarded_at`.

## 3. Trava `ProtectedRoute` — Tela de Licença

Componente novo `LicenseGate`:
- Lê `salon` + `is_active` + `activation_status`.
- Master admin → bypass total.
- `is_active=false` → tela "Licença Suspensa" (tom GF Estratégia Digital, contato).
- `activation_status='pending'` (e não master) → tela "Aguardando Ativação".
- Caso contrário renderiza children.
- Onboarding (form passo 0) só aparece após ativação.

Ordem em rotas protegidas: `ProtectedRoute → LicenseGate → OnboardingWizard → Page`.

## 4. Master Panel (`/master`)

Refatorar `MasterPanel.tsx`:
- Tabela com todos salões: nome, dono, plano, status, branding, criado em.
- Por linha:
  - Select `plan` (studio/elite) → update.
  - Switch `is_active` (toggle bloqueio).
  - Select `activation_status` (pending/active/suspended).
  - Checkbox `has_custom_branding`.
- Updates via `supabase.from('salons').update(...)` — RLS já permite via `is_master_admin`.
- Realtime: subscription em `salons` para refletir mudanças instantâneas.
- Auditoria: gravar em `audit_log` cada mudança.

## 5. Bloqueio instantâneo multi-tenant

`usePermissions` adiciona realtime subscription no próprio `salons` row do usuário → invalida cache → `LicenseGate` re-renderiza imediatamente quando Master alterna `is_active`.

## 6. Hierarquia de Roles (UI gates)

`usePermissions` já expõe roles. Adicionar helpers:
- `can.viewFinancials = isMasterAdmin || hasRole('owner')`
- `can.manageQuality = ['owner','manager','master_admin']`
- `can.useQuickLaunchOnly` → professional puro

`AppShell` filtra menu por role:
- **Manager**: vê apenas Checklists, Avaliações, Lançamentos, Configurações.
- **Professional**: vê apenas Dashboard pessoal (próprias metas) + botão Lançamento Rápido. Esconde Comissões, Categorias, Clientes, Insights, Master, etc.
- **Owner**: vê tudo do salão.

Página `Index` (Command Center): se role = professional puro → renderizar visão simplificada (próprias metas/badges) ao invés do dashboard global. (Componente novo `ProfessionalHomeView`.)

## 7. Arquivos afetados

**Migration**: `supabase/migrations/<ts>_saas_licensing.sql`

**Novos**:
- `src/components/LicenseGate.tsx`
- `src/components/ProfessionalHomeView.tsx`

**Editar**:
- `src/hooks/usePermissions.ts` — novos campos (is_active, activation_status, owner_name) + realtime + helpers.
- `src/components/OnboardingWizard.tsx` — passo 0 obrigatório + não-fechável + owner_name.
- `src/components/ProtectedRoute.tsx` — usar pelo App via wrapper já existente, mas adicionar LicenseGate.
- `src/App.tsx` — inserir LicenseGate na composição `protect()`.
- `src/components/AppShell.tsx` — menu por role.
- `src/pages/MasterPanel.tsx` — controles completos.
- `src/pages/Index.tsx` — branch para professional puro.
- `src/pages/Professionals.tsx` — manter limite 5 (já existe via trigger).

## Confirmações antes de codar

Vou rodar a migration primeiro (ela precisa de aprovação tua), e depois aplico todas as mudanças de código em sequência.

Posso prosseguir?
