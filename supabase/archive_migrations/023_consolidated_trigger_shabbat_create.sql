CREATE TRIGGER trg_shabbat_complete
  AFTER UPDATE OF status ON meals
  FOR EACH ROW
  WHEN (NEW.type IN ('shabbat_friday', 'shabbat_saturday') AND NEW.status IN ('cook_assigned','ready','driver_assigned','picked_up','delivered','confirmed'))
  EXECUTE FUNCTION notify_admin_shabbat_complete();
