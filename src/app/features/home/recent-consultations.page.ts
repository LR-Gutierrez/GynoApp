import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { PatientService } from 'src/app/core/services/patient.service';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { calculateAge } from 'src/app/shared/models/patient.model';

interface ConsultationItem {
  consultationId: string;
  patientId: string;
  patientName: string;
  age: number;
  initials: string;
  motivo: string;
  date: string;
  time: string;
}

@Component({
  selector: 'app-recent-consultations',
  templateUrl: './recent-consultations.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    GynoPageHeaderComponent,
    GynoBottomNavComponent,
  ],
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
      .skeleton-shimmer {
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255,255,255,0.06) 50%,
          transparent 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }
      @keyframes shimmer {
        from { background-position: 200% 0; }
        to { background-position: -200% 0; }
      }
    `,
  ],
})
export class RecentConsultationsPage {
  private router = inject(Router);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);

  readonly loading = signal(true);
  readonly consultations = signal<ConsultationItem[]>([]);

  async ionViewWillEnter() {
    this.loading.set(true);
    try {
      await this.loadConsultations();
    } finally {
      this.loading.set(false);
    }
  }

  private async loadConsultations() {
    const patients = await this.patientService.getAll();
    const patientMap = new Map(patients.map(p => [p.id, p]));

    const allItems: { patientId: string; date: string; time: string; consultationId: string; motivo: string }[] = [];

    for (const p of patients) {
      const cons = await this.consultationService.getByPatient(p.id);
      for (const c of cons) {
        allItems.push({
          patientId: p.id,
          date: c.date,
          time: c.time ?? '',
          consultationId: c.id,
          motivo: c.motivo,
        });
      }
    }

    allItems.sort((a, b) => {
      const dateCmp = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCmp !== 0) return dateCmp;
      return (b.time || '').localeCompare(a.time || '');
    });

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    this.consultations.set(
      allItems.map(c => {
        const p = patientMap.get(c.patientId)!;
        const d = new Date(c.date);
        const nameParts = p.name.split(' ');
        const initials = nameParts.length >= 2
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : nameParts[0][0].toUpperCase();

        return {
          consultationId: c.consultationId,
          patientId: c.patientId,
          patientName: p.name,
          age: calculateAge(p.birthDate),
          initials,
          motivo: c.motivo,
          date: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
          time: c.time || '',
        };
      })
    );
  }

  goToPatient(item: ConsultationItem) {
    this.router.navigate(['/home/patient', item.patientId]);
  }

  goToConsultation(item: ConsultationItem) {
    this.router.navigate(['/home/patient', item.patientId, 'consultation', item.consultationId]);
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
