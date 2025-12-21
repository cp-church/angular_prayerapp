import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="space-y-6">
  <div *ngIf="loading" class="flex items-center justify-center py-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span class="ml-3 text-gray-600 dark:text-gray-400">Loading settings...</span>
  </div>

  <ng-container *ngIf="!loading">
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div class="text-sm text-blue-800 dark:text-blue-200">
          <p class="font-medium mb-1">Session Timeout Configuration</p>
          <p>These settings control how long admin sessions remain active and how frequently the database connection is kept alive. Changes take effect for new sessions and existing active sessions.</p>
        </div>
      </div>
    </div>

    <!-- Inactivity Timeout -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-600 dark:text-orange-400">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h3 class="text-lg font-medium text-gray-800 dark:!text-gray-100">
          Inactivity Timeout
        </h3>
      </div>
      
      <div class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          How long an admin session can remain inactive before automatic logout. No interaction includes: mouse movement, clicks, keyboard input, scrolling, or touch events. Switching tabs does not count toward inactivity.
        </p>
        
        <div class="flex items-center gap-4">
          <input
            type="number"
            min="5"
            [(ngModel)]="inactivityTimeout"
            (ngModelChange)="onInactivityTimeoutChange($event)"
            class="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span class="text-gray-600 dark:text-gray-400">minutes</span>
        </div>
        
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded p-3 border border-orange-200 dark:border-orange-700">
          <p class="text-xs text-orange-800 dark:text-orange-200">
            Current setting: <strong>{{ formatTime(inactivityTimeout) }}</strong>
          </p>
        </div>
      </div>
    </div>

    <!-- Max Session Duration -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600 dark:text-purple-400">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h3 class="text-lg font-medium text-gray-800 dark:!text-gray-100">
          Maximum Session Duration
        </h3>
      </div>
      
      <div class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Maximum time an admin session can remain active, regardless of user activity. This provides an additional security layer by forcing re-authentication after a long session.
        </p>
        
        <div class="flex items-center gap-4">
          <input
            type="number"
            min="30"
            [(ngModel)]="maxSessionDuration"
            (ngModelChange)="onMaxSessionDurationChange($event)"
            class="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span class="text-gray-600 dark:text-gray-400">minutes</span>
        </div>
        
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded p-3 border border-purple-200 dark:border-purple-700">
          <p class="text-xs text-purple-800 dark:text-purple-200">
            Current setting: <strong>{{ formatTime(maxSessionDuration) }}</strong>
          </p>
        </div>
      </div>
    </div>

    <!-- Database Heartbeat -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600 dark:text-green-400">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h3 class="text-lg font-medium text-gray-800 dark:!text-gray-100">
          Database Heartbeat Interval
        </h3>
      </div>
      
      <div class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          How frequently a lightweight query is sent to keep the Supabase database awake. Supabase free tier pauses after ~5 minutes of inactivity. Keep this interval less than 5 minutes and less frequent than the inactivity timeout.
        </p>
        
        <div class="flex items-center gap-4">
          <input
            type="number"
            min="1"
            [(ngModel)]="dbHeartbeatInterval"
            (ngModelChange)="onDbHeartbeatIntervalChange($event)"
            class="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span class="text-gray-600 dark:text-gray-400">minutes</span>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 rounded p-3 border border-green-200 dark:border-green-700">
          <p class="text-xs text-green-800 dark:text-green-200">
            Current setting: <strong>{{ formatTime(dbHeartbeatInterval) }}</strong>
          </p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div *ngIf="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex gap-3">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600 dark:text-red-400 flex-shrink-0">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <!-- Success Message -->
    <div *ngIf="saved" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex gap-3">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600 dark:text-green-400 flex-shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <p class="text-sm text-green-800 dark:text-green-200">Settings saved successfully! Changes will apply to new admin sessions.</p>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <button
        (click)="handleSave()"
        [disabled]="loading"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Save Settings
      </button>
    </div>
  </ng-container>
</div>
  `
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
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      this.loading = true;
      this.cdr.markForCheck();

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
          this.cdr.markForCheck();
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
        this.cdr.markForCheck();
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
      this.cdr.markForCheck();
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async handleSave(): Promise<void> {
    try {
      if (this.inactivityTimeout < 5) {
        this.error = 'Inactivity timeout must be at least 5 minutes';
        this.cdr.markForCheck();
        return;
      }
      if (this.maxSessionDuration < 30) {
        this.error = 'Max session duration must be at least 30 minutes';
        this.cdr.markForCheck();
        return;
      }
      if (this.dbHeartbeatInterval < 1) {
        this.error = 'Database heartbeat interval must be at least 1 minute';
        this.cdr.markForCheck();
        return;
      }
      if (this.dbHeartbeatInterval >= this.inactivityTimeout) {
        this.error = 'Database heartbeat must be less frequent than inactivity timeout';
        this.cdr.markForCheck();
        return;
      }

      this.loading = true;
      this.cdr.markForCheck();

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
        this.cdr.markForCheck();
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
      this.cdr.markForCheck();
      this.toast.success('Settings saved successfully!');
      setTimeout(() => {
        this.saved = false;
        this.cdr.markForCheck();
      }, 3000);
    } catch (err) {
      this.error = 'Failed to save settings';
      this.cdr.markForCheck();
      console.error('Error:', err);
      this.toast.error('Failed to save settings');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
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
