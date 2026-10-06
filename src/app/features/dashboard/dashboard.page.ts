import { Component } from '@angular/core';
import { LatestValues } from './latest-values/latest-values';
import { ReadingsTable } from './readings-table/readings-table';

@Component({
  selector: 'app-dashboard-page',
  imports: [LatestValues, ReadingsTable],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.sass',
})
export class DashboardPage {}
