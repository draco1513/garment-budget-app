import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent, IonItem, IonLabel, IonInput,
  IonTextarea, IonSegment, IonSegmentButton, IonProgressBar,
  IonBackButton, IonSpinner, IonNote, IonBadge, ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, arrowForwardOutline, arrowBackOutline,
  shirtOutline, resizeOutline, listOutline, checkmarkOutline
} from 'ionicons/icons';
import { BudgetService } from '../../../core/services/budget.service';
import { CatalogCacheService } from '../../../core/services/catalog-cache.service';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { SyncQueueService } from '../../../core/services/sync-queue.service';
import { SizeGroup } from '../../../core/models';

type WizardStep = 'garment' | 'sizes' | 'info' | 'confirm';

@Component({
  selector: 'app-budget-create',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonIcon, IonCard, IonCardContent, IonItem, IonLabel, IonInput,
    IonTextarea, IonSegment, IonSegmentButton, IonProgressBar,
    IonBackButton, IonSpinner, IonNote, IonBadge
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" text="Cancelar"></ion-back-button>
        </ion-buttons>
        <ion-title>Nuevo Presupuesto</ion-title>
      </ion-toolbar>

      <!-- Barra de progreso del wizard -->
      <ion-toolbar>
        <div class="wizard-steps">
          @for (step of steps; track step.key) {
            <div class="step-item"
                 [class.active]="currentStep() === step.key"
                 [class.done]="isStepDone(step.key)">
              <div class="step-circle">
                @if (isStepDone(step.key)) {
                  <ion-icon name="checkmark-outline"></ion-icon>
                } @else {
                  {{ step.number }}
                }
              </div>
              <span class="step-label">{{ step.label }}</span>
            </div>
          }
        </div>
        <ion-progress-bar [value]="progressValue()"></ion-progress-bar>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">

      <!-- PASO 1: Prenda ya seleccionada (viene de la pantalla anterior) -->
      @if (currentStep() === 'garment') {
        <div class="step-content">
          <div class="step-header">
            <ion-icon name="shirt-outline"></ion-icon>
            <h2>Prenda seleccionada</h2>
          </div>
          <ion-card>
            <ion-card-content>
              <div class="garment-preview">
                <div class="garment-icon">👗</div>
                <div>
                  <strong>{{ garmentName() }}</strong>
                  <p>Categoría: {{ categoryName() }}</p>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-content>
              <ion-item>
                <ion-input
                  label="Nombre del presupuesto *"
                  labelPlacement="floating"
                  [(ngModel)]="budgetName"
                  placeholder="Ej: Blusa Felipa - Cliente EXIT"
                  maxlength="200">
                </ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  label="Cliente"
                  labelPlacement="floating"
                  [(ngModel)]="clientName"
                  placeholder="Nombre del cliente (opcional)"
                  maxlength="150">
                </ion-input>
              </ion-item>
              <ion-item>
                <ion-textarea
                  label="Notas"
                  labelPlacement="floating"
                  [(ngModel)]="notes"
                  placeholder="Observaciones adicionales..."
                  rows="3"
                  maxlength="1000">
                </ion-textarea>
              </ion-item>
            </ion-card-content>
          </ion-card>
        </div>
      }

      <!-- PASO 2: Tallas y cantidades -->
      @if (currentStep() === 'sizes') {
        <div class="step-content">
          <div class="step-header">
            <ion-icon name="resize-outline"></ion-icon>
            <h2>Tallas y cantidades</h2>
            <p>Ingresa cuántas prendas de cada talla</p>
          </div>

          @for (group of sizeGroups(); track group.id) {
            <ion-card>
              <ion-card-content>
                <h3 class="group-title">{{ group.name }}</h3>
                <div class="sizes-grid">
                  @for (size of group.sizes; track size.id) {
                    <div class="size-input-cell">
                      <label class="size-label">{{ size.code }}</label>
                      <input
                        type="number"
                        class="size-qty-input"
                        [value]="getSizeQty(size.id)"
                        (input)="setSizeQty(size.id, $event)"
                        min="0" max="9999" inputmode="numeric">
                    </div>
                  }
                </div>
              </ion-card-content>
            </ion-card>
          }

          <!-- Resumen de tallas -->
          @if (totalQuantity() > 0) {
            <ion-card color="light">
              <ion-card-content>
                <div class="qty-summary">
                  <strong>Total prendas:</strong>
                  <ion-badge color="primary">{{ totalQuantity() }}</ion-badge>
                </div>
                <div class="qty-breakdown">
                  @for (entry of sizeEntries(); track entry.sizeId) {
                    @if (entry.quantity > 0) {
                      <span class="qty-chip">
                        {{ entry.sizeCode }}: {{ entry.quantity }}
                      </span>
                    }
                  }
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }

      <!-- PASO 3: Confirmación -->
      @if (currentStep() === 'confirm') {
        <div class="step-content">
          <div class="step-header">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            <h2>Confirmar presupuesto</h2>
          </div>
          <ion-card>
            <ion-card-content>
              <div class="confirm-row"><span>Prenda</span><strong>{{ garmentName() }}</strong></div>
              <div class="confirm-row"><span>Nombre</span><strong>{{ budgetName }}</strong></div>
              @if (clientName) {
                <div class="confirm-row"><span>Cliente</span><strong>{{ clientName }}</strong></div>
              }
              <div class="confirm-row">
                <span>Total prendas</span>
                <strong>{{ totalQuantity() }}</strong>
              </div>
            </ion-card-content>
          </ion-card>
          <div class="confirm-note">
            <ion-icon name="information-circle-outline"></ion-icon>
            El sistema cargará automáticamente los costos de telas, avíos y proceso
            según la plantilla de la prenda. Podrás ajustarlos después.
          </div>
        </div>
      }

    </ion-content>

    <!-- Botones de navegación -->
    <div class="wizard-footer">
      @if (currentStep() !== 'garment') {
        <ion-button fill="outline" (click)="prevStep()">
          <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
          Anterior
        </ion-button>
      }
      <div class="spacer"></div>
      @if (currentStep() !== 'confirm') {
        <ion-button (click)="nextStep()" [disabled]="!canProceed()">
          Siguiente
          <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
        </ion-button>
      } @else {
        <ion-button color="success" (click)="submit()" [disabled]="submitting()">
          @if (submitting()) {
            <ion-spinner name="crescent" slot="start"></ion-spinner>
          }
          Crear Presupuesto
        </ion-button>
      }
    </div>
  `,
  styles: [`
    .wizard-steps {
      display: flex; align-items: center; justify-content: space-around;
      padding: 10px 16px 6px;
    }
    .step-item {
      display: flex; flex-direction: column; align-items: center;
      gap: 4px; flex: 1;
    }
    .step-circle {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--ion-color-light); border: 2px solid var(--ion-color-medium);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: var(--ion-color-medium);
      transition: all 0.2s;
    }
    .step-item.active .step-circle  { background: var(--ion-color-primary); border-color: var(--ion-color-primary); color: white; }
    .step-item.done .step-circle    { background: var(--ion-color-success); border-color: var(--ion-color-success); color: white; }
    .step-label { font-size: 10px; color: var(--ion-color-medium); text-align: center; }
    .step-item.active .step-label  { color: var(--ion-color-primary); font-weight: 600; }

    .step-content { padding: 16px 8px 24px; }
    .step-header  {
      text-align: center; padding: 16px; margin-bottom: 8px;
    }
    .step-header ion-icon { font-size: 40px; color: var(--ion-color-primary); display: block; margin-bottom: 8px; }
    .step-header h2 { margin: 0 0 4px; font-size: 18px; font-weight: 700; }
    .step-header p  { margin: 0; color: var(--ion-color-medium); font-size: 14px; }

    .garment-preview {
      display: flex; gap: 16px; align-items: center;
    }
    .garment-icon { font-size: 48px; }

    .group-title {
      font-size: 13px; font-weight: 700; text-transform: uppercase;
      color: var(--ion-color-medium); margin: 0 0 12px; letter-spacing: 0.5px;
    }
    .sizes-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 10px;
    }
    .size-input-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .size-label {
      font-size: 12px; font-weight: 700; color: var(--ion-color-dark);
      text-align: center;
    }
    .size-qty-input {
      width: 64px; height: 44px; text-align: center;
      border: 2px solid var(--ion-color-light-shade);
      border-radius: 10px; font-size: 16px; font-weight: 600;
      background: white; outline: none;
      -moz-appearance: textfield;
    }
    .size-qty-input:focus { border-color: var(--ion-color-primary); }
    .size-qty-input::-webkit-outer-spin-button,
    .size-qty-input::-webkit-inner-spin-button { -webkit-appearance: none; }

    .qty-summary {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 10px; font-size: 15px;
    }
    .qty-breakdown { display: flex; flex-wrap: wrap; gap: 6px; }
    .qty-chip {
      padding: 3px 8px; background: var(--ion-color-primary-tint);
      border-radius: 12px; font-size: 12px; font-weight: 600;
      color: var(--ion-color-primary);
    }

    .confirm-row {
      display: flex; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px solid var(--ion-color-light-shade);
      font-size: 14px;
    }
    .confirm-row:last-child { border-bottom: none; }
    .confirm-row span { color: var(--ion-color-medium); }

    .confirm-note {
      display: flex; gap: 10px; align-items: flex-start;
      background: #eff6ff; border-radius: 12px; padding: 14px;
      font-size: 13px; color: #1e40af; margin: 16px 0; line-height: 1.5;
    }
    .confirm-note ion-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }

    .wizard-footer {
      position: fixed; bottom: 0; left: 0; right: 0;
      padding: 12px 16px calc(12px + var(--ion-safe-area-bottom));
      background: var(--ion-background-color);
      border-top: 1px solid var(--ion-color-light-shade);
      display: flex; align-items: center; gap: 12px;
      z-index: 100;
    }
    .spacer { flex: 1; }
  `]
})
export class BudgetCreatePage implements OnInit {

  currentStep = signal<WizardStep>('garment');
  submitting = signal(false);
  sizeGroups = signal<SizeGroup[]>([]);

  budgetName = '';
  clientName = '';
  notes = '';
  garmentTypeId = 0;

  private sizeQtyMap = new Map<number, number>();
  private sizeCodeMap = new Map<number, string>();

  steps = [
    { key: 'garment' as WizardStep, number: 1, label: 'Prenda' },
    { key: 'sizes' as WizardStep, number: 2, label: 'Tallas' },
    { key: 'confirm' as WizardStep, number: 3, label: 'Confirmar' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private budgetSvc: BudgetService,
    private catalog: CatalogCacheService,
    public connectivity: ConnectivityService,
    private syncQueue: SyncQueueService,
    private toast: ToastController
  ) {
    addIcons({
      checkmarkCircleOutline, arrowForwardOutline, arrowBackOutline,
      shirtOutline, resizeOutline, listOutline, checkmarkOutline
    });
  }

  ngOnInit(): void {
    this.garmentTypeId = Number(this.route.snapshot.queryParams['garmentTypeId']);
    this.sizeGroups.set(this.catalog.getSizeGroups());
    // Mapear códigos de talla para el resumen
    this.catalog.getAllSizes().forEach(s => this.sizeCodeMap.set(s.id, s.code));
  }

  garmentName(): string {
    return this.catalog.getGarmentsByCategory(0)
      .find(g => g.id === this.garmentTypeId)?.name ?? 'Prenda seleccionada';
  }

  categoryName(): string { return ''; }

  progressValue(): number {
    const map: Record<WizardStep, number> = { garment: 0.33, sizes: 0.66, info: 0.8, confirm: 1.0 };
    return map[this.currentStep()];
  }

  isStepDone(step: WizardStep): boolean {
    const order: WizardStep[] = ['garment', 'sizes', 'confirm'];
    return order.indexOf(step) < order.indexOf(this.currentStep());
  }

  canProceed(): boolean {
    switch (this.currentStep()) {
      case 'garment': return !!this.budgetName.trim();
      case 'sizes': return this.totalQuantity() > 0;
      default: return true;
    }
  }

  nextStep(): void {
    const order: WizardStep[] = ['garment', 'sizes', 'confirm'];
    const idx = order.indexOf(this.currentStep());
    if (idx < order.length - 1) this.currentStep.set(order[idx + 1]);
  }

  prevStep(): void {
    const order: WizardStep[] = ['garment', 'sizes', 'confirm'];
    const idx = order.indexOf(this.currentStep());
    if (idx > 0) this.currentStep.set(order[idx - 1]);
  }

  getSizeQty(sizeId: number): number {
    return this.sizeQtyMap.get(sizeId) ?? 0;
  }

  setSizeQty(sizeId: number, event: any): void {
    const qty = Math.max(0, parseInt(event.target.value) || 0);
    if (qty > 0) this.sizeQtyMap.set(sizeId, qty);
    else this.sizeQtyMap.delete(sizeId);
  }

  totalQuantity(): number {
    return Array.from(this.sizeQtyMap.values()).reduce((s, v) => s + v, 0);
  }

  sizeEntries(): { sizeId: number; sizeCode: string; quantity: number }[] {
    return Array.from(this.sizeQtyMap.entries()).map(([sizeId, quantity]) => ({
      sizeId, quantity, sizeCode: this.sizeCodeMap.get(sizeId) ?? ''
    }));
  }

  async submit(): Promise<void> {
    this.submitting.set(true);
    const payload = {
      name: this.budgetName.trim(),
      garmentTypeId: this.garmentTypeId,
      clientName: this.clientName.trim() || undefined,
      notes: this.notes.trim() || undefined,
      sizeQuantities: this.sizeEntries().map(e => ({
        sizeId: e.sizeId, quantity: e.quantity
      }))
    };

    if (!this.connectivity.isOnline()) {
      await this.syncQueue.enqueue('CREATE_BUDGET', payload);
      const t = await this.toast.create({
        message: 'Guardado localmente. Se sincronizará cuando haya internet.',
        color: 'warning', duration: 3000, position: 'top'
      });
      await t.present();
      this.router.navigate(['/budgets']);
      return;
    }

    this.budgetSvc.create(payload).subscribe({
      next: async res => {
        const t = await this.toast.create({
          message: `Presupuesto ${res.data.code} creado correctamente`,
          color: 'success', duration: 3000, position: 'top'
        });
        await t.present();
        this.router.navigate(['/budgets', res.data.id]);
      },
      error: async () => {
        this.submitting.set(false);
        const t = await this.toast.create({
          message: 'Error al crear el presupuesto. Intente nuevamente.',
          color: 'danger', duration: 3000, position: 'top'
        });
        await t.present();
      }
    });
  }
}
