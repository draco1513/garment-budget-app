import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { HttpClient }     from '@angular/common/http';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonBadge, IonButton, IonIcon, IonAccordion, IonAccordionGroup,
  IonItem, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmarkOutline, keyOutline } from 'ionicons/icons';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonBadge, IonButton, IonIcon, IonAccordion, IonAccordionGroup,
    IonItem, IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/home"></ion-back-button></ion-buttons>
        <ion-title>Roles y Permisos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div style="padding:8px">
        <ion-accordion-group>
          @for (role of roles(); track role.id) {
            <ion-accordion [value]="'role-' + role.id">
              <ion-item slot="header" color="light">
                <ion-icon name="shield-checkmark-outline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <strong>{{ role.name }}</strong>
                  <p>{{ role.description }}</p>
                </ion-label>
                <ion-badge slot="end" color="primary">
                  {{ role.rolePermissions?.length ?? 0 }} permisos
                </ion-badge>
              </ion-item>

              <div slot="content" style="padding:12px 16px">
                @if (role.rolePermissions?.length) {
                  <div class="permissions-by-module">
                    @for (module of getModules(role); track module) {
                      <div class="module-section">
                        <div class="module-title">{{ module }}</div>
                        <div class="perm-chips">
                          @for (rp of getPermsByModule(role, module); track rp.permissionId) {
                            <ion-badge color="light" class="perm-chip">
                              {{ rp.permission?.code ?? rp.permissionId }}
                            </ion-badge>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p style="color:var(--ion-color-medium);font-size:14px">Sin permisos asignados</p>
                }
              </div>
            </ion-accordion>
          }
        </ion-accordion-group>
      </div>
    </ion-content>
  `,
  styles: [`
    .permissions-by-module { display: flex; flex-direction: column; gap: 12px; }
    .module-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      color: var(--ion-color-medium); letter-spacing: 0.8px; margin-bottom: 6px;
    }
    .perm-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .perm-chip { font-size: 10px !important; padding: 4px 8px !important; }
    .module-section { padding-bottom: 10px; border-bottom: 1px solid var(--ion-color-light-shade); }
    .module-section:last-child { border-bottom: none; }
  `]
})
export class RoleListPage implements OnInit {

  roles = signal<any[]>([]);

  constructor(private http: HttpClient) {
    addIcons({ shieldCheckmarkOutline, keyOutline });
  }

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/roles`).subscribe(res => {
      this.roles.set(res.data);
    });
  }

  getModules(role: any): string[] {
    const modules = new Set<string>(
      (role.rolePermissions ?? []).map((rp: any) => rp.permission?.module ?? 'OTHER')
    );
    return Array.from(modules).sort();
  }

  getPermsByModule(role: any, module: string): any[] {
    return (role.rolePermissions ?? [])
      .filter((rp: any) => (rp.permission?.module ?? 'OTHER') === module);
  }
}
