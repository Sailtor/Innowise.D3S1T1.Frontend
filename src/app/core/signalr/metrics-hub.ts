import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReadingNotification } from './metrics-hub.types';

// Thin wrapper around Innowise.D3S1T1.Notifications' MetricsHub (/hubs/metrics). Connects
// lazily on first joinRoom() so pages that never show live readings (Table, Graphs) never
// open a socket. A reconnect gets a fresh ConnectionId and the hub has no persisted group
// membership, so every previously-joined room is rejoined in onreconnected.
@Injectable({ providedIn: 'root' })
export class MetricsHubService {
  private readonly joinedRooms = new Set<string>();
  private connection?: HubConnection;
  private connectionStart?: Promise<void>;

  readonly readingReceived$ = new Subject<ReadingNotification>();

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
    if (!this.connection) {
      this.connection = new HubConnectionBuilder()
        .withUrl(environment.notificationHubUrl)
        .withAutomaticReconnect()
        .build();

      this.connection.on('ReceiveReading', (notification: ReadingNotification) =>
        this.readingReceived$.next(notification),
      );

      this.connection.onreconnected(async () => {
        for (const room of this.joinedRooms) {
          try {
            await this.connection!.invoke('JoinRoom', room);
          } catch (error) {
            console.warn(
              `MetricsHubService: failed to rejoin room "${room}" after reconnect`,
              error,
            );
          }
        }
      });

      this.connectionStart = this.connection.start();
    }

    return this.connectionStart!;
  }
}
