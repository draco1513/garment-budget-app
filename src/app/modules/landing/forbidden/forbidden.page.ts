import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline } from 'ionicons/icons';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, IonContent, IonButton, IonIcon],
  template: `
    <ion-content>
      <div class="forbidden-container">
        <ion-icon name="lock-closed-outline"></ion-icon>
        <h2>Sin permisos</h2>
        <p>No tienes acceso a esta sección.<br>Contacta a tu administrador.</p>
        <ion-button routerLink="/home" fill="outline">Volver al inicio</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .forbidden-container {
      text-align: center; padding: 80px 24px;
    }
    ion-icon {
      font-size: 80px;
      color: var(--ion-color-medium);
      display: block;
      margin-bottom: 16px;
    }
    h2 { font-size: 22px; font-weight: 700; }
    p  { color: var(--ion-color-medium); margin-bottom: 24px; line-height: 1.6; }
  `]
})
export class ForbiddenPage {
  constructor() { addIcons({ lockClosedOutline }); }
}
