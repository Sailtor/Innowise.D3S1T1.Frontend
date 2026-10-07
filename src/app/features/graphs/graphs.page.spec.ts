import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { GraphsPage } from './graphs.page';
import {
  AggregationChartsDocument,
  DashboardFiltersRoomsDocument,
} from '../../core/graphql/generated/graphql';

describe('GraphsPage', () => {
  let controller: ApolloTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphsPage, ApolloTestingModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('renders the aggregation charts panel', () => {
    const fixture = TestBed.createComponent(GraphsPage);
    fixture.detectChanges();

    controller.expectOne(DashboardFiltersRoomsDocument).flushData({ availableRooms: [] });
    controller.expectOne(AggregationChartsDocument).flushData({ metricAggregation: [] });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-aggregation-charts')).toBeTruthy();
  });
});
