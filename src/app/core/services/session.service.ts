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

  readonly locked = signal(false);

  constructor() {
    effect(() => {
      const minutes = this.settings.autoLockMinutes();
      if (this.auth.isAuthenticated()) {
        this.setTimeout(minutes);
        this.startMonitoring();
      } else {
        this.stopMonitoring();
        this.locked.set(false);
      }
    });
  }

  private setTimeout(minutes: number) {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    if (minutes === 0) return;
    this.idleTimer = setTimeout(() => this.onTimeout(), minutes * 60 * 1000);
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
    const minutes = this.settings.autoLockMinutes();
    if (minutes === 0) return;
    this.idleTimer = setTimeout(() => this.onTimeout(), minutes * 60 * 1000);
  }

  private onTimeout() {
    this.locked.set(true);
    this.auth.logout();
  }
}
