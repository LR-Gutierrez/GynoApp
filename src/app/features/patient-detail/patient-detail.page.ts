import { Component, signal, computed, inject, ViewChild } from '@angular/core';
import { IonicModule, PopoverController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoAvatarComponent } from 'src/app/shared/components/gyno-avatar/gyno-avatar.component';
import { GynoPhotoThumbnailComponent } from 'src/app/shared/components/gyno-photo-thumbnail/gyno-photo-thumbnail.component';
import { GynoSectionHeaderComponent } from 'src/app/shared/components/gyno-section-header/gyno-section-header.component';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { GynoPinInputComponent } from 'src/app/shared/components/gyno-pin-input/gyno-pin-input.component';
import { GynoPhotoViewerComponent } from 'src/app/shared/components/gyno-photo-viewer/gyno-photo-viewer.component';
import { GynoActionPopoverComponent, GynoActionItem } from 'src/app/shared/components/gyno-action-popover/gyno-action-popover.component';
import { PatientService } from 'src/app/core/services/patient.service';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { EncryptedPhotoService } from 'src/app/core/services/encrypted-photo.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SettingsService } from 'src/app/core/services/settings.service';
import { Patient, Consultation, calculateAge, gestacionalWeeks } from 'src/app/shared/models/patient.model';

