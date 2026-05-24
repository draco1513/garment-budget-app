import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader,
  IonCardTitle, IonBadge, IonAccordion, IonAccordionGroup,
  IonItem, IonLabel, IonSpinner, IonBackButton, IonFab,
  IonFabButton, IonFabList, IonRefresher, IonRefresherContent,
  IonChip, AlertController, ToastController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  downloadOutline, checkmarkCircleOutline, closeCircleOutline,
  documentOutline, printOutline, copyOutline, createOutline,
  shareOutline, ellipsisVertical, handRightOutline, cashOutline
} from 'ionicons/icons';
import { BudgetService } from '../../../core/services/budget.service';
import { AuthService } from '../../../core/services/auth.service';
import { BudgetDetail } from '../../../core/models';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Component({
  selector: 'app-budget-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonBadge, IonAccordion, IonAccordionGroup,
    IonItem, IonLabel, IonSpinner, IonBackButton, IonFab,
    IonFabButton, IonFabList, IonRefresher, IonRefresherContent,
    IonChip
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/budgets"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ budget()?.code ?? 'Presupuesto' }}</ion-title>
        <ion-buttons slot="end">
          @if (budget() && auth.hasPermission('BUDGET_EXPORT')) {
            <ion-button (click)="openExportMenu()">
              <ion-icon name="download-outline" slot="icon-only"></ion-icon>
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="reload($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading()) {
        <div class="loading-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
        </div>
      }

      @if (budget(); as b) {

        <!-- Encabezado del presupuesto -->
        <div class="budget-hero">
          @if (b.garmentImageUrl) {
            <img [src]="b.garmentImageUrl" [alt]="b.garmentName" class="garment-img" loading="lazy">
          } @else {
            <div class="garment-placeholder">👗</div>
          }
          <div class="hero-info">
            <div class="hero-badge">
              <ion-badge [color]="getStatusColor(b.status)">
                {{ getStatusLabel(b.status) }}
              </ion-badge>
            </div>
            <h1>{{ b.name }}</h1>
            <p class="hero-sub">
              {{ b.garmentName }} · {{ b.garmentCategory }}
            </p>
            @if (b.clientName) {
              <p class="hero-client">
                <ion-icon name="person-outline"></ion-icon>
                {{ b.clientName }}
              </p>
            }
          </div>
        </div>

        <!-- Tallas y cantidades -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Tallas y Cantidades</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="sizes-row">
              @for (sq of b.sizeQuantities; track sq.sizeId) {
                <div class="size-chip">
                  <span class="size-code">{{ sq.sizeCode }}</span>
                  <span class="size-qty">{{ sq.quantity }}</span>
                </div>
              }
            </div>
            <div class="total-qty">Total: {{ b.orderQuantity }} prendas</div>
          </ion-card-content>
        </ion-card>

        <!-- Resumen de costos -->
        @if (b.costSummary) {
          <ion-card class="summary-card">
            <ion-card-content>
              <div class="summary-title">Costo por Prenda</div>
              <div class="summary-row">
                <span>Telas</span>
                <span>S/ {{ b.costSummary.subtotalFabrics | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row">
                <span>Avíos</span>
                <span>S/ {{ b.costSummary.subtotalAccessories | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row">
                <span>Proceso</span>
                <span>S/ {{ b.costSummary.subtotalProcess | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row">
                <span>Gastos Operativos</span>
                <span>S/ {{ b.costSummary.subtotalOperational | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row">
                <span>Gastos Varios</span>
                <span>S/ {{ b.costSummary.subtotalMisc | number:'1.2-2' }}</span>
              </div>
              <div class="summary-total">
                <span>COSTO TOTAL / PRENDA</span>
                <span>S/ {{ b.costSummary.totalUnitCost | number:'1.2-2' }}</span>
              </div>
              <div class="summary-order">
                <span>Costo total del pedido</span>
                <strong>S/ {{ b.costSummary.totalOrderCost | number:'1.2-2' }}</strong>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Márgenes de utilidad -->
        @if (b.marginOptions.length) {
          <ion-card>
            <ion-card-header>
              <ion-card-title>Opciones de Precio con Margen</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="margins-grid">
                @for (m of b.marginOptions; track m.marginPct) {
                  <div class="margin-card" [class.selected]="false">
                    <div class="margin-pct">{{ m.marginPct }}%</div>
                    <div class="margin-amount">+S/ {{ m.marginAmount | number:'1.2-2' }}</div>
                    <div class="margin-total">S/ {{ m.totalWithMargin | number:'1.2-2' }}</div>
                  </div>
                }
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Negociación -->
        @if (b.negotiation) {
          <ion-card [color]="b.negotiation.agreed ? 'success' : 'warning'" class="negotiation-card">
            <ion-card-content>
              <div class="neg-header">
                <ion-icon [name]="b.negotiation.agreed ? 'checkmark-circle-outline' : 'hand-right-outline'"></ion-icon>
                <span>{{ b.negotiation.agreed ? 'Precio Acordado' : 'En Negociación' }}</span>
              </div>
              @if (b.negotiation.proposedPrice) {
                <div class="neg-row">
                  <span>Precio propuesto</span>
                  <strong>S/ {{ b.negotiation.proposedPrice | number:'1.2-2' }}</strong>
                </div>
              }
              @if (b.negotiation.finalPrice) {
                <div class="neg-row">
                  <span>Precio final</span>
                  <strong class="neg-final">S/ {{ b.negotiation.finalPrice | number:'1.2-2' }}</strong>
                </div>
              }
              @if (b.negotiation.negotiationNotes) {
                <div class="neg-notes">{{ b.negotiation.negotiationNotes }}</div>
              }
              @if (auth.hasPermission('BUDGET_NEGOTIATE') && isEditable(b.status)) {
                <ion-button fill="clear" size="small" [routerLink]="['/budgets', b.id, 'negotiation']">
                  Editar negociación
                </ion-button>
              }
            </ion-card-content>
          </ion-card>
        }

        <!-- Desglose de telas -->
        <ion-accordion-group>
          <ion-accordion value="fabrics">
            <ion-item slot="header" color="light">
              <ion-label><strong>Telas ({{ b.fabricLines.length }})</strong></ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              @for (l of b.fabricLines; track l.id) {
                <div class="line-row">
                  <div class="line-main">
                    <span class="line-name">{{ l.partName }}</span>
                    <span class="line-sub">{{ l.materialName }} ({{ l.materialCode }})</span>
                  </div>
                  <div class="line-amounts">
                    <span>{{ l.consumptionPerUnit | number:'1.3-3' }} {{ l.unit }}</span>
                    <span>× S/ {{ l.unitCostSnapshot | number:'1.2-2' }}</span>
                    <strong>= S/ {{ l.subtotalPerUnit | number:'1.2-2' }}</strong>
                  </div>
                </div>
              }
            </div>
          </ion-accordion>

          <ion-accordion value="accessories">
            <ion-item slot="header" color="light">
              <ion-label><strong>Avíos ({{ b.accessoryLines.length }})</strong></ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              @for (l of b.accessoryLines; track l.id) {
                <div class="line-row">
                  <div class="line-main">
                    <span class="line-name">{{ l.accessoryName }}</span>
                    <span class="line-sub">{{ l.accessoryType }}</span>
                  </div>
                  <div class="line-amounts">
                    <span>{{ l.quantityPerUnit | number:'1.0-3' }} {{ l.unit }}</span>
                    <span>× S/ {{ l.unitCostSnapshot | number:'1.2-2' }}</span>
                    <strong>= S/ {{ l.subtotalPerUnit | number:'1.2-2' }}</strong>
                  </div>
                </div>
              }
            </div>
          </ion-accordion>

          <ion-accordion value="process">
            <ion-item slot="header" color="light">
              <ion-label><strong>Proceso ({{ b.processLines.length }})</strong></ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              @for (l of b.processLines; track l.id) {
                <div class="line-row">
                  <div class="line-main">
                    <span class="line-name">{{ l.stepName }}</span>
                    <span class="line-sub">{{ l.stepCategory }}</span>
                  </div>
                  <div class="line-amounts">
                    <span>× {{ l.quantity | number:'1.0-2' }}</span>
                    <span>S/ {{ l.unitCostSnapshot | number:'1.2-2' }}/und</span>
                    <strong>= S/ {{ l.subtotalPerUnit | number:'1.2-2' }}</strong>
                  </div>
                </div>
              }
            </div>
          </ion-accordion>
        </ion-accordion-group>

        <!-- Acciones de estado -->
        @if (isEditable(b.status) && auth.hasPermission('BUDGET_APPROVE')) {
          <div class="action-buttons">
            @if (b.status === 'DRAFT') {
              <ion-button expand="block" color="warning" (click)="changeStatus('REVIEW')">
                Enviar a revisión
              </ion-button>
            }
            @if (b.status === 'REVIEW') {
              <ion-button expand="block" color="success" (click)="changeStatus('APPROVED')">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                Aprobar presupuesto
              </ion-button>
              <ion-button expand="block" color="danger" fill="outline" (click)="changeStatus('REJECTED')">
                <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                Rechazar
              </ion-button>
            }
          </div>
        }

      } <!-- end if budget -->

    </ion-content>

    <!-- FAB exportar -->
    @if (budget() && auth.hasPermission('BUDGET_EXPORT')) {
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button color="tertiary">
          <ion-icon name="share-outline"></ion-icon>
        </ion-fab-button>
        <ion-fab-list side="top">
          <ion-fab-button color="danger" (click)="exportPdf()" title="PDF">
            <ion-icon name="document-outline"></ion-icon>
          </ion-fab-button>
          <ion-fab-button color="success" (click)="exportExcel()" title="Excel">
            <ion-icon name="grid-outline"></ion-icon>
          </ion-fab-button>
        </ion-fab-list>
      </ion-fab>
    }
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .budget-hero {
      display: flex; gap: 16px; padding: 16px;
      background: linear-gradient(135deg, #1a3a5c, #2d6a9f); color: white;
    }
    .garment-img {
      width: 80px; height: 80px; border-radius: 12px;
      object-fit: cover; flex-shrink: 0;
    }
    .garment-placeholder {
      width: 80px; height: 80px; border-radius: 12px;
      background: rgba(255,255,255,0.15); display: flex;
      align-items: center; justify-content: center; font-size: 36px;
    }
    .hero-badge { margin-bottom: 6px; }
    .hero-info h1 { font-size: 18px; font-weight: 700; margin: 0 0 4px; line-height: 1.3; }
    .hero-sub { font-size: 13px; opacity: 0.85; margin: 0; }
    .hero-client { font-size: 13px; opacity: 0.85; margin: 4px 0 0; display: flex; align-items: center; gap: 4px; }

    .sizes-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    .size-chip {
      display: flex; flex-direction: column; align-items: center;
      background: var(--ion-color-light); border-radius: 10px;
      padding: 6px 10px; min-width: 44px;
    }
    .size-code { font-size: 11px; font-weight: 700; color: var(--ion-color-medium); }
    .size-qty  { font-size: 18px; font-weight: 700; }
    .total-qty { font-size: 13px; color: var(--ion-color-medium); }

    .summary-card { --background: #f0fdf4; }
    .summary-title { font-weight: 700; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-row {
      display: flex; justify-content: space-between;
      padding: 5px 0; font-size: 14px;
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    .summary-row span:first-child { color: var(--ion-color-medium); }
    .summary-total {
      display: flex; justify-content: space-between;
      padding: 10px 0 6px; font-size: 15px; font-weight: 700;
      border-top: 2px solid var(--ion-color-success);
      color: var(--ion-color-success); margin-top: 4px;
    }
    .summary-order {
      display: flex; justify-content: space-between;
      padding: 4px 0; font-size: 14px; color: var(--ion-color-medium);
    }
    .summary-order strong { color: var(--ion-color-dark); font-size: 16px; }

    .margins-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .margin-card {
      text-align: center; padding: 14px 8px;
      border: 2px solid var(--ion-color-light-shade);
      border-radius: 12px; background: white;
    }
    .margin-pct    { font-size: 20px; font-weight: 800; color: var(--ion-color-primary); }
    .margin-amount { font-size: 11px; color: var(--ion-color-success); margin: 2px 0; }
    .margin-total  { font-size: 15px; font-weight: 700; }

    .negotiation-card { margin: 0 8px; }
    .neg-header { display: flex; align-items: center; gap: 8px; font-weight: 700; margin-bottom: 10px; font-size: 15px; }
    .neg-header ion-icon { font-size: 22px; }
    .neg-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
    .neg-final { font-size: 18px; color: var(--ion-color-success-shade); }
    .neg-notes { font-size: 13px; color: var(--ion-color-medium); margin-top: 8px; font-style: italic; }

    .accordion-content { padding: 0 16px; }
    .line-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid var(--ion-color-light-shade);
    }
    .line-main { flex: 1; }
    .line-name { display: block; font-size: 14px; font-weight: 600; }
    .line-sub  { display: block; font-size: 12px; color: var(--ion-color-medium); }
    .line-amounts {
      display: flex; flex-direction: column; align-items: flex-end;
      font-size: 12px; color: var(--ion-color-medium); gap: 2px;
    }
    .line-amounts strong { font-size: 14px; color: var(--ion-color-dark); }

    .action-buttons { padding: 16px 8px 100px; display: flex; flex-direction: column; gap: 10px; }
  `]
})
export class BudgetDetailPage implements OnInit {

  budget = signal<BudgetDetail | null>(null);
  loading = signal(true);

  constructor(
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private budgetSvc: BudgetService,
    private toast: ToastController,
    private alert: AlertController,
    private actionSheet: ActionSheetController
  ) {
    addIcons({
      downloadOutline, checkmarkCircleOutline, closeCircleOutline,
      documentOutline, printOutline, copyOutline, createOutline,
      shareOutline, ellipsisVertical, handRightOutline, cashOutline
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.budgetSvc.getById(id).subscribe({
      next: res => { this.budget.set(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  reload(event?: any): void {
    this.load();
    setTimeout(() => event?.target?.complete(), 800);
  }

  isEditable(status: string): boolean {
    return ['DRAFT', 'REVIEW'].includes(status);
  }

  getStatusColor(status: string): string {
    const m: Record<string, string> = {
      DRAFT: 'medium', REVIEW: 'warning', APPROVED: 'success',
      REJECTED: 'danger', EXPORTED: 'tertiary', CLOSED: 'dark'
    };
    return m[status] ?? 'medium';
  }

  getStatusLabel(status: string): string {
    const m: Record<string, string> = {
      DRAFT: 'Borrador', REVIEW: 'En revisión', APPROVED: 'Aprobado',
      REJECTED: 'Rechazado', EXPORTED: 'Exportado', CLOSED: 'Cerrado'
    };
    return m[status] ?? status;
  }

  async changeStatus(newStatus: string): Promise<void> {
    const b = this.budget();
    if (!b) return;

    const confirm = await this.alert.create({
      header: 'Confirmar',
      message: `¿Deseas cambiar el estado a "${this.getStatusLabel(newStatus)}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar', handler: () => {
            this.budgetSvc.changeStatus(b.id, newStatus).subscribe({
              next: res => { this.budget.set(res.data); },
              error: () => { }
            });
          }
        }
      ]
    });
    await confirm.present();
  }

  exportPdf(): void {
    const b = this.budget();
    if (!b) return;
    this.budgetSvc.exportPdf(b.id).subscribe(blob => {
      this.downloadFile(blob, `presupuesto-${b.code}.pdf`);
    });
  }

  exportExcel(): void {
    const b = this.budget();
    if (!b) return;
    this.budgetSvc.exportExcel(b.id).subscribe(blob => {
      this.downloadFile(blob, `presupuesto-${b.code}.xlsx`);
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  openExportMenu(): void { /* handled by FAB */ }
}
