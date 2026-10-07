import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { TablePage } from './table.page';
import {
  ReadingsTableDocument,
  DashboardFiltersRoomsDocument,
} from '../../core/graphql/generated/graphql';

describe('TablePage', () => {
  let controller: ApolloTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablePage, ApolloTestingModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('renders the readings table', () => {
    const fixture = TestBed.createComponent(TablePage);
    fixture.detectChanges();

    controller.expectOne(DashboardFiltersRoomsDocument).flushData({ availableRooms: [] });
    controller.expectOne(ReadingsTableDocument).flushData({
      metricReadings: {
        totalCount: 0,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        items: [],
      },
    });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-readings-table')).toBeTruthy();
  });
});
