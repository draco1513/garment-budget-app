# Garment Budget App — Frontend

Angular 18 + Ionic 8 + Capacitor 6

---

## Comandos principales

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Desarrollo web (con proxy al backend en :8080)
npm start
# → http://localhost:4200

# Build producción
npm run build

# Tests
npm run test

# Analizar tamaño del bundle
npm run analyze

# Sincronizar con Android/iOS (después de npm run build)
npm run cap:sync

# Abrir en Android Studio
npm run cap:android

# Abrir en Xcode (solo macOS)
npm run cap:ios
```

---

## Estructura

```
src/app/
├── core/
│   ├── services/
│   │   ├── auth.service.ts          ← JWT + Capacitor Preferences
│   │   ├── budget.service.ts        ← API de presupuestos
│   │   ├── catalog-cache.service.ts ← Sincronización offline
│   │   ├── connectivity.service.ts  ← Detección online/offline
│   │   ├── local-db.service.ts      ← IndexedDB con Dexie.js
│   │   └── sync-queue.service.ts    ← Cola de operaciones offline
│   ├── interceptors/
│   │   └── http.interceptors.ts     ← JWT + manejo de errores
│   └── guards/
│       └── guards.ts                ← authGuard + permissionGuard
│
├── modules/
│   ├── auth/login/                  ← Pantalla de login
│   ├── landing/category-select/     ← PRIMERA PANTALLA — elegir categoría
│   ├── budget/
│   │   ├── list/                    ← Lista de presupuestos
│   │   ├── create/                  ← Wizard de creación (3 pasos)
│   │   ├── detail/                  ← Detalle completo + exportar
│   │   └── negotiation/             ← Registrar negociación
│   ├── garments/list/               ← Catálogo de prendas
│   ├── materials/list/              ← Catálogo de telas
│   ├── accessories/list/            ← Catálogo de avíos
│   └── admin/
│       ├── users/                   ← Gestión de usuarios
│       └── roles/                   ← Ver roles y permisos
│
└── shared/
    ├── directives/has-permission.directive.ts
    └── pipes/pipes.ts               ← sol, budgetStatus, statusColor
```

---

## Modo Offline

Al detectar pérdida de internet:
1. Banner amarillo aparece en la parte superior
2. Listas usan datos de IndexedDB (Dexie.js)
3. Operaciones de escritura van a la cola (`SyncQueueService`)
4. Al reconectar → cola se procesa automáticamente

---

## Variables de entorno

```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'http://localhost:8080/api/v1',
  // ...
};

// src/environments/environment.prod.ts
export const environment = {
  apiUrl: 'https://app.garmentbudget.pe/api/v1',
  // ...
};
```

---

## Compilar para Android

```bash
# 1. Instalar Android Studio
# 2. Build y sincronizar
npm run build
npx cap sync

# 3. Abrir en Android Studio
npx cap open android

# 4. En Android Studio: Build > Generate Signed APK
```

---

## Compilar para iOS (solo macOS)

```bash
npm run build
npx cap sync
npx cap open ios
# En Xcode: Product > Archive
```

---

## Agregar nueva página

```bash
# Angular CLI (standalone automáticamente por configuración)
ng generate component modules/mi-modulo/mi-pagina --standalone

# Agregar a app.routes.ts con lazy loading:
{
  path: 'mi-ruta',
  loadComponent: () => import('./modules/mi-modulo/mi-pagina/mi-pagina.component')
    .then(m => m.MiPaginaComponent)
}
```
