import { Injectable }         from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { firstValueFrom }     from 'rxjs';
import { LocalDbService }     from './local-db.service';
import { ConnectivityService } from './connectivity.service';
import { environment }        from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SyncQueueService {

  private syncing = false;

  constructor(
    private db: LocalDbService,
    private http: HttpClient,
    private connectivity: ConnectivityService
  ) {
    // Escuchar reconexión y sincronizar pendientes automáticamente
    this.connectivity.online$.subscribe(async online => {
      if (online && !this.syncing) {
        await this.flushQueue();
      }
    });
  }

  // ─── Agregar operación a la cola ───────────────────────────────

  async enqueue(type: string, payload: any): Promise<void> {
    await this.db.enqueuePendingOp({
      type: type as any,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0
    });
    console.log('[SyncQueue] Operación encolada:', type);

    // Intentar sincronizar inmediatamente si hay internet
    if (this.connectivity.isOnline()) {
      await this.flushQueue();
    }
  }

  // ─── Procesar cola cuando hay internet ─────────────────────────

  async flushQueue(): Promise<void> {
    if (this.syncing) return;
    const ops = await this.db.getPendingOps();
    if (!ops.length) return;

    this.syncing = true;
    console.log(`[SyncQueue] Procesando ${ops.length} operaciones pendientes`);

    for (const op of ops) {
      if (op.retries >= 3) {
        // Demasiados reintentos — descartar
        await this.db.removePendingOp(op.id!);
        console.warn('[SyncQueue] Operación descartada tras 3 reintentos:', op.type);
        continue;
      }

      try {
        await this.executeOp(op);
        await this.db.removePendingOp(op.id!);
        console.log('[SyncQueue] Operación sincronizada:', op.type);
      } catch (err) {
        await this.db.incrementRetry(op.id!);
        console.error('[SyncQueue] Error al sincronizar:', op.type, err);
      }
    }

    this.syncing = false;
  }

  private async executeOp(op: any): Promise<void> {
    const base = environment.apiUrl;

    switch (op.type) {
      case 'CREATE_BUDGET':
        await firstValueFrom(this.http.post(`${base}/budgets`, op.payload));
        break;
      case 'UPDATE_SIZES':
        await firstValueFrom(
          this.http.put(`${base}/budgets/${op.payload.budgetId}/sizes`, op.payload.sizes)
        );
        break;
      case 'UPDATE_LINE':
        await firstValueFrom(
          this.http.patch(
            `${base}/budgets/${op.payload.budgetId}/fabric-lines/${op.payload.lineId}`,
            op.payload.data
          )
        );
        break;
      case 'UPDATE_NEGOTIATION':
        await firstValueFrom(
          this.http.put(`${base}/budgets/${op.payload.budgetId}/negotiation`, op.payload.data)
        );
        break;
    }
  }
}
