import { AirQualityReading, EnergyReading, MotionReading } from '../../../core/graphql/generated/schema-types';

// Derived from the schema's own generated types (not a specific query's result shape) so
// a field rename in schema.graphql fails this compile instead of silently desyncing.
export type ReadingRow =
  | Required<Pick<EnergyReading, '__typename' | 'energyAmount'>>
  | Required<Pick<AirQualityReading, '__typename' | 'co2' | 'pm25' | 'humidity'>>
  | Required<Pick<MotionReading, '__typename' | 'isMotionDetected'>>;

export const READING_TYPE_LABEL: Record<ReadingRow['__typename'], string> = {
  EnergyReading: 'Energy',
  AirQualityReading: 'Air quality',
  MotionReading: 'Motion',
};

export function typeLabel(reading: ReadingRow): string {
  return READING_TYPE_LABEL[reading.__typename];
}

export function displayValue(reading: ReadingRow): string {
  switch (reading.__typename) {
    case 'EnergyReading':
      return `${reading.energyAmount.toFixed(2)} kWh`;
    case 'AirQualityReading':
      return `CO2 ${reading.co2.toFixed(0)} ppm, PM2.5 ${reading.pm25.toFixed(1)}, humidity ${reading.humidity.toFixed(0)}%`;
    case 'MotionReading':
      return reading.isMotionDetected ? 'Motion detected' : 'No motion';
  }
}
