import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

export interface RecentPatient {
  id: string;
  name: string;
  age: number;
  consultationId: string;
  motivo: string;
  lastVisitDate: string;
  lastVisitTime: string;
}

@Component({
  selector: 'gyno-recent-card',
  templateUrl: './gyno-recent-card.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GynoRecentCardComponent {
  readonly patient = input.required<RecentPatient>();

  readonly patientClicked = output<void>();
  readonly consultationClicked = output<void>();

  get initials(): string {
    const parts = this.patient().name.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
}
