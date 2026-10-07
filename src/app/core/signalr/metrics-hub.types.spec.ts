import { formatAlertMessage, toReadingRow } from './metrics-hub.types';

describe('toReadingRow', () => {
  it('maps an energy payload', () => {
    const row = toReadingRow({
      room: 'kitchen',
      payload: { type: 'energy', energy: 12.5 },
      ingestedAtUtc: '2026-01-01T00:00:00Z',
    });

    expect(row).toEqual({
      __typename: 'EnergyReading',
      id: 'live:kitchen:EnergyReading',
      room: 'kitchen',
      receivedAt: '2026-01-01T00:00:00Z',
      energyAmount: 12.5,
    });
  });

  it('maps an air_quality payload, passing co2/pm25/humidity through unrenamed', () => {
    const row = toReadingRow({
      room: 'office',
      payload: { type: 'air_quality', co2: 850, pm25: 12.3, humidity: 41 },
      ingestedAtUtc: '2026-01-01T00:00:00Z',
    });

    expect(row).toEqual({
      __typename: 'AirQualityReading',
      id: 'live:office:AirQualityReading',
      room: 'office',
      receivedAt: '2026-01-01T00:00:00Z',
      co2: 850,
      pm25: 12.3,
      humidity: 41,
    });
  });

  it('maps a motion payload, renaming motionDetected to isMotionDetected', () => {
    const row = toReadingRow({
      room: 'hallway',
      payload: { type: 'motion', motionDetected: true },
      ingestedAtUtc: '2026-01-01T00:00:00Z',
    });

    expect(row).toEqual({
      __typename: 'MotionReading',
      id: 'live:hallway:MotionReading',
      room: 'hallway',
      receivedAt: '2026-01-01T00:00:00Z',
      isMotionDetected: true,
    });
  });
});

describe('formatAlertMessage', () => {
  it('formats a CO2 threshold alert, rounded to a whole ppm like reading-display.ts', () => {
    const message = formatAlertMessage({
      room: 'office',
      readingType: 'AirQuality',
      rule: 'AirQuality.Co2.ExceedsThreshold',
      value: 1200.6,
      threshold: 1000.4,
      ingestedAtUtc: '2026-01-01T00:00:00Z',
    });

    expect(message).toBe('office: CO2 1201 ppm exceeds threshold 1000');
  });

  it('formats a PM2.5 threshold alert, rounded to one decimal with its µg/m³ unit', () => {
    const message = formatAlertMessage({
      room: 'office',
      readingType: 'AirQuality',
      rule: 'AirQuality.Pm25.ExceedsThreshold',
      value: 45.56,
      threshold: 35.04,
      ingestedAtUtc: '2026-01-01T00:00:00Z',
    });

    expect(message).toBe('office: PM2.5 45.6 µg/m³ exceeds threshold 35.0 µg/m³');
  });

  it('formats a motion-detected alert without restating the zero threshold', () => {
    const message = formatAlertMessage({
      room: 'hallway',
      readingType: 'Motion',
      rule: 'Motion.Detected',
      value: 1,
      threshold: 0,
      ingestedAtUtc: '2026-01-01T00:00:00Z',
    });

    expect(message).toBe('hallway: motion detected');
  });

  it('falls back to a generic message for an unrecognised rule', () => {
    const message = formatAlertMessage({
      room: 'kitchen',
      readingType: 'Energy',
      rule: 'Energy.Usage.ExceedsThreshold',
      value: 500,
      threshold: 400,
      ingestedAtUtc: '2026-01-01T00:00:00Z',
    });

    expect(message).toBe(
      'kitchen: Energy alert (Energy.Usage.ExceedsThreshold) — value 500, threshold 400',
    );
  });
});
