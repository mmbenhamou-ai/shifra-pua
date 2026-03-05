-- 20240304000005_meal_events_security.sql
-- Bloquer tout INSERT/UPDATE/DELETE direct sur meal_events (RPC only).

-- Blocage INSERT
CREATE POLICY "Block direct insert on meal_events" ON public.meal_events
FOR INSERT
WITH CHECK (false);

-- Blocage UPDATE
CREATE POLICY "Block direct update on meal_events" ON public.meal_events
FOR UPDATE
USING (false)
WITH CHECK (false);

-- Blocage DELETE
CREATE POLICY "Block direct delete on meal_events" ON public.meal_events
FOR DELETE
USING (false);
