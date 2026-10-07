import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { Subject } from 'rxjs';
import { LatestValues } from './latest-values';
import { LatestValuesDocument, LatestValuesQuery } from '../../../core/graphql/generated/graphql';
import { MetricsHubService } from '../../../core/signalr/metrics-hub';
import { ReadingNotification } from '../../../core/signalr/metrics-hub.types';

describe('LatestValues', () => {
  let controller: ApolloTestingController;
  let readingReceived$: Subject<ReadingNotification>;
  let fakeHub: {
    joinRoom: jasmine.Spy;
    leaveRoom: jasmine.Spy;
    readingReceived$: Subject<ReadingNotification>;
  };

  beforeEach(async () => {
    readingReceived$ = new Subject<ReadingNotification>();
    fakeHub = {
      joinRoom: jasmine.createSpy('joinRoom').and.resolveTo(undefined),
      leaveRoom: jasmine.createSpy('leaveRoom').and.resolveTo(undefined),
      readingReceived$,
    };

    await TestBed.configureTestingModule({
      imports: [LatestValues, ApolloTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MetricsHubService, useValue: fakeHub },
      ],
    }).compileComponents();

    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  function flush(data: LatestValuesQuery): void {
    controller.expectOne(LatestValuesDocument).flushData(data);
  }

  function visibleRows(fixture: { nativeElement: HTMLElement }): NodeListOf<HTMLLIElement> {
    return fixture.nativeElement.querySelectorAll('.reading-row:not(.reading-row--empty)');
  }

  it('renders the base GraphQL rows unchanged when no live events arrive', () => {
    const fixture = TestBed.createComponent(LatestValues);
    fixture.detectChanges();

    flush({
      latestReadings: [
        {
          __typename: 'EnergyReading',
          id: '1',
          room: 'kitchen',
          receivedAt: '2026-01-01T00:00:00Z',
          energyAmount: 3,
        },
      ],
      rooms: [{ room: 'kitchen', totalReadings: 1 }],
    });
    fixture.detectChanges();

    const rows = visibleRows(fixture);
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('kitchen');
    expect(rows[0].textContent).toContain('3.00');
  });

  it('joins every room reported by the query result', () => {
    const fixture = TestBed.createComponent(LatestValues);
    fixture.detectChanges();

    flush({
      latestReadings: [],
      rooms: [
        { room: 'kitchen', totalReadings: 0 },
        { room: 'hallway', totalReadings: 0 },
      ],
    });
    fixture.detectChanges();

    expect(fakeHub.joinRoom).toHaveBeenCalledWith('kitchen');
    expect(fakeHub.joinRoom).toHaveBeenCalledWith('hallway');
  });

  it('updates an existing room/type row in place on a live push', () => {
    const fixture = TestBed.createComponent(LatestValues);
    fixture.detectChanges();

    flush({
      latestReadings: [
        {
          __typename: 'EnergyReading',
          id: '1',
          room: 'kitchen',
          receivedAt: '2026-01-01T00:00:00Z',
          energyAmount: 3,
        },
      ],
      rooms: [{ room: 'kitchen', totalReadings: 1 }],
    });
    fixture.detectChanges();

    readingReceived$.next({
      room: 'kitchen',
      payload: { type: 'energy', energy: 9 },
      ingestedAtUtc: '2026-01-01T00:05:00Z',
    });
    fixture.detectChanges();

    const rows = visibleRows(fixture);
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('9.00');
  });

  it('appends a new row for a room/type not present in the base query result', () => {
    const fixture = TestBed.createComponent(LatestValues);
    fixture.detectChanges();

    flush({
      latestReadings: [],
      rooms: [{ room: 'kitchen', totalReadings: 0 }],
    });
    fixture.detectChanges();

    readingReceived$.next({
      room: 'kitchen',
      payload: { type: 'motion', motionDetected: true },
      ingestedAtUtc: '2026-01-01T00:05:00Z',
    });
    fixture.detectChanges();

    const rows = visibleRows(fixture);
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Motion detected');
  });
});
