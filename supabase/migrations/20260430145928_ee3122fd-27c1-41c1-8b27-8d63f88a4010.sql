
-- Apaga em ordem segura: roles → profiles → salons órfãos → auth.users
DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) <> 'leandropfonseca20@gmail.com');

DELETE FROM public.profiles
WHERE id IN (SELECT id FROM auth.users WHERE lower(email) <> 'leandropfonseca20@gmail.com');

DELETE FROM public.salons
WHERE id NOT IN (SELECT salon_id FROM public.profiles WHERE salon_id IS NOT NULL);

DELETE FROM auth.users WHERE lower(email) <> 'leandropfonseca20@gmail.com';
