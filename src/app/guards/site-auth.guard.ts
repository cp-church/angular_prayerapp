import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';
import { combineLatest } from 'rxjs';
import { map, skipWhile } from 'rxjs/operators';

/**
 * Site-wide authentication guard
 * All users must be authenticated to view any page except the admin-login page itself
 */
export const siteAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const adminAuthService = inject(AdminAuthService);

  // Wait for loading to complete, then check authentication
  return combineLatest([
    adminAuthService.isAuthenticated$,
    adminAuthService.loading$
  ]).pipe(
    // Skip while loading
    skipWhile(([_, isLoading]) => isLoading),
    // Take first value after loading is complete
    map(([isAuthenticated]) => {
      // If user is authenticated, allow access
      if (isAuthenticated) {
        return true;
      }

      // Not authenticated - redirect to login
      console.log('[SiteAuthGuard] Access denied - redirecting to login');
      return router.createUrlTree(['/admin-login'], {
        queryParams: { returnUrl: state.url }
      });
    })
  );
};
