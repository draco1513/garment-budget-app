import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonItem, IonInput, IonTextarea, IonCard, IonCardContent, IonCardHeader,
  IonCardTitle, IonBackButton, IonSpinner, ToastController, IonNote
} from '@ionic/angular/standalone';
import { BudgetService } from '../../../core/services/budget.service';
import { BudgetDetail }  from '../../../core/models';

@Component({
  selector: 'app-negotiation',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonItem, IonInput, IonTextarea, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonBackButton, IonSpinner, IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/budgets/' + budgetId"></ion-back-button>
        </ion-buttons>
        <ion-title>Negociación</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (budget(); as b) {

        <!-- Referencia de costos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Referencia de costos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="ref-row">
              <span>Costo por prenda</span>
              <strong>S/ {{ b.costSummary?.totalUnitCost | number:'1.2-2' }}</strong>
            </div>
            @for (m of b.marginOptions; track m.marginPct) {
              <div class="ref-row">
                <span>Con {{ m.marginPct }}% margen</span>
                <span class="ref-price">S/ {{ m.totalWithMargin | number:'1.2-2' }}</span>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Formulario de negociación -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Registrar negociación</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-input
                label="Precio propuesto al cliente (S/)"
                labelPlacement="floating"
                type="number"
                [(ngModel)]="proposed"
                placeholder="0.00"
                inputmode="decimal">
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-input
                label="Precio final acordado (S/)"
                labelPlacement="floating"
                type="number"
                [(ngModel)]="final"
                placeholder="0.00"
                inputmode="decimal">
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-textarea
                label="Notas de negociación"
                labelPlacement="floating"
                [(ngModel)]="notes"
                rows="4"
                placeholder="Ej: CON TELA DE 14 SOLES SIN TEÑIDO, MÁS DEL 15% GANANCIA...">
              </ion-textarea>
            </ion-item>
            <ion-note color="medium" style="padding:8px 0;display:block;font-size:13px">
              Al ingresar el precio final, el presupuesto quedará marcado como acordado.
            </ion-note>
          </ion-card-content>
        </ion-card>

        <div class="save-section">
          <ion-button expand="block" (click)="save()" [disabled]="saving()">
            @if (saving()) {
              <ion-spinner name="crescent" slot="start"></ion-spinner>
            }
            Guardar negociación
          </ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .ref-row {
      display: flex; justify-content: space-between;
      padding: 8px 0; font-size: 14px;
      border-bottom: 1px solid var(--ion-color-light-shade);
    }
    .ref-row:last-child { border-bottom: none; }
    .ref-row span:first-child { color: var(--ion-color-medium); }
    .ref-price { font-weight: 600; color: var(--ion-color-success); }
    .save-section { padding: 16px 8px 40px; }
  `]
})
export class NegotiationPage implements OnInit {

  budget   = signal<BudgetDetail | null>(null);
  saving   = signal(false);
  budgetId = 0;
  proposed = 0;
  final    = 0;
  notes    = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private budgetSvc: BudgetService,
    private toast: ToastController
  ) {}

  ngOnInit(): void {
    this.budgetId = Number(this.route.snapshot.paramMap.get('id'));
    this.budgetSvc.getById(this.budgetId).subscribe(res => {
      this.budget.set(res.data);
      if (res.data.negotiation) {
        this.proposed = res.data.negotiation.proposedPrice ?? 0;
        this.final    = res.data.negotiation.finalPrice ?? 0;
        this.notes    = res.data.negotiation.negotiationNotes ?? '';
      }
    });
  }

  save(): void {
    this.saving.set(true);
    this.budgetSvc.updateNegotiation(this.budgetId, {
      proposedPrice: this.proposed || undefined,
      finalPrice:    this.final || undefined,
      notes:         this.notes.trim() || undefined
    }).subscribe({
      next: async () => {
        const t = await this.toast.create({
          message: 'Negociación guardada correctamente',
          color: 'success', duration: 2500, position: 'top'
        });
        await t.present();
        this.router.navigate(['/budgets', this.budgetId]);
      },
      error: () => this.saving.set(false)
    });
  }
}
