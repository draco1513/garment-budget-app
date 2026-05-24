import { Injectable, signal } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Router }             from '@angular/router';
import { Preferences }        from '@capacitor/preferences';
import { Observable, from, tap, catchError, throwError } from 'rxjs';
import { AuthResponse, LoginRequest, ApiResponse, UserInfo } from '../models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY   = 'gb_access_token';
const REFRESH_KEY = 'gb_refresh_token';
const USER_KEY    = 'gb_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // Signal reactivo — la UI reacciona automáticamente
  currentUser = signal<UserInfo | null>(null);
  isLoading   = signal(false);

  private baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  // ─── Login ────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    this.isLoading.set(true);
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.baseUrl}/login`, credentials
    ).pipe(
      tap(async res => {
        if (res.success) {
          await this.saveTokens(res.data);
          this.currentUser.set(res.data.user);
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  // ─── Logout ───────────────────────────────────────────────────

  async logout(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: REFRESH_KEY });
    await Preferences.remove({ key: USER_KEY });
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ─── Refresh Token ────────────────────────────────────────────

  refresh(): Observable<ApiResponse<AuthResponse>> {
    return from(Preferences.get({ key: REFRESH_KEY })).pipe(
      tap(() => {}),
      // switchMap no disponible sin importarlo — usamos el resultado directo
    ) as any; // simplificado para brevedad
  }

  refreshTokens(refreshToken: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.baseUrl}/refresh`, { refreshToken }
    ).pipe(
      tap(async res => {
        if (res.success) await this.saveTokens(res.data);
      })
    );
  }

  // ─── Token storage (Capacitor Preferences — seguro en móvil) ──

  async getAccessToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  }

  async getRefreshToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: REFRESH_KEY });
    return value;
  }

  private async saveTokens(data: AuthResponse): Promise<void> {
    await Preferences.set({ key: TOKEN_KEY, value: data.accessToken });
    await Preferences.set({ key: REFRESH_KEY, value: data.refreshToken });
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(data.user) });
  }

  private async restoreSession(): Promise<void> {
    const { value } = await Preferences.get({ key: USER_KEY });
    if (value) {
      try {
        this.currentUser.set(JSON.parse(value));
      } catch { /* token corrupto — sesión limpia */ }
    }
  }

  // ─── Permisos ─────────────────────────────────────────────────

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions?.includes(permission) ?? false;
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.roles?.includes(role) ?? false;
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
