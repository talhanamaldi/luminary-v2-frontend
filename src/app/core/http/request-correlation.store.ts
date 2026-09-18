import { Injectable, signal } from '@angular/core';

export interface RequestCorrelation {
  readonly requestId: string;
  readonly code: string | null;
  readonly recordedAt: string;
}

@Injectable({ providedIn: 'root' })
export class RequestCorrelationStore {
  private readonly lastResponseRequestIdState = signal<string | null>(null);
  private readonly lastErrorState = signal<RequestCorrelation | null>(null);

  readonly lastResponseRequestId = this.lastResponseRequestIdState.asReadonly();
  readonly lastError = this.lastErrorState.asReadonly();

  recordResponse(requestId: string | null): void {
    if (requestId) {
      this.lastResponseRequestIdState.set(requestId);
    }
  }

  recordError(requestId: string | null, code: string | null): void {
    if (!requestId) {
      return;
    }

    this.lastResponseRequestIdState.set(requestId);
    this.lastErrorState.set({
      requestId,
      code,
      recordedAt: new Date().toISOString(),
    });
  }
}
