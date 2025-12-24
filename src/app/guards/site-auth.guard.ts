import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';
import { SupabaseService } from '../services/supabase.service';
import { combineLatest, from, of } from 'rxjs';
import { map, skipWhile, switchMap } from 'rxjs/operators';
import { getUserInfo } from '../../utils/userInfoStorage';

/**
 * Site-wide authentication guard
 * All users must be authenticated to view any page except the login page itself
 * Also checks if user is blocked and logs them out if so
 */
export const siteAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const adminAuthService = inject(AdminAuthService);
  const supabaseService = inject(SupabaseService);

  // Wait for loading to complete, then check authentication
  return combineLatest([
    adminAuthService.isAuthenticated$,
    adminAuthService.loading$
  ]).pipe(
    // Skip while loading
    skipWhile(([_, isLoading]) => isLoading),
    // Take first value after loading is complete
    switchMap(([isAuthenticated]) => {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        console.log('[SiteAuthGuard] Access denied - redirecting to login');
        return of(router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        }));
      }

      // User is authenticated - check if they are blocked
      const userInfo = getUserInfo();
      if (!userInfo.email) {
        // No email in storage, allow access (shouldn't happen in normal flow)
        return of(true);
      }

      // Check if user is blocked in database
      return from(
        supabaseService.directQuery<{ is_blocked: boolean }>(
          'email_subscribers',
          {
            select: 'is_blocked',
            eq: { email: userInfo.email.toLowerCase() },
            limit: 1
          }
        )
      ).pipe(
        map(({ data, error }) => {
          if (error) {
            console.error('[SiteAuthGuard] Error checking blocked status:', error);
            return true; // Allow access on error to avoid breaking the app
          }

          const isBlocked = data && Array.isArray(data) && data.length > 0 && data[0]?.is_blocked;
          
          if (isBlocked) {
            console.log('[SiteAuthGuard] User is blocked - logging out');
            adminAuthService.logout();
            return router.createUrlTree(['/login'], {
              queryParams: { 
                returnUrl: state.url,
                blocked: 'true'
              }
            });
          }

          return true;
        })
      );
    })
  );
};
