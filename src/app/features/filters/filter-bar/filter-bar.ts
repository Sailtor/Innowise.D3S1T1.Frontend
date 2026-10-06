import { Component, inject, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DashboardFiltersService, RANGE_PRESETS } from '../../../core/filters/dashboard-filters';
import { MetricReadingType } from '../../../core/graphql/generated/schema-types';

@Component({
  selector: 'app-filter-bar',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.sass',
})
export class FilterBar {
  readonly showTypeFilter = input(true);

  protected readonly filters = inject(DashboardFiltersService);
  protected readonly types = Object.values(MetricReadingType);
  protected readonly rangePresets = RANGE_PRESETS;

  protected onRoomsChange(rooms: string[]): void {
    this.filters.setRooms(rooms);
  }

  protected onTypeChange(type: MetricReadingType | null): void {
    this.filters.setType(type);
  }

  protected onRangeChange(durationMs: number): void {
    this.filters.setRangeDurationMs(durationMs);
  }
}
