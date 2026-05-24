import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject }      from '@angular/core';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router }      from '@angular/router';
import { ToastController } from '@ionic/angular';

/**
 * JWT Interceptor — agrega el Bearer token a cada request.
 * Usa HttpInterceptorFn (funcional, Angular 17+) — sin clase ni @Injectable.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Rutas públicas que no necesitan token
  const publicPaths = ['/auth/login', '/auth/refresh', '/actuator/health'];
  const isPublic = publicPaths.some(p => req.url.includes(p));
  if (isPublic) return next(req);

  return from(authService.getAccessToken()).pipe(
    switchMap(token => {
      if (!token) return next(req);

      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next(authReq);
    })
  );
};

/**
 * Error Interceptor — manejo centralizado de errores HTTP.
 * 401 → logout y redirige a login
 * 403 → toast "Sin permisos"
 * 5xx → toast "Error del servidor"
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService  = inject(AuthService);
  const router       = inject(Router);
  const toastCtrl    = inject(ToastController);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          authService.logout();
          router.navigate(['/auth/login']);
          break;

        case 403:
          showToast(toastCtrl, 'Sin permisos para esta acción', 'warning');
          break;

        case 429:
          showToast(toastCtrl, 'Demasiados intentos. Espere un momento.', 'warning');
          break;

        case 0:
          // Sin conexión o servidor caído
          console.warn('[Error] Sin respuesta del servidor');
          break;

        default:
          if (error.status >= 500) {
            showToast(toastCtrl, 'Error del servidor. Intente más tarde.', 'danger');
          }
      }

      return throwError(() => error);
    })
  );
};

async function showToast(
  ctrl: ToastController,
  message: string,
  color: string
): Promise<void> {
  const toast = await ctrl.create({
    message, color, duration: 3000,
    position: 'top', buttons: [{ icon: 'close', role: 'cancel' }]
  });
  await toast.present();
}
