import { Component, effect, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService } from '../theme/theme';
import { DashboardFiltersService } from '../filters/dashboard-filters';
import { MetricsHubService } from '../signalr/metrics-hub';
import { ALERT_SNACKBAR_PANEL_CLASS, formatAlertMessage } from '../signalr/metrics-hub.types';

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatButtonToggleModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.sass',
})
export class Shell {
  protected readonly theme = inject(ThemeService);

  private readonly breakpointObserver = inject(BreakpointObserver);
  protected readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  private readonly metricsHub = inject(MetricsHubService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dashboardFilters = inject(DashboardFiltersService);
  private readonly joinedByShell = new Set<string>();

  constructor() {
    this.metricsHub.alertReceived$.pipe(takeUntilDestroyed()).subscribe((alert) => {
      this.snackBar.open(formatAlertMessage(alert), 'Dismiss', {
        duration: 6000,
        panelClass: ALERT_SNACKBAR_PANEL_CLASS,
      });
    });

    // Permanent, app-lifetime interest in every known room so alert toasts aren't
    // limited to rooms a page has rendered this session (data/Frontend.md §19). Shell
    // never leaveRoom()s - MetricsHubService's refcounted join/leave means this doesn't
    // fight with a page component's own joinRoom/leaveRoom for the same room.
    effect(() => {
      for (const room of this.dashboardFilters.roomOptions()) {
        if (!this.joinedByShell.has(room)) {
          this.joinedByShell.add(room);
          void this.metricsHub.joinRoom(room);
        }
      }
    });
  }

  protected onThemeChange(change: MatButtonToggleChange): void {
    this.theme.set(change.value === 'dark');
  }
}
