import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="w-full min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
      <div class="max-w-md w-full mx-auto space-y-8 p-4 sm:p-8">
        <div class="text-center">
          <!-- Shield Icon -->
          <svg class="mx-auto h-12 w-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Portal
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in with a verification code sent to your email
          </p>
        </div>

        <!-- Success State -->
        <div *ngIf="success" class="space-y-4">
          <!-- Main success notification -->
          <div class="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-6 shadow-lg">
            <div class="flex items-start gap-3 mb-4">
              <!-- CheckCircle Icon -->
              <svg class="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="flex-1">
                <h3 class="text-green-900 dark:text-green-100 font-bold text-lg">
                  Verification Code Sent! 📧
                </h3>
                <p class="text-green-800 dark:text-green-200 text-sm mt-1">
                  We've sent a verification code to:
                </p>
                <p class="text-green-900 dark:text-green-100 font-semibold text-base mt-2">
                  {{email}}
                </p>
              </div>
            </div>

            <!-- MFA Code Input Form -->
            <div *ngIf="waitingForMfaCode" class="mt-4">
              <div class="bg-white dark:bg-gray-800 rounded-md p-4 border border-green-200 dark:border-green-800 space-y-4">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Enter Verification Code
                </h4>
                <div>
                  <label class="sr-only">
                    Verification Code
                  </label>
                  <div class="flex gap-2 justify-center" (paste)="handlePaste($event)">
                    <input
                      *ngFor="let digit of mfaCode; let i = index"
                      #codeInput
                      type="text"
                      inputmode="numeric"
                      [attr.maxlength]="codeLength"
                      [value]="mfaCode[i]"
                      (input)="handleCodeChange(i, $event)"
                      (keydown)="handleKeyDown(i, $event)"
                      [attr.autocomplete]="i === 0 ? 'one-time-code' : 'off'"
                      [disabled]="loading"
                      class="w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             border-green-400 dark:border-green-600 focus:border-green-500 focus:ring-2 focus:ring-green-200
                             disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <!-- Error Message for Code Verification -->
                <div *ngIf="error && waitingForMfaCode" class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <!-- AlertCircle Icon -->
                  <svg class="text-red-600 dark:text-red-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-red-800 dark:text-red-200 text-sm">{{error}}</span>
                </div>

                <!-- Verify Button -->
                <button
                  (click)="handleSubmit($event)"
                  [disabled]="loading || !isCodeComplete()"
                  type="button"
                  class="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div *ngIf="loading" class="flex items-center justify-center gap-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </div>
                  <span *ngIf="!loading">Verify Code</span>
                </button>
              </div>
            </div>

            <!-- Step-by-step instructions (when not waiting for code) -->
            <div *ngIf="!waitingForMfaCode" class="mt-4 bg-white dark:bg-gray-800 rounded-md p-4 border border-green-200 dark:border-green-800">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                What to do next:
              </h4>
              <ol class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li class="flex items-start gap-2">
                  <span class="flex-shrink-0 w-5 h-5 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Open your email inbox and look for an email from Prayer App</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="flex-shrink-0 w-5 h-5 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Find the <strong>6-digit verification code</strong> in the email</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="flex-shrink-0 w-5 h-5 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Enter the code above and click <strong>"Verify Code"</strong></span>
                </li>
              </ol>
            </div>

            <!-- Additional info -->
            <div class="mt-4 flex items-start gap-2 text-xs text-green-700 dark:text-green-300">
              <!-- AlertCircle Icon -->
              <svg class="flex-shrink-0 mt-0.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p>
                <strong>Don't see the email?</strong> Check your spam/junk folder. The code expires in 10 minutes.
              </p>
            </div>
          </div>

          <button
            (click)="resetForm()"
            class="w-full py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ← Send to a different email
          </button>
        </div>

        <!-- Login Form -->
        <form *ngIf="!success" class="mt-8 space-y-6" (ngSubmit)="handleSubmit($event)">
          <div>
            <label for="email" class="sr-only">
              Admin Email Address
            </label>
            <div class="relative">
              <!-- Mail Icon -->
              <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <input
                id="email"
                name="email"
                type="email"
                required
                [(ngModel)]="email"
                class="pl-12 pr-3 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Admin Email Address"
              />
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Enter your admin email to receive a verification code
            </p>
          </div>

          <!-- Error Message -->
          <div *ngIf="error && !waitingForMfaCode" class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <!-- AlertCircle Icon -->
            <svg class="text-red-600 dark:text-red-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-red-800 dark:text-red-200 text-sm">{{error}}</span>
          </div>

          <button
            type="submit"
            [disabled]="loading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div *ngIf="loading" class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending verification code...
            </div>
            <span *ngIf="!loading">Send Verification Code</span>
          </button>
        </form>

        <div class="mt-4 text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            🔒 Secure authentication via verification code
          </p>
        </div>

        <div class="mt-6 text-center">
          <a
            [routerLink]="['/']"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <!-- ArrowLeft Icon -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Main Page
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  email = '';
  mfaCode: string[] = [];
  codeLength = 4; // Will be fetched from settings
  error = '';
  success = false;
  loading = false;
  waitingForMfaCode = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private adminAuthService: AdminAuthService,
    private supabaseService: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // Initialize code array immediately so inputs can render
    this.mfaCode = new Array(this.codeLength).fill('');
    
    // Fetch code length from settings
    await this.fetchCodeLength();
    
    // Check if we just sent an MFA code (persisted across re-renders)
    const mfaSent = sessionStorage.getItem('mfa_email_sent');
    const savedEmail = sessionStorage.getItem('mfa_email');
    
    if (mfaSent === 'true' && savedEmail) {
      this.success = true;
      this.waitingForMfaCode = true;
      this.email = savedEmail;
      this.cdr.markForCheck();
      
      // Focus first input after a short delay
      setTimeout(() => {
        this.focusInput(0);
      }, 100);
    }

    // Check if user is already authenticated
    this.adminAuthService.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAdmin => {
        if (isAdmin) {
          this.router.navigate(['/admin']);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async handleSubmit(event: Event) {
    event.preventDefault();
    this.error = '';
    this.loading = true;
    this.cdr.markForCheck();

    try {
      // If waiting for MFA code, verify it
      if (this.waitingForMfaCode) {
        return this.verifyMfaCode();
      }

      // Otherwise, send MFA code
      console.log('[AdminLogin] Starting MFA code send for:', this.email);
      
      const timeoutId = setTimeout(() => {
        console.warn('[AdminLogin] MFA code request timed out');
        this.loading = false;
        this.error = 'Request timed out. Please try again.';
        this.cdr.markForCheck();
      }, 15000);

      const result = await this.adminAuthService.sendMfaCode(this.email);
      
      clearTimeout(timeoutId);
      
      console.log('[AdminLogin] MFA code send result:', result);
      
      if (result.success) {
        console.log('[AdminLogin] MFA code sent successfully');
        this.success = true;
        this.waitingForMfaCode = true;
        // Save to sessionStorage
        sessionStorage.setItem('mfa_email_sent', 'true');
        sessionStorage.setItem('mfa_email', this.email);
        this.cdr.markForCheck();
      } else {
        console.error('[AdminLogin] MFA code failed:', result.error);
        this.error = result.error || 'Failed to send MFA code. Please try again.';
        this.cdr.markForCheck();
      }
    } catch (err) {
      console.error('[AdminLogin] Exception in handleSubmit:', err);
      this.error = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      this.cdr.markForCheck();
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private async verifyMfaCode() {
    try {
      if (!this.isCodeComplete()) {
        this.error = 'Please enter the complete code from your email';
        this.loading = false;
        this.cdr.markForCheck();
        return;
      }

      console.log('[AdminLogin] Verifying MFA code');

      const result = await this.adminAuthService.verifyMfaCode(this.mfaCode.join(''));

      if (result.success) {
        console.log('[AdminLogin] MFA verification successful');
        // Clear sessionStorage and navigate
        sessionStorage.removeItem('mfa_email_sent');
        sessionStorage.removeItem('mfa_email');
        this.router.navigate(['/admin']);
      } else {
        console.error('[AdminLogin] MFA verification failed:', result.error);
        this.error = result.error || 'Invalid code. Please try again.';
        this.mfaCode = new Array(this.codeLength).fill(''); // Clear code for retry
        this.focusInput(0);
        this.cdr.markForCheck();
      }
    } catch (err) {
      console.error('[AdminLogin] Exception in verifyMfaCode:', err);
      this.error = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      this.cdr.markForCheck();
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private async fetchCodeLength() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('admin_settings')
        .select('verification_code_length')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        this.codeLength = data.verification_code_length || 4;
      } else {
        this.codeLength = 4;
      }
      this.mfaCode = new Array(this.codeLength).fill('');
    } catch (err) {
      console.error('[AdminLogin] Error fetching code length:', err);
      this.codeLength = 4;
      this.mfaCode = new Array(4).fill('');
    }
  }

  handleCodeChange(index: number, event: any): void {
    const target = event?.target;
    if (!target) return;
    
    const value = target.value;
    
    // Handle autofill on iOS/Chromium which pastes the full code into the first input
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, this.codeLength);
      if (digits.length >= this.codeLength) {
        this.mfaCode = digits.slice(0, this.codeLength).split('');
        this.error = '';
        // Reset the first input to show only its digit
        if (index === 0 && this.codeInputs?.first) {
          this.codeInputs.first.nativeElement.value = this.mfaCode[0];
        }
        this.focusInput(this.codeLength - 1);
        return;
      }
    }

    // Only allow digits
    if (/^\d$/.test(value)) {
      this.mfaCode[index] = value;
      this.error = '';
      if (index < this.codeLength - 1) {
        this.focusInput(index + 1);
      }
    } else {
      this.mfaCode[index] = '';
    }
  }

  handleKeyDown(index: number, event: any): void {
    const key = event?.key;
    if (!key) return;
    
    if (key === 'Backspace') {
      if (!this.mfaCode[index] && index > 0) {
        this.focusInput(index - 1);
      }
      this.mfaCode[index] = '';
    } else if (key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
    } else if (key === 'ArrowRight' && index < this.codeLength - 1) {
      this.focusInput(index + 1);
    } else if (key === 'Enter' && this.isCodeComplete()) {
      // Verify on Enter if all digits are filled
      this.handleSubmit(event);
    }
  }

  handlePaste(event: any): void {
    if (!event) return;
    
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') || '';
    const digits = paste.replace(/\D/g, '').slice(0, this.codeLength);
    
    if (digits.length >= this.codeLength) {
      this.mfaCode = digits.slice(0, this.codeLength).split('');
      this.focusInput(this.codeLength - 1);
    }
  }

  focusInput(index: number) {
    setTimeout(() => {
      const inputs = this.codeInputs.toArray();
      if (inputs[index]) {
        inputs[index].nativeElement.focus();
      }
    }, 0);
  }

  isCodeComplete(): boolean {
    return this.mfaCode.every(digit => digit.length === 1);
  }

  resetForm() {
    // Clear sessionStorage
    sessionStorage.removeItem('mfa_email_sent');
    sessionStorage.removeItem('mfa_email');
    this.success = false;
    this.waitingForMfaCode = false;
    this.email = '';
    this.mfaCode = new Array(this.codeLength).fill('');
    this.error = '';
    this.cdr.markForCheck();
  }
}
