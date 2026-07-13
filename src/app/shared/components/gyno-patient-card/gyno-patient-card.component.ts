import { Component, input, output, computed } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Patient, calculateAge } from '../../models/patient.model';
import { GynoAvatarComponent } from '../gyno-avatar/gyno-avatar.component';

@Component({
  selector: 'gyno-patient-card',
  templateUrl: './gyno-patient-card.component.html',
  standalone: true,
  imports: [IonicModule, GynoAvatarComponent],
})
export class GynoPatientCardComponent {
  readonly patient = input.required<Patient>();
  readonly avatar = input<string>('');
  readonly patientAge = computed(() => calculateAge(this.patient().birthDate));

  readonly clicked = output<void>();
  readonly delete = output<void>();
}
