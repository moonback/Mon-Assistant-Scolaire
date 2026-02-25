-- Ajouter les colonnes manquantes à la table children
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS bedtime text DEFAULT '20:00',
ADD COLUMN IF NOT EXISTS reward_goals jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS blocked_topics text[] DEFAULT '{}';

-- Recharger le cache du schéma (PostgREST le fait automatiquement, mais au cas où)
NOTIFY pgrst, 'reload schema';
