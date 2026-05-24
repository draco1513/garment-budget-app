import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonRouterOutlet, IonToast, IonIcon } from '@ionic/angular/standalone';
import { ConnectivityService } from './core/services/connectivity.service';
import { CatalogCacheService } from './core/services/catalog-cache.service';
import { SyncQueueService } from './core/services/sync-queue.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, IonApp, IonRouterOutlet, IonToast, IonIcon],
  template: `
    <ion-app>
      <!-- Banner de modo offline -->
      @if (!connectivity.isOnline()) {
        <div class="offline-banner">
          <ion-icon name="cloud-offline-outline"></ion-icon>
          Sin conexión — trabajando en modo offline
        </div>
      }
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  styles: [`
    .offline-banner {
      background: #f59e0b;
      color: white;
      text-align: center;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      z-index: 9999;
      position: sticky;
      top: 0;
    }
  `]
})
export class AppComponent implements OnInit {

  constructor(
    public connectivity: ConnectivityService,
    private catalogCache: CatalogCacheService,
    private syncQueue: SyncQueueService,   // inicializa el listener de reconexión
    private auth: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    // Inicializar catálogo si hay sesión activa
    if (this.auth.isAuthenticated()) {
      await this.catalogCache.initialize();
    }
  }
}
