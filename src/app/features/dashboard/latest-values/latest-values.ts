import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LatestValuesGQL, LatestValuesQuery } from '../../../core/graphql/generated/graphql';

type ReadingRow = LatestValuesQuery['latestReadings'][number];

const READING_TYPE_LABEL: Record<ReadingRow['__typename'], string> = {
  EnergyReading: 'Energy',
  AirQualityReading: 'Air quality',
  MotionReading: 'Motion',
};

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

  protected readonly readings = computed<ReadingRow[]>(() => this.completeData()?.latestReadings ?? []);
  protected readonly rooms = computed(() => this.completeData()?.rooms ?? []);

  protected typeLabel(reading: ReadingRow): string {
    return READING_TYPE_LABEL[reading.__typename];
  }

  protected displayValue(reading: ReadingRow): string {
    switch (reading.__typename) {
      case 'EnergyReading':
        return `${reading.energyAmount.toFixed(2)} kWh`;
      case 'AirQualityReading':
        return `CO2 ${reading.co2.toFixed(0)} ppm, PM2.5 ${reading.pm25.toFixed(1)}, humidity ${reading.humidity.toFixed(0)}%`;
      case 'MotionReading':
        return reading.isMotionDetected ? 'Motion detected' : 'No motion';
    }
  }
}
