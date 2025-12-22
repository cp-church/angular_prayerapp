import { Component, OnInit, Injector } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <router-outlet></router-outlet>
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'prayerapp';

  constructor(
    private router: Router,
    private injector: Injector
  ) {}

  ngOnInit() {
    this.handleApprovalCode();
  }

  /**
   * Handle approval code in URL for one-time admin login
   * Admin services are lazy loaded only when approval code is present
   */
  private async handleApprovalCode() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) return;

    // Check if already validated
    const existingEmail = localStorage.getItem('approvalAdminEmail');
    if (existingEmail) {
      // Clear URL params and navigate to admin
      window.history.replaceState({}, '', window.location.pathname);
      
      // Lazy load admin auth service
      const { AdminAuthService } = await import('./services/admin-auth.service');
      const adminAuth = this.injector.get(AdminAuthService);
      await adminAuth.setApprovalSession(existingEmail);
      this.router.navigate(['/admin']);
      return;
    }

    try {
      // Lazy load both services
      const { ApprovalLinksService } = await import('./services/approval-links.service');
      const { AdminAuthService } = await import('./services/admin-auth.service');
      
      const approvalLinks = this.injector.get(ApprovalLinksService);
      const adminAuth = this.injector.get(AdminAuthService);
      
      const result = await approvalLinks.validateApprovalCode(code);

      if (result?.user?.email) {
        // Store approval session data
        localStorage.setItem('approvalAdminEmail', result.user.email);
        localStorage.setItem('approvalSessionValidated', 'true');
        localStorage.setItem('approvalApprovalType', result.approval_type);
        localStorage.setItem('approvalApprovalId', result.approval_id);

        // Immediately set admin status
        await adminAuth.setApprovalSession(result.user.email);

        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
        
        // Navigate to admin
        this.router.navigate(['/admin']);
      } else {
        // Code validation failed, go to login
        this.router.navigate(['/admin-login']);
      }
    } catch (error) {
      // Validation error - user can use normal login page
      console.error('Approval code validation failed:', error);
      this.router.navigate(['/admin-login']);
    }
  }
}
