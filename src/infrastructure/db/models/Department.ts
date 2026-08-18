// src/infrastructure/db/models/Department.ts
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

/** Plan Bölüm 10.1 DEPARTMENT — tam senkron (küçük tablo, Bölüm 10.3). */
export default class Department extends Model {
  static table = 'departments';

  @field('code') code: string;
  @field('name') name: string;
  @field('type') type: string; // 'PRODUCTION' | 'WAREHOUSE' | 'BOTH'
  @field('parent_id') parentId?: string;
}
