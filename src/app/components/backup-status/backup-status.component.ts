import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

interface BackupLog {
  id: string;
  backup_date: string;
  status: 'success' | 'failed' | 'in_progress';
  tables_backed_up: Record<string, number>;
  total_records: number;
  error_message?: string;
  duration_seconds?: number;
  created_at: string;
}

@Component({
  selector: 'app-backup-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backup-status.component.html',
  styleUrls: ['./backup-status.component.css']
})
export class BackupStatusComponent implements OnInit {
  latestBackup: BackupLog | null = null;
  allBackups: BackupLog[] = [];
  showFullLog = false;
  expandedBackupId: string | null = null;
  loading = false;
  backingUp = false;
  restoring = false;
  showRestoreDialog = false;

  constructor(
    private supabaseService: SupabaseService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchBackupLogs();
  }

  async fetchBackupLogs(): Promise<void> {
    this.loading = true;
    try {
      const supabaseUrl = this.supabaseService.getSupabaseUrl();
      const supabaseKey = this.supabaseService.getSupabaseKey();

      const params = new URLSearchParams();
      params.set('select', '*');
      params.set('order', 'backup_date.desc');
      params.set('limit', '100');

      const url = `${supabaseUrl}/rest/v1/backup_logs?${params.toString()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Query failed: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        this.latestBackup = data[0];
        this.allBackups = data;
      }
    } catch (error) {
      console.error('Error fetching backup logs:', error);
      this.toast.error('Failed to load backup logs');
    } finally {
      this.loading = false;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  async handleManualBackup(): Promise<void> {
    if (!confirm('Create a manual backup now? This will back up all current data.')) {
      return;
    }

    this.backingUp = true;
    try {
      // Auto-discover tables from the database
      const supabaseUrl = this.supabaseService.getSupabaseUrl();
      const supabaseKey = this.supabaseService.getSupabaseKey();

      let tables: string[];

      try {
        const tableParams = new URLSearchParams();
        tableParams.set('select', 'table_name');
        tableParams.set('order', 'table_name.asc');

        const tableResponse = await fetch(`${supabaseUrl}/rest/v1/backup_tables?${tableParams.toString()}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          }
        });

        if (tableResponse.ok) {
          const tableList = await tableResponse.json();
          tables = tableList.map((t: { table_name: string }) => t.table_name);
        } else {
          throw new Error('Could not fetch table list');
        }
      } catch {
        // Fallback to hardcoded list if view doesn't exist
        tables = [
          'admin_settings',
          'analytics',
          'backup_logs',
          'email_subscribers',
          'prayer_prompts',
          'prayer_types',
          'prayer_updates',
          'prayers',
          'status_change_requests',
          'update_deletion_requests',
          'user_preferences'
        ];
      }

      console.log(`Backing up ${tables.length} tables:`, tables);

      const startTime = Date.now();
      const backup: {
        timestamp: string;
        version: string;
        tables: Record<string, { count?: number; error?: string; data: any[] }>;
      } = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        tables: {}
      };

      // Fetch all tables
      for (const table of tables) {
        try {
          const tableParams = new URLSearchParams();
          tableParams.set('select', '*');

          const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${tableParams.toString()}`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            }
          });

          if (response.ok) {
            const tableData = await response.json();
            backup.tables[table] = { count: tableData.length, data: tableData };
          } else {
            const errorText = await response.text();
            backup.tables[table] = { error: errorText, data: [] };
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          backup.tables[table] = { error: errorMessage, data: [] };
        }
      }

      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);

      // Create summary
      const summary: Record<string, number> = {};
      let totalRecords = 0;
      for (const table in backup.tables) {
        const count = backup.tables[table].count || 0;
        summary[table] = count;
        totalRecords += count;
      }

      // Download backup as JSON
      const backupJson = JSON.stringify(backup, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manual_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log to database
      await this.supabaseService.getClient()
        .from('backup_logs')
        .insert({
          backup_date: new Date().toISOString(),
          status: 'success',
          tables_backed_up: summary,
          total_records: totalRecords,
          duration_seconds: durationSeconds
        });

      this.toast.success(`Backup complete! Downloaded ${totalRecords.toLocaleString()} records in ${durationSeconds}s`);
      this.fetchBackupLogs(); // Refresh the log
    } catch (error: unknown) {
      console.error('Backup failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log failure
      await this.supabaseService.getClient()
        .from('backup_logs')
        .insert({
          backup_date: new Date().toISOString(),
          status: 'failed',
          error_message: errorMessage,
          total_records: 0
        });

      this.toast.error('Backup failed: ' + errorMessage);
    } finally {
      this.backingUp = false;
    }
  }

  async handleManualRestore(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!confirm(`Are you absolutely sure you want to restore from "${file.name}"?\n\nThis will ERASE ALL current data!`)) {
      input.value = '';
      return;
    }

    this.restoring = true;
    this.showRestoreDialog = false;

    try {
      // Read the file
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.tables || typeof backup.tables !== 'object') {
        throw new Error('Invalid backup file format');
      }

      // Get list of tables to restore
      const tablesInBackup = Object.keys(backup.tables);

      // Tables to skip during restore (operational data that shouldn't be restored)
      const skipTables = ['analytics', 'backup_logs'];

      // Define dependency order for known tables (for proper foreign key handling)
      const knownOrder = [
        'prayer_types',
        'prayers',
        'prayer_updates',
        'prayer_prompts',
        'email_subscribers',
        'user_preferences',
        'status_change_requests',
        'update_deletion_requests',
        'admin_settings'
      ];

      // Sort tables: known tables in dependency order first, then any unknown tables
      const tables = [
        ...knownOrder.filter(t => tablesInBackup.includes(t) && !skipTables.includes(t)),
        ...tablesInBackup.filter(t => !knownOrder.includes(t) && !skipTables.includes(t))
      ];

      let totalRestored = 0;
      const errors: string[] = [];

      for (const tableName of tables) {
        if (!backup.tables[tableName]) continue;

        const tableData = backup.tables[tableName];
        const records = tableData.data || [];

        if (records.length === 0) continue;

        try {
          // Get all existing records to delete them by their actual IDs
          const { data: existingRecords, error: fetchError } = await this.supabaseService.getClient()
            .from(tableName)
            .select('id');

          if (fetchError) {
            errors.push(`Error fetching ${tableName}: ${fetchError.message}`);
            continue;
          }

          // Delete all existing records in batches
          if (existingRecords && existingRecords.length > 0) {
            const ids = existingRecords.map((r: any) => r.id);
            const deleteBatchSize = 100;

            for (let i = 0; i < ids.length; i += deleteBatchSize) {
              const idBatch = ids.slice(i, i + deleteBatchSize);
              const { error: deleteError } = await this.supabaseService.getClient()
                .from(tableName)
                .delete()
                .in('id', idBatch);

              if (deleteError) {
                errors.push(`Error deleting from ${tableName}: ${deleteError.message}`);
                break;
              }
            }
          }

          // Use upsert to handle any remaining conflicts
          const batchSize = 100;
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);

            const { error: insertError } = await this.supabaseService.getClient()
              .from(tableName)
              .upsert(batch, { onConflict: 'id' });

            if (insertError) {
              errors.push(`Error inserting into ${tableName}: ${insertError.message}`);
              continue;
            }

            totalRestored += batch.length;
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          errors.push(`Exception restoring ${tableName}: ${errorMessage}`);
        }
      }

      // Log skipped tables info
      if (skipTables.length > 0) {
        console.log(`Skipped tables (operational data): ${skipTables.join(', ')}`);
      }

      if (errors.length > 0) {
        console.error('Restore errors:', errors);
        this.toast.warning(`Restore completed with ${errors.length} error(s). Restored ${totalRestored.toLocaleString()} records. Check console for details.`);
      } else {
        const skipMsg = skipTables.length > 0
          ? `\n\nSkipped: ${skipTables.join(', ')} (operational data)`
          : '';
        this.toast.success(`Restore complete! Restored ${totalRestored.toLocaleString()} records.${skipMsg}`);
      }

      // Refresh the page to show updated data
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: unknown) {
      console.error('Restore failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.toast.error('Restore failed: ' + errorMessage);
    } finally {
      this.restoring = false;
      input.value = '';
    }
  }

  toggleExpanded(backupId: string): void {
    this.expandedBackupId = this.expandedBackupId === backupId ? null : backupId;
  }

  toggleShowFullLog(): void {
    this.showFullLog = !this.showFullLog;
    if (!this.showFullLog) {
      this.expandedBackupId = null;
    }
  }

  getTableEntries(backup: BackupLog): [string, number][] {
    return Object.entries(backup.tables_backed_up).sort(([a], [b]) => a.localeCompare(b));
  }

  getVisibleBackups(): BackupLog[] {
    return this.showFullLog ? this.allBackups : this.allBackups.slice(0, 5);
  }
}
