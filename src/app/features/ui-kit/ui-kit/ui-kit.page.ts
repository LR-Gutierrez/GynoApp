import { Component, inject } from '@angular/core';
import { IonicModule, ToastController, AlertController, PopoverController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GynoPatientCardComponent } from 'src/app/shared/components/gyno-patient-card/gyno-patient-card.component';
import { GynoConsultationCardComponent } from 'src/app/shared/components/gyno-consultation-card/gyno-consultation-card.component';
import { GynoStatusCardComponent } from 'src/app/shared/components/gyno-status-card/gyno-status-card.component';
import { GynoFormFieldComponent } from 'src/app/shared/components/gyno-form-field/gyno-form-field.component';
import { GynoSearchBarComponent } from 'src/app/shared/components/gyno-search-bar/gyno-search-bar.component';
import { GynoPhotoThumbnailComponent } from 'src/app/shared/components/gyno-photo-thumbnail/gyno-photo-thumbnail.component';
import { GynoEmptyStateComponent } from 'src/app/shared/components/gyno-empty-state/gyno-empty-state.component';
import { GynoLoadingOverlayComponent } from 'src/app/shared/components/gyno-loading-overlay/gyno-loading-overlay.component';
import { GynoConfirmDialogComponent } from 'src/app/shared/components/gyno-confirm-dialog/gyno-confirm-dialog.component';
import { GynoSecurityBadgeComponent } from 'src/app/shared/components/gyno-security-badge/gyno-security-badge.component';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoPatientTableComponent } from 'src/app/shared/components/gyno-patient-table/gyno-patient-table.component';
import { GynoFabComponent } from 'src/app/shared/components/gyno-fab/gyno-fab.component';
import { GynoSectionHeaderComponent } from 'src/app/shared/components/gyno-section-header/gyno-section-header.component';
import { GynoFilterPopoverComponent } from 'src/app/shared/components/gyno-filter-popover/gyno-filter-popover.component';
import { GynoActionPopoverComponent } from 'src/app/shared/components/gyno-action-popover/gyno-action-popover.component';
import { Patient, Consultation } from 'src/app/shared/models/patient.model';
import { StatusChip } from 'src/app/shared/components/gyno-status-card/gyno-status-card.component';
import { TablePatient } from 'src/app/shared/components/gyno-patient-table/gyno-patient-table.component';
import { phoneMask, digitsOnlyMask, lettersOnlyMask } from 'src/app/shared/utils/masks';

@Component({
  selector: 'app-ui-kit',
  templateUrl: './ui-kit.page.html',
  styleUrls: ['./ui-kit.page.scss'],
  standalone: true,
  imports: [
    IonicModule, CommonModule, FormsModule,
    GynoPatientCardComponent, GynoConsultationCardComponent, GynoStatusCardComponent,
    GynoFormFieldComponent, GynoSearchBarComponent, GynoPhotoThumbnailComponent,
    GynoEmptyStateComponent, GynoLoadingOverlayComponent, GynoConfirmDialogComponent,
    GynoSecurityBadgeComponent, GynoPageHeaderComponent, GynoPatientTableComponent,
    GynoFabComponent, GynoSectionHeaderComponent, GynoFilterPopoverComponent, GynoActionPopoverComponent,
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
      component: GynoFilterPopoverComponent,
      event, side: 'bottom', alignment: 'start', showBackdrop: false,
    });
    await popover.present();
  }

  async openActionPopover(event: MouseEvent, patientName: string) {
    const popover = await this.popoverController.create({
      component: GynoActionPopoverComponent,
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


