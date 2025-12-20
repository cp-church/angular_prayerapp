import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { PendingPreferenceChange } from '../../services/admin-data.service';
import { SupabaseService } from '../../services/supabase.service';
import { lookupPersonByEmail, formatPersonName, type PlanningCenterPerson } from '../../../lib/planning-center';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pending-preference-change-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-4">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Preference Change Request
          </h3>

          <!-- User Info -->
          <div class="mb-4">
            <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{{ change.name }}</span>
              </div>
              <div class="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span class="break-words">{{ change.email }}
                  <!-- Planning Center Verification Badge -->
                  <span *ngIf="!pcLoading && pcPerson" class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Planning Center: {{ formatPersonName(pcPerson) }}
                  </span>
                  <span *ngIf="!pcLoading && !pcPerson && !pcError" class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    Not found
                  </span>
                  <span *ngIf="!pcLoading && pcError" class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    Error
                  </span>
                  <span *ngIf="pcLoading" class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                    <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                </span>
              </div>
              <div class="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{{ formatDate(change.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Requested Change -->
          <div class="p-3 rounded-lg border-2"
               [class]="change.receive_new_prayer_notifications ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'">
            <p class="text-sm font-medium mb-1"
               [class]="change.receive_new_prayer_notifications ? 'text-green-800 dark:text-green-200' : 'text-gray-800 dark:text-gray-200'">
              Requested Change:
            </p>
            <p class="text-sm"
               [class]="change.receive_new_prayer_notifications ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'">
              {{ change.receive_new_prayer_notifications ? 'Subscribe to' : 'Unsubscribe from' }} new prayer notifications
            </p>
          </div>
        </div>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          Pending
        </span>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-2">
        <button
          *ngIf="!isDenying"
          (click)="handleApprove()"
          [disabled]="isProcessing"
          class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {{ isProcessing ? 'Approving...' : 'Approve' }}
        </button>

        <button
          *ngIf="!isDenying"
          (click)="isDenying = true"
          [disabled]="isProcessing"
          class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Deny
        </button>
      </div>

      <!-- Denial Form -->
      <div *ngIf="isDenying" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reason for denial (required)
        </label>
        <textarea
          [(ngModel)]="denialReason"
          rows="3"
          placeholder="Explain why this preference change is being denied..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-3"
        ></textarea>
        <div class="flex gap-2">
          <button
            (click)="handleDeny()"
            [disabled]="!denialReason.trim() || isProcessing"
            class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isProcessing ? 'Denying...' : 'Confirm Denial' }}
          </button>
          <button
            (click)="isDenying = false; denialReason = ''"
            [disabled]="isProcessing"
            class="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PendingPreferenceChangeCardComponent implements OnInit {
  @Input() change!: PendingPreferenceChange;
  @Output() approve = new EventEmitter<string>();
  @Output() deny = new EventEmitter<{ id: string; reason: string }>();

  isProcessing = false;
  isDenying = false;
  denialReason = '';

  // Planning Center verification
  pcPerson: PlanningCenterPerson | null = null;
  pcLoading = false;
  pcError = false;

  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.lookupPlanningCenterPerson();
  }

  private async lookupPlanningCenterPerson() {
    if (!this.change?.email) {
      return;
    }

    this.pcLoading = true;
    this.pcError = false;

    try {
      const result = await lookupPersonByEmail(
        this.change.email,
        environment.supabaseUrl,
        environment.supabaseAnonKey
      );

      if (result.error) {
        console.error('Planning Center lookup error:', result.error);
        this.pcError = true;
      } else if (result.people && result.people.length > 0) {
        this.pcPerson = result.people[0];
      }
    } catch (error) {
      console.error('Unexpected error during Planning Center lookup:', error);
      this.pcError = true;
    } finally {
      this.pcLoading = false;
      this.cdr.markForCheck();
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPersonName(person: PlanningCenterPerson): string {
    return formatPersonName(person);
  }

  async handleApprove() {
    this.isProcessing = true;
    try {
      this.approve.emit(this.change.id);
    } finally {
      this.isProcessing = false;
    }
  }

  async handleDeny() {
    if (!this.denialReason.trim()) return;
    
    this.isProcessing = true;
    try {
      this.deny.emit({ id: this.change.id, reason: this.denialReason });
      this.isDenying = false;
      this.denialReason = '';
    } finally {
      this.isProcessing = false;
    }
  }
}
