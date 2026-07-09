import { Component, inject } from '@angular/core';
import { IonicModule, ToastController, AlertController, PopoverController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GyncPatientCardComponent } from 'src/app/shared/components/gync-patient-card/gync-patient-card.component';
import { GyncConsultationCardComponent } from 'src/app/shared/components/gync-consultation-card/gync-consultation-card.component';
import { GyncStatusCardComponent } from 'src/app/shared/components/gync-status-card/gync-status-card.component';
import { GyncFormFieldComponent } from 'src/app/shared/components/gync-form-field/gync-form-field.component';
import { GyncSearchBarComponent } from 'src/app/shared/components/gync-search-bar/gync-search-bar.component';
import { GyncPhotoThumbnailComponent } from 'src/app/shared/components/gync-photo-thumbnail/gync-photo-thumbnail.component';
import { GyncEmptyStateComponent } from 'src/app/shared/components/gync-empty-state/gync-empty-state.component';
import { GyncLoadingOverlayComponent } from 'src/app/shared/components/gync-loading-overlay/gync-loading-overlay.component';
import { GyncConfirmDialogComponent } from 'src/app/shared/components/gync-confirm-dialog/gync-confirm-dialog.component';
import { GyncSecurityBadgeComponent } from 'src/app/shared/components/gync-security-badge/gync-security-badge.component';
import { GyncPageHeaderComponent } from 'src/app/shared/components/gync-page-header/gync-page-header.component';
import { GyncPatientTableComponent } from 'src/app/shared/components/gync-patient-table/gync-patient-table.component';
import { GyncFabComponent } from 'src/app/shared/components/gync-fab/gync-fab.component';
import { GyncSectionHeaderComponent } from 'src/app/shared/components/gync-section-header/gync-section-header.component';
import { Patient, Consultation } from 'src/app/shared/models/patient.model';
import { StatusChip } from 'src/app/shared/components/gync-status-card/gync-status-card.component';
import { TablePatient } from 'src/app/shared/components/gync-patient-table/gync-patient-table.component';
import { phoneMask, digitsOnlyMask, lettersOnlyMask } from 'src/app/shared/utils/masks';

@Component({
  selector: 'app-ui-kit',
  templateUrl: './ui-kit.page.html',
  styleUrls: ['./ui-kit.page.scss'],
  standalone: true,
  imports: [
    IonicModule, CommonModule, FormsModule,
    GyncPatientCardComponent, GyncConsultationCardComponent, GyncStatusCardComponent,
    GyncFormFieldComponent, GyncSearchBarComponent, GyncPhotoThumbnailComponent,
    GyncEmptyStateComponent, GyncLoadingOverlayComponent, GyncConfirmDialogComponent,
    GyncSecurityBadgeComponent, GyncPageHeaderComponent, GyncPatientTableComponent,
    GyncFabComponent, GyncSectionHeaderComponent,
  ],
})
export class UiKitPage {
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private popoverController = inject(PopoverController);

  showLoading = false;
  showConfirm = false;
  searchValue = '';
  formValue = '';
  formError: string | null = null;

  readonly phoneMask = phoneMask;
  readonly digitsOnlyMask = digitsOnlyMask;
  readonly lettersOnlyMask = lettersOnlyMask;

  sampleConsultation: Consultation = {
    id: '1',
    patientId: '1',
    date: '2026-06-15',
    motivo: 'Control Rutina',
    diagnostico: 'Embarazo sin complicaciones',
    tratamiento: 'Suplementos vitamínicos',
    receta: 'Ácido fólico 5mg',
    notas: 'Paciente en buen estado general. Control en 4 semanas.',
    photoIds: ['1', '2', '3'],
    createdAt: '2026-06-15',
  };

  samplePatient: Patient = {
    id: '1',
    name: 'María García',
    age: 34,
    phone: '+58 412-1234567',
    address: 'Av. Principal, Caracas',
    alergias: 'Penicilina',
    createdAt: '2026-01-01',
    updatedAt: '2026-06-01',
  };

  sampleStatusChips: StatusChip[] = [
    { label: 'EMBARAZO', variant: 'primary' },
    { label: 'CONTROL', variant: 'secondary' },
    { label: 'ESTABLE', variant: 'success' },
  ];

