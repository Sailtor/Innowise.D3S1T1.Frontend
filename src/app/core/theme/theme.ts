import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'theme';
const DARK_CLASS = 'dark-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly isDark = signal(this.readStored());

  constructor() {
    this.applyClass(this.isDark());
  }

  set(isDark: boolean): void {
    this.isDark.set(isDark);
    this.applyClass(isDark);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    }
  }

  toggle(): void {
    this.set(!this.isDark());
  }

  private readStored(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return localStorage.getItem(STORAGE_KEY) === 'dark';
  }

  private applyClass(isDark: boolean): void {
    if (!this.isBrowser) {
      return;
    }
    document.documentElement.classList.toggle(DARK_CLASS, isDark);
  }
}
