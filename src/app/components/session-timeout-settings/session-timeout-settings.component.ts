import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

interface TimeoutSettings {
  id: number;
  inactivity_timeout_minutes: number;
  max_session_duration_minutes: number;
  db_heartbeat_interval_minutes: number;
  updated_at?: string;
}

@Component({
  selector: 'app-session-timeout-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-timeout-settings.component.html',
  styleUrls: ['./session-timeout-settings.component.css']
})
export class SessionTimeoutSettingsComponent implements OnInit {
  inactivityTimeout = 30;
  maxSessionDuration = 480;
  dbHeartbeatInterval = 1;
  saved = false;
  error: string | null = null;
  loading = false;

  constructor(
    private supabaseService: SupabaseService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      this.loading = true;

      // Try loading from localStorage first
      const cached = localStorage.getItem('adminTimeoutSettings');
      if (cached) {
        try {
          const settings = JSON.parse(cached);
          this.inactivityTimeout = settings.inactivityTimeoutMinutes || 30;
          this.maxSessionDuration = settings.maxSessionDurationMinutes || 480;
          this.dbHeartbeatInterval = settings.dbHeartbeatIntervalMinutes || 1;
          
          console.log('[SessionTimeoutSettings] Loaded settings from localStorage');
          this.loading = false;
          return;
        } catch (parseError) {
          console.error('Error parsing cached settings:', parseError);
          localStorage.removeItem('adminTimeoutSettings');
        }
      }

      // Fall back to database
      const { data, error: fetchError } = await this.supabaseService.getClient()
        .from('admin_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error loading settings:', fetchError);
        this.error = 'Failed to load settings from database';
        return;
      }

      if (data) {
        this.inactivityTimeout = data.inactivity_timeout_minutes || 30;
        this.maxSessionDuration = data.max_session_duration_minutes || 480;
        this.dbHeartbeatInterval = data.db_heartbeat_interval_minutes || 1;
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      this.error = 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  async handleSave(): Promise<void> {
    try {
      if (this.inactivityTimeout < 5) {
        this.error = 'Inactivity timeout must be at least 5 minutes';
        return;
      }
      if (this.maxSessionDuration < 30) {
        this.error = 'Max session duration must be at least 30 minutes';
        return;
      }
      if (this.dbHeartbeatInterval < 1) {
        this.error = 'Database heartbeat interval must be at least 1 minute';
        return;
      }
      if (this.dbHeartbeatInterval >= this.inactivityTimeout) {
        this.error = 'Database heartbeat must be less frequent than inactivity timeout';
        return;
      }

      this.loading = true;

      const { error: upsertError } = await this.supabaseService.getClient()
        .from('admin_settings')
        .upsert(
          {
            id: 1, // Always use id 1 for single settings row
            inactivity_timeout_minutes: this.inactivityTimeout,
            max_session_duration_minutes: this.maxSessionDuration,
            db_heartbeat_interval_minutes: this.dbHeartbeatInterval,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (upsertError) {
        this.error = 'Failed to save settings to database';
        console.error('Save error:', upsertError);
        return;
      }

      // Also cache settings in localStorage for instant load on next visit
      try {
        const cachedSettings = {
          inactivityTimeoutMinutes: this.inactivityTimeout,
          maxSessionDurationMinutes: this.maxSessionDuration,
          dbHeartbeatIntervalMinutes: this.dbHeartbeatInterval,
        };
        localStorage.setItem('adminTimeoutSettings', JSON.stringify(cachedSettings));
        
        console.log('[SessionTimeoutSettings] Cached updated timeout settings in localStorage');
      } catch (storageError) {
        console.error('Error caching timeout settings in localStorage:', storageError);
      }

      this.error = null;
      this.saved = true;
      this.toast.success('Settings saved successfully!');
      setTimeout(() => this.saved = false, 3000);
    } catch (err) {
      this.error = 'Failed to save settings';
      console.error('Error:', err);
      this.toast.error('Failed to save settings');
    } finally {
      this.loading = false;
    }
  }

  formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  }

  onInactivityTimeoutChange(value: string): void {
    this.inactivityTimeout = Math.max(5, parseInt(value) || 5);
  }

  onMaxSessionDurationChange(value: string): void {
    this.maxSessionDuration = Math.max(30, parseInt(value) || 30);
  }

  onDbHeartbeatIntervalChange(value: string): void {
    this.dbHeartbeatInterval = Math.max(1, parseInt(value) || 1);
  }
}
