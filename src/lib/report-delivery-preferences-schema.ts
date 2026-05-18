/**
 * Detects PostgREST "table not in schema cache" when migrations have not been applied yet.
 */
export function isReportDeliveryPreferencesTableMissing(
  error: { message?: string } | null | undefined,
): boolean {
  const m = error?.message;
  if (!m || typeof m !== "string") return false;
  if (!m.includes("report_delivery_preferences")) return false;
  return (
    m.includes("schema cache") || m.includes("Could not find the table")
  );
}
