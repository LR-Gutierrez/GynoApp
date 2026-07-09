import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Patient } from '../../models/patient.model';
import { GynoAvatarComponent } from '../gyno-avatar/gyno-avatar.component';
import { GynoStatusPillComponent } from '../gyno-status-pill/gyno-status-pill.component';
import { GynoPaginationComponent } from '../gyno-pagination/gyno-pagination.component';

export interface TablePatient extends Patient {
  ultimaConsulta?: string;
  status?: string;
  statusVariant?: 'success' | 'danger' | 'info' | 'warning' | 'neutral';
}

@Component({
  selector: 'gyno-patient-table',
  templateUrl: './gyno-patient-table.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, GynoAvatarComponent, GynoStatusPillComponent, GynoPaginationComponent],
})
export class GynoPatientTableComponent {
  readonly patients = input<TablePatient[]>([]);
  readonly totalCount = input<number>(0);
  readonly pageSize = input<number>(10);
  readonly currentPage = input<number>(1);

  readonly filter = output<MouseEvent>();
  readonly rowAction = output<{ patient: TablePatient; event: MouseEvent }>();
  readonly pageChange = output<number>();
}
