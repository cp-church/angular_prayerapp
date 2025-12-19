import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminGuard = () => {
  const adminAuthService = inject(AdminAuthService);
  const router = inject(Router);

  return adminAuthService.isAdmin$.pipe(
    map(isAdmin => {
      if (!isAdmin) {
        router.navigate(['/admin-login']);
        return false;
      }
      return true;
    })
  );
};
