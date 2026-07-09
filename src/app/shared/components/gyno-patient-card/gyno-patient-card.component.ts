import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Patient } from '../../models/patient.model';
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

  readonly clicked = output<void>();
  readonly delete = output<void>();
}
