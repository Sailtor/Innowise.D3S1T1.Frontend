import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { Sort } from '@angular/material/sort';
import { ReadingsTable } from './readings-table';
import {
  ReadingsTableDocument,
  DashboardFiltersRoomsDocument,
} from '../../../core/graphql/generated/graphql';
import { DashboardFiltersService } from '../../../core/filters/dashboard-filters';
import { MetricReadingType } from '../../../core/graphql/generated/schema-types';

// Pagination/sort/filter handlers and derived signals are `protected` (template-only
// by design) - tests reach them the conventional Angular way, through the component
// instance cast rather than widening the component's public API for tests alone.
function asTestable(component: ReadingsTable) {
  return component as unknown as {
    rows: () => { room: string }[];
    totalCount: () => number;
    showInitialLoading: () => boolean;
    hasData: () => boolean;
    error: () => unknown;
    onPage: (event: { pageIndex: number; pageSize: number; length: number }) => void;
    onSort: (sort: Sort) => void;
  };
}

function flushEmptyPage(controller: ApolloTestingController): void {
  controller.expectOne(ReadingsTableDocument).flushData({
    metricReadings: {
      totalCount: 0,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      items: [],
    },
  });
}

function flushRooms(controller: ApolloTestingController, rooms: string[] = []): void {
  controller.expectOne(DashboardFiltersRoomsDocument).flushData({ availableRooms: rooms });
}

