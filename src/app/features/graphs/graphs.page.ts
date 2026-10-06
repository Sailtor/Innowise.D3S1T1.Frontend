import { Component } from '@angular/core';
import { AggregationCharts } from './aggregation-charts/aggregation-charts';

@Component({
  selector: 'app-graphs-page',
  imports: [AggregationCharts],
  templateUrl: './graphs.page.html',
  styleUrl: './graphs.page.sass',
})
export class GraphsPage {}
