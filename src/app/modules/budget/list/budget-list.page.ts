import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { FormsModule }    from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonIcon, IonSearchbar, IonSelect, IonSelectOption,
  IonCard, IonCardContent, IonBadge, IonFab, IonFabButton,
  IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher,
  IonRefresherContent, IonSkeletonText, IonBackButton, IonItem
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, documentTextOutline, filterOutline } from 'ionicons/icons';
import { BudgetService }      from '../../../core/services/budget.service';
import { LocalDbService }     from '../../../core/services/local-db.service';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { AuthService }        from '../../../core/services/auth.service';
import { BudgetSummary, BudgetStatus } from '../../../core/models';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonSearchbar, IonSelect, IonSelectOption,
    IonCard, IonCardContent, IonBadge, IonFab, IonFabButton,
    IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher,
    IonRefresherContent, IonSkeletonText, IonBackButton, IonItem
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" text="Inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Presupuestos</ion-title>
        <ion-buttons slot="end">
          @if (auth.hasPermission('BUDGET_CREATE')) {
            <ion-button routerLink="/budgets/create">
              <ion-icon name="add-outline" slot="icon-only"></ion-icon>
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>

      <!-- Filtros -->
      <ion-toolbar>
        <ion-searchbar
          placeholder="Buscar por nombre o cliente..."
          [(ngModel)]="searchTerm"
          [debounce]="500"
          (ionInput)="onSearch()"
          animated>
        </ion-searchbar>
      </ion-toolbar>
      <ion-toolbar>
        <div class="filter-row">
          <ion-select
            placeholder="Estado"
            [(ngModel)]="statusFilter"
            (ionChange)="onFilterChange()"
            interface="popover">
            <ion-select-option value="">Todos</ion-select-option>
            <ion-select-option value="DRAFT">Borrador</ion-select-option>
            <ion-select-option value="REVIEW">En revisión</ion-select-option>
            <ion-select-option value="APPROVED">Aprobado</ion-select-option>
            <ion-select-option value="EXPORTED">Exportado</ion-select-option>
            <ion-select-option value="REJECTED">Rechazado</ion-select-option>
          </ion-select>
          <ion-button
            fill="clear"
            size="small"
            (click)="toggleMine()">
            {{ showMine ? 'Todos' : 'Mis presupuestos' }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">

      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Modo offline: mostrar caché -->
      @if (!connectivity.isOnline()) {
        <div class="offline-notice">
          <ion-icon name="cloud-offline-outline"></ion-icon>
          Mostrando presupuestos guardados localmente
        </div>
      }

      <!-- Skeleton loading -->
      @if (loading()) {
        <div class="list-container">
          @for (i of [1,2,3,4,5]; track i) {
            <ion-card class="budget-skeleton">
              <ion-card-content>
                <ion-skeleton-text [animated]="true" style="width: 60%; height: 18px; margin-bottom: 8px"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 40%; height: 14px; margin-bottom: 12px"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 80%; height: 12px"></ion-skeleton-text>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }

      <!-- Lista de presupuestos -->
      @if (!loading()) {
        <div class="list-container">
          @if (!budgets().length) {
            <div class="empty-state">
              <ion-icon name="document-text-outline"></ion-icon>
              <p>No hay presupuestos</p>
              @if (auth.hasPermission('BUDGET_CREATE')) {
                <ion-button routerLink="/budgets/create" fill="outline" size="small">
                  Crear presupuesto
                </ion-button>
              }
            </div>
          }

          @for (budget of budgets(); track budget.id) {
            <ion-card class="budget-card" [routerLink]="['/budgets', budget.id]">
              <ion-card-content>
                <div class="budget-header">
                  <div class="budget-main">
                    <div class="budget-code">{{ budget.code }}</div>
                    <div class="budget-name">{{ budget.name }}</div>
                    @if (budget.clientName) {
                      <div class="budget-client">Cliente: {{ budget.clientName }}</div>
                    }
                  </div>
                  <ion-badge [color]="getStatusColor(budget.status)">
                    {{ getStatusLabel(budget.status) }}
                  </ion-badge>
                </div>

                <div class="budget-footer">
                  <div class="budget-stats">
                    <span>{{ budget.orderQuantity }} prendas</span>
                    @if (budget.totalUnitCost) {
                      <span>S/ {{ budget.totalUnitCost | number:'1.2-2' }}/und</span>
                    }
                    @if (budget.totalOrderCost) {
                      <span class="total">S/ {{ budget.totalOrderCost | number:'1.2-2' }} total</span>
                    }
                  </div>
                  <div class="budget-date">
                    {{ budget.createdAt | date:'dd/MM/yyyy' }}
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>

        <!-- Infinite scroll -->
        @if (!isLastPage()) {
          <ion-infinite-scroll (ionInfinite)="loadMore($event)">
            <ion-infinite-scroll-content loadingText="Cargando..."></ion-infinite-scroll-content>
          </ion-infinite-scroll>
        }
      }

    </ion-content>

    <!-- FAB para crear presupuesto rápido -->
    @if (auth.hasPermission('BUDGET_CREATE')) {
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button routerLink="/budgets/create" color="primary">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    }
  `,
  styles: [`
    .filter-row {
      display: flex; align-items: center;
      padding: 0 8px; gap: 8px;
    }
    .list-container { padding: 8px 8px 80px; }
    .offline-notice {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; background: #fff3cd;
      color: #856404; font-size: 13px;
    }
    .budget-card {
      margin: 6px 0; cursor: pointer;
      transition: transform 0.15s;
    }
    .budget-card:active { transform: scale(0.98); }
    .budget-card ion-card-content { padding: 14px 16px; }
    .budget-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
    .budget-code { font-size: 11px; color: var(--ion-color-medium); font-family: monospace; }
    .budget-name { font-size: 16px; font-weight: 600; margin: 2px 0; line-height: 1.3; }
    .budget-client { font-size: 13px; color: var(--ion-color-medium); }
    .budget-footer { display: flex; justify-content: space-between; align-items: flex-end; }
    .budget-stats {
      display: flex; gap: 10px; flex-wrap: wrap;
      font-size: 12px; color: var(--ion-color-medium);
    }
    .budget-stats .total { font-weight: 700; color: var(--ion-color-success); }
    .budget-date { font-size: 11px; color: var(--ion-color-medium); }
    .budget-skeleton ion-card-content { padding: 16px; }
    .empty-state {
      text-align: center; padding: 60px 16px;
      color: var(--ion-color-medium);
    }
    .empty-state ion-icon { font-size: 64px; display: block; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; margin-bottom: 16px; }
  `]
})
export class BudgetListPage implements OnInit {

  budgets  = signal<BudgetSummary[]>([]);
  loading  = signal(true);
  isLastPage = signal(false);

  searchTerm   = '';
  statusFilter = '';
  showMine     = false;

  private currentPage = 0;

  constructor(
    public auth: AuthService,
    public connectivity: ConnectivityService,
    private budgetSvc: BudgetService,
    private db: LocalDbService
  ) {
    addIcons({ addOutline, documentTextOutline, filterOutline });
  }

  ngOnInit(): void { this.load(true); }

  load(reset = false): void {
    if (reset) { this.currentPage = 0; this.budgets.set([]); this.loading.set(true); }

    if (!this.connectivity.isOnline()) {
      this.loadOffline();
      return;
    }

    this.budgetSvc.list(this.currentPage, 20, this.showMine, this.searchTerm || undefined)
      .subscribe({
        next: res => {
          const items = res.data.content;
          this.budgets.update(prev => reset ? items : [...prev, ...items]);
          this.isLastPage.set(res.data.last);
          this.loading.set(false);
        },
        error: () => { this.loadOffline(); }
      });
  }

  private async loadOffline(): Promise<void> {
    const cached = await this.db.getAllCachedBudgets();
    this.budgets.set(cached as any[]);
    this.isLastPage.set(true);
    this.loading.set(false);
  }

  loadMore(event: any): void {
    this.currentPage++;
    this.budgetSvc.list(this.currentPage, 20, this.showMine, this.searchTerm || undefined)
      .subscribe(res => {
        this.budgets.update(prev => [...prev, ...res.data.content]);
        this.isLastPage.set(res.data.last);
        event.target.complete();
      });
  }

  doRefresh(event: any): void {
    this.load(true);
    setTimeout(() => event.target.complete(), 1000);
  }

  onSearch(): void    { this.load(true); }
  onFilterChange(): void { this.load(true); }
  toggleMine(): void  { this.showMine = !this.showMine; this.load(true); }

  getStatusColor(status: BudgetStatus): string {
    const map: Record<string, string> = {
      DRAFT: 'medium', REVIEW: 'warning', APPROVED: 'success',
      REJECTED: 'danger', EXPORTED: 'tertiary', CLOSED: 'dark', CANCELLED: 'danger'
    };
    return map[status] ?? 'medium';
  }

  getStatusLabel(status: BudgetStatus): string {
    const map: Record<string, string> = {
      DRAFT: 'Borrador', REVIEW: 'En revisión', APPROVED: 'Aprobado',
      REJECTED: 'Rechazado', EXPORTED: 'Exportado', CLOSED: 'Cerrado', CANCELLED: 'Cancelado'
    };
    return map[status] ?? status;
  }
}
