import { Component, signal }  from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router }              from '@angular/router';
import {
  IonContent, IonCard, IonCardContent, IonItem, IonLabel,
  IonInput, IonButton, IonSpinner, IonText, IonIcon,
  IonInputPasswordToggle
} from '@ionic/angular/standalone';
import { addIcons }    from 'ionicons';
import { personOutline, lockClosedOutline, logoApple } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogCacheService } from '../../../core/services/catalog-cache.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonCard, IonCardContent, IonItem, IonLabel,
    IonInput, IonButton, IonSpinner, IonText, IonIcon,
    IonInputPasswordToggle
  ],
  template: `
    <ion-content class="login-content" [fullscreen]="true">
      <div class="login-wrapper">

        <!-- Logo y título -->
        <div class="brand">
          <div class="brand-icon">✂️</div>
          <h1>Presupuesto Textil</h1>
          <p>Sistema de fabricación de prendas</p>
        </div>

        <!-- Formulario -->
        <ion-card class="login-card">
          <ion-card-content>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">

              <ion-item [class.ion-invalid]="isInvalid('username')">
                <ion-icon slot="start" name="person-outline" color="medium"></ion-icon>
                <ion-input
                  formControlName="username"
                  type="text"
                  label="Usuario"
                  labelPlacement="floating"
                  placeholder="Tu nombre de usuario"
                  autocomplete="username"
                  [clearInput]="true">
                </ion-input>
              </ion-item>
              @if (isInvalid('username')) {
                <ion-text color="danger" class="error-text">
                  El usuario es requerido
                </ion-text>
              }

              <ion-item [class.ion-invalid]="isInvalid('password')" class="mt-8">
                <ion-icon slot="start" name="lock-closed-outline" color="medium"></ion-icon>
                <ion-input
                  formControlName="password"
                  type="password"
                  label="Contraseña"
                  labelPlacement="floating"
                  placeholder="Tu contraseña"
                  autocomplete="current-password">
                  <ion-input-password-toggle slot="end"></ion-input-password-toggle>
                </ion-input>
              </ion-item>
              @if (isInvalid('password')) {
                <ion-text color="danger" class="error-text">
                  La contraseña es requerida
                </ion-text>
              }

              <!-- Error de login -->
              @if (errorMsg()) {
                <div class="login-error">
                  {{ errorMsg() }}
                </div>
              }

              <!-- Botón login -->
              <ion-button
                expand="block"
                type="submit"
                class="login-btn"
                [disabled]="loading() || form.invalid">
                @if (loading()) {
                  <ion-spinner name="crescent"></ion-spinner>
                } @else {
                  Ingresar
                }
              </ion-button>

            </form>

          </ion-card-content>
        </ion-card>

        <p class="version-text">v1.0.0</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-content {
      --background: linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%);
    }
    .login-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
    }
    .brand {
      text-align: center;
      color: white;
      margin-bottom: 32px;
    }
    .brand-icon { font-size: 56px; margin-bottom: 8px; }
    .brand h1 { font-size: 24px; font-weight: 700; margin: 0; }
    .brand p  { font-size: 14px; opacity: 0.8; margin: 4px 0 0; }
    .login-card {
      width: 100%;
      max-width: 420px;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    .login-btn {
      margin-top: 24px;
      --border-radius: 8px;
      height: 48px;
      font-size: 16px;
      font-weight: 600;
    }
    .login-error {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      padding: 10px 14px;
      color: #dc2626;
      font-size: 14px;
      margin-top: 12px;
    }
    .error-text { font-size: 12px; padding: 4px 16px 0; display: block; }
    .mt-8 { margin-top: 8px; }
    .version-text { color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 24px; }
  `]
})
export class LoginPage {

  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private catalog: CatalogCacheService,
    private router: Router
  ) {
    addIcons({ personOutline, lockClosedOutline, logoApple });

    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.form.value).subscribe({
      next: async () => {
        // Descargar catálogo en background
        this.catalog.initialize();
        await this.router.navigate(['/home']);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Usuario o contraseña incorrectos';
        this.errorMsg.set(msg);
        this.loading.set(false);
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
