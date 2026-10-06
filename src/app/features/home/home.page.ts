import { Component } from '@angular/core';
import { LatestValues } from './latest-values/latest-values';

@Component({
  selector: 'app-home-page',
  imports: [LatestValues],
  templateUrl: './home.page.html',
  styleUrl: './home.page.sass',
})
export class HomePage {}
