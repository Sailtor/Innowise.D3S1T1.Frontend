import { Component, OnDestroy, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { scan } from 'rxjs';
import { LatestValuesGQL, LatestValuesQuery } from '../../../core/graphql/generated/graphql';
import { displayValue, typeLabel } from '../../../core/reading-display';
import { MetricsHubService } from '../../../core/signalr/metrics-hub';
import { toReadingRow } from '../../../core/signalr/metrics-hub.types';

export type ReadingRow = LatestValuesQuery['latestReadings'][number];

function rowKey(room: string, typename: ReadingRow['__typename']): string {
  return `${room}:${typename}`;
}

@Component({
  selector: 'app-latest-values',
  templateUrl: './latest-values.html',
  styleUrl: './latest-values.sass',
})
export class LatestValues implements OnDestroy {
  private readonly latestValuesGQL = inject(LatestValuesGQL);
  private readonly metricsHub = inject(MetricsHubService);

  // Rooms this instance has asked the hub to join - left on destroy, since the hub has no
  // other signal that this component stopped caring about them.
  private readonly joined = new Set<string>();

  private readonly result = toSignal(this.latestValuesGQL.watch().valueChanges, {
    initialValue: undefined,
  });

  protected readonly loading = computed(() => this.result()?.loading ?? true);
  protected readonly error = computed(() => this.result()?.error);

  // Apollo's result is a union keyed on `dataState`; only the "complete" branch
  // guarantees `data` matches the query shape (other states carry undefined or a
  // partial object). Narrow on it instead of trusting `data` directly.
  private readonly completeData = computed(() => {
    const current = this.result();
    return current?.dataState === 'complete' ? current.data : undefined;
  });

  protected readonly rooms = computed(() => this.completeData()?.rooms ?? []);

  // Live pushes keyed by room+type, newest wins. A room/type not in the base GraphQL list
  // yet shows up as a new row; one already there gets its value replaced in place.
  private readonly liveByKey = toSignal(
    this.metricsHub.readingReceived$.pipe(
      scan((map, notification) => {
        const row = toReadingRow(notification);
        return new Map(map).set(rowKey(row.room, row.__typename), row);
      }, new Map<string, ReadingRow>()),
    ),
    { initialValue: new Map<string, ReadingRow>() },
  );

  protected readonly readings = computed<ReadingRow[]>(() => {
    const merged = new Map<string, ReadingRow>(
      (this.completeData()?.latestReadings ?? []).map((row) => [
        rowKey(row.room, row.__typename),
        row,
      ]),
    );
    for (const [key, row] of this.liveByKey()) {
      merged.set(key, row);
    }
    return [...merged.values()];
  });

  constructor() {
    // The room list only grows (or stays the same) within a page load - a room that starts
    // reporting for the first time after load shows up live only after the next reload,
    // which also re-runs the latestReadings query and picks it up then.
    effect(() => {
      for (const { room } of this.rooms()) {
        if (!this.joined.has(room)) {
          this.joined.add(room);
          void this.metricsHub.joinRoom(room);
        }
      }
    });
  }

  ngOnDestroy(): void {
    for (const room of this.joined) {
      void this.metricsHub.leaveRoom(room);
    }
  }

  protected typeLabel(reading: ReadingRow): string {
    return typeLabel(reading);
  }

  protected displayValue(reading: ReadingRow): string {
    return displayValue(reading);
  }
}
