import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { HttpClient }     from '@angular/common/http';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonBackButton, IonCard, IonCardContent, IonSearchbar,
  IonRefresher, IonRefresherContent, IonIcon, IonBadge,
  IonInfiniteScroll, IonInfiniteScrollContent,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pricetagOutline, createOutline } from 'ionicons/icons';
import { AuthService }    from '../../../core/services/auth.service';
import { Material }       from '../../../core/models';
import { environment }    from '../../../../environments/environment';

@Component({
  selector: 'app-material-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonBackButton, IonCard, IonCardContent, IonSearchbar,
    IonRefresher, IonRefresherContent, IonIcon, IonBadge,
    IonInfiniteScroll, IonInfiniteScrollContent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/home"></ion-back-button></ion-buttons>
        <ion-title>Telas y Materiales</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar [(ngModel)]="search" (ionInput)="filter()"
          placeholder="Buscar material..." [debounce]="300" animated></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="load(true, $event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="list-container">
        @for (m of filtered(); track m.id) {
          <ion-card class="material-card">
            <ion-card-content>
              <div class="material-row">
                <div class="material-icon">
                  <ion-icon name="pricetag-outline" color="primary"></ion-icon>
                </div>
                <div class="material-info">
                  <div class="material-code">{{ m.code }}</div>
                  <div class="material-name">{{ m.name }}</div>
                  @if (m.supplier) {
                    <div class="material-supplier">{{ m.supplier }}</div>
                  }
                </div>
                <div class="material-price">
                  <div class="price-amount">S/ {{ m.costPerUnit | number:'1.2-2' }}</div>
                  <div class="price-unit">/ {{ m.unit }}</div>
                  @if (auth.hasPermission('MATERIAL_CHANGE_PRICE')) {
                    <ion-button fill="clear" size="small" (click)="editPrice(m)">
                      <ion-icon name="create-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                  }
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        }

        @if (!filtered().length && !loading()) {
          <div class="empty-state">
            <ion-icon name="pricetag-outline"></ion-icon>
            <p>No se encontraron materiales</p>
          </div>
        }
      </div>

      <ion-infinite-scroll (ionInfinite)="loadMore($event)" [disabled]="isLastPage()">
        <ion-infinite-scroll-content loadingText="Cargando..."></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `,
  styles: [`
    .list-container { padding: 8px 8px 24px; }
    .material-card { margin: 6px 0; }
    .material-card ion-card-content { padding: 12px 16px; }
    .material-row { display: flex; align-items: center; gap: 12px; }
    .material-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: var(--ion-color-primary-tint);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .material-info { flex: 1; }
    .material-code    { font-size: 11px; color: var(--ion-color-medium); font-weight: 700; letter-spacing: 0.5px; }
    .material-name    { font-size: 15px; font-weight: 600; }
    .material-supplier{ font-size: 12px; color: var(--ion-color-medium); }
    .material-price   { text-align: right; }
    .price-amount { font-size: 17px; font-weight: 700; color: var(--ion-color-success-shade); }
    .price-unit   { font-size: 11px; color: var(--ion-color-medium); }
    .empty-state  { text-align: center; padding: 60px; color: var(--ion-color-medium); }
    .empty-state ion-icon { font-size: 56px; display: block; margin-bottom: 12px; }
  `]
})
export class MaterialListPage implements OnInit {

  all        = signal<Material[]>([]);
  filtered   = signal<Material[]>([]);
  loading    = signal(true);
  isLastPage = signal(false);
  search     = '';
  private page = 0;

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private alert: AlertController,
    private toast: ToastController
  ) {
    addIcons({ pricetagOutline, createOutline });
  }

  ngOnInit(): void { this.load(true); }

  load(reset = false, event?: any): void {
    if (reset) { this.page = 0; }
    this.http.get<any>(`${environment.apiUrl}/materials?page=${this.page}&size=30`)
      .subscribe(res => {
        const items = res.data.content as Material[];
        this.all.update(prev => reset ? items : [...prev, ...items]);
        this.isLastPage.set(res.data.last);
        this.loading.set(false);
        this.filter();
        event?.target?.complete();
      });
  }

  loadMore(event: any): void {
    this.page++;
    this.load(false, event);
  }

  filter(): void {
    const term = this.search.toLowerCase();
    this.filtered.set(term
      ? this.all().filter(m => m.name.toLowerCase().includes(term) || m.code.toLowerCase().includes(term))
      : this.all()
    );
  }

  async editPrice(material: Material): Promise<void> {
    const a = await this.alert.create({
      header: `Cambiar precio: ${material.name}`,
      message: `Precio actual: S/ ${material.costPerUnit.toFixed(2)} / ${material.unit}`,
      inputs: [{
        name: 'price', type: 'number', placeholder: 'Nuevo precio',
        value: material.costPerUnit, min: 0
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: (data) => {
            const newPrice = parseFloat(data.price);
            if (isNaN(newPrice) || newPrice < 0) return;
            this.http.patch(`${environment.apiUrl}/materials/${material.id}/price?price=${newPrice}`, {})
              .subscribe({
                next: async () => {
                  material.costPerUnit = newPrice;
                  this.all.update(list => list.map(m => m.id === material.id ? { ...m, costPerUnit: newPrice } : m));
                  this.filter();
                  const t = await this.toast.create({ message: 'Precio actualizado', color: 'success', duration: 2000, position: 'top' });
                  await t.present();
                }
              });
          }
        }
      ]
    });
    await a.present();
  }
}
