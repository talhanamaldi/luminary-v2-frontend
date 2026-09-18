import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppActivityStore {
  private readonly pendingCount = signal(0);

  readonly pending = computed(() => this.pendingCount() > 0);

  async track<T>(operation: () => Promise<T>): Promise<T> {
    this.pendingCount.update((count) => count + 1);
    try {
      return await operation();
    } finally {
      this.pendingCount.update((count) => Math.max(0, count - 1));
    }
  }
}
