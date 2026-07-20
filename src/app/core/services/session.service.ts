import { Injectable, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private router = inject(Router);
  private auth = inject(AuthService);
  private settings = inject(SettingsService);

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private eventsBound = false;
  private timeoutMs = 5 * 60 * 1000;

  readonly locked = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadTimeout();
        this.startMonitoring();
      } else {
        this.stopMonitoring();
        this.locked.set(false);
      }
    });
  }

  private async loadTimeout() {
    const minutes = await this.settings.getAutoLock();
    this.timeoutMs = minutes > 0 ? minutes * 60 * 1000 : Infinity;
  }

  private startMonitoring() {
    if (this.eventsBound) return;
    this.eventsBound = true;
    this.resetTimer();
    document.addEventListener('click', this.onActivity);
    document.addEventListener('keydown', this.onActivity);
    document.addEventListener('touchstart', this.onActivity);
    document.addEventListener('scroll', this.onActivity, { passive: true });
  }

  private stopMonitoring() {
    if (!this.eventsBound) return;
    this.eventsBound = false;
    document.removeEventListener('click', this.onActivity);
    document.removeEventListener('keydown', this.onActivity);
    document.removeEventListener('touchstart', this.onActivity);
    document.removeEventListener('scroll', this.onActivity);
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }

  private onActivity = () => {
    this.auth.updateLastActivity();
    this.resetTimer();
  };

  private resetTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.timeoutMs === Infinity) return;
    this.idleTimer = setTimeout(() => this.onTimeout(), this.timeoutMs);
  }

  private onTimeout() {
    this.locked.set(true);
    this.auth.logout();
  }
}
