import { AggregationField } from '../../core/graphql/generated/schema-types';

export const AGGREGATION_FIELD_LABEL: Record<AggregationField, string> = {
  [AggregationField.EnergyAmount]: 'Energy (kWh)',
  [AggregationField.Co2]: 'CO2 (ppm)',
  [AggregationField.Pm25]: 'PM2.5',
  [AggregationField.Humidity]: 'Humidity (%)',
  [AggregationField.MotionDetected]: 'Motion detected (%)',
};

// MOTION_DETECTED's average is the mean of a 0/1 boolean across the bucket - scale it to
// a percentage of time motion was detected rather than a raw fraction. This is a unit
// conversion the chart itself needs (not just display rounding), so it's kept separate
// from `formatAggregationValue`'s display-string truncation below.
export function toChartValue(field: AggregationField, value: number): number {
  return field === AggregationField.MotionDetected ? value * 100 : value;
}

export function formatAggregationValue(field: AggregationField, value: number): string {
  return field === AggregationField.MotionDetected ? value.toFixed(0) : value.toFixed(2);
}

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
