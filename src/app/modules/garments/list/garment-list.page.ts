import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { HttpClient }     from '@angular/common/http';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonBackButton, IonCard, IonCardContent, IonBadge, IonSearchbar,
  IonSelect, IonSelectOption, IonRefresher, IonRefresherContent,
  IonSkeletonText, IonIcon, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, shirtOutline } from 'ionicons/icons';
import { AuthService }        from '../../../core/services/auth.service';
import { CatalogCacheService } from '../../../core/services/catalog-cache.service';
import { environment }        from '../../../../environments/environment';

@Component({
  selector: 'app-garment-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonBackButton, IonCard, IonCardContent, IonBadge, IonSearchbar,
    IonSelect, IonSelectOption, IonRefresher, IonRefresherContent,
    IonSkeletonText, IonIcon
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/home"></ion-back-button></ion-buttons>
        <ion-title>Catálogo de Prendas</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar [(ngModel)]="search" (ionInput)="filter()" placeholder="Buscar prenda..." [debounce]="300" animated></ion-searchbar>
      </ion-toolbar>
      <ion-toolbar>
        <ion-select [(ngModel)]="selectedCat" (ionChange)="filter()" placeholder="Todas las categorías" interface="popover">
          <ion-select-option value="">Todas</ion-select-option>
          @for (c of categories(); track c.id) {
            <ion-select-option [value]="c.id">{{ c.name }}</ion-select-option>
          }
        </ion-select>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="list-container">
        @for (g of filtered(); track g.id) {
          <ion-card class="garment-card">
            <ion-card-content>
              <div class="garment-row">
                <div class="garment-img">
                  @if (g.imageUrl) {
                    <img [src]="g.imageUrl" [alt]="g.name" loading="lazy">
                  } @else {
                    <ion-icon name="shirt-outline"></ion-icon>
                  }
                </div>
                <div class="garment-info">
                  <strong>{{ g.name }}</strong>
                  <ion-badge color="light">{{ getCategoryName(g.categoryId) }}</ion-badge>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        }

        @if (!filtered().length) {
          <div class="empty-state">
            <ion-icon name="shirt-outline"></ion-icon>
            <p>No se encontraron prendas</p>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .list-container { padding: 8px; }
    .garment-card { margin: 6px 0; }
    .garment-card ion-card-content { padding: 12px 16px; }
    .garment-row { display: flex; gap: 14px; align-items: center; }
    .garment-img {
      width: 56px; height: 56px; border-radius: 10px;
      background: var(--ion-color-light); display: flex;
      align-items: center; justify-content: center;
      font-size: 28px; flex-shrink: 0; overflow: hidden;
    }
    .garment-img img { width: 100%; height: 100%; object-fit: cover; }
    .garment-info { flex: 1; }
    .garment-info strong { display: block; font-size: 15px; margin-bottom: 4px; }
    .empty-state { text-align: center; padding: 60px; color: var(--ion-color-medium); }
    .empty-state ion-icon { font-size: 56px; display: block; margin-bottom: 12px; }
  `]
})
export class GarmentListPage implements OnInit {

  categories = signal<any[]>([]);
  all        = signal<any[]>([]);
  filtered   = signal<any[]>([]);
  search     = '';
  selectedCat: number | '' = '';

  constructor(
    public auth: AuthService,
    private catalog: CatalogCacheService,
    private http: HttpClient
  ) {
    addIcons({ addOutline, shirtOutline });
  }

  ngOnInit(): void {
    this.categories.set(this.catalog.getCategories());
    this.loadGarments();
  }

  loadGarments(): void {
    this.http.get<any>(`${environment.apiUrl}/garments?size=200`).subscribe(res => {
      this.all.set(res.data.content);
      this.filter();
    });
  }

  filter(): void {
    let items = this.all();
    if (this.selectedCat) items = items.filter(g => g.categoryId === this.selectedCat || g.category?.id === this.selectedCat);
    if (this.search) items = items.filter(g => g.name.toLowerCase().includes(this.search.toLowerCase()));
    this.filtered.set(items);
  }

  getCategoryName(id: number): string {
    return this.categories().find(c => c.id === id)?.name ?? '';
  }

  refresh(event: any): void {
    this.loadGarments();
    setTimeout(() => event.target.complete(), 800);
  }
}
