import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Shell } from './shell';

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
});
