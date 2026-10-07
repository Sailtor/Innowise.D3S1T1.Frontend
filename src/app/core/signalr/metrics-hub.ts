import { Injectable } from '@angular/core';
import type { HubConnection } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReadingNotification, ThresholdAlertNotification } from './metrics-hub.types';

// Thin wrapper around Innowise.D3S1T1.Notifications' MetricsHub (/hubs/metrics). Connects
// lazily on first joinRoom() so pages that never show live readings (Table, Graphs) never
// open a socket. A reconnect gets a fresh ConnectionId and the hub has no persisted group
// membership, so every previously-joined room is rejoined in onreconnected.
//
// `@microsoft/signalr` is dynamically imported inside ensureConnected() rather than at the
// top of this file - Shell (the eager, always-loaded app root) now injects this service too
// (for alertReceived$), and a static import here would pull the signalr library into the
// initial bundle and bust the 1MB build-budget error (gotcha 17's pattern, applied at the
// service level instead of a lazy route's component level).
@Injectable({ providedIn: 'root' })
export class MetricsHubService {
  private readonly joinedRooms = new Set<string>();
  private connection?: HubConnection;
  private connectionStart?: Promise<void>;

  readonly readingReceived$ = new Subject<ReadingNotification>();
  readonly alertReceived$ = new Subject<ThresholdAlertNotification>();

  async joinRoom(room: string): Promise<void> {
    await this.ensureConnected();
    try {
      await this.connection!.invoke('JoinRoom', room);
      this.joinedRooms.add(room);
    } catch (error) {
      console.warn(`MetricsHubService: failed to join room "${room}"`, error);
    }
  }

  async leaveRoom(room: string): Promise<void> {
    if (!this.connection) {
      return;
    }
    try {
      await this.connection.invoke('LeaveRoom', room);
    } catch (error) {
      console.warn(`MetricsHubService: failed to leave room "${room}"`, error);
    } finally {
      this.joinedRooms.delete(room);
    }
  }

  private ensureConnected(): Promise<void> {
    if (!this.connectionStart) {
      this.connectionStart = this.connect();
    }

    return this.connectionStart;
  }

  private async connect(): Promise<void> {
    const { HubConnectionBuilder } = await import('@microsoft/signalr');

    this.connection = new HubConnectionBuilder()
      .withUrl(environment.notificationHubUrl)
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveReading', (notification: ReadingNotification) =>
      this.readingReceived$.next(notification),
    );

    this.connection.on('ReceiveAlert', (alert: ThresholdAlertNotification) =>
      this.alertReceived$.next(alert),
    );

    this.connection.onreconnected(async () => {
      for (const room of this.joinedRooms) {
        try {
          await this.connection!.invoke('JoinRoom', room);
        } catch (error) {
          console.warn(`MetricsHubService: failed to rejoin room "${room}" after reconnect`, error);
        }
      }
    });

    await this.connection.start();
  }
}
