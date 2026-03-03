CREATE TRIGGER trg_shabbat_complete
  AFTER UPDATE OF cook_id ON meal_items
  FOR EACH ROW
  WHEN (NEW.cook_id IS NOT NULL AND OLD.cook_id IS DISTINCT FROM NEW.cook_id)
  EXECUTE FUNCTION notify_admin_shabbat_complete();
