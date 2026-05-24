import { Injectable }     from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable }      from 'rxjs';
import { tap }             from 'rxjs/operators';
import {
  ApiResponse, PageResponse, BudgetSummary, BudgetDetail,
  CreateBudgetRequest, UpdateLineRequest, NegotiationRequest
} from '../models';
import { LocalDbService }  from './local-db.service';
import { environment }     from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {

  private url = `${environment.apiUrl}/budgets`;

  constructor(private http: HttpClient, private db: LocalDbService) {}

  // ─── Lista ────────────────────────────────────────────────────

  list(page = 0, size = 20, mine = false, client?: string):
      Observable<ApiResponse<PageResponse<BudgetSummary>>> {
    let params = new HttpParams()
      .set('page', page).set('size', size).set('mine', mine);
    if (client) params = params.set('client', client);
    return this.http.get<ApiResponse<PageResponse<BudgetSummary>>>(this.url, { params });
  }

  // ─── Detalle ──────────────────────────────────────────────────

  getById(id: number): Observable<ApiResponse<BudgetDetail>> {
    return this.http.get<ApiResponse<BudgetDetail>>(`${this.url}/${id}`).pipe(
      tap(res => { if (res.success) this.db.cacheBudget(res.data); })
    );
  }

  // ─── CRUD ─────────────────────────────────────────────────────

  create(request: CreateBudgetRequest): Observable<ApiResponse<BudgetDetail>> {
    return this.http.post<ApiResponse<BudgetDetail>>(this.url, request);
  }

  duplicate(id: number): Observable<ApiResponse<BudgetDetail>> {
    return this.http.post<ApiResponse<BudgetDetail>>(`${this.url}/${id}/duplicate`, {});
  }

  // ─── Tallas ───────────────────────────────────────────────────

  updateSizes(id: number, sizes: { sizeId: number; quantity: number }[]):
      Observable<ApiResponse<BudgetDetail>> {
    return this.http.put<ApiResponse<BudgetDetail>>(`${this.url}/${id}/sizes`, sizes);
  }

  // ─── Líneas de costo ──────────────────────────────────────────

  updateFabricLine(budgetId: number, lineId: number, data: UpdateLineRequest):
      Observable<ApiResponse<BudgetDetail>> {
    return this.http.patch<ApiResponse<BudgetDetail>>(
      `${this.url}/${budgetId}/fabric-lines/${lineId}`, data
    );
  }

  updateAccessoryLine(budgetId: number, lineId: number, data: UpdateLineRequest):
      Observable<ApiResponse<BudgetDetail>> {
    return this.http.patch<ApiResponse<BudgetDetail>>(
      `${this.url}/${budgetId}/accessory-lines/${lineId}`, data
    );
  }

  updateProcessLine(budgetId: number, lineId: number, data: UpdateLineRequest):
      Observable<ApiResponse<BudgetDetail>> {
    return this.http.patch<ApiResponse<BudgetDetail>>(
      `${this.url}/${budgetId}/process-lines/${lineId}`, data
    );
  }

  // ─── Negociación ──────────────────────────────────────────────

  updateNegotiation(id: number, data: NegotiationRequest):
      Observable<ApiResponse<BudgetDetail>> {
    return this.http.put<ApiResponse<BudgetDetail>>(
      `${this.url}/${id}/negotiation`, data
    );
  }

  // ─── Estado ───────────────────────────────────────────────────

  changeStatus(id: number, status: string, reason?: string):
      Observable<ApiResponse<BudgetDetail>> {
    return this.http.patch<ApiResponse<BudgetDetail>>(
      `${this.url}/${id}/status`, { status, reason }
    );
  }

  // ─── Exportación ──────────────────────────────────────────────

  exportPdf(id: number): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/reports/budgets/${id}/pdf`,
      { responseType: 'blob' }
    );
  }

  exportExcel(id: number): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/reports/budgets/${id}/excel`,
      { responseType: 'blob' }
    );
  }
}
