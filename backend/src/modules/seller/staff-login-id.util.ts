/** Stored staff login IDs never include a leading "@"; UI may show @handle for display. */
export function normalizeStaffLoginId(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}
