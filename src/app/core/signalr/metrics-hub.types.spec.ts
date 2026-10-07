import { toReadingRow } from './metrics-hub.types';

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
