import { Component } from '@angular/core';
import { ReadingsTable } from './readings-table/readings-table';
import { FilterBar } from '../filters/filter-bar/filter-bar';

@Component({
  selector: 'app-table-page',
  imports: [ReadingsTable, FilterBar],
  templateUrl: './table.page.html',
  styleUrl: './table.page.sass',
})
export class TablePage {}
