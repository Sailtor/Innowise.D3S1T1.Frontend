import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LatestValuesGQL, LatestValuesQuery } from '../../../core/graphql/generated/graphql';
import { displayValue, typeLabel } from '../../../core/reading-display';

type ReadingRow = LatestValuesQuery['latestReadings'][number];

@Component({
  selector: 'app-latest-values',
  templateUrl: './latest-values.html',
  styleUrl: './latest-values.sass',
})
export class LatestValues {
  private readonly latestValuesGQL = inject(LatestValuesGQL);

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

  protected readonly readings = computed<ReadingRow[]>(
    () => this.completeData()?.latestReadings ?? [],
  );
  protected readonly rooms = computed(() => this.completeData()?.rooms ?? []);

  protected typeLabel(reading: ReadingRow): string {
    return typeLabel(reading);
  }

  protected displayValue(reading: ReadingRow): string {
    return displayValue(reading);
  }
}
