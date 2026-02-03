import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SSOAuthService } from '../services/sso-auth.service';

export const authGuard: CanActivateFn = async (
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(SSOAuthService);
  const router = inject(Router);
  const isAuth = await firstValueFrom(authService.hasValidAccessToken());

  if (!isAuth) {
    router.navigate(['']);
    return false;
  }

  const requiresCoordinadorProfile = next.data['requiresCoordinadorProfile'];

  if (requiresCoordinadorProfile) {
    const isCoordinador = await authService.isCoordinadorProfile();
    if (!isCoordinador) {
      router.navigate(['']);
      return false;
    }
  }

  return true;
};
