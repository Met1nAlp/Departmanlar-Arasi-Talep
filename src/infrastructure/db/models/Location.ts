// src/infrastructure/db/models/Location.ts
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

/** Plan Bölüm 10.1 LOCATION — tam senkron (küçük tablo, Bölüm 10.3). */
export default class Location extends Model {
  static table = 'locations';

  @field('department_id') departmentId!: string;
  @field('code') code!: string; // "A-12-03"
  @field('kind') kind!: string; // 'SHELF' | 'LINESIDE' | 'DROP_POINT' | 'CHARGER'
  @field('map_ref') mapRef?: string; // AGV node id
}
