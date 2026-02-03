import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../environment/environment';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const router = inject(Router);
  const oauthService = inject(OAuthService);
  const accessToken = sessionStorage.getItem('access_token');
  if (environment.arrayUrlExceptions.some((url) => req.url.includes(url))) {
    return next(req);
  }

  if (accessToken) {
    const authRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return next(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          oauthService.logOut();
          router.navigate(['/']).then(() => window.location.reload());
        }
        return throwError(() => error);
      }),
    );
  }

  return next(req);
}
