import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';
import { map, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

/**
 * Site-wide authentication guard
 * All users must be authenticated to view any page except the admin-login page itself
 */
export const siteAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const adminAuthService = inject(AdminAuthService);

  return adminAuthService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
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
