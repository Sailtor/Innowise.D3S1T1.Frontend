import type { ReadingRow } from '../../features/home/latest-values/latest-values';

// Mirrors Innowise.D3S1T1.Notifications' wire shapes (MetricReadingPayload and its three
// variant records, ReadingNotification) - this service has its own small SignalR-only
// contract, separate from the Gateway's GraphQL schema the rest of the app codegens from.
export interface EnergyPayload {
  type: 'energy';
  energy: number;
}

export interface AirQualityPayload {
  type: 'air_quality';
  co2: number;
  pm25: number;
  humidity: number;
}

export interface MotionPayload {
  type: 'motion';
  motionDetected: boolean;
}

export type MetricReadingPayload = EnergyPayload | AirQualityPayload | MotionPayload;

export interface ReadingNotification {
  room: string;
  payload: MetricReadingPayload;
  ingestedAtUtc: string;
}

export function toReadingRow(notification: ReadingNotification): ReadingRow {
  const { room, payload, ingestedAtUtc } = notification;

  switch (payload.type) {
    case 'energy':
      return {
        __typename: 'EnergyReading',
        id: `live:${room}:EnergyReading`,
        room,
        receivedAt: ingestedAtUtc,
        energyAmount: payload.energy,
      };
    case 'air_quality':
      return {
        __typename: 'AirQualityReading',
        id: `live:${room}:AirQualityReading`,
        room,
        receivedAt: ingestedAtUtc,
        co2: payload.co2,
        pm25: payload.pm25,
        humidity: payload.humidity,
      };
    case 'motion':
      return {
        __typename: 'MotionReading',
        id: `live:${room}:MotionReading`,
        room,
        receivedAt: ingestedAtUtc,
        isMotionDetected: payload.motionDetected,
      };
  }
}
