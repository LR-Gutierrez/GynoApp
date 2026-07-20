import { Component, signal, inject, ViewChild, OnInit } from '@angular/core';
import { IonicModule, AlertController, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoPhotoThumbnailComponent } from 'src/app/shared/components/gyno-photo-thumbnail/gyno-photo-thumbnail.component';
import { GynoSectionHeaderComponent } from 'src/app/shared/components/gyno-section-header/gyno-section-header.component';
import { GynoPinInputComponent } from 'src/app/shared/components/gyno-pin-input/gyno-pin-input.component';
import { GynoPhotoViewerComponent } from 'src/app/shared/components/gyno-photo-viewer/gyno-photo-viewer.component';
import { GynoActionPopoverComponent, GynoActionItem } from 'src/app/shared/components/gyno-action-popover/gyno-action-popover.component';
import { PatientService } from 'src/app/core/services/patient.service';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { EncryptedPhotoService } from 'src/app/core/services/encrypted-photo.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SettingsService } from 'src/app/core/services/settings.service';
import { RecetaPdfService } from 'src/app/core/services/receta-pdf.service';
import { Patient, Consultation } from 'src/app/shared/models/patient.model';

@Component({
  selector: 'app-consultation-detail',
  templateUrl: './consultation-detail.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterModule,
    GynoPageHeaderComponent,
    GynoPhotoThumbnailComponent,
    GynoSectionHeaderComponent,
    GynoPinInputComponent,
    GynoPhotoViewerComponent,
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
export class ConsultationDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);
  private encryptedPhotoService = inject(EncryptedPhotoService);
  private auth = inject(AuthService);
  private settings = inject(SettingsService);
  private alertCtrl = inject(AlertController);
  private popoverCtrl = inject(PopoverController);
  private recetaPdf = inject(RecetaPdfService);

  @ViewChild('photoViewer') photoViewer!: GynoPhotoViewerComponent;

  readonly loading = signal(true);
  readonly consultation = signal<Consultation | null>(null);
  readonly patient = signal<Patient | null>(null);
  readonly photos = signal<{ id: string; src: string; consultationId: string; mimeType: string }[]>([]);

  readonly galleryUnlocked = signal(false);
  readonly galleryLoading = signal(false);
  private timeFormat = signal<'12h' | '24h'>('24h');

  get headerTitle(): string {
    return this.patient()?.name ?? 'Consulta';
  }

  get dateLabel(): string {
    const c = this.consultation();
    if (!c) return '';
    const [y, m, d] = c.date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    let label = `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    if (c.time) label += ` · ${this.settings.formatTime(c.time, this.timeFormat())}`;
    return label;
  }

  async ngOnInit() {
    this.loading.set(true);
    try {
      const consultationId = this.route.snapshot.paramMap.get('consultationId') ?? '';
      const patientId = this.route.snapshot.paramMap.get('id') ?? '';

      const [c, p, tf] = await Promise.all([
        this.consultationService.getById(consultationId),
        this.patientService.getById(patientId),
        this.settings.getTimeFormat(),
      ]);
      this.timeFormat.set(tf);

      this.consultation.set(c);
      this.patient.set(p);

      if (c) {
        const loaded = await this.encryptedPhotoService.loadPhotos(c.id);
        this.photos.set(loaded.map(photo => ({
          id: photo.id,
          src: photo.src,
          consultationId: c.id,
          mimeType: photo.mimeType,
        })));
      }
    } catch (e) {
      console.error('Error loading consultation detail:', e);
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    history.back();
  }

  async showActions(event: MouseEvent) {
    const c = this.consultation();
    if (!c) return;

    const actions: GynoActionItem[] = [
      { value: 'edit', label: 'Editar', icon: 'mgc_edit_2_line' },
    ];

    if (c.receta) {
      actions.push({ value: 'export-pdf', label: 'Exportar receta PDF', icon: 'mgc_pdf_line' });
    }

    if (c.status === 'programada') {
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
      this.edit();
    } else if (data?.action === 'export-pdf') {
      this.exportRecetaPdf();
    } else if (data?.action === 'delete') {
      this.delete();
    } else if (data?.action === 'mark-attended') {
      this.edit(true);
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
              await this.consultationService.updateStatus(c.id, 'cancelada');
              this.consultation.update(v => v ? { ...v, status: 'cancelada' } : v);
            },
          },
        ],
      });
      await alert.present();
    }
  }

  edit(markAttended?: boolean) {
    const c = this.consultation();
    const patientId = this.route.snapshot.paramMap.get('id');
    if (c && patientId) {
      this.router.navigate(['/home/patient', patientId, 'consultation', 'new'], {
        queryParams: { edit: c.id, ...(markAttended ? { markAttended: 'true' } : {}) },
      });
    }
  }

  private async exportRecetaPdf() {
    const c = this.consultation();
    const p = this.patient();
    if (!c || !p) return;
    const blob = await this.recetaPdf.generate(c, p.name);

    if (Capacitor.isNativePlatform()) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const fileName = `receta-${p.name.replace(/\s+/g, '_')}.pdf`;
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
      const uri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({ files: [uri.uri], title: `Receta - ${p.name}` });
    } else {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  }

  async delete() {
    const c = this.consultation();
    if (!c) return;
    const alert = await this.alertCtrl.create({
      header: 'Eliminar consulta',
      message: '¿Estás segura de eliminar esta consulta? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const patientId = this.route.snapshot.paramMap.get('id');
            await this.encryptedPhotoService.deleteAllForConsultation(c.id);
            await this.consultationService.delete(c.id);
            if (patientId) {
              this.router.navigate(['/home/patient', patientId]);
            } else {
              this.router.navigate(['/home']);
            }
          },
        },
      ],
    });
    await alert.present();
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

  async takePhoto() {
    try {
      let dataUrl: string;
      let mimeType = 'image/jpeg';
      if (Capacitor.isNativePlatform()) {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
        });
        const path = image.path ?? image.webPath!;
        const reader = new FileReader();
        const blob = await fetch(path).then(r => r.blob());
        dataUrl = await new Promise<string>(resolve => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        mimeType = blob.type || 'image/jpeg';
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) { reject(); return; }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject();
            reader.readAsDataURL(file);
          };
          input.oncancel = () => reject();
          input.click();
        });
      }

      const consultationId = this.consultation()?.id;
      if (!consultationId) return;

      const photoIds = await this.encryptedPhotoService.savePhotos(consultationId, [
        { dataUrl, mimeType },
      ]);

      const loaded = await this.encryptedPhotoService.loadPhotos(consultationId);
      this.photos.set(loaded.map(photo => ({
        id: photo.id,
        src: photo.src,
        consultationId,
        mimeType: photo.mimeType,
      })));

      const c = this.consultation();
      if (c) {
        c.photoIds = [...c.photoIds, ...photoIds];
        await this.consultationService.update(c);
      }
    } catch {
      // user cancelled
    }
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

  async unlockGallery() {
    this.galleryLoading.set(true);
    if (Capacitor.isNativePlatform()) {
      try {
        await BiometricAuth.authenticate({
          reason: 'Desbloquea las fotos de esta consulta',
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
        reason: 'Desbloquea las fotos de esta consulta',
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

  lockGallery() {
    this.galleryUnlocked.set(false);
  }

  ionViewWillLeave() {
    this.encryptedPhotoService.revokeAll();
  }
}
