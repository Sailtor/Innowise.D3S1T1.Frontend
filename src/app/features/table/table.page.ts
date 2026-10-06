import { Component } from '@angular/core';
import { ReadingsTable } from './readings-table/readings-table';

@Component({
  selector: 'app-table-page',
  imports: [ReadingsTable],
  templateUrl: './table.page.html',
  styleUrl: './table.page.sass',
})
export class TablePage {}
