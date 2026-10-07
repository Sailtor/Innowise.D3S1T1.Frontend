import type { HubConnection } from '@microsoft/signalr';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { MetricsHubService } from './metrics-hub';

describe('MetricsHubService', () => {
  let fakeConnection: {
    start: jasmine.Spy;
    invoke: jasmine.Spy;
    on: jasmine.Spy;
    onreconnected: jasmine.Spy;
  };

  beforeEach(() => {
    fakeConnection = {
      start: jasmine.createSpy('start').and.resolveTo(undefined),
      invoke: jasmine.createSpy('invoke').and.resolveTo(undefined),
      on: jasmine.createSpy('on'),
      onreconnected: jasmine.createSpy('onreconnected'),
    };

    spyOn(HubConnectionBuilder.prototype, 'withUrl').and.callFake(function (
      this: HubConnectionBuilder,
    ) {
      return this;
    });
    spyOn(HubConnectionBuilder.prototype, 'withAutomaticReconnect').and.callFake(function (
      this: HubConnectionBuilder,
    ) {
      return this;
    });
    // fakeConnection only implements the subset of HubConnection this service calls; casting
    // past that (rather than stubbing the rest of the real class) keeps the fake minimal.
    spyOn(HubConnectionBuilder.prototype, 'build').and.returnValue(
      fakeConnection as unknown as HubConnection,
    );
  });

  it('connects once on the first joinRoom() and reuses the connection afterwards', async () => {
    const service = new MetricsHubService();

    await service.joinRoom('kitchen');
    await service.joinRoom('hallway');

    expect(fakeConnection.start).toHaveBeenCalledTimes(1);
    expect(fakeConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'kitchen');
    expect(fakeConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'hallway');
  });

  it('invokes LeaveRoom for an already-joined room', async () => {
    const service = new MetricsHubService();
    await service.joinRoom('kitchen');

    await service.leaveRoom('kitchen');

    expect(fakeConnection.invoke).toHaveBeenCalledWith('LeaveRoom', 'kitchen');
  });

  it('rejoins every still-joined room when the connection reconnects', async () => {
    const service = new MetricsHubService();
    await service.joinRoom('kitchen');
    await service.joinRoom('hallway');
    fakeConnection.invoke.calls.reset();

    const onReconnected = fakeConnection.onreconnected.calls.mostRecent().args[0];
    await onReconnected();

    expect(fakeConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'kitchen');
    expect(fakeConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'hallway');
  });

  it('warns and does not track the room when JoinRoom invoke rejects', async () => {
    fakeConnection.invoke.and.rejectWith(new Error('hub unreachable'));
    spyOn(console, 'warn');
    const service = new MetricsHubService();

    await service.joinRoom('kitchen');

    expect(console.warn).toHaveBeenCalled();

    // Not tracked as joined, so a later reconnect has nothing to rejoin for it.
    fakeConnection.invoke.calls.reset();
    const onReconnected = fakeConnection.onreconnected.calls.mostRecent().args[0];
    await onReconnected();
    expect(fakeConnection.invoke).not.toHaveBeenCalled();
  });

  it('emits on alertReceived$ when the hub pushes ReceiveAlert', async () => {
    const service = new MetricsHubService();
    await service.joinRoom('kitchen');

    const onReceiveAlert = fakeConnection.on.calls
      .all()
      .map((call) => call.args)
      .find(([event]) => event === 'ReceiveAlert')?.[1];
    expect(onReceiveAlert).toBeDefined();

    const alerts: unknown[] = [];
    service.alertReceived$.subscribe((alert) => alerts.push(alert));

    const alert = {
      room: 'kitchen',
      readingType: 'AirQuality',
      rule: 'AirQuality.Co2.ExceedsThreshold',
      value: 1200,
      threshold: 1000,
      ingestedAtUtc: '2026-01-01T00:00:00Z',
    };
    onReceiveAlert(alert);

    expect(alerts).toEqual([alert]);
  });

  it('warns but keeps rejoining the remaining rooms when one rejoin fails after reconnect', async () => {
    const service = new MetricsHubService();
    await service.joinRoom('kitchen');
    await service.joinRoom('hallway');
    fakeConnection.invoke.calls.reset();
    fakeConnection.invoke.and.callFake((_method: string, room: string) =>
      room === 'kitchen' ? Promise.reject(new Error('hub unreachable')) : Promise.resolve(),
    );
    spyOn(console, 'warn');

    const onReconnected = fakeConnection.onreconnected.calls.mostRecent().args[0];
    await onReconnected();

    expect(console.warn).toHaveBeenCalled();
    expect(fakeConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'hallway');
  });
});
