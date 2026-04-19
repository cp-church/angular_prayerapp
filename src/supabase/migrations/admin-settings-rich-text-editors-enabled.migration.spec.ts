import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Contract test for the migration that adds `admin_settings.rich_text_editors_enabled`.
 * SQL files are not included in JS coverage; this keeps the DDL from drifting unnoticed.
 */
describe('migration 20260419120000_admin_settings_rich_text_editors_enabled.sql', () => {
  const migrationPath = join(
    process.cwd(),
    'supabase/migrations/20260419120000_admin_settings_rich_text_editors_enabled.sql'
  );

  it('adds rich_text_editors_enabled to admin_settings with safe defaults', () => {
    const sql = readFileSync(migrationPath, 'utf8');
    expect(sql).toMatch(/ALTER\s+TABLE\s+public\.admin_settings/i);
    expect(sql).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+rich_text_editors_enabled/i);
    expect(sql).toMatch(/boolean\s+NOT\s+NULL\s+DEFAULT\s+true/i);
  });
});
