import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DashboardFiltersRoomsGQL } from '../graphql/generated/graphql';
import { MetricReadingType } from '../graphql/generated/schema-types';

export interface RangePreset {
  label: string;
  durationMs: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const RANGE_PRESETS: RangePreset[] = [
  { label: 'Last hour', durationMs: HOUR_MS },
  { label: 'Last 24 hours', durationMs: DAY_MS },
  { label: 'Last 7 days', durationMs: 7 * DAY_MS },
  { label: 'Last 30 days', durationMs: 30 * DAY_MS },
];

export function presetToRange(durationMs: number, now: Date = new Date()): { from: string; to: string } {
  return {
    from: new Date(now.getTime() - durationMs).toISOString(),
    to: now.toISOString(),
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardFiltersService {
  private readonly roomsGQL = inject(DashboardFiltersRoomsGQL);
  private readonly roomsResult = toSignal(this.roomsGQL.watch().valueChanges, { initialValue: undefined });

  readonly roomOptions = computed(() => {
    const current = this.roomsResult();
    return current?.dataState === 'complete' ? current.data.availableRooms : [];
  });

  readonly roomsLoading = computed(() => this.roomsResult()?.loading ?? true);
  readonly roomsError = computed(() => this.roomsResult()?.error);

  readonly rooms = signal<string[]>([]);
  readonly type = signal<MetricReadingType | null>(null);
  readonly rangeDurationMs = signal<number>(RANGE_PRESETS[1].durationMs);

  setRooms(rooms: string[]): void {
    this.rooms.set(rooms);
  }

  setType(type: MetricReadingType | null): void {
    this.type.set(type);
  }

  setRangeDurationMs(durationMs: number): void {
    this.rangeDurationMs.set(durationMs);
  }
}
