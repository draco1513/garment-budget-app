import { Routes } from '@angular/router';
import { authGuard, permissionGuard } from './core/guards/guards';

export const routes: Routes = [

  // ─── Rutas públicas ──────────────────────────────────────────
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./modules/auth/login/login.page').then(m => m.LoginPage)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // ─── App principal (requiere auth) ───────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    children: [

      // Primera pantalla: selección de categoría
      {
        path: 'home',
        loadComponent: () =>
          import('./modules/landing/category-select/category-select.page')
            .then(m => m.CategorySelectPage)
      },

      // ── Presupuestos ──────────────────────────────────────────
      {
        path: 'budgets',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./modules/budget/list/budget-list.page').then(m => m.BudgetListPage)
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./modules/budget/create/budget-create.page').then(m => m.BudgetCreatePage),
            canActivate: [permissionGuard],
            data: { permission: 'BUDGET_CREATE' }
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./modules/budget/detail/budget-detail.page').then(m => m.BudgetDetailPage)
          },
          {
            path: ':id/negotiation',
            loadComponent: () =>
              import('./modules/budget/negotiation/negotiation.page').then(m => m.NegotiationPage),
            canActivate: [permissionGuard],
            data: { permission: 'BUDGET_NEGOTIATE' }
          }
        ]
      },

      // ── Prendas ───────────────────────────────────────────────
      {
        path: 'garments',
        loadComponent: () =>
          import('./modules/garments/list/garment-list.page').then(m => m.GarmentListPage)
      },

      // ── Materiales ────────────────────────────────────────────
      {
        path: 'materials',
        loadComponent: () =>
          import('./modules/materials/list/material-list.page').then(m => m.MaterialListPage),
        canActivate: [permissionGuard],
        data: { permission: 'MATERIAL_VIEW' }
      },

      // ── Avíos ─────────────────────────────────────────────────
      {
        path: 'accessories',
        loadComponent: () =>
          import('./modules/accessories/list/accessory-list.page').then(m => m.AccessoryListPage),
        canActivate: [permissionGuard],
        data: { permission: 'ACCESSORY_VIEW' }
      },

      // ── Admin ─────────────────────────────────────────────────
      {
        path: 'admin',
        children: [
          {
            path: 'users',
            loadComponent: () =>
              import('./modules/admin/users/user-list.page').then(m => m.UserListPage),
            canActivate: [permissionGuard],
            data: { permission: 'USER_VIEW' }
          },
          {
            path: 'roles',
            loadComponent: () =>
              import('./modules/admin/roles/role-list.page').then(m => m.RoleListPage),
            canActivate: [permissionGuard],
            data: { permission: 'USER_MANAGE_ROLES' }
          }
        ]
      },

      // ── Sin permisos ──────────────────────────────────────────
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./modules/landing/forbidden/forbidden.page').then(m => m.ForbiddenPage)
      },

      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '/home' }
];
