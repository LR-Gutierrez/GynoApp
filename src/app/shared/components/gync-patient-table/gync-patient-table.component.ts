import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Patient } from '../../models/patient.model';
import { GyncAvatarComponent } from '../gync-avatar/gync-avatar.component';
import { GyncStatusPillComponent } from '../gync-status-pill/gync-status-pill.component';
import { GyncPaginationComponent } from '../gync-pagination/gync-pagination.component';

export interface TablePatient extends Patient {
  ultimaConsulta?: string;
  status?: string;
  statusVariant?: 'success' | 'danger' | 'info' | 'warning' | 'neutral';
}

@Component({
  selector: 'gync-patient-table',
  templateUrl: './gync-patient-table.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, GyncAvatarComponent, GyncStatusPillComponent, GyncPaginationComponent],
})
export class GyncPatientTableComponent {
  readonly patients = input<TablePatient[]>([]);
  readonly totalCount = input<number>(0);
  readonly pageSize = input<number>(10);
  readonly currentPage = input<number>(1);

  readonly filter = output<MouseEvent>();
  readonly rowAction = output<{ patient: TablePatient; event: MouseEvent }>();
  readonly pageChange = output<number>();
}
