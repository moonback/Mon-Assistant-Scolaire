-- Security Fix: Ensure only the parent can increment their child's stars
CREATE OR REPLACE FUNCTION increment_child_stars(child_id uuid, count integer)
RETURNS void AS $$
BEGIN
  -- Strict security check to ensure the caller is indeed the parent of the child
  IF EXISTS (
    SELECT 1 FROM public.children 
    WHERE id = child_id AND parent_id = auth.uid()
  ) THEN
    UPDATE public.children
    SET stars = stars + count
    WHERE id = child_id;
  ELSE
    RAISE EXCEPTION 'Non autorisé';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
