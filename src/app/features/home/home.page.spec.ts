import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { HomePage } from './home.page';
import { LatestValuesDocument } from '../../core/graphql/generated/graphql';

describe('HomePage', () => {
  let controller: ApolloTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage, ApolloTestingModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('renders the intro column and the latest-values panel', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    controller.expectOne(LatestValuesDocument).flushData({ latestReadings: [], rooms: [] });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.home-intro')).toBeTruthy();
    expect(compiled.querySelector('app-latest-values')).toBeTruthy();
  });
});
