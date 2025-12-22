import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map, skipWhile } from 'rxjs/operators';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminGuard = () => {
  const adminAuthService = inject(AdminAuthService);
  const router = inject(Router);

  // Check for approval code in URL before checking isAdmin
  const params = new URLSearchParams(window.location.search);
  const hasApprovalCode = params.has('code');
  
  // If there's an approval code, let the app component handle it
  if (hasApprovalCode) {
    return true;
  }

  // Wait for loading to complete, then check admin status
  return combineLatest([
    adminAuthService.isAdmin$,
    adminAuthService.loading$
  ]).pipe(
    // Skip while loading
    skipWhile(([_, isLoading]) => isLoading),
    // Check admin status
    map(([isAdmin]) => {
      if (!isAdmin) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    })
  );
};
