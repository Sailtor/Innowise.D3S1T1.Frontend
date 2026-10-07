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

// Mirrors Notifications.Application.ThresholdAlert - pushed as event "ReceiveAlert" on the
// same hub/groups as ReceiveReading. `rule` is an open string, not a closed enum: the
// evaluator can add rules server-side without a frontend change, so formatAlertMessage
// below always has a generic fallback rather than assuming only the known rules can occur.
export interface ThresholdAlertNotification {
  room: string;
  readingType: string;
  rule: string;
  value: number;
  threshold: number;
  ingestedAtUtc: string;
}

// CSS can't import a TS identifier - styles.sass's `.alert-snackbar` rule must keep this
// string in sync by hand.
export const ALERT_SNACKBAR_PANEL_CLASS = 'alert-snackbar';

export function formatAlertMessage(alert: ThresholdAlertNotification): string {
  const { room, readingType, rule, value, threshold } = alert;

  switch (rule) {
    case 'AirQuality.Co2.ExceedsThreshold':
      // Same precision convention as reading-display.ts's displayValue.
      return `${room}: CO2 ${value.toFixed(0)} ppm exceeds threshold ${threshold.toFixed(0)}`;
    case 'AirQuality.Pm25.ExceedsThreshold':
      return `${room}: PM2.5 ${value.toFixed(1)} µg/m³ exceeds threshold ${threshold.toFixed(1)} µg/m³`;
    case 'Motion.Detected':
      return `${room}: motion detected`;
    default:
      return `${room}: ${readingType} alert (${rule}) — value ${value}, threshold ${threshold}`;
  }
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
