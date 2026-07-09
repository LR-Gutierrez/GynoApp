import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Consultation } from '../../models/patient.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'gyno-consultation-card',
  templateUrl: './gyno-consultation-card.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class GynoConsultationCardComponent {
  readonly consultation = input.required<Consultation>();

  readonly clicked = output<void>();

  get badgeVariant(): string {
    const d = this.consultation();
    if (d.motivo?.toLowerCase().includes('rutina')) return 'badge-routine';
    if (d.motivo?.toLowerCase().includes('emergencia')) return 'badge-danger';
    if (d.motivo?.toLowerCase().includes('control')) return 'badge-secondary';
    return 'badge-primary';
  }

  get badgeText(): string {
    const m = this.consultation().motivo;
    if (!m) return 'CONSULTA';
    return m.substring(0, 12).toUpperCase();
  }

  get doctorName(): string {
    return 'Dra. López';
  }
}
