import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Shell } from './shell';
import { MetricsHubService } from '../signalr/metrics-hub';
import { ALERT_SNACKBAR_PANEL_CLASS } from '../signalr/metrics-hub.types';

describe('Shell', () => {
  beforeEach(async () => {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark-theme');
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark-theme');
  });

  it('should create the shell', () => {
    const fixture = TestBed.createComponent(Shell);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a skip link targeting a focusable main content region', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const skipLink = compiled.querySelector('a.skip-link');
    expect(skipLink?.getAttribute('href')).toBe('#main-content');

    const main = compiled.querySelector('#main-content');
    expect(main).toBeTruthy();
    // tabindex="-1" is what makes a fragment link actually move keyboard focus to this
    // element (not just scroll to it) - without it, href="#main-content" alone leaves
    // document.activeElement on <body> (confirmed manually - see verification.md).
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });

  it('moves keyboard focus to the main content when the skip link is activated', () => {
    const fixture = TestBed.createComponent(Shell);
    // Focus/activeElement only behaves realistically for nodes attached to the live
    // document - fixtures aren't attached by default.
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    try {
      const compiled = fixture.nativeElement as HTMLElement;
      const skipLink = compiled.querySelector('a.skip-link') as HTMLAnchorElement;

      skipLink.focus();
      skipLink.click();

      const main = compiled.querySelector('#main-content');
      expect(document.activeElement).toBe(main);
    } finally {
      fixture.nativeElement.remove();
    }
  });

  it('renders the three nav entries', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a[routerLink]')).map((a) =>
      a.getAttribute('routerLink'),
    );
    expect(links).toEqual(['/', '/graphs', '/table']);
  });

  it('clicking Dark/Light in the theme switch flips the dark-theme class on <html>', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('dark-theme')).toBeFalse();

    const buttons = fixture.nativeElement.querySelectorAll('mat-button-toggle button');
    const [lightButton, darkButton] = Array.from(buttons) as HTMLButtonElement[];

    darkButton.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('dark-theme')).toBeTrue();

    lightButton.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('dark-theme')).toBeFalse();
  });

  it('opens a snackbar with the formatted message when the hub pushes a threshold alert', () => {
    const fixture = TestBed.createComponent(Shell);
    const snackBar = TestBed.inject(MatSnackBar);
    const openSpy = spyOn(snackBar, 'open');
    fixture.detectChanges();

    const metricsHub = TestBed.inject(MetricsHubService);
    metricsHub.alertReceived$.next({
      room: 'kitchen',
      readingType: 'AirQuality',
      rule: 'AirQuality.Co2.ExceedsThreshold',
      value: 1200,
      threshold: 1000,
      ingestedAtUtc: '2026-01-01T00:00:00Z',
    });

    expect(openSpy).toHaveBeenCalledWith('kitchen: CO2 1200 ppm exceeds threshold 1000', 'Dismiss', {
      duration: 6000,
      panelClass: ALERT_SNACKBAR_PANEL_CLASS,
    });
  });
});
