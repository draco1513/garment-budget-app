// src/environments/environment.prod.ts — Producción
export const environment = {
  production: true,
  apiUrl: 'https://app.garmentbudget.pe/api/v1',  // ajustar al dominio real
  catalogSyncInterval: 300000,  // verificar catálogo cada 5 min en prod
  appVersion: '1.0.0'
};
