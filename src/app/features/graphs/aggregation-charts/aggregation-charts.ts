import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import {
  CategoryScale,
  ChartConfiguration,
  Colors,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AggregationChartsGQL, AggregationChartsQuery } from '../../../core/graphql/generated/graphql';
import {
  AggregationField,
  MetricAggregationInput,
  TimeInterval,
} from '../../../core/graphql/generated/schema-types';
import { AGGREGATION_FIELD_LABEL, toChartValue } from '../aggregation-display';
import { DashboardFiltersService, presetToRange } from '../../../core/filters/dashboard-filters';

type Bucket = AggregationChartsQuery['metricAggregation'][number];

function formatBucketLabel(iso: string, interval: TimeInterval): string {
  const date = new Date(iso);
  return interval === TimeInterval.Day
    ? date.toLocaleDateString()
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Shared by the grouped/ungrouped branches of `chartData`: aligns one series' buckets to
// the full, sorted label order, leaving a `null` (Chart.js gap, D-6) wherever that series
// has no bucket for a given label.
function buildSeriesData(buckets: Bucket[], labelOrder: string[], field: AggregationField): (number | null)[] {
  const byLabel = new Map<string, Bucket>(buckets.map((bucket) => [bucket.bucketStart ?? '', bucket]));
  return labelOrder.map((iso) => {
    const average = byLabel.get(iso)?.stats.average;
    return average === null || average === undefined ? null : toChartValue(field, average);
  });
}

const CHART_REGISTERABLES = [
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  Colors,
];

@Component({
  selector: 'app-aggregation-charts',
  imports: [BaseChartDirective, MatSelectModule, MatFormFieldModule, MatSlideToggleModule, MatProgressBarModule],
  // Registered here (not in app.config.ts) so Chart.js only loads into this lazy
  // route's chunk, not the eagerly-bootstrapped main bundle (it blew the 1MB initial
  // bundle budget when registered at the root - see spec.md criterion 7). Only the
  // controller/elements/scales/plugins a line chart actually uses are registered,
  // not chart.js's full `registerables` set.
  providers: [provideCharts({ registerables: CHART_REGISTERABLES })],
  templateUrl: './aggregation-charts.html',
  styleUrl: './aggregation-charts.sass',
})
export class AggregationCharts {
  private readonly aggregationChartsGQL = inject(AggregationChartsGQL);
  private readonly filters = inject(DashboardFiltersService);

  protected readonly fields = Object.values(AggregationField);
  protected readonly intervals = Object.values(TimeInterval);

  protected readonly field = signal<AggregationField>(AggregationField.EnergyAmount);
  protected readonly interval = signal<TimeInterval>(TimeInterval.Hour);
  protected readonly groupByRoom = signal(false);

  private readonly variables = computed<{ input: MetricAggregationInput }>(() => {
    const { from, to } = presetToRange(this.filters.rangeDurationMs());
    const rooms = this.filters.rooms();
    return {
      input: {
        field: this.field(),
        interval: this.interval(),
        groupByRoom: this.groupByRoom(),
        rooms: rooms.length ? rooms : undefined,
        from,
        to,
      },
    };
  });

  private readonly result = toSignal(
    toObservable(this.variables).pipe(
      switchMap((vars) =>
        this.aggregationChartsGQL.watch({ variables: vars, notifyOnNetworkStatusChange: true }).valueChanges,
      ),
    ),
    { initialValue: undefined },
  );

  protected readonly loading = computed(() => this.result()?.loading ?? true);
  protected readonly error = computed(() => this.result()?.error);

  // Same sticky-last-complete-data pattern as ReadingsTable: switching variables swaps
  // the underlying watch query, so its first emission is never "complete" yet.
  private readonly lastCompleteData = signal<AggregationChartsQuery | undefined>(undefined);

  constructor() {
    effect(() => {
      const current = this.result();
      if (current?.dataState === 'complete') {
        this.lastCompleteData.set(current.data);
      }
    });
  }

  protected readonly hasData = computed(() => (this.lastCompleteData()?.metricAggregation.length ?? 0) > 0);
  protected readonly showInitialLoading = computed(() => this.loading() && this.lastCompleteData() === undefined);

  protected readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const buckets = this.lastCompleteData()?.metricAggregation ?? [];
    const activeInterval = this.interval();
    const activeField = this.field();

    const sorted = [...buckets].sort((a, b) => (a.bucketStart ?? '').localeCompare(b.bucketStart ?? ''));
    const labelOrder = [...new Set(sorted.map((bucket) => bucket.bucketStart).filter((v): v is string => v !== null))];
    const labels = labelOrder.map((iso) => formatBucketLabel(iso, activeInterval));

    if (!this.groupByRoom()) {
      return {
        labels,
        datasets: [
          { label: AGGREGATION_FIELD_LABEL[activeField], data: buildSeriesData(sorted, labelOrder, activeField) },
        ],
      };
    }

    const rooms = [...new Set(sorted.map((bucket) => bucket.room).filter((v): v is string => v !== null))];
    return {
      labels,
      datasets: rooms.map((room) => ({
        label: room,
        data: buildSeriesData(
          sorted.filter((bucket) => bucket.room === room),
          labelOrder,
          activeField,
        ),
      })),
    };
  });

  // A y-axis title carrying the field's unit, independent of groupByRoom: the ungrouped
  // mode's single dataset is labeled with the field (so the legend alone reads fine),
  // but grouped mode labels each dataset with its room name instead - without this,
  // the unit disappeared entirely from a grouped chart (self-review finding).
  protected readonly chartOptions = computed<ChartConfiguration<'line'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: false,
    scales: {
      y: { title: { display: true, text: AGGREGATION_FIELD_LABEL[this.field()] } },
    },
  }));

  protected fieldLabel(field: AggregationField): string {
    return AGGREGATION_FIELD_LABEL[field];
  }

  protected intervalLabel(interval: TimeInterval): string {
    return interval.charAt(0) + interval.slice(1).toLowerCase();
  }

  protected onFieldChange(field: AggregationField): void {
    this.field.set(field);
  }

  protected onIntervalChange(interval: TimeInterval): void {
    this.interval.set(interval);
  }

  protected onGroupByRoomChange(event: MatSlideToggleChange): void {
    this.groupByRoom.set(event.checked);
  }
}
