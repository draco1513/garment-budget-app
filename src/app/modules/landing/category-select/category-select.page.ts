import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonIcon, IonCard, IonCardContent, IonSearchbar,
  IonGrid, IonRow, IonCol, IonBadge, IonAvatar, IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, personCircleOutline, searchOutline,
  manOutline, womanOutline, peopleOutline, happyOutline,
  notificationsOutline, settingsOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogCacheService } from '../../../core/services/catalog-cache.service';
import { GarmentCategory } from '../../../core/models';

@Component({
  selector: 'app-category-select',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonCard, IonCardContent, IonSearchbar,
    IonGrid, IonRow, IonCol, IonBadge, IonAvatar, IonSkeletonText
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar color="primary">
        <ion-title>
          <div class="toolbar-title">
            <span>✂️</span>
            <span>Presupuesto Textil</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="goToBudgets()" title="Mis presupuestos">
            <ion-icon name="document-text-outline" slot="icon-only"></ion-icon>
          </ion-button>
          @if (auth.hasPermission('USER_VIEW')) {
            <ion-button routerLink="/admin/users" title="Administración">
              <ion-icon name="settings-outline" slot="icon-only"></ion-icon>
            </ion-button>
          }
          <ion-button (click)="logout()" title="Cerrar sesión">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">

      <!-- Saludo personalizado -->
      <div class="welcome-section">
        <div class="user-avatar">
          {{ getInitials() }}
        </div>
        <div class="welcome-text">
          <h2>¡Hola, {{ getFirstName() }}!</h2>
          <p>¿Para quién es la prenda que deseas presupuestar?</p>
        </div>
      </div>

      <!-- Grid de categorías — PRIMERA PANTALLA -->
      <div class="categories-section">
        @if (loading()) {
          <ion-grid>
            <ion-row>
              @for (i of [1,2,3,4,5,6]; track i) {
                <ion-col size="6" size-md="4">
                  <div class="category-skeleton">
                    <ion-skeleton-text [animated]="true" style="width:64px;height:64px;border-radius:50%;margin:0 auto 12px"></ion-skeleton-text>
                    <ion-skeleton-text [animated]="true" style="width:80px;margin:0 auto"></ion-skeleton-text>
                  </div>
                </ion-col>
              }
            </ion-row>
          </ion-grid>
        } @else {
          <ion-grid>
            <ion-row>
              @for (cat of categories(); track cat.id) {
                <ion-col size="6" size-md="4" size-lg="3">
                  <div class="category-card" (click)="selectCategory(cat)"
                       [class.selected]="selectedCategory()?.id === cat.id">
                    <div class="category-icon">
                      {{ getCategoryEmoji(cat.code) }}
                    </div>
                    <div class="category-name">{{ cat.name }}</div>
                    <div class="category-count">
                      {{ getGarmentCount(cat.id) }} prendas
                    </div>
                  </div>
                </ion-col>
              }
            </ion-row>
          </ion-grid>
        }
      </div>

      <!-- Prendas de la categoría seleccionada -->
      @if (selectedCategory()) {
        <div class="garments-section">
          <h3 class="section-title">
            Prendas — {{ selectedCategory()!.name }}
          </h3>
          <ion-searchbar
            placeholder="Buscar prenda..."
            [(ngModel)]="searchTerm"
            [debounce]="300"
            (ionInput)="filterGarments()">
          </ion-searchbar>

          <ion-grid>
            <ion-row>
              @for (g of filteredGarments(); track g.id) {
                <ion-col size="12" size-md="6" size-lg="4">
                  <ion-card class="garment-card" (click)="createBudget(g.id)">
                    <ion-card-content>
                      <div class="garment-row">
                        <div class="garment-thumb">
                          @if (g.imageUrl) {
                            <img [src]="g.imageUrl" [alt]="g.name" loading="lazy">
                          } @else {
                            <span>👗</span>
                          }
                        </div>
                        <div class="garment-info">
                          <strong>{{ g.name }}</strong>
                          <span>Toca para presupuestar</span>
                        </div>
                        <ion-icon name="chevron-forward-outline" color="medium"></ion-icon>
                      </div>
                    </ion-card-content>
                  </ion-card>
                </ion-col>
              }
            </ion-row>
          </ion-grid>
        </div>
      }

    </ion-content>
  `,
  styles: [`
    .toolbar-title { display: flex; align-items: center; gap: 8px; font-weight: 700; }

    .welcome-section {
      display: flex; align-items: center; gap: 16px;
      padding: 20px 16px 8px; background: var(--ion-color-primary);
      color: white;
    }
    .user-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(255,255,255,0.2); display: flex;
      align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; flex-shrink: 0;
    }
    .welcome-text h2 { margin: 0; font-size: 18px; }
    .welcome-text p  { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }

    .categories-section { padding: 16px 8px 0; }

    .category-card {
      text-align: center; padding: 20px 12px;
      border-radius: 16px; cursor: pointer;
      transition: all 0.2s;
      background: var(--ion-card-background);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 2px solid transparent;
      user-select: none;
    }
    .category-card:hover  { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
    .category-card.selected { border-color: var(--ion-color-primary); background: var(--ion-color-primary-tint); }
    .category-icon  { font-size: 48px; margin-bottom: 8px; }
    .category-name  { font-size: 14px; font-weight: 600; }
    .category-count { font-size: 11px; color: var(--ion-color-medium); margin-top: 4px; }

    .category-skeleton {
      padding: 20px 12px; border-radius: 16px;
      background: var(--ion-card-background); text-align: center;
    }

    .garments-section { padding: 0 8px 24px; }
    .section-title {
      font-size: 16px; font-weight: 700; padding: 16px 8px 8px;
      margin: 0; color: var(--ion-color-dark);
    }

    .garment-card { cursor: pointer; margin: 6px 0; }
    .garment-card ion-card-content { padding: 12px 16px; }
    .garment-row {
      display: flex; align-items: center; gap: 12px;
    }
    .garment-thumb {
      width: 48px; height: 48px; border-radius: 8px;
      background: var(--ion-color-light); display: flex;
      align-items: center; justify-content: center;
      font-size: 24px; flex-shrink: 0; overflow: hidden;
    }
    .garment-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .garment-info { flex: 1; }
    .garment-info strong { display: block; font-size: 15px; }
    .garment-info span   { font-size: 12px; color: var(--ion-color-medium); }
  `]
})
export class CategorySelectPage implements OnInit {

  categories = signal<GarmentCategory[]>([]);
  selectedCategory = signal<GarmentCategory | null>(null);
  filteredGarments = signal<any[]>([]);
  loading = signal(true);
  searchTerm = '';

  private allGarments: any[] = [];

  constructor(
    public auth: AuthService,
    private catalog: CatalogCacheService,
    private router: Router
  ) {
    addIcons({
      logOutOutline, personCircleOutline, searchOutline,
      manOutline, womanOutline, peopleOutline, happyOutline,
      notificationsOutline, settingsOutline
    });
  }

  ngOnInit(): void {
    // Esperar a que el catálogo esté disponible
    this.loadCategories();
  }

  private loadCategories(): void {
    const cats = this.catalog.getCategories();
    if (cats.length) {
      this.categories.set(cats);
      this.loading.set(false);
    } else {
      // Reintentar cuando el catálogo cargue
      setTimeout(() => this.loadCategories(), 500);
    }
  }

  selectCategory(cat: GarmentCategory): void {
    this.selectedCategory.set(cat);
    this.allGarments = this.catalog.getGarmentsByCategory(cat.id);
    this.filteredGarments.set(this.allGarments);
    this.searchTerm = '';
  }

  filterGarments(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredGarments.set(
      this.allGarments.filter(g => g.name.toLowerCase().includes(term))
    );
  }

  getGarmentCount(categoryId: number): number {
    return this.catalog.getGarmentsByCategory(categoryId).length;
  }

  getCategoryEmoji(code: string): string {
    const map: Record<string, string> = {
      ADULT_MEN: '👔', ADULT_WOMEN: '👗', CHILDREN_BOY: '👦',
      CHILDREN_GIRL: '👧', BABY: '👶', UNISEX: '🧥'
    };
    return map[code] ?? '👕';
  }

  getInitials(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getFirstName(): string {
    return this.auth.currentUser()?.fullName?.split(' ')[0] ?? 'Usuario';
  }

  createBudget(garmentTypeId: number): void {
    this.router.navigate(['/budgets/create'], {
      queryParams: { garmentTypeId }
    });
  }

  goToBudgets(): void {
    this.router.navigate(['/budgets']);
  }

  logout(): void {
    this.auth.logout();
  }
}
