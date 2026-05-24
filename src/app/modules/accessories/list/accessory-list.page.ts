import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { HttpClient }     from '@angular/common/http';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonBackButton, IonCard, IonCardContent, IonSearchbar,
  IonRefresher, IonRefresherContent, IonIcon, IonBadge, IonButton,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ribbonOutline, createOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { Accessory }   from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-accessory-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonCard, IonCardContent, IonSearchbar,
    IonRefresher, IonRefresherContent, IonIcon, IonBadge, IonButton
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/home"></ion-back-button></ion-buttons>
        <ion-title>Avíos</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar [(ngModel)]="search" (ionInput)="filter()"
          placeholder="Buscar avío..." [debounce]="300" animated></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="load($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="list-container">
        @for (a of filtered(); track a.id) {
          <ion-card>
            <ion-card-content>
              <div class="acc-row">
                <div class="acc-icon">
                  <ion-icon name="ribbon-outline" color="secondary"></ion-icon>
                </div>
                <div class="acc-info">
                  <div class="acc-name">{{ a.name }}</div>
                  <ion-badge color="light" style="font-size:10px">{{ a.type }}</ion-badge>
                </div>
                <div class="acc-price">
                  <div class="price-amount">S/ {{ a.costPerUnit | number:'1.2-2' }}</div>
                  <div class="price-unit">/ {{ a.unit }}</div>
                  @if (auth.hasPermission('ACCESSORY_CHANGE_PRICE')) {
                    <ion-button fill="clear" size="small" (click)="editPrice(a)">
                      <ion-icon name="create-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                  }
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        }

        @if (!filtered().length) {
          <div class="empty-state">
            <ion-icon name="ribbon-outline"></ion-icon>
            <p>No se encontraron avíos</p>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .list-container { padding: 8px 8px 24px; }
    ion-card { margin: 6px 0; }
    ion-card-content { padding: 12px 16px; }
    .acc-row { display: flex; align-items: center; gap: 12px; }
    .acc-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: var(--ion-color-secondary-tint);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .acc-info   { flex: 1; }
    .acc-name   { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .acc-price  { text-align: right; }
    .price-amount { font-size: 17px; font-weight: 700; color: var(--ion-color-success-shade); }
    .price-unit   { font-size: 11px; color: var(--ion-color-medium); }
    .empty-state  { text-align: center; padding: 60px; color: var(--ion-color-medium); }
    .empty-state ion-icon { font-size: 56px; display: block; margin-bottom: 12px; }
  `]
})
export class AccessoryListPage implements OnInit {

  all      = signal<Accessory[]>([]);
  filtered = signal<Accessory[]>([]);
  search   = '';

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private alert: AlertController,
    private toast: ToastController
  ) {
    addIcons({ ribbonOutline, createOutline });
  }

  ngOnInit(): void { this.load(); }

  load(event?: any): void {
    this.http.get<any>(`${environment.apiUrl}/accessories/all`).subscribe(res => {
      this.all.set(res.data);
      this.filter();
      event?.target?.complete();
    });
  }

  filter(): void {
    const term = this.search.toLowerCase();
    this.filtered.set(term
      ? this.all().filter(a => a.name.toLowerCase().includes(term))
      : this.all()
    );
  }

  async editPrice(accessory: Accessory): Promise<void> {
    const a = await this.alert.create({
      header: `Cambiar precio: ${accessory.name}`,
      inputs: [{ name: 'price', type: 'number', value: accessory.costPerUnit, min: 0 }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: (data) => {
            const price = parseFloat(data.price);
            if (isNaN(price) || price < 0) return;
            this.http.patch(`${environment.apiUrl}/accessories/${accessory.id}/price?price=${price}`, {})
              .subscribe({
                next: async () => {
                  this.all.update(list => list.map(acc => acc.id === accessory.id ? { ...acc, costPerUnit: price } : acc));
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
