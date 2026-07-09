import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Patient } from '../../models/patient.model';
import { GyncAvatarComponent } from '../gync-avatar/gync-avatar.component';

@Component({
  selector: 'gync-patient-card',
  templateUrl: './gync-patient-card.component.html',
  standalone: true,
  imports: [IonicModule, GyncAvatarComponent],
})
export class GyncPatientCardComponent {
  readonly patient = input.required<Patient>();
  readonly avatar = input<string>('');

  readonly clicked = output<void>();
  readonly delete = output<void>();
}
