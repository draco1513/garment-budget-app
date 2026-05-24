import { inject }          from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService }     from '../services/auth.service';

/**
 * authGuard — protege rutas que requieren login.
 * Si no hay sesión → redirige a /auth/login.
 */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;
  router.navigate(['/auth/login']);
  return false;
};

/**
 * permissionGuard — protege rutas que requieren un permiso específico.
 * Uso en routes: canActivate: [permissionGuard], data: { permission: 'BUDGET_APPROVE' }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth     = inject(AuthService);
  const router   = inject(Router);
  const required = route.data['permission'] as string;

  if (!required) return true;

  if (auth.hasPermission(required)) return true;

  router.navigate(['/forbidden']);
  return false;
};
