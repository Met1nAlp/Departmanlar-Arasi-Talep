// src/infrastructure/db/models/PartBarcode.ts
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

/** Plan Bölüm 10.1 PART_BARCODE — barkod çözümleme akışı Bölüm 13.3'te bu tabloyu okur. */
export default class PartBarcode extends Model {
  static table = 'part_barcodes';

  @field('part_id') partId!: string;
  @field('symbology') symbology!: string;
  @field('raw_value') rawValue!: string;
  @field('parsed_gtin') parsedGtin?: string;
  @field('is_primary') isPrimary!: boolean;
}
