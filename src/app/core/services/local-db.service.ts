import { Injectable }      from '@angular/core';
import Dexie, { Table }    from 'dexie';
import { CatalogCache, PendingOperation, BudgetDetail } from '../models';

/**
 * Base de datos local (IndexedDB) para modo offline.
 * Dexie.js es un wrapper liviano sobre IndexedDB con API de Promesas.
 *
 * Qué se guarda localmente:
 * - catalog:         catálogo completo (telas, avíos, tallas, prendas)
 * - drafts:          presupuestos borrador del usuario
 * - recent_budgets:  últimos 20 presupuestos vistos (para acceso offline)
 * - pending_ops:     operaciones pendientes de sincronizar cuando vuelva internet
 */
@Injectable({ providedIn: 'root' })
export class LocalDbService extends Dexie {

  catalog!:        Table<CatalogCache & { id?: number }, number>;
  drafts!:         Table<BudgetDetail & { localId?: number }, number>;
  recentBudgets!:  Table<BudgetDetail & { cachedAt?: string }, number>;
  pendingOps!:     Table<PendingOperation, number>;

  constructor() {
    super('GarmentBudgetDB');

    this.version(1).stores({
      catalog:       '++id, version',
      drafts:        '++localId, id, status, garmentName',
      recentBudgets: 'id, code, status, cachedAt',
      pendingOps:    '++id, type, createdAt'
    });
  }

  // ─── Catálogo ──────────────────────────────────────────────────

  async saveCatalog(catalog: CatalogCache): Promise<void> {
    await this.catalog.clear();
    await this.catalog.add(catalog);
  }

  async getCatalog(): Promise<CatalogCache | undefined> {
    return this.catalog.toCollection().first();
  }

  async getCatalogVersion(): Promise<number> {
    const catalog = await this.getCatalog();
    return catalog?.version ?? 0;
  }

  // ─── Presupuestos recientes ─────────────────────────────────────

  async cacheBudget(budget: BudgetDetail): Promise<void> {
    await this.recentBudgets.put({
      ...budget,
      cachedAt: new Date().toISOString()
    });
    // Mantener solo los últimos 20
    const all = await this.recentBudgets.orderBy('cachedAt').reverse().toArray();
    if (all.length > 20) {
      const toDelete = all.slice(20).map(b => b.id!);
      await this.recentBudgets.bulkDelete(toDelete);
    }
  }

  async getCachedBudget(id: number): Promise<BudgetDetail | undefined> {
    return this.recentBudgets.get(id);
  }

  async getAllCachedBudgets(): Promise<BudgetDetail[]> {
    return this.recentBudgets.orderBy('cachedAt').reverse().toArray();
  }

  // ─── Borradores locales ─────────────────────────────────────────

  async saveDraft(budget: Partial<BudgetDetail>): Promise<number> {
    return this.drafts.add(budget as BudgetDetail);
  }

  async getDrafts(): Promise<BudgetDetail[]> {
    return this.drafts.toArray();
  }

  async deleteDraft(localId: number): Promise<void> {
    await this.drafts.delete(localId);
  }

  // ─── Cola de operaciones pendientes ────────────────────────────

  async enqueuePendingOp(op: Omit<PendingOperation, 'id'>): Promise<void> {
    await this.pendingOps.add({ ...op, retries: 0 });
  }

  async getPendingOps(): Promise<PendingOperation[]> {
    return this.pendingOps.orderBy('createdAt').toArray();
  }

  async removePendingOp(id: number): Promise<void> {
    await this.pendingOps.delete(id);
  }

  async incrementRetry(id: number): Promise<void> {
    await this.pendingOps.where('id').equals(id).modify(op => {
      op.retries = (op.retries || 0) + 1;
    });
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      this.catalog.clear(),
      this.recentBudgets.clear(),
      this.drafts.clear(),
      this.pendingOps.clear()
    ]);
  }
}
