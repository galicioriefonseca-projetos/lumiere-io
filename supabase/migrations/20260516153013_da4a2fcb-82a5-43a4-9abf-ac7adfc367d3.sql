
-- 1. Expand plan enum (keep existing studio/elite for compatibility)
ALTER TYPE public.salon_plan ADD VALUE IF NOT EXISTS 'start';
ALTER TYPE public.salon_plan ADD VALUE IF NOT EXISTS 'performance';
ALTER TYPE public.salon_plan ADD VALUE IF NOT EXISTS 'network';
ALTER TYPE public.salon_plan ADD VALUE IF NOT EXISTS 'founder';

-- 2. New role: platform_admin (synonym for master_admin)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';

-- 3. New columns on salons
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS founder_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS professional_count_estimate int;
