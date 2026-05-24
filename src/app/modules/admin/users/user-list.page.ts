import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonBackButton, IonCard, IonCardContent, IonBadge, IonButton,
  IonIcon, IonSearchbar, IonRefresher, IonRefresherContent,
  IonFab, IonFabButton, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, addOutline, shieldOutline, banOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonCard, IonCardContent, IonBadge, IonButton,
    IonIcon, IonSearchbar, IonRefresher, IonRefresherContent,
    IonFab, IonFabButton
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/home"></ion-back-button></ion-buttons>
        <ion-title>Usuarios</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar [(ngModel)]="search" (ionInput)="filter()"
          placeholder="Buscar usuario..." [debounce]="300"></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="load($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="list-container">
        @for (u of filtered(); track u.id) {
          <ion-card>
            <ion-card-content>
              <div class="user-row">
                <div class="user-avatar">{{ getInitials(u.fullName) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ u.fullName }}</div>
                  <div class="user-username">{{ '@' + u.username }}</div>
                  <div class="user-email">{{ u.email }}</div>
                  <div class="user-roles">
                    @for (ur of u.userRoles; track ur.id) {
                      @if (ur.active) {
                        <ion-badge color="primary" style="margin-right:4px;font-size:10px">
                          {{ ur.role?.name ?? ur.roleId }}
                        </ion-badge>
                      }
                    }
                  </div>
                </div>
                <div class="user-actions">
                  <ion-badge [color]="u.active ? 'success' : 'medium'">
                    {{ u.active ? 'Activo' : 'Inactivo' }}
                  </ion-badge>
                  @if (auth.hasPermission('USER_EDIT') && u.id !== auth.currentUser()?.id) {
                    <ion-button fill="clear" size="small" (click)="toggleActive(u)">
                      <ion-icon [name]="u.active ? 'ban-outline' : 'checkmark-circle-outline'" slot="icon-only"></ion-icon>
                    </ion-button>
                  }
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        }
      </div>
    </ion-content>

    @if (auth.hasPermission('USER_CREATE')) {
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="createUser()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    }
  `,
  styles: [`
    .list-container { padding: 8px 8px 80px; }
    ion-card { margin: 6px 0; }
    ion-card-content { padding: 14px 16px; }
    .user-row { display: flex; gap: 12px; align-items: flex-start; }
    .user-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--ion-color-primary); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; flex-shrink: 0;
    }
    .user-info { flex: 1; }
    .user-name     { font-size: 15px; font-weight: 700; }
    .user-username { font-size: 12px; color: var(--ion-color-medium); }
    .user-email    { font-size: 12px; color: var(--ion-color-medium); margin-bottom: 6px; }
    .user-actions  { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  `]
})
export class UserListPage implements OnInit {

  all = signal<any[]>([]);
  filtered = signal<any[]>([]);
  search = '';

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private alert: AlertController,
    private toast: ToastController
  ) {
    addIcons({ personOutline, addOutline, shieldOutline, banOutline, checkmarkCircleOutline });
  }

  ngOnInit(): void { this.load(); }

  load(event?: any): void {
    this.http.get<any>(`${environment.apiUrl}/users?size=100`).subscribe(res => {
      this.all.set(res.data.content);
      this.filter();
      event?.target?.complete();
    });
  }

  filter(): void {
    const t = this.search.toLowerCase();
    this.filtered.set(t
      ? this.all().filter(u => u.fullName.toLowerCase().includes(t) || u.username.toLowerCase().includes(t))
      : this.all()
    );
  }

  getInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  async toggleActive(user: any): Promise<void> {
    const newState = !user.active;
    const a = await this.alert.create({
      header: newState ? 'Activar usuario' : 'Desactivar usuario',
      message: `¿Confirmas ${newState ? 'activar' : 'desactivar'} a ${user.fullName}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.http.patch(`${environment.apiUrl}/users/${user.id}/toggle-active?active=${newState}&username=${user.username}`, {})
              .subscribe({
                next: async () => {
                  user.active = newState;
                  const t = await this.toast.create({ message: `Usuario ${newState ? 'activado' : 'desactivado'}`, color: 'success', duration: 2000, position: 'top' });
                  await t.present();
                }
              });
          }
        }
      ]
    });
    await a.present();
  }

  async createUser(): Promise<void> {
    const a = await this.alert.create({
      header: 'Crear Usuario',
      inputs: [
        { name: 'fullName', type: 'text', placeholder: 'Nombre completo' },
        { name: 'username', type: 'text', placeholder: 'Usuario' },
        { name: 'email', type: 'email', placeholder: 'Email' },
        { name: 'password', type: 'password', placeholder: 'Contraseña' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: (data) => {
            this.http.post<any>(`${environment.apiUrl}/users`, data).subscribe({
              next: async (res) => {
                this.all.update(l => [res.data, ...l]);
                this.filter();
                const t = await this.toast.create({ message: 'Usuario creado', color: 'success', duration: 2000, position: 'top' });
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