interface TimelineConsultation {
  id: string;
  date: Date;
  dateLabel: string;
  timeLabel: string;
  title: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterModule,
    GynoPageHeaderComponent,
    GynoAvatarComponent,
    GynoPhotoThumbnailComponent,
    GynoSectionHeaderComponent,
    GynoBottomNavComponent,
    GynoPinInputComponent,
    GynoPhotoViewerComponent,
    GynoActionPopoverComponent,
  ],
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
      .gallery-item {
        animation: gallerySlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes gallerySlideUp {
        from { opacity: 0; transform: translateY(16px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
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
export class PatientDetailPage {
  readonly loadingPatient = signal(true);
  readonly loadingConsultations = signal(true);
  readonly patient = signal<Patient | null>(null);
  readonly patientAge = computed(() => {
    const p = this.patient();
    return p ? calculateAge(p.birthDate) : 0;
  });
  readonly gestacionalWeeks = computed(() => {
    const p = this.patient();
    return p?.FUR ? gestacionalWeeks(p.FUR) : null;
  });
  readonly consultations = signal<TimelineConsultation[]>([]);
  readonly encryptedPhotos = signal<{ id: string; src: string; consultationId: string; mimeType: string }[]>([]);

  readonly galleryUnlocked = signal(false);
  readonly galleryLoading = signal(false);
  @ViewChild('photoViewer') photoViewer!: GynoPhotoViewerComponent;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);
  private encryptedPhotoService = inject(EncryptedPhotoService);
  private auth = inject(AuthService);
  private settings = inject(SettingsService);
  private popoverCtrl = inject(PopoverController);
  private alertCtrl = inject(AlertController);

  async ionViewWillEnter() {
    this.loadingPatient.set(true);
    this.loadingConsultations.set(true);
    try {
      const id = this.route.snapshot.paramMap.get('id')!;
      const p = await this.patientService.getById(id);
      this.patient.set(p);
      this.loadingPatient.set(false);

      if (p) {
        await this.loadConsultations();
      }
    } catch (e) {
      console.error('Error loading patient:', e);
    } finally {
      this.loadingPatient.set(false);
      this.loadingConsultations.set(false);
    }
  }

  private async loadConsultations() {
    const p = this.patient();
    if (!p) return;

    const [cons, timeFormat] = await Promise.all([
      this.consultationService.getByPatient(p.id),
      this.settings.getTimeFormat(),
    ]);

    this.consultations.set(
      cons.map((c) => ({
        id: c.id,
        date: new Date(c.date),
        dateLabel: this.formatDateLabel(c.date),
        timeLabel: this.settings.formatTime(c.time, timeFormat),
        title: c.motivo,
        description: c.diagnostico + (c.tratamiento ? `\nTx: ${c.tratamiento}` : ''),
        status: c.status,
      }))
    );

    const consultationIds = cons.map(c => c.id);
    if (consultationIds.length > 0) {
      const photos = await this.encryptedPhotoService.loadAllPhotos(consultationIds);
      this.encryptedPhotos.set(photos);
    }
  }

  private formatDateLabel(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  navigateToConsultation(consultationId: string) {
    this.router.navigate(['/home/patient', this.patient()?.id, 'consultation', consultationId]);
  }

  async showConsultationActions(event: MouseEvent, consultationId: string) {
    const cons = this.consultations().find(c => c.id === consultationId);
    const actions: GynoActionItem[] = [
      { value: 'edit', label: 'Editar', icon: 'mgc_edit_2_line' },
    ];

    if (cons?.status === 'programada') {
      actions.push({ value: 'mark-attended', label: 'Marcar como atendida', icon: 'mgc_check_line' });
      actions.push({ value: 'mark-cancelled', label: 'Cancelar consulta', icon: 'mgc_close_line', destructive: true });
    }

    actions.push({ value: 'delete', label: 'Eliminar', icon: 'mgc_delete_back_line', destructive: true });

    const popover = await this.popoverCtrl.create({
      component: GynoActionPopoverComponent,
      componentProps: { actions },
      event,
      side: 'bottom',
      alignment: 'start',
      showBackdrop: false,
    });
    await popover.present();
    const { data } = await popover.onWillDismiss();
    if (data?.action === 'edit') {
      this.editConsultation(consultationId);
    } else if (data?.action === 'delete') {
      this.deleteConsultation(consultationId);
    } else if (data?.action === 'mark-attended') {
      this.editConsultation(consultationId, true);
    } else if (data?.action === 'mark-cancelled') {
      const alert = await this.alertCtrl.create({
        header: 'Cancelar consulta',
        message: '¿Estás segura de cancelar esta consulta?',
        buttons: [
          { text: 'No', role: 'cancel' },
          {
            text: 'Sí, cancelar',
            role: 'destructive',
            handler: async () => {
              await this.consultationService.updateStatus(consultationId, 'cancelada');
              await this.loadConsultations();
            },
          },
        ],
      });
      await alert.present();
    }
  }

  editConsultation(consultationId: string, markAttended?: boolean) {
    const patientId = this.patient()?.id;
    if (patientId) {
      this.router.navigate(['/home/patient', patientId, 'consultation', 'new'], {
        queryParams: { edit: consultationId, ...(markAttended ? { markAttended: 'true' } : {}) },
      });
    }
  }

  async deleteConsultation(consultationId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar consulta',
      message: '¿Estás segura de eliminar esta consulta? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.encryptedPhotoService.deleteAllForConsultation(consultationId);
            await this.consultationService.delete(consultationId);
            await this.loadConsultations();
          },
        },
      ],
    });
    await alert.present();
  }

  editPatient() {
    const patientId = this.patient()?.id;
    if (patientId) {
      this.router.navigate(['/home/patient', patientId, 'edit']);
    }
  }

  newConsultation() {
    this.router.navigate(['/home/patient', this.patient()?.id, 'consultation', 'new']);
  }

  callPatient() {
    const p = this.patient();
    if (p) window.open(`tel:${p.phone}`, '_system');
  }

  sendWhatsApp() {
    const p = this.patient();
    if (p) {
      const msg = encodeURIComponent(`Hola ${p.name}, te escribe la Dra.`);
      window.open(`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_system');
    }
  }

  openPhoto(src: string) {
    this.photoViewer.openPhoto(src);
  }

  readonly showPinInput = signal(false);
  readonly showBiometric = signal(false);
  readonly pinError = signal('');
  readonly pinResetKey = signal(0);
  private pendingPinSrc = '';

  async onPinUnlocked(pin: string) {
    const { valid } = await this.auth.verifyPin(pin);
    if (!valid) {
      this.pinError.set('PIN incorrecto');
      this.pinResetKey.update(n => n + 1);
      return;
    }
    this.pinError.set('');
    this.showPinInput.set(false);
    if (this.pendingPinSrc) {
      this.openPhoto(this.pendingPinSrc);
      this.pendingPinSrc = '';
    } else {
      this.galleryUnlocked.set(true);
    }
    this.galleryLoading.set(false);
  }

  onPinChanged() {
    this.pinError.set('');
  }

  onPinCancelled() {
    this.showPinInput.set(false);
    this.pendingPinSrc = '';
    this.galleryLoading.set(false);
    this.pinError.set('');
  }

  async unlockSinglePhoto(src: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        await BiometricAuth.authenticate({
          reason: 'Desbloquea esta foto',
        });
        this.openPhoto(src);
        return;
      } catch {
        // biometric failed/cancelled → fallback to PIN
      }
    }
    this.pendingPinSrc = src;
    this.showBiometric.set(Capacitor.isNativePlatform());
    this.showPinInput.set(true);
  }

  lockGallery() {
    this.galleryUnlocked.set(false);
  }

  async unlockGallery() {
    this.galleryLoading.set(true);
    if (Capacitor.isNativePlatform()) {
      try {
        await BiometricAuth.authenticate({
          reason: 'Desbloquea las fotos de la paciente',
        });
        this.galleryUnlocked.set(true);
        this.galleryLoading.set(false);
        return;
      } catch {
        // biometric failed/cancelled → fallback to PIN
      }
    }
    this.showBiometric.set(Capacitor.isNativePlatform());
    this.showPinInput.set(true);
  }

  async onBiometricClick() {
    try {
      await BiometricAuth.authenticate({
        reason: 'Desbloquea las fotos de la paciente',
      });
      this.showPinInput.set(false);
      if (this.pendingPinSrc) {
        this.openPhoto(this.pendingPinSrc);
        this.pendingPinSrc = '';
      } else {
        this.galleryUnlocked.set(true);
      }
      this.galleryLoading.set(false);
    } catch {
      // user cancelled biometric in the PIN modal — stay on PIN
    }
  }

  ionViewWillLeave() {
    this.encryptedPhotoService.revokeAll();
  }
}
