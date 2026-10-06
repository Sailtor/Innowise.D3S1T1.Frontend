import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { FilterBar } from './filter-bar';
import { DashboardFiltersRoomsDocument } from '../../../core/graphql/generated/graphql';
import { DashboardFiltersService, RANGE_PRESETS } from '../../../core/filters/dashboard-filters';
import { MetricReadingType } from '../../../core/graphql/generated/schema-types';

function flushRooms(controller: ApolloTestingController, rooms: string[] = []): void {
  controller.expectOne(DashboardFiltersRoomsDocument).flushData({ availableRooms: rooms });
}

describe('FilterBar', () => {
  let controller: ApolloTestingController;
  let filters: DashboardFiltersService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBar, ApolloTestingModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    controller = TestBed.inject(ApolloTestingController);
    filters = TestBed.inject(DashboardFiltersService);
  });

  afterEach(() => {
    controller.verify();
  });

  it('renders room options from availableRooms', async () => {
    const fixture = TestBed.createComponent(FilterBar);
    fixture.detectChanges();

    flushRooms(controller, ['Kitchen', 'Lobby']);
    await fixture.whenStable();

    expect(filters.roomOptions()).toEqual(['Kitchen', 'Lobby']);
  });

  it('writes room selection through to the shared service', async () => {
    const fixture = TestBed.createComponent(FilterBar);
    fixture.detectChanges();
    flushRooms(controller, ['Kitchen', 'Lobby']);
    await fixture.whenStable();

    (fixture.componentInstance as unknown as { onRoomsChange: (rooms: string[]) => void }).onRoomsChange(['Lobby']);

    expect(filters.rooms()).toEqual(['Lobby']);
  });

  it('writes type selection through to the shared service when showTypeFilter is true', async () => {
    const fixture = TestBed.createComponent(FilterBar);
    fixture.componentRef.setInput('showTypeFilter', true);
    fixture.detectChanges();
    flushRooms(controller);
    await fixture.whenStable();

    (
      fixture.componentInstance as unknown as { onTypeChange: (type: MetricReadingType | null) => void }
    ).onTypeChange(MetricReadingType.Energy);

    expect(filters.type()).toBe(MetricReadingType.Energy);
  });

  it('hides the type filter when showTypeFilter is false', async () => {
    const fixture = TestBed.createComponent(FilterBar);
    fixture.componentRef.setInput('showTypeFilter', false);
    fixture.detectChanges();
    flushRooms(controller);
    await fixture.whenStable();

    const typeLabel = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('mat-label')).find(
      (el) => el.textContent === 'Type',
    );
    expect(typeLabel).toBeUndefined();
  });

  it('disables the Rooms select while the rooms query is loading', async () => {
    const fixture = TestBed.createComponent(FilterBar);
    fixture.detectChanges();

    expect(filters.roomsLoading()).toBeTrue();
    const select = (fixture.nativeElement as HTMLElement).querySelector('mat-select');
    expect(select?.getAttribute('aria-disabled')).toBe('true');

    flushRooms(controller);
    await fixture.whenStable();

    expect(filters.roomsLoading()).toBeFalse();
  });

  it('shows an inline error hint when the rooms query fails', async () => {
    const fixture = TestBed.createComponent(FilterBar);
    fixture.detectChanges();

    controller.expectOne(DashboardFiltersRoomsDocument).networkError(new Error('Gateway unreachable'));
    await fixture.whenStable();

    expect(filters.roomsError()).toBeTruthy();
    const hint = (fixture.nativeElement as HTMLElement).querySelector('.filter-error');
    expect(hint?.textContent).toContain('Could not load rooms.');
  });

  it('writes range preset selection through to the shared service', async () => {
    const fixture = TestBed.createComponent(FilterBar);
    fixture.detectChanges();
    flushRooms(controller);
    await fixture.whenStable();

    (fixture.componentInstance as unknown as { onRangeChange: (durationMs: number) => void }).onRangeChange(
      RANGE_PRESETS[0].durationMs,
    );

    expect(filters.rangeDurationMs()).toBe(RANGE_PRESETS[0].durationMs);
  });
});