  samplePatients: TablePatient[] = [
    { id: '1', name: 'Beatriz Gómez', age: 31, phone: '+58 414-1112233', ultimaConsulta: '15 Oct 2023', status: 'Control Rutina', statusVariant: 'success', createdAt: '', updatedAt: '' },
    { id: '2', name: 'Claudia Paredes', age: 25, phone: '+58 414-2223344', ultimaConsulta: '02 Oct 2023', status: 'Seguimiento', statusVariant: 'danger', createdAt: '', updatedAt: '' },
    { id: '3', name: 'Diana Rivas', age: 39, phone: '+58 414-3334455', ultimaConsulta: '28 Sep 2023', status: 'Prenatal', statusVariant: 'info', createdAt: '', updatedAt: '' },
    { id: '4', name: 'Fernanda Pardo', age: 45, phone: '+58 414-4445566', ultimaConsulta: '14 Sep 2023', status: 'Control Rutina', statusVariant: 'success', createdAt: '', updatedAt: '' },
  ];

  constructor() {
    setTimeout(() => {
      this.formError = 'Este campo es requerido';
    }, 1500);
  }

  toggleLoading() {
    this.showLoading = !this.showLoading;
    if (this.showLoading) {
      setTimeout(() => { this.showLoading = false; }, 3000);
    }
  }

  toggleConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  async showToast() {
    const toast = await this.toastController.create({
      message: '¡Acción completada exitosamente!',
      duration: 3000,
      position: 'bottom',
      color: 'success',
      buttons: [{ text: 'Cerrar', role: 'cancel' }],
    });
    await toast.present();
  }

  async showAlert() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      subHeader: '¿Estás seguro?',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', handler: () => console.log('Confirmado') },
      ],
    });
    await alert.present();
  }

  async openProfileActionPopover(event: MouseEvent) {
    const popover = await this.popoverController.create({
      component: ProfileActionPopoverComponent,
      event, side: 'bottom', alignment: 'start', showBackdrop: false,
    });
    await popover.present();
  }

  async openFilterPopover(event: MouseEvent) {
    const popover = await this.popoverController.create({
      component: FilterPopoverComponent,
      event, side: 'bottom', alignment: 'start', showBackdrop: false,
    });
    await popover.present();
  }

  async openActionPopover(event: MouseEvent, patientName: string) {
    const popover = await this.popoverController.create({
      component: ActionPopoverComponent,
      componentProps: { patientName },
      event, side: 'bottom', alignment: 'start', showBackdrop: false,
    });
    await popover.present();
  }

  onAction(action: string) { console.log('Action:', action); }
  handleConfirm() { console.log('Confirmado'); this.showConfirm = false; }
  onSearch(event: any) { this.searchValue = event.target?.value || ''; }
  clearSearch() { this.searchValue = ''; }
}

@Component({
  selector: 'app-profile-action-popover',
  template: `
    <ion-list>
      <ion-item button (click)="close()"><ion-icon name="create-outline" slot="start"></ion-icon>Editar perfil</ion-item>
      <ion-item button (click)="close()"><ion-icon name="call-outline" slot="start"></ion-icon>Llamar</ion-item>
      <ion-item button (click)="close()"><ion-icon name="chatbubble-ellipses-outline" slot="start"></ion-icon>Enviar mensaje</ion-item>
      <ion-item button lines="none" (click)="close()"><ion-icon name="document-text-outline" slot="start"></ion-icon>Ver historial</ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [IonicModule],
})
export class ProfileActionPopoverComponent {
  private popoverController = inject(PopoverController);
  close() { this.popoverController.dismiss(); }
}

@Component({
  selector: 'app-filter-popover',
  template: `
    <ion-list>
      <ion-item button (click)="close()">Por fecha</ion-item>
      <ion-item button (click)="close()">Por nombre</ion-item>
      <ion-item button (click)="close()">Por estado</ion-item>
      <ion-item button lines="none" (click)="close()">Limpiar filtros</ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [IonicModule],
})
export class FilterPopoverComponent {
  private popoverController = inject(PopoverController);
  close() { this.popoverController.dismiss(); }
}

@Component({
  selector: 'app-action-popover',
  template: `
    <ion-list>
      <ion-item button (click)="close()">Ver perfil</ion-item>
      <ion-item button (click)="close()">Editar</ion-item>
      <ion-item button (click)="close()">Historial</ion-item>
      <ion-item button lines="none" (click)="close()">Eliminar</ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [IonicModule],
})
export class ActionPopoverComponent {
  private popoverController = inject(PopoverController);
  close() { this.popoverController.dismiss(); }
}
