import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReadingsTableGQL, ReadingsTableQuery } from '../../../core/graphql/generated/graphql';
import {
  MetricReadingFilterInput,
  MetricReadingSortInput,
  SortEnumType,
} from '../../../core/graphql/generated/schema-types';
import { displayValue, typeLabel } from '../../../core/reading-display';
import { DashboardFiltersService, presetToRange } from '../../../core/filters/dashboard-filters';

type ReadingRow = NonNullable<NonNullable<NonNullable<ReadingsTableQuery['metricReadings']>['items']>[number]>;

const PAGE_SIZE = 20;
const SORTABLE_FIELDS = ['room', 'receivedAt'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

function isSortableField(value: string): value is SortableField {
  return (SORTABLE_FIELDS as readonly string[]).includes(value);
}

@Component({
  selector: 'app-readings-table',
  imports: [MatTableModule, MatSortModule, MatPaginatorModule, MatProgressBarModule],
  templateUrl: './readings-table.html',
  styleUrl: './readings-table.sass',
})
export class ReadingsTable {
  private readonly readingsTableGQL = inject(ReadingsTableGQL);
  private readonly filters = inject(DashboardFiltersService);

  protected readonly displayedColumns = ['room', 'type', 'value', 'receivedAt'];

  protected readonly pageIndex = signal(0);
  protected readonly sortField = signal<SortableField | null>(null);
  protected readonly sortDirection = signal<SortEnumType>(SortEnumType.Asc);

  private readonly variables = computed(() => {
    const order: MetricReadingSortInput[] = [];
    const field = this.sortField();
    if (field) {
      order.push({ [field]: this.sortDirection() });
    }

    const rooms = this.filters.rooms();
    const type = this.filters.type();
    const { from, to } = presetToRange(this.filters.rangeDurationMs());
    const where: MetricReadingFilterInput = {
      room: rooms.length ? { in: rooms } : undefined,
      type: type ? { eq: type } : undefined,
      receivedAt: { gte: from, lte: to },
    };

    return {
      skip: this.pageIndex() * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
      order,
    };
  });

  private readonly result = toSignal(
    toObservable(this.variables).pipe(
      switchMap((vars) =>
        this.readingsTableGQL.watch({ variables: vars, notifyOnNetworkStatusChange: true }).valueChanges,
      ),
    ),
    { initialValue: undefined },
  );

  protected readonly loading = computed(() => this.result()?.loading ?? true);
  protected readonly error = computed(() => this.result()?.error);

  // Sticky across variable changes: switching page/sort/filter swaps the underlying
  // watch query (see `result` above), so the new query's first emission is never
  // "complete" yet. Holding the last complete payload here keeps rows on screen
  // during that refetch instead of flashing to empty (D-3).
  private readonly lastCompleteData = signal<ReadingsTableQuery | undefined>(undefined);

  constructor() {
    effect(() => {
      const current = this.result();
      if (current?.dataState === 'complete') {
        this.lastCompleteData.set(current.data);
      }
    });

    effect(() => {
      this.filters.rooms();
      this.filters.type();
      this.filters.rangeDurationMs();
      this.pageIndex.set(0);
    });
  }

  protected readonly hasData = computed(() => this.lastCompleteData() !== undefined);
  protected readonly showInitialLoading = computed(() => this.loading() && !this.hasData());

  protected readonly segment = computed(() => this.lastCompleteData()?.metricReadings);
  protected readonly rows = computed<ReadingRow[]>(() =>
    (this.segment()?.items ?? []).filter((row): row is ReadingRow => row !== null),
  );

  // Drives the paginator's own hasNext/hasPrevious math (scope item 2) from the
  // server's own pageInfo flags, rather than trusting totalCount alone: when the
  // server says there's no next page, clamp the reported length to what's actually
  // on screen so a stale/racy totalCount can't leave "Next" enabled past the end.
  protected readonly totalCount = computed(() => {
    const seg = this.segment();
    if (!seg) {
      return 0;
    }
    if (!seg.pageInfo.hasNextPage) {
      return this.pageIndex() * PAGE_SIZE + this.rows().length;
    }
    return seg.totalCount;
  });

  protected typeLabel(reading: ReadingRow): string {
    return typeLabel(reading);
  }

  protected displayValue(reading: ReadingRow): string {
    return displayValue(reading);
  }

  protected receivedAtLabel(reading: ReadingRow): string {
    return new Date(reading.receivedAt).toLocaleString();
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  protected onSort(sort: Sort): void {
    if (!sort.direction || !isSortableField(sort.active)) {
      this.sortField.set(null);
      return;
    }
    this.sortField.set(sort.active);
    this.sortDirection.set(sort.direction === 'asc' ? SortEnumType.Asc : SortEnumType.Desc);
    this.pageIndex.set(0);
  }
}
