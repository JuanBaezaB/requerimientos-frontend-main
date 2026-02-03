import { inject, Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { Observable, of } from 'rxjs';
import { environment } from '../environment/environment';
import { User } from '../interface/user.interface';

@Injectable({ providedIn: 'root' })
export class SSOAuthService {
  private _oauthService = inject(OAuthService);

  constructor() {
    this.configure();
  }

  private configure() {
    this._oauthService.configure(environment.authConfig);
    this._oauthService.tryLogin();
  }

  async login() {
    await this._oauthService.initCodeFlow();
  }

  async logout() {
    this._oauthService.logOut();
    await this._oauthService.revokeTokenAndLogout();
    sessionStorage.clear();
  }

  public hasValidAccessToken(): Observable<boolean> {
    const isAuth = this._oauthService.hasValidAccessToken();
    return of(isAuth);
  }

  public async accessToken(): Promise<string> {
    return await new Promise((resolve) => {
      setTimeout(() => {
        const token = this._oauthService.getIdToken() || '';
        resolve(token);
      }, 2000);
    });
  }

  async isAuthenticated(): Promise<boolean> {
    return this._oauthService.hasValidAccessToken();
  }

  async refreshToken() {
    return this._oauthService.refreshToken();
  }

  async getUserInfoProfile(): Promise<User | null> {
    const token = sessionStorage.getItem('id_token');

    if (!token) {
      throw new Error('Token no encontrado');
    }

    try {
      const decoded = jwtDecode<JwtPayload & User>(token);
      return {
        given_name: decoded.given_name || 'Usuario',
        email: decoded.email || 'Sin correo',
      };
    } catch (error) {
      return null;
    }
  }

  async isCoordinadorProfile(): Promise<boolean> {
    try {
      const user = await this.getUserInfoProfile();

      if (!user || !user.email) {
        return false;
      }

      return environment.remoteUsers.mainUsers
        .map((email) => email.toLowerCase())
        .includes(user.email.toLowerCase());
    } catch (_) {
      return false;
    }
  }
}
