import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { ChartConfiguration } from 'chart.js';
import { AggregationCharts } from './aggregation-charts';
import { AggregationChartsDocument, DashboardFiltersRoomsDocument } from '../../../core/graphql/generated/graphql';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DashboardFiltersService } from '../../../core/filters/dashboard-filters';

// `field`/`chartData` etc. are `protected` (template-only by design, matching
// ReadingsTable's own test convention) - tests reach them through an instance cast.
function asTestable(component: AggregationCharts) {
  return component as unknown as {
    chartData: () => ChartConfiguration<'line'>['data'];
    showInitialLoading: () => boolean;
    hasData: () => boolean;
    error: () => unknown;
    onFieldChange: (field: string) => void;
    onGroupByRoomChange: (event: MatSlideToggleChange) => void;
  };
}

function flushRooms(controller: ApolloTestingController, rooms: string[] = []): void {
  controller.expectOne(DashboardFiltersRoomsDocument).flushData({ availableRooms: rooms });
}

describe('AggregationCharts', () => {
  let controller: ApolloTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AggregationCharts, ApolloTestingModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('builds one dataset when not grouped by room', async () => {
    const fixture = TestBed.createComponent(AggregationCharts);
    fixture.detectChanges();

    flushRooms(controller, ['Kitchen']);
    controller.expectOne(AggregationChartsDocument).flushData({
      metricAggregation: [
        { room: null, bucketStart: '2026-01-01T00:00:00.000Z', stats: { count: 2, min: 1, max: 3, average: 2, sum: 4 } },
        { room: null, bucketStart: '2026-01-01T01:00:00.000Z', stats: { count: 2, min: 2, max: 4, average: 3, sum: 6 } },
      ],
    });
    await fixture.whenStable();

    const component = asTestable(fixture.componentInstance);
    const data = component.chartData();
    expect(data.labels?.length).toBe(2);
    expect(data.datasets.length).toBe(1);
    expect(data.datasets[0].data).toEqual([2, 3]);
    expect(component.hasData()).toBeTrue();
  });

  it('builds one dataset per room when grouped by room', async () => {
    const fixture = TestBed.createComponent(AggregationCharts);
    fixture.detectChanges();

    flushRooms(controller, ['Kitchen', 'Lobby']);
    controller.expectOne(AggregationChartsDocument).flushData({ metricAggregation: [] });
    await fixture.whenStable();

    asTestable(fixture.componentInstance).onGroupByRoomChange({ checked: true } as MatSlideToggleChange);
    await fixture.whenStable();

    const request = controller.expectOne(AggregationChartsDocument);
    expect(request.operation.variables['input'].groupByRoom).toBeTrue();
    request.flushData({
      metricAggregation: [
        { room: 'Kitchen', bucketStart: '2026-01-01T00:00:00.000Z', stats: { count: 1, min: 1, max: 1, average: 1, sum: 1 } },
        { room: 'Lobby', bucketStart: '2026-01-01T00:00:00.000Z', stats: { count: 1, min: 2, max: 2, average: 2, sum: 2 } },
      ],
    });
    await fixture.whenStable();

    const data = asTestable(fixture.componentInstance).chartData();
    expect(data.datasets.length).toBe(2);
    expect(data.datasets.map((d) => d.label).sort()).toEqual(['Kitchen', 'Lobby']);
  });

  it('refetches with the new field when the field control changes', async () => {
    const fixture = TestBed.createComponent(AggregationCharts);
    fixture.detectChanges();

    flushRooms(controller);
    controller.expectOne(AggregationChartsDocument).flushData({ metricAggregation: [] });
    await fixture.whenStable();

    asTestable(fixture.componentInstance).onFieldChange('CO2');
    await fixture.whenStable();

    const request = controller.expectOne(AggregationChartsDocument);
    expect(request.operation.variables['input'].field).toBe('CO2');
    request.flushData({ metricAggregation: [] });
    await fixture.whenStable();
  });

  it('refetches with the rooms array when the shared room filter changes', async () => {
    const fixture = TestBed.createComponent(AggregationCharts);
    fixture.detectChanges();

    flushRooms(controller, ['Kitchen', 'Lobby']);
    controller.expectOne(AggregationChartsDocument).flushData({ metricAggregation: [] });
    await fixture.whenStable();

    TestBed.inject(DashboardFiltersService).setRooms(['Lobby']);
    await fixture.whenStable();

    const request = controller.expectOne(AggregationChartsDocument);
    expect(request.operation.variables['input'].rooms).toEqual(['Lobby']);
    request.flushData({ metricAggregation: [] });
    await fixture.whenStable();
  });

  it('shows the empty state when no readings exist in the selected range', async () => {
    const fixture = TestBed.createComponent(AggregationCharts);
    fixture.detectChanges();

    flushRooms(controller);
    controller.expectOne(AggregationChartsDocument).flushData({ metricAggregation: [] });
    await fixture.whenStable();

    const component = asTestable(fixture.componentInstance);
    expect(component.hasData()).toBeFalse();
    expect(component.showInitialLoading()).toBeFalse();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
  });

  it('shows the error banner when the query fails', async () => {
    const fixture = TestBed.createComponent(AggregationCharts);
    fixture.detectChanges();

    flushRooms(controller);
    controller.expectOne(AggregationChartsDocument).networkError(new Error('Gateway unreachable'));
    await fixture.whenStable();

    const component = asTestable(fixture.componentInstance);
    expect(component.error()).toBeTruthy();
    expect(component.showInitialLoading()).toBeFalse();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-banner[role="alert"]')).toBeTruthy();
  });
});
