import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { RouteReuseStrategy }    from '@angular/router';
import { routes }                from './app.routes';
import { jwtInterceptor, errorInterceptor } from './core/interceptors/http.interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router con preload de módulos lazy
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // HTTP con interceptors funcionales (JWT + Error)
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),

    // Ionic — estrategia de rutas para navegación mobile
    provideIonicAngular({
      mode: 'md',                // Material Design en todas las plataformas
      animated: true,
      rippleEffect: true
    }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ]
};
