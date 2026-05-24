import { Injectable, signal } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { firstValueFrom }     from 'rxjs';
import { LocalDbService }     from './local-db.service';
import { ConnectivityService } from './connectivity.service';
import { CatalogCache, ApiResponse } from '../models';
import { environment }        from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogCacheService {

  catalog = signal<CatalogCache | null>(null);
  syncing = signal(false);

  private url = `${environment.apiUrl}/catalog`;

  constructor(
    private http: HttpClient,
    private db: LocalDbService,
    private connectivity: ConnectivityService
  ) {}

  // ─── Inicializar catálogo al login ─────────────────────────────

  async initialize(): Promise<void> {
    // 1. Cargar versión local de IndexedDB
    const local = await this.db.getCatalog();
    if (local) this.catalog.set(local);

    // 2. Si hay internet → verificar si hay versión nueva
    if (this.connectivity.isOnline()) {
      await this.syncIfNeeded(local?.version ?? 0);
    }
  }

  // ─── Verificar y sincronizar ────────────────────────────────────

  async syncIfNeeded(localVersion: number): Promise<void> {
    try {
      this.syncing.set(true);
      const vRes = await firstValueFrom(
        this.http.get<ApiResponse<{ version: number }>>(`${this.url}/version`)
      );

      if (vRes.data.version > localVersion) {
        await this.downloadFull();
      }
    } catch (err) {
      console.warn('[Catalog] No se pudo verificar versión:', err);
    } finally {
      this.syncing.set(false);
    }
  }

  async downloadFull(): Promise<void> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<CatalogCache>>(`${this.url}/full`)
    );
    await this.db.saveCatalog(res.data);
    this.catalog.set(res.data);
    console.log('[Catalog] Sincronizado v' + res.data.version);
  }

  // ─── Acceso a datos del catálogo ───────────────────────────────

  getCategories() {
    return this.catalog()?.categories ?? [];
  }

  getGarmentsByCategory(categoryId: number) {
    return (this.catalog()?.garments ?? [])
      .filter(g => g.categoryId === categoryId);
  }

  getMaterials() {
    return this.catalog()?.materials ?? [];
  }

  getAccessories() {
    return this.catalog()?.accessories ?? [];
  }

  getProcessSteps() {
    return this.catalog()?.processSteps ?? [];
  }

  getSizeGroups() {
    return this.catalog()?.sizeGroups ?? [];
  }

  getSizesForGroup(groupId: number) {
    return (this.catalog()?.sizeGroups ?? [])
      .find(g => g.id === groupId)?.sizes ?? [];
  }

  getAllSizes() {
    return (this.catalog()?.sizeGroups ?? [])
      .flatMap(g => g.sizes)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }
}
