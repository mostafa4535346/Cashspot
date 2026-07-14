
CREATE OR REPLACE FUNCTION public.auto_remove_broken_atm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE broken_count int;
BEGIN
  IF NEW.kind = 'broken' THEN
    SELECT COUNT(*) INTO broken_count
      FROM public.reports
     WHERE atm_id = NEW.atm_id AND kind = 'broken';
    IF broken_count >= 6 THEN
      INSERT INTO public.activity_logs (actor_id, action, target_type, target_id, metadata)
      VALUES (NEW.user_id, 'atm.auto_remove', 'atm', NEW.atm_id, jsonb_build_object('broken_reports', broken_count));
      DELETE FROM public.atms WHERE id = NEW.atm_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_remove_broken_atm ON public.reports;
CREATE TRIGGER trg_auto_remove_broken_atm
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.auto_remove_broken_atm();
