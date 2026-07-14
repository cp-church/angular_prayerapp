import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';
import { EmailTemplatesManagerComponent } from '../email-templates-manager/email-templates-manager.component';
import { EmailSubscribersComponent } from '../email-subscribers/email-subscribers.component';
import { AdminSubscriberEmailBroadcastComponent } from '../admin-subscriber-email-broadcast/admin-subscriber-email-broadcast.component';
import { AdminSectionLoadingComponent } from '../admin-section-loading/admin-section-loading.component';

@Component({
  selector: 'app-email-settings',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    EmailTemplatesManagerComponent,
    EmailSubscribersComponent,
    AdminSubscriberEmailBroadcastComponent,
    AdminSectionLoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      @if (error) {
        <div class="mb-4">
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4" role="alert" aria-live="assertive" aria-atomic="true">
            <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
          </div>
        </div>
      }

      <!-- Email Subscribers Component -->
      <div class="mb-4">
        <app-email-subscribers></app-email-subscribers>
      </div>

      <div class="mb-4">
        <app-admin-subscriber-email-broadcast></app-admin-subscriber-email-broadcast>
      </div>

      <!-- Prayer Update Reminders Section -->
      <div class="mb-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40" [class.cursor-pointer]="!remindersSectionExpanded" (click)="!remindersSectionExpanded && onRemindersSectionToggle()">
        <button
          type="button"
          id="email-reminders-settings-trigger"
          class="admin-settings-collapsible-trigger cursor-pointer w-full flex min-h-12 items-center justify-between gap-2 text-left rounded-lg -mx-1 px-1 py-0.5 -my-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
          (click)="onRemindersSectionToggle(); $event.stopPropagation()"
          [attr.aria-expanded]="remindersSectionExpanded"
          aria-controls="email-reminders-panel"
        >
          <span class="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 min-w-0">
            <svg class="text-blue-600 dark:text-blue-400 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Prayer Update Reminders
          </span>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200"
            [class.rotate-180]="remindersSectionExpanded"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        @if (remindersSectionExpanded) {
        <div
          id="email-reminders-panel"
          role="region"
          aria-labelledby="email-reminders-settings-trigger"
          class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
        @if (loading) {
        <app-admin-section-loading message="Loading reminder settings…" />
        }

        @if (!loading) {
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Automatically send email reminders to prayer requesters and optionally archive prayers without updates.
        </p>

        <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <!-- Enable Reminders Checkbox -->
          <label class="flex items-start cursor-pointer mb-4">
            <input
              type="checkbox"
              [(ngModel)]="enableReminders"
              id="enableReminders"
              name="enableReminders"
              aria-label="Enable prayer update reminders"
              class="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
            />
            <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Enable prayer update reminders</span>
          </label>

          @if (enableReminders) {
            <!-- Reminder Interval Days -->
            <div class="ml-6 mb-4 pb-4 border-b border-gray-300 dark:border-gray-600">
              <label for="reminder-interval-days" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Days of inactivity before sending reminder email
              </label>
              <div class="flex items-center gap-3">
                <input
                  id="reminder-interval-days"
                  type="number"
                  min="1"
                  max="90"
                  [(ngModel)]="reminderIntervalDays"
                  name="reminderIntervalDays"
                  (ngModelChange)="validateReminderDays()"
                  aria-label="Days before sending reminder"
                  aria-describedby="reminderDaysHelp"
                  class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">days</span>
              </div>
              <p id="reminderDaysHelp" class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Send reminder email after this many days without any updates to the prayer.
              </p>
            </div>

            <!-- Auto-Archive Setting -->
            <div class="ml-6">
              <label class="flex items-start cursor-pointer mb-3">
                <input
                  type="checkbox"
                  [(ngModel)]="enableAutoArchive"
                  id="enableAutoArchive"
                  name="enableAutoArchive"
                  aria-label="Auto-archive prayers after reminder"
                  class="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Auto-archive prayers after reminder if still no update</span>
              </label>
              
              @if (enableAutoArchive) {
                <div class="ml-6 mb-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Days after reminder email before auto-archiving
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      [(ngModel)]="daysBeforeArchive"
                      (ngModelChange)="validateArchiveDays()"
                      class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">days</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    After the reminder email is sent, if no update is received within this many days, the prayer will be automatically archived.
                  </p>
                  <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                    <p class="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Example:</strong> With {{ reminderIntervalDays }} days for reminder and {{ daysBeforeArchive }} days for archive, a prayer with no updates will receive a reminder after {{ reminderIntervalDays }} days, then be archived {{ daysBeforeArchive }} days later (total of {{ reminderIntervalDays + daysBeforeArchive }} days) if still no update.
                    </p>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        @if (successReminders) {
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-4 mb-4" role="status" aria-live="polite" aria-atomic="true">
            <p class="text-sm text-green-800 dark:text-green-200">
              Reminder settings saved successfully!
            </p>
          </div>
        }

        <div class="flex justify-end">
          <button
            (click)="saveReminderSettings()"
            [disabled]="savingReminders"
            class="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Save reminder settings"
          >
            @if (savingReminders) {
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            }
            @if (!savingReminders) {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            }
            {{ savingReminders ? 'Saving...' : 'Save Reminder Settings' }}
          </button>
        </div>
        }
        </div>
        }
      </div>
      </div>

      <!-- Hourly user prayer reminder (Settings → Prayer reminders) -->
      <div class="mb-4">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
          [class.cursor-pointer]="!hourlySectionExpanded"
          (click)="!hourlySectionExpanded && onHourlySectionToggle()"
        >
          <button
            type="button"
            id="email-hourly-reminder-settings-trigger"
            class="admin-settings-collapsible-trigger cursor-pointer w-full flex min-h-12 items-center justify-between gap-2 text-left rounded-lg -mx-1 px-1 py-0.5 -my-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
            (click)="onHourlySectionToggle(); $event.stopPropagation()"
            [attr.aria-expanded]="hourlySectionExpanded"
            aria-controls="email-hourly-reminder-panel"
          >
            <span class="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 min-w-0">
              <svg class="text-blue-600 dark:text-blue-400 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
              Hourly user prayer reminder email
            </span>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200"
              [class.rotate-180]="hourlySectionExpanded"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          @if (hourlySectionExpanded) {
            <div
              id="email-hourly-reminder-panel"
              role="region"
              aria-labelledby="email-hourly-reminder-settings-trigger"
              class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Users opt in under <strong class="text-gray-800 dark:text-gray-200">Settings → Prayer reminders</strong>. This controls which template the hourly job sends. The
                <strong class="text-gray-800 dark:text-gray-200">random recent prayer</strong> option picks a different prayer when possible: <strong class="text-gray-800 dark:text-gray-200">every</strong> approved <strong class="text-gray-800 dark:text-gray-200">current</strong> community prayer on the church list, plus <strong class="text-gray-800 dark:text-gray-200">all</strong> of your personal prayers that are not <strong class="text-gray-800 dark:text-gray-200">Answered</strong>. Edit copy in <strong class="text-gray-800 dark:text-gray-200">Email Templates</strong> (keys <code class="text-xs">user_hourly_prayer_reminder</code> and <code class="text-xs">user_hourly_prayer_reminder_with_spotlight</code>).
              </p>

              @if (loadingHourlyTemplate) {
                <div class="text-center py-6">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Loading hourly reminder template…</p>
                </div>
              }

              @if (!loadingHourlyTemplate) {
                <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span id="user-hourly-reminder-template-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email template</span>
                  <div class="relative max-w-lg">
                    <div
                      [ngClass]="{
                        'border-blue-500 bg-blue-50 dark:bg-blue-900/20': showHourlyPrayerTemplateDropdown,
                        'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20': !showHourlyPrayerTemplateDropdown
                      }"
                      class="flex w-full rounded-lg border-2 transition-all overflow-hidden"
                    >
                      <button
                        type="button"
                        id="user-hourly-reminder-template"
                        (click)="showHourlyPrayerTemplateDropdown = !showHourlyPrayerTemplateDropdown"
                        [disabled]="savingHourlyTemplate"
                        [attr.aria-expanded]="showHourlyPrayerTemplateDropdown"
                        aria-haspopup="listbox"
                        aria-labelledby="user-hourly-reminder-template-label"
                        aria-describedby="userHourlyReminderTemplateHelp"
                        class="w-full flex items-center justify-between gap-2 p-2 sm:p-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <span class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ hourlyPrayerTemplateLabel() }}</span>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="text-gray-600 dark:text-gray-400 transition-transform shrink-0"
                          [class.rotate-180]="showHourlyPrayerTemplateDropdown"
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    </div>
                    @if (showHourlyPrayerTemplateDropdown) {
                    <div>
                      <div class="fixed inset-0 z-10" (click)="showHourlyPrayerTemplateDropdown = false"></div>
                      <div
                        role="listbox"
                        aria-labelledby="user-hourly-reminder-template-label"
                        class="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 max-h-60 overflow-y-auto"
                      >
                        @for (opt of hourlyReminderTemplateOptions; track opt.value) {
                        <button
                          type="button"
                          role="option"
                          [attr.aria-selected]="userHourlyReminderTemplateKey === opt.value"
                          (click)="setHourlyPrayerTemplateKey(opt.value)"
                          class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{{ opt.label }}</span>
                          @if (userHourlyReminderTemplateKey === opt.value) {
                          <span class="text-blue-600 dark:text-blue-400">✓</span>
                          }
                        </button>
                        }
                      </div>
                    </div>
                    }
                  </div>
                  <p id="userHourlyReminderTemplateHelp" class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Push notifications use the same spotlight title when that option is selected and a prayer is available.
                  </p>
                </div>
              }

              @if (successHourlyTemplate) {
                <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-4 mb-4" role="status" aria-live="polite">
                  <p class="text-sm text-green-800 dark:text-green-200">Hourly reminder template saved.</p>
                </div>
              }

              <div class="flex justify-end">
                <button
                  type="button"
                  (click)="saveHourlyUserReminderTemplate()"
                  [disabled]="savingHourlyTemplate || loadingHourlyTemplate"
                  class="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Save hourly reminder template"
                >
                  @if (savingHourlyTemplate) {
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  }
                  @if (!savingHourlyTemplate) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  }
                  {{ savingHourlyTemplate ? 'Saving…' : 'Save hourly reminder template' }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Hourly user memorization reminder (Settings → Memorization reminders) -->
      <div class="mb-4">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
          [class.cursor-pointer]="!hourlyMemorizationSectionExpanded"
          (click)="!hourlyMemorizationSectionExpanded && onHourlyMemorizationSectionToggle()"
        >
          <button
            type="button"
            id="email-hourly-memorization-reminder-settings-trigger"
            class="admin-settings-collapsible-trigger cursor-pointer w-full flex min-h-12 items-center justify-between gap-2 text-left rounded-lg -mx-1 px-1 py-0.5 -my-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
            (click)="onHourlyMemorizationSectionToggle(); $event.stopPropagation()"
            [attr.aria-expanded]="hourlyMemorizationSectionExpanded"
            aria-controls="email-hourly-memorization-reminder-panel"
          >
            <span class="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 min-w-0">
              <svg class="text-blue-600 dark:text-blue-400 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              Hourly user memorization reminder email
            </span>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200"
              [class.rotate-180]="hourlyMemorizationSectionExpanded"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          @if (hourlyMemorizationSectionExpanded) {
            <div
              id="email-hourly-memorization-reminder-panel"
              role="region"
              aria-labelledby="email-hourly-memorization-reminder-settings-trigger"
              class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Users opt in under <strong class="text-gray-800 dark:text-gray-200">Settings → Memorization reminders</strong>. This controls which template the hourly job sends. The
                <strong class="text-gray-800 dark:text-gray-200">spotlight</strong> option highlights the item on the user's memorization list that needs the most practice (learning tier and least recently practiced first). Edit copy in <strong class="text-gray-800 dark:text-gray-200">Email Templates</strong> (keys <code class="text-xs">user_hourly_memorization_reminder</code> and <code class="text-xs">user_hourly_memorization_reminder_with_spotlight</code>).
              </p>

              @if (loadingHourlyMemorizationTemplate) {
                <div class="text-center py-6">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Loading memorization reminder template…</p>
                </div>
              }

              @if (!loadingHourlyMemorizationTemplate) {
                <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span id="user-hourly-memorization-reminder-template-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email template</span>
                  <div class="relative max-w-lg">
                    <div
                      [ngClass]="{
                        'border-blue-500 bg-blue-50 dark:bg-blue-900/20': showHourlyMemorizationTemplateDropdown,
                        'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20': !showHourlyMemorizationTemplateDropdown
                      }"
                      class="flex w-full rounded-lg border-2 transition-all overflow-hidden"
                    >
                      <button
                        type="button"
                        id="user-hourly-memorization-reminder-template"
                        (click)="showHourlyMemorizationTemplateDropdown = !showHourlyMemorizationTemplateDropdown"
                        [disabled]="savingHourlyMemorizationTemplate"
                        [attr.aria-expanded]="showHourlyMemorizationTemplateDropdown"
                        aria-haspopup="listbox"
                        aria-labelledby="user-hourly-memorization-reminder-template-label"
                        aria-describedby="userHourlyMemorizationReminderTemplateHelp"
                        class="w-full flex items-center justify-between gap-2 p-2 sm:p-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <span class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ hourlyMemorizationTemplateLabel() }}</span>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="text-gray-600 dark:text-gray-400 transition-transform shrink-0"
                          [class.rotate-180]="showHourlyMemorizationTemplateDropdown"
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    </div>
                    @if (showHourlyMemorizationTemplateDropdown) {
                    <div>
                      <div class="fixed inset-0 z-10" (click)="showHourlyMemorizationTemplateDropdown = false"></div>
                      <div
                        role="listbox"
                        aria-labelledby="user-hourly-memorization-reminder-template-label"
                        class="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 max-h-60 overflow-y-auto"
                      >
                        @for (opt of hourlyMemorizationReminderTemplateOptions; track opt.value) {
                        <button
                          type="button"
                          role="option"
                          [attr.aria-selected]="userHourlyMemorizationReminderTemplateKey === opt.value"
                          (click)="setHourlyMemorizationTemplateKey(opt.value)"
                          class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{{ opt.label }}</span>
                          @if (userHourlyMemorizationReminderTemplateKey === opt.value) {
                          <span class="text-blue-600 dark:text-blue-400">✓</span>
                          }
                        </button>
                        }
                      </div>
                    </div>
                    }
                  </div>
                  <p id="userHourlyMemorizationReminderTemplateHelp" class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Push notifications use the spotlight reference when that option is selected and the user has memorized items.
                  </p>
                </div>
              }

              @if (successHourlyMemorizationTemplate) {
                <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-4 mb-4" role="status" aria-live="polite">
                  <p class="text-sm text-green-800 dark:text-green-200">Memorization reminder template saved.</p>
                </div>
              }

              <div class="flex justify-end">
                <button
                  type="button"
                  (click)="saveHourlyMemorizationReminderTemplate()"
                  [disabled]="savingHourlyMemorizationTemplate || loadingHourlyMemorizationTemplate"
                  class="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Save memorization hourly reminder template"
                >
                  @if (savingHourlyMemorizationTemplate) {
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  }
                  @if (!savingHourlyMemorizationTemplate) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  }
                  {{ savingHourlyMemorizationTemplate ? 'Saving…' : 'Save memorization reminder template' }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Email Templates Manager -->
      <div class="mb-4">
        <app-email-templates-manager></app-email-templates-manager>
      </div>
    </div>
  `,
  styles: []
})
export class EmailSettingsComponent implements OnInit {
  @ViewChild(EmailSubscribersComponent) emailSubscribers?: EmailSubscribersComponent;

  @Output() onSave = new EventEmitter<void>();

  readonly hourlyReminderTemplateOptions = [
    { value: 'user_hourly_prayer_reminder', label: 'Simple nudge (default)' },
    {
      value: 'user_hourly_prayer_reminder_with_spotlight',
      label: 'Spotlight mix — all current community + your personal (non-answered)',
    },
  ] as const;

  readonly hourlyMemorizationReminderTemplateOptions = [
    { value: 'user_hourly_memorization_reminder', label: 'Simple nudge (default)' },
    {
      value: 'user_hourly_memorization_reminder_with_spotlight',
      label: 'Spotlight — item needing the most practice',
    },
  ] as const;

  remindersSectionExpanded = false;
  private remindersInitialLoadDone = false;

  hourlySectionExpanded = false;
  hourlyMemorizationSectionExpanded = false;
  showHourlyPrayerTemplateDropdown = false;
  showHourlyMemorizationTemplateDropdown = false;

  enableReminders = false;
  reminderIntervalDays = 7;
  enableAutoArchive = false;
  daysBeforeArchive = 7;

  userHourlyReminderTemplateKey: string = 'user_hourly_prayer_reminder';
  loadingHourlyTemplate = false;
  savingHourlyTemplate = false;
  successHourlyTemplate = false;

  userHourlyMemorizationReminderTemplateKey: string = 'user_hourly_memorization_reminder';
  loadingHourlyMemorizationTemplate = false;
  savingHourlyMemorizationTemplate = false;
  successHourlyMemorizationTemplate = false;

  loading = false;
  savingReminders = false;
  error: string | null = null;
  successVerification = false;
  successReminders = false;

  constructor(
    private supabase: SupabaseService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.loadHourlyUserReminderTemplate();
    void this.loadHourlyMemorizationReminderTemplate();
  }

  onRemindersSectionToggle(): void {
    this.remindersSectionExpanded = !this.remindersSectionExpanded;
    if (this.remindersSectionExpanded && !this.remindersInitialLoadDone) {
      this.remindersInitialLoadDone = true;
      void this.loadSettings();
    }
    this.cdr.markForCheck();
  }

  onHourlySectionToggle(): void {
    this.hourlySectionExpanded = !this.hourlySectionExpanded;
    this.cdr.markForCheck();
  }

  onHourlyMemorizationSectionToggle(): void {
    this.hourlyMemorizationSectionExpanded = !this.hourlyMemorizationSectionExpanded;
    this.cdr.markForCheck();
  }

  hourlyPrayerTemplateLabel(): string {
    return (
      this.hourlyReminderTemplateOptions.find((o) => o.value === this.userHourlyReminderTemplateKey)
        ?.label ?? 'Simple nudge (default)'
    );
  }

  hourlyMemorizationTemplateLabel(): string {
    return (
      this.hourlyMemorizationReminderTemplateOptions.find(
        (o) => o.value === this.userHourlyMemorizationReminderTemplateKey
      )?.label ?? 'Simple nudge (default)'
    );
  }

  setHourlyPrayerTemplateKey(value: string): void {
    this.userHourlyReminderTemplateKey = value;
    this.showHourlyPrayerTemplateDropdown = false;
    this.cdr.markForCheck();
  }

  setHourlyMemorizationTemplateKey(value: string): void {
    this.userHourlyMemorizationReminderTemplateKey = value;
    this.showHourlyMemorizationTemplateDropdown = false;
    this.cdr.markForCheck();
  }

  async loadHourlyMemorizationReminderTemplate(): Promise<void> {
    this.loadingHourlyMemorizationTemplate = true;
    this.successHourlyMemorizationTemplate = false;
    this.cdr.markForCheck();
    try {
      const { data, error } = await this.supabase.client
        .from('admin_settings')
        .select('user_hourly_memorization_reminder_template_key')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      const key = (data as { user_hourly_memorization_reminder_template_key?: string } | null)
        ?.user_hourly_memorization_reminder_template_key;
      if (
        key === 'user_hourly_memorization_reminder' ||
        key === 'user_hourly_memorization_reminder_with_spotlight'
      ) {
        this.userHourlyMemorizationReminderTemplateKey = key;
      }
    } catch (err: unknown) {
      console.error('Error loading memorization hourly reminder template setting:', err);
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Unknown error';
      this.error = `Failed to load memorization hourly reminder template: ${message}`;
      this.cdr.markForCheck();
    } finally {
      this.loadingHourlyMemorizationTemplate = false;
      this.cdr.markForCheck();
    }
  }

  async saveHourlyMemorizationReminderTemplate(): Promise<void> {
    this.savingHourlyMemorizationTemplate = true;
    this.successHourlyMemorizationTemplate = false;
    this.error = null;
    this.cdr.markForCheck();
    try {
      const { error } = await this.supabase.client
        .from('admin_settings')
        .update({
          user_hourly_memorization_reminder_template_key:
            this.userHourlyMemorizationReminderTemplateKey,
        })
        .eq('id', 1);

      if (error) throw error;

      this.successHourlyMemorizationTemplate = true;
      this.toast.success('Hourly memorization reminder template saved.');
      this.onSave.emit();
      this.cdr.markForCheck();
      setTimeout(() => {
        this.successHourlyMemorizationTemplate = false;
        this.cdr.markForCheck();
      }, 3000);
    } catch (err: unknown) {
      console.error('Error saving memorization hourly reminder template:', err);
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Unknown error';
      this.error = `Failed to save memorization hourly reminder template: ${message}`;
      this.toast.error('Failed to save memorization hourly reminder template');
      this.cdr.markForCheck();
    } finally {
      this.savingHourlyMemorizationTemplate = false;
      this.cdr.markForCheck();
    }
  }

  async loadHourlyUserReminderTemplate(): Promise<void> {
    this.loadingHourlyTemplate = true;
    this.successHourlyTemplate = false;
    this.cdr.markForCheck();
    try {
      const { data, error } = await this.supabase.client
        .from('admin_settings')
        .select('user_hourly_prayer_reminder_template_key')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      const key = (data as { user_hourly_prayer_reminder_template_key?: string } | null)
        ?.user_hourly_prayer_reminder_template_key;
      if (
        key === 'user_hourly_prayer_reminder' ||
        key === 'user_hourly_prayer_reminder_with_spotlight'
      ) {
        this.userHourlyReminderTemplateKey = key;
      }
    } catch (err: unknown) {
      console.error('Error loading hourly reminder template setting:', err);
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Unknown error';
      this.error = `Failed to load hourly reminder template: ${message}`;
      this.cdr.markForCheck();
    } finally {
      this.loadingHourlyTemplate = false;
      this.cdr.markForCheck();
    }
  }

  async saveHourlyUserReminderTemplate(): Promise<void> {
    this.savingHourlyTemplate = true;
    this.successHourlyTemplate = false;
    this.error = null;
    this.cdr.markForCheck();
    try {
      const { error } = await this.supabase.client
        .from('admin_settings')
        .update({ user_hourly_prayer_reminder_template_key: this.userHourlyReminderTemplateKey })
        .eq('id', 1);

      if (error) throw error;

      this.successHourlyTemplate = true;
      this.toast.success('Hourly prayer reminder template saved.');
      this.onSave.emit();
      this.cdr.markForCheck();
      setTimeout(() => {
        this.successHourlyTemplate = false;
        this.cdr.markForCheck();
      }, 3000);
    } catch (err: unknown) {
      console.error('Error saving hourly reminder template:', err);
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Unknown error';
      this.error = `Failed to save hourly reminder template: ${message}`;
      this.toast.error('Failed to save hourly reminder template');
      this.cdr.markForCheck();
    } finally {
      this.savingHourlyTemplate = false;
      this.cdr.markForCheck();
    }
  }

  async loadSettings() {
    try {
      this.loading = true;
      this.cdr.markForCheck();
      this.error = null;

      const { data, error } = await this.supabase.client
        .from('admin_settings')
        .select('enable_reminders, reminder_interval_days, enable_auto_archive, days_before_archive')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.enable_reminders !== null && data.enable_reminders !== undefined) {
          this.enableReminders = data.enable_reminders;
        }
        if (data.reminder_interval_days !== null && data.reminder_interval_days !== undefined) {
          this.reminderIntervalDays = data.reminder_interval_days;
        }
        if (data.enable_auto_archive !== null && data.enable_auto_archive !== undefined) {
          this.enableAutoArchive = data.enable_auto_archive;
        }
        if (data.days_before_archive !== null && data.days_before_archive !== undefined) {
          this.daysBeforeArchive = data.days_before_archive;
        }
      }
    } catch (err: unknown) {
      console.error('Error loading email settings:', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Unknown error';
      this.error = `Failed to load email settings: ${message}`;
      this.remindersSectionExpanded = true;
      this.cdr.markForCheck();
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async saveReminderSettings() {
    try {
      this.savingReminders = true;
      this.cdr.markForCheck();
      this.error = null;
      this.successReminders = false;

      const { error } = await this.supabase.client
        .from('admin_settings')
        .upsert({
          id: 1,
          enable_reminders: this.enableReminders,
          reminder_interval_days: this.reminderIntervalDays,
          enable_auto_archive: this.enableAutoArchive,
          days_before_archive: this.daysBeforeArchive
        })
        .select();

      if (error) throw error;

      this.successReminders = true;
      this.cdr.markForCheck();
      this.toast.success('Prayer reminder settings saved!');
      this.onSave.emit();

      setTimeout(() => {
        this.successReminders = false;
        this.cdr.markForCheck();
      }, 3000);
    } catch (err: unknown) {
      console.error('Error saving reminder settings:', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Unknown error';
      this.error = `Failed to save reminder settings: ${message}`;
      this.remindersSectionExpanded = true;
      this.cdr.markForCheck();
      this.toast.error('Failed to save reminder settings');
    } finally {
      this.savingReminders = false;
      this.cdr.markForCheck();
    }
  }

  validateReminderDays() {
    if (this.reminderIntervalDays < 1) {
      this.reminderIntervalDays = 1;
    } else if (this.reminderIntervalDays > 90) {
      this.reminderIntervalDays = 90;
    }
  }

  validateArchiveDays() {
    if (this.daysBeforeArchive < 1) {
      this.daysBeforeArchive = 1;
    } else if (this.daysBeforeArchive > 90) {
      this.daysBeforeArchive = 90;
    }
  }

  /** Expand Email Subscribers and reset add form before the admin Email Subscribers driver.js tour. */
  prepareEmailSubscribersTour(): void {
    this.emailSubscribers?.prepareTourInitialState();
  }

  /** Overview tour: expand Email Subscribers, set list search to app-test, and load rows for column highlights. */
  prepareEmailSubscribersOverviewTour(): Promise<void> {
    return this.emailSubscribers?.prepareOverviewTourListState() ?? Promise.resolve();
  }

  openAddSubscriberFormForTour(): void {
    this.emailSubscribers?.openAddFormForTour();
  }

  showPlanningCenterTabForTour(): void {
    this.emailSubscribers?.showPlanningCenterTabForTour();
  }

  runPlanningCenterSearchTourDemo(): Promise<void> {
    return this.emailSubscribers?.runPlanningCenterSearchTourDemo() ?? Promise.resolve();
  }

  selectTourPlanningCenterMatchFromDemoResults(): void {
    this.emailSubscribers?.selectTourPlanningCenterMatchFromDemoResults();
  }

  applyTourDemoPlanningCenterAdd(): void {
    this.emailSubscribers?.applyTourDemoPlanningCenterAdd();
  }

  clearEmailSubscribersTourDemoForm(): void {
    this.emailSubscribers?.clearEmailSubscribersTourDemoForm();
  }
}
