import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea número como precio en soles peruanos.
 * Uso: {{ 12.5 | sol }}  →  "S/ 12.50"
 */
@Pipe({ name: 'sol', standalone: true })
export class SolPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 2): string {
    if (value == null) return 'S/ 0.00';
    return `S/ ${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

/**
 * Traduce el código de estado al español.
 * Uso: {{ 'APPROVED' | budgetStatus }}  →  "Aprobado"
 */
@Pipe({ name: 'budgetStatus', standalone: true })
export class BudgetStatusPipe implements PipeTransform {
  private labels: Record<string, string> = {
    DRAFT:     'Borrador',
    REVIEW:    'En revisión',
    APPROVED:  'Aprobado',
    REJECTED:  'Rechazado',
    EXPORTED:  'Exportado',
    CLOSED:    'Cerrado',
    CANCELLED: 'Cancelado'
  };

  transform(status: string): string {
    return this.labels[status] ?? status;
  }
}

/**
 * Color Ionic según estado del presupuesto.
 * Uso: [color]="budget.status | statusColor"
 */
@Pipe({ name: 'statusColor', standalone: true })
export class StatusColorPipe implements PipeTransform {
  private colors: Record<string, string> = {
    DRAFT:     'medium',
    REVIEW:    'warning',
    APPROVED:  'success',
    REJECTED:  'danger',
    EXPORTED:  'tertiary',
    CLOSED:    'dark',
    CANCELLED: 'danger'
  };

  transform(status: string): string {
    return this.colors[status] ?? 'medium';
  }
}
