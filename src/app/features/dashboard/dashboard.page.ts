import { Component } from '@angular/core';
import { LatestValues } from './latest-values/latest-values';

@Component({
  selector: 'app-dashboard-page',
  imports: [LatestValues],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.sass',
})
export class DashboardPage {}
