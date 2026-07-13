import { Injectable, signal, computed, inject } from '@angular/core';
import type { DoctorProfile } from '../models/doctor.model';
import { DatabaseService } from 'src/app/core/services/database.service';

const DEFAULTS: DoctorProfile = {
  firstName: 'Roberto',
  lastName: 'García',
  specialty: 'Ginecología y Obstetricia',
  specialties: ['Ginecología', 'Obstetricia'],
  badge: 'Médico',
};

@Injectable({ providedIn: 'root' })
export class DoctorProfileService {
  private db = inject(DatabaseService);

  private loaded = false;
  private userSet = false;

  readonly loading = signal(true);
  readonly profile = signal<DoctorProfile>({ ...DEFAULTS });

  readonly displayName = computed(
    () => `Dr. ${this.profile().firstName} ${this.profile().lastName}`,
  );

  readonly initials = computed(() =>
    `${this.profile().firstName[0]}${this.profile().lastName[0]}`.toUpperCase(),
  );

  constructor() {
    this.loadFromDb();
  }

  private async loadFromDb(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const saved = await this.db.getProfile();
      if (saved && !this.userSet) {
        this.profile.set(saved);
      }
    } catch {
      console.warn('Could not load profile from DB, using defaults');
    } finally {
      this.loading.set(false);
    }
  }

  async update(updates: Partial<DoctorProfile>): Promise<void> {
    this.userSet = true;
    this.profile.update((prev) => ({ ...prev, ...updates }));
    try {
      await this.db.saveProfile(this.profile());
    } catch {
      console.warn('Could not save profile to DB');
    }
  }

  async updatePhoto(photoUrl: string): Promise<void> {
    this.userSet = true;
    this.profile.update((prev) => ({ ...prev, photoUrl }));
    try {
      await this.db.saveProfile(this.profile());
    } catch {
      console.warn('Could not save profile to DB');
    }
  }

  /** Force-load from DB */
  async init(): Promise<void> {
    await this.loadFromDb();
  }
}
