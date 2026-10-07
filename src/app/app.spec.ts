import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { App } from './app';
import { DashboardFiltersRoomsDocument } from './core/graphql/generated/graphql';

describe('App', () => {
  let controller: ApolloTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, ApolloTestingModule],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  // Flushed with no rooms - these tests only care about App/Shell creation and
  // rendering, not about MetricsHubService.joinRoom() actually exercising a real hub
  // connection (no fake hub is provided at this level, unlike shell.spec.ts).
  function flushNoRooms(): void {
    controller.expectOne(DashboardFiltersRoomsDocument).flushData({ availableRooms: [] });
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    flushNoRooms();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the shell title', () => {
    const fixture = TestBed.createComponent(App);
    flushNoRooms();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('D3S1T1 Metrics Dashboard');
  });
});
