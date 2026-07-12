import { Injectable, signal, computed } from '@angular/core';
import type { DoctorProfile } from '../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorProfileService {
  readonly profile = signal<DoctorProfile>({
    firstName: 'Roberto',
    lastName: 'García',
    specialty: 'Ginecología y Obstetricia',
    specialties: ['Ginecología', 'Obstetricia'],
    badge: 'Médico',
  });

  readonly displayName = computed(
    () => `Dr. ${this.profile().firstName} ${this.profile().lastName}`,
  );

  readonly initials = computed(() =>
    `${this.profile().firstName[0]}${this.profile().lastName[0]}`.toUpperCase(),
  );

  update(updates: Partial<DoctorProfile>): void {
    this.profile.update((prev) => ({ ...prev, ...updates }));
  }

  updatePhoto(photoUrl: string): void {
    this.profile.update((prev) => ({ ...prev, photoUrl }));
  }
}
