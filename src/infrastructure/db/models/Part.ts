// src/infrastructure/db/models/Part.ts
import { Model } from '@nozbe/watermelondb';
import { field, json } from '@nozbe/watermelondb/decorators';

function sanitizeAttributes(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

/** Plan Bölüm 10.1 PART + Bölüm 10.3 yerel katalog. */
export default class Part extends Model {
  static table = 'parts';

  @field('part_no') partNo!: string;
  @field('revision') revision!: string;
  @field('description_tr') descriptionTr!: string;
  @field('description_en') descriptionEn?: string;
  @field('uom') uom!: string;
  @field('serial_tracked') serialTracked!: boolean;
  @field('lot_tracked') lotTracked!: boolean;
  @field('min_stock') minStock!: number;
  @field('default_supplier_dept_id') defaultSupplierDeptId?: string;
  @json('attributes_json', sanitizeAttributes) attributes!: Record<string, unknown>;
}
