import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

export function authExpirationInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const oauthService = inject(OAuthService);
  const router = inject(Router);
  const dialog = inject(MatDialog);
  const accessToken = sessionStorage.getItem('access_token');

  if (!accessToken) return next(req);

  const tiempoExpiracionMs = parseInt(sessionStorage.getItem('expires_at')!);
  const tiempoEmisionMs = parseInt(sessionStorage.getItem('access_token_stored_at')!);
  const tiempoActualMs = Date.now();

  const tiempoVidaTotalMs = tiempoExpiracionMs - tiempoEmisionMs;
  const tiempoVidaActualMs = tiempoExpiracionMs - tiempoActualMs;

  const necesitaRefrescar = tiempoVidaActualMs <= 0 ||
    tiempoVidaActualMs <= 0.25 * tiempoVidaTotalMs;

  if (necesitaRefrescar && !isRefreshing) {
    isRefreshing = true;

    return from(oauthService.refreshToken()).pipe(
      switchMap((nuevoToken: any) => {
        const nuevoAccessToken = oauthService.getAccessToken();
        const ahoraMs = Date.now();

        if (nuevoAccessToken) {
          sessionStorage.setItem('access_token', nuevoAccessToken);
          sessionStorage.setItem(
            'expires_at',
            (ahoraMs + nuevoToken.expires_in * 1000).toString(),
          );
          sessionStorage.setItem('refresh_token', nuevoToken.refresh_token);
          sessionStorage.setItem('access_token_stored_at', ahoraMs.toString());
        }

        isRefreshing = false;

        return next(req); // Continuar con la request original
      }),
      catchError((error) => {
        isRefreshing = false;

        if (error instanceof HttpErrorResponse && error.status === 400) {
          oauthService.logOut();
          router.navigate(['/']).then(() => window.location.reload());
        }

        return throwError(() => error);
      }),
    );
  }

  return next(req);
}