describe('ReadingsTable', () => {
  let controller: ApolloTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadingsTable, ApolloTestingModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('renders rows and total count from metricReadings', async () => {
    const fixture = TestBed.createComponent(ReadingsTable);
    fixture.detectChanges();

    flushRooms(controller, ['Kitchen']);
    controller.expectOne(ReadingsTableDocument).flushData({
      metricReadings: {
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        items: [
          {
            __typename: 'EnergyReading',
            id: '1',
            room: 'Kitchen',
            type: 'ENERGY',
            receivedAt: '2026-01-01T00:00:00Z',
            energyAmount: 4.2,
          },
        ],
      },
    });
    await fixture.whenStable();

    const component = asTestable(fixture.componentInstance);
    const rows = component.rows();
    expect(rows.length).toBe(1);
    expect(rows[0].room).toBe('Kitchen');
    expect(component.totalCount()).toBe(1);

    const renderedRows = (fixture.nativeElement as HTMLElement).querySelectorAll('tr.reading-row');
    expect(renderedRows.length).toBe(1);

    const headerCells = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'th[mat-header-cell]',
    );
    expect(headerCells.length).toBe(4);
    headerCells.forEach((cell) => expect(cell.getAttribute('scope')).toBe('col'));

    // A narrow viewport must scroll this wrapper, not the whole page (D-6).
    const scrollWrapper = (fixture.nativeElement as HTMLElement).querySelector(
      '.table-scroll table.readings-mat-table',
    );
    expect(scrollWrapper).toBeTruthy();
  });

  it('requests the next page with skip advanced by the page size', async () => {
    const fixture = TestBed.createComponent(ReadingsTable);
    fixture.detectChanges();

    flushRooms(controller);
    controller.expectOne(ReadingsTableDocument).flushData({
      metricReadings: {
        totalCount: 50,
        pageInfo: { hasNextPage: true, hasPreviousPage: false },
        items: [],
      },
    });
    await fixture.whenStable();

    asTestable(fixture.componentInstance).onPage({ pageIndex: 1, pageSize: 20, length: 50 });
    await fixture.whenStable();

    const nextRequest = controller.expectOne(ReadingsTableDocument);
    expect(nextRequest.operation.variables['skip']).toBe(20);
    nextRequest.flushData({
      metricReadings: {
        totalCount: 50,
        pageInfo: { hasNextPage: true, hasPreviousPage: true },
        items: [],
      },
    });
    await fixture.whenStable();
  });

  it('keeps the previous rows visible while a filter change is in flight', async () => {
    const fixture = TestBed.createComponent(ReadingsTable);
    fixture.detectChanges();

    flushRooms(controller, ['Kitchen', 'Lobby']);
    controller.expectOne(ReadingsTableDocument).flushData({
      metricReadings: {
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        items: [
          {
            __typename: 'EnergyReading',
            id: '1',
            room: 'Kitchen',
            type: 'ENERGY',
            receivedAt: '2026-01-01T00:00:00Z',
            energyAmount: 4.2,
          },
        ],
      },
    });
    await fixture.whenStable();

    const component = asTestable(fixture.componentInstance);
    TestBed.inject(DashboardFiltersService).setRooms(['Lobby']);
    await fixture.whenStable();

    // New watch query is in flight (filter changed); rows from the previous
    // complete response must still be showing, not an empty/skeleton flash.
    expect(component.rows().length).toBe(1);
    expect(component.showInitialLoading()).toBeFalse();

    const filteredRequest = controller.expectOne(ReadingsTableDocument);
    const where = filteredRequest.operation.variables['where'];
    expect(where).toEqual(
      jasmine.objectContaining({
        room: { in: ['Lobby'] },
        type: undefined,
        receivedAt: { gte: jasmine.any(String), lte: jasmine.any(String) },
      }),
    );
    filteredRequest.flushData({
      metricReadings: {
        totalCount: 0,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        items: [],
      },
    });
    await fixture.whenStable();

    expect(component.rows().length).toBe(0);
  });

  it('refetches with the type filter when the shared type filter changes', async () => {
    const fixture = TestBed.createComponent(ReadingsTable);
    fixture.detectChanges();

    flushRooms(controller);
    flushEmptyPage(controller);
    await fixture.whenStable();

    TestBed.inject(DashboardFiltersService).setType(MetricReadingType.Energy);
    await fixture.whenStable();

    const request = controller.expectOne(ReadingsTableDocument);
    expect(request.operation.variables['where'].type).toEqual({ eq: 'ENERGY' });
    request.flushData({
      metricReadings: {
        totalCount: 0,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        items: [],
      },
    });
    await fixture.whenStable();
  });

  it('requests sorted results and resets to page 1 when a sort is applied', async () => {
    const fixture = TestBed.createComponent(ReadingsTable);
    fixture.detectChanges();

    flushRooms(controller);
    controller.expectOne(ReadingsTableDocument).flushData({
      metricReadings: {
        totalCount: 50,
        pageInfo: { hasNextPage: true, hasPreviousPage: false },
        items: [],
      },
    });
    await fixture.whenStable();

    // Move off page 1 first, so sorting resetting it back to page 1 is a real assertion.
    asTestable(fixture.componentInstance).onPage({ pageIndex: 1, pageSize: 20, length: 50 });
    await fixture.whenStable();
    controller.expectOne(ReadingsTableDocument).flushData({
      metricReadings: {
        totalCount: 50,
        pageInfo: { hasNextPage: true, hasPreviousPage: true },
        items: [],
      },
    });
    await fixture.whenStable();

    asTestable(fixture.componentInstance).onSort({ active: 'receivedAt', direction: 'desc' });
    await fixture.whenStable();

    const request = controller.expectOne(ReadingsTableDocument);
    expect(request.operation.variables['order']).toEqual([{ receivedAt: 'DESC' }]);
    expect(request.operation.variables['skip']).toBe(0);
    request.flushData({
      metricReadings: {
        totalCount: 50,
        pageInfo: { hasNextPage: true, hasPreviousPage: false },
        items: [],
      },
    });
    await fixture.whenStable();
  });

  it('clears the sort when the sort direction cycles back to none', async () => {
    const fixture = TestBed.createComponent(ReadingsTable);
    fixture.detectChanges();

    flushRooms(controller);
    flushEmptyPage(controller);
    await fixture.whenStable();

    asTestable(fixture.componentInstance).onSort({ active: 'room', direction: 'asc' });
    await fixture.whenStable();
    flushEmptyPage(controller);
    await fixture.whenStable();

    asTestable(fixture.componentInstance).onSort({ active: 'room', direction: '' });
    await fixture.whenStable();

    const request = controller.expectOne(ReadingsTableDocument);
    expect(request.operation.variables['order']).toEqual([]);
    request.flushData({
      metricReadings: {
        totalCount: 0,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        items: [],
      },
    });
    await fixture.whenStable();
  });

  it('keeps previously loaded rows visible when a later refetch errors', async () => {
    const fixture = TestBed.createComponent(ReadingsTable);
    fixture.detectChanges();

    flushRooms(controller);
    controller.expectOne(ReadingsTableDocument).flushData({
      metricReadings: {
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        items: [
          {
            __typename: 'EnergyReading',
            id: '1',
            room: 'Kitchen',
            type: 'ENERGY',
            receivedAt: '2026-01-01T00:00:00Z',
            energyAmount: 4.2,
          },
        ],
      },
    });
    await fixture.whenStable();

    const component = asTestable(fixture.componentInstance);
    expect(component.hasData()).toBeTrue();

    component.onPage({ pageIndex: 1, pageSize: 20, length: 1 });
    await fixture.whenStable();

    controller.expectOne(ReadingsTableDocument).networkError(new Error('Gateway unreachable'));
    await fixture.whenStable();

    // The refetch failed, but page 1's data must still be on screen - an error must
    // never wipe rows the user already had (D-3's intent extends to error states too).
    expect(component.hasData()).toBeTrue();
    expect(component.rows().length).toBe(1);
    expect(component.error()).toBeTruthy();
  });
});
