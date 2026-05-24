import { Injectable, signal } from '@angular/core';
import { Network }            from '@capacitor/network';
import { BehaviorSubject }    from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {

  // Signal para la UI — reacciona instantáneamente
  isOnline = signal<boolean>(true);

  // Observable para interceptors y servicios
  online$ = new BehaviorSubject<boolean>(true);

  constructor() {
    this.initNetworkListener();
  }

  private async initNetworkListener(): Promise<void> {
    // Estado inicial
    const status = await Network.getStatus();
    this.setStatus(status.connected);

    // Escuchar cambios (Capacitor — funciona en Android/iOS/Web)
    Network.addListener('networkStatusChange', status => {
      this.setStatus(status.connected);
    });

    // Fallback para navegador web
    window.addEventListener('online',  () => this.setStatus(true));
    window.addEventListener('offline', () => this.setStatus(false));
  }

  private setStatus(connected: boolean): void {
    this.isOnline.set(connected);
    this.online$.next(connected);

    if (!connected) {
      console.warn('[Connectivity] Sin conexión — modo offline activo');
    } else {
      console.log('[Connectivity] Conexión restaurada');
    }
  }
}
