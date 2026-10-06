import { Component } from '@angular/core';
import { AggregationCharts } from './aggregation-charts/aggregation-charts';
import { FilterBar } from '../filters/filter-bar/filter-bar';

@Component({
  selector: 'app-graphs-page',
  imports: [AggregationCharts, FilterBar],
  templateUrl: './graphs.page.html',
  styleUrl: './graphs.page.sass',
})
export class GraphsPage {}
