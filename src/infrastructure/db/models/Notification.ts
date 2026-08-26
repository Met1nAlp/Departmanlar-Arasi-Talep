// src/infrastructure/db/models/Notification.ts
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class NotificationRecord extends Model {
  static table = 'notifications';

  @field('request_id') requestId: string;
  @field('title') title: string;
  @field('body') body: string;
  @field('is_read') isRead: boolean;
  @field('created_at') createdAt: number;
  @field('user_id') userId: string;
}