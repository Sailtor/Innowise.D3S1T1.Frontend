import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark-theme');
  });

  afterEach(() => {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark-theme');
  });

  it('defaults to light and toggling flips isDark, the DOM class, and localStorage', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const theme = TestBed.inject(ThemeService);

    expect(theme.isDark()).toBeFalse();
    expect(document.documentElement.classList.contains('dark-theme')).toBeFalse();

    theme.toggle();

    expect(theme.isDark()).toBeTrue();
    expect(document.documentElement.classList.contains('dark-theme')).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('dark');

    theme.toggle();

    expect(theme.isDark()).toBeFalse();
    expect(document.documentElement.classList.contains('dark-theme')).toBeFalse();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('seeds isDark from a stored preference', () => {
    localStorage.setItem('theme', 'dark');

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const theme = TestBed.inject(ThemeService);

    expect(theme.isDark()).toBeTrue();
    expect(document.documentElement.classList.contains('dark-theme')).toBeTrue();
  });
});
