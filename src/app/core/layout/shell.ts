import { Component, inject } from '@angular/core';
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

  constructor() {
    // Rooms only arrive here via whatever page already joined them on MetricsHubService
    // (today, only Home's LatestValues) - this component never calls joinRoom itself, so an
    // alert only surfaces for a room the user has had visible at least once this session.
    this.metricsHub.alertReceived$.pipe(takeUntilDestroyed()).subscribe((alert) => {
      this.snackBar.open(formatAlertMessage(alert), 'Dismiss', {
        duration: 6000,
        panelClass: ALERT_SNACKBAR_PANEL_CLASS,
      });
    });
  }

  protected onThemeChange(change: MatButtonToggleChange): void {
    this.theme.set(change.value === 'dark');
  }
}
