// ============================================================
//  models/index.ts — Todos los tipos del sistema
// ============================================================

// ─── Auth ─────────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
}

// ─── Catálogo ─────────────────────────────────────────────────
export interface GarmentCategory {
  id: number;
  code: string;
  name: string;
  iconName: string;
  displayOrder: number;
}

export interface GarmentType {
  id: number;
  name: string;
  categoryId: number;
  description?: string;
  imageUrl?: string;
  active: boolean;
  fabricParts?: GarmentFabricPart[];
  accessoryTemplates?: GarmentAccessoryTemplate[];
  processTemplates?: GarmentProcessTemplate[];
}

export interface GarmentFabricPart {
  id: number;
  partName: string;
  material?: Material;
  baseConsumption: number;
  unit: string;
  optional: boolean;
  displayOrder: number;
}

export interface GarmentAccessoryTemplate {
  id: number;
  accessory: Accessory;
  quantityPerUnit: number;
  required: boolean;
  displayOrder: number;
}

export interface GarmentProcessTemplate {
  id: number;
  processStep: ProcessStep;
  defaultQuantity: number;
  defaultCost: number;
  displayOrder: number;
}

export interface Material {
  id: number;
  code: string;
  name: string;
  unit: string;
  costPerUnit: number;
  supplier?: string;
}

export interface Accessory {
  id: number;
  name: string;
  type: string;
  unit: string;
  costPerUnit: number;
}

export interface ProcessStep {
  id: number;
  name: string;
  category: string;
  defaultCost: number;
  displayOrder: number;
}

export interface SizeGroup {
  id: number;
  name: string;
  sizes: Size[];
}

export interface Size {
  id: number;
  code: string;
  name: string;
  orderIndex: number;
}

// ─── Presupuesto ──────────────────────────────────────────────
export interface BudgetSummary {
  id: number;
  code: string;
  name: string;
  clientName?: string;
  status: BudgetStatus;
  orderQuantity: number;
  garmentName: string;
  totalUnitCost?: number;
  totalOrderCost?: number;
  finalPrice?: number;
  createdAt: string;
}

export type BudgetStatus =
  | 'DRAFT' | 'REVIEW' | 'APPROVED'
  | 'REJECTED' | 'EXPORTED' | 'CLOSED' | 'CANCELLED';

export interface BudgetDetail extends BudgetSummary {
  garmentCategory: string;
  garmentImageUrl?: string;
  notes?: string;
  createdByName: string;
  updatedAt: string;
  sizeQuantities: SizeQty[];
  fabricLines: FabricLine[];
  accessoryLines: AccessoryLine[];
  processLines: ProcessLine[];
  operationalLines: SimpleLine[];
  miscLines: SimpleLine[];
  costSummary?: CostSummary;
  marginOptions: MarginOption[];
  negotiation?: Negotiation;
}

export interface SizeQty {
  sizeId: number;
  sizeCode: string;
  sizeName: string;
  quantity: number;
}

export interface FabricLine {
  id: number;
  partName: string;
  materialCode: string;
  materialName: string;
  consumptionPerUnit: number;
  unit: string;
  unitCostSnapshot: number;
  subtotalPerUnit: number;
  totalConsumptionMts: number;
  notes?: string;
}

export interface AccessoryLine {
  id: number;
  accessoryName: string;
  accessoryType: string;
  quantityPerUnit: number;
  unit: string;
  unitCostSnapshot: number;
  subtotalPerUnit: number;
  notes?: string;
}

export interface ProcessLine {
  id: number;
  stepName: string;
  stepCategory: string;
  quantity: number;
  unitCostSnapshot: number;
  subtotalPerUnit: number;
  notes?: string;
}

export interface SimpleLine {
  id: number;
  typeName: string;
  quantity: number;
  unitCostSnapshot: number;
  subtotalPerUnit: number;
}

export interface CostSummary {
  subtotalFabrics: number;
  subtotalAccessories: number;
  subtotalProcess: number;
  subtotalOperational: number;
  subtotalMisc: number;
  totalUnitCost: number;
  totalOrderCost: number;
  lastCalculatedAt: string;
}

export interface MarginOption {
  marginPct: number;
  marginAmount: number;
  totalWithMargin: number;
}

export interface Negotiation {
  proposedPrice?: number;
  finalPrice?: number;
  negotiationNotes?: string;
  agreed: boolean;
  agreedAt?: string;
}

// ─── Requests ──────────────────────────────────────────────────
export interface CreateBudgetRequest {
  name: string;
  garmentTypeId: number;
  clientName?: string;
  sizeQuantities?: { sizeId: number; quantity: number }[];
  notes?: string;
}

export interface UpdateLineRequest {
  unitCost?: number;
  quantity?: number;
  notes?: string;
}

export interface NegotiationRequest {
  proposedPrice?: number;
  finalPrice?: number;
  notes?: string;
}

// ─── API Response wrapper ──────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ─── Catálogo offline ──────────────────────────────────────────
export interface CatalogCache {
  version: number;
  lastUpdated: string;
  categories: GarmentCategory[];
  garments: { id: number; name: string; categoryId: number; imageUrl?: string }[];
  materials: Material[];
  accessories: Accessory[];
  processSteps: ProcessStep[];
  operationalTypes: { id: number; name: string; defaultCost: number }[];
  miscTypes: { id: number; name: string; defaultCost: number }[];
  sizeGroups: SizeGroup[];
}

// ─── Operaciones offline pendientes ────────────────────────────
export interface PendingOperation {
  id?: number;
  type: 'CREATE_BUDGET' | 'UPDATE_SIZES' | 'UPDATE_LINE' | 'UPDATE_NEGOTIATION';
  payload: any;
  createdAt: string;
  retries: number;
}
