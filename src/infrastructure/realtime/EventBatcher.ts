// src/infrastructure/realtime/EventBatcher.ts
//
// Plan Bölüm 12.5 "Performans teknikleri": "WS olay fırtınası → Olaylar 100 ms
// pencerede batch'lenip tek state güncellemesi." Bu sınıf, kısa aralıkla gelen
// çok sayıda olayı tek bir `onFlush` çağrısında toplu olarak dışarı verir —
// her olayda ayrı re-render tetiklemek yerine.

export class EventBatcher<T> {
  private buffer: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly windowMs: number,
    private readonly onFlush: (events: T[]) => void
  ) {}

  push(event: T): void {
    this.buffer.push(event);
    if (this.timer == null) {
      this.timer = setTimeout(() => this.flush(), this.windowMs);
    }
  }

  flush(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) return;
    const batch = this.buffer;
    this.buffer = [];
    this.onFlush(batch);
  }

  dispose(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.buffer = [];
  }
}
