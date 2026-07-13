import { Component, signal, computed, inject, HostListener } from '@angular/core';
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
import { GynoActionPopoverComponent, GynoActionItem } from 'src/app/shared/components/gyno-action-popover/gyno-action-popover.component';
import { PatientService } from 'src/app/core/services/patient.service';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { EncryptedPhotoService } from 'src/app/core/services/encrypted-photo.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Patient, Consultation, calculateAge } from 'src/app/shared/models/patient.model';

interface TimelineConsultation {
  id: string;
  date: Date;
  dateLabel: string;
  timeLabel: string;
  title: string;
  description: string;
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
      .viewer-enter {
        animation: viewerFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes viewerFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .chrome-visible {
        opacity: 1;
        transition: opacity 0.25s ease;
      }
      .chrome-hidden {
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
      }
      .dot-active {
        opacity: 1;
        transform: scale(1);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .dot-inactive {
        opacity: 0.4;
        transform: scale(0.85);
        transition: all 0.2s ease;
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
  readonly consultations = signal<TimelineConsultation[]>([]);
  readonly encryptedPhotos = signal<{ id: string; src: string; consultationId: string; mimeType: string }[]>([]);

  readonly galleryUnlocked = signal(false);
  readonly galleryLoading = signal(false);
  readonly selectedIndex = signal(-1);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);
  private encryptedPhotoService = inject(EncryptedPhotoService);
  private auth = inject(AuthService);
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

    const cons = await this.consultationService.getByPatient(p.id);
    this.consultations.set(
      cons.map((c) => ({
        id: c.id,
        date: new Date(c.date),
        dateLabel: this.formatDateLabel(c.date),
        timeLabel: c.time ?? '',
        title: c.motivo,
        description: c.diagnostico + (c.tratamiento ? `\nTx: ${c.tratamiento}` : ''),
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

  constructor() {
    document.addEventListener('ionBackButton', (ev: any) => {
      if (this.selectedIndex() >= 0) {
        ev.detail.register(10, () => this.closePhoto());
      }
    });
  }

  get selectedPhoto(): string | null {
    const idx = this.selectedIndex();
    const photos = this.encryptedPhotos();
    return idx >= 0 && idx < photos.length ? photos[idx].src : null;
  }

  get photoCount(): number {
    return this.encryptedPhotos().length;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  navigateToConsultation(consultationId: string) {
    this.router.navigate(['/home/patient', this.patient()?.id, 'consultation', consultationId]);
  }

  async showConsultationActions(event: MouseEvent, consultationId: string) {
    const actions: GynoActionItem[] = [
      { value: 'edit', label: 'Editar', icon: 'mgc_edit_2_line' },
      { value: 'delete', label: 'Eliminar', icon: 'mgc_delete_back_line', destructive: true },
    ];

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
    }
  }

  editConsultation(consultationId: string) {
    const patientId = this.patient()?.id;
    if (patientId) {
      this.router.navigate(['/home/patient', patientId, 'consultation', 'new'], {
        queryParams: { edit: consultationId },
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

  readonly chromeVisible = signal(true);
  private chromeTimer: ReturnType<typeof setTimeout> | null = null;
  imageLoaded = signal(false);
  readonly singlePhotoView = signal(false);

  readonly viewerDragX = signal(0);
  readonly viewerDragActive = signal(false);
  readonly viewerZoom = signal(1);
  readonly swipeTargetIdx = signal(-1);
  private dragStartX = 0;
  viewWidth = 0;
  private isAnimatingSwipe = false;

  private pinchStartDist = 0;
  private pinchStartZoom = 1;
  private isPinching = false;

  private panStartX = 0;
  private panStartY = 0;
  private panStartScrollLeft = 0;
  private panStartScrollTop = 0;
  private isPanning = false;

  openPhoto(src: string, single = false) {
    const idx = this.encryptedPhotos().findIndex(p => p.src === src);
    this.selectedIndex.set(idx);
    this.viewerZoom.set(1);
    this.viewerDragX.set(0);
    this.viewerDragActive.set(false);
    this.swipeTargetIdx.set(-1);
    this.isPanning = false;
    this.isAnimatingSwipe = false;
    this.imageLoaded.set(false);
    this.singlePhotoView.set(single);
    document.body.style.overflow = 'hidden';
    this.showChromeTemporarily();
  }

  closePhoto() {
    this.selectedIndex.set(-1);
    this.viewerZoom.set(1);
    this.viewerDragX.set(0);
    this.swipeTargetIdx.set(-1);
    this.isAnimatingSwipe = false;
    this.singlePhotoView.set(false);
    document.body.style.overflow = '';
    if (this.chromeTimer) clearTimeout(this.chromeTimer);
  }

  @HostListener('window:keydown', ['$event'])
  onViewerKeydown(e: KeyboardEvent) {
    if (this.selectedIndex() < 0) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prevPhoto();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.nextPhoto();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.closePhoto();
    }
  }

  onViewerClick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest('.chrome-area, button, .dot')) return;
    if (this.chromeVisible()) {
      this.hideChrome();
    } else {
      this.showChromeTemporarily();
    }
  }

  showChromeTemporarily() {
    this.chromeVisible.set(true);
    if (this.chromeTimer) clearTimeout(this.chromeTimer);
    this.chromeTimer = setTimeout(() => this.hideChrome(), 3000);
  }

  hideChrome() {
    this.chromeVisible.set(false);
    if (this.chromeTimer) {
      clearTimeout(this.chromeTimer);
      this.chromeTimer = null;
    }
  }

  onImageLoad() {
    this.imageLoaded.set(true);
  }

  prevPhoto($event?: MouseEvent) {
    if (this.singlePhotoView()) return;
    $event?.stopPropagation();
    const idx = this.selectedIndex();
    if (idx > 0) {
      this.selectedIndex.set(idx - 1);
      this.viewerZoom.set(1);
      this.viewerDragX.set(0);
      this.swipeTargetIdx.set(-1);
      this.isPanning = false;
      this.imageLoaded.set(false);
      this.showChromeTemporarily();
    }
  }

  nextPhoto($event?: MouseEvent) {
    if (this.singlePhotoView()) return;
    $event?.stopPropagation();
    const idx = this.selectedIndex();
    if (idx < this.encryptedPhotos().length - 1) {
      this.selectedIndex.set(idx + 1);
      this.viewerZoom.set(1);
      this.viewerDragX.set(0);
      this.swipeTargetIdx.set(-1);
      this.isPanning = false;
      this.imageLoaded.set(false);
      this.showChromeTemporarily();
    }
  }

  private getPointerX(e: TouchEvent | MouseEvent): number {
    return 'touches' in e ? e.touches[0].clientX : e.clientX;
  }

  private getPointerXEnd(e: TouchEvent | MouseEvent): number {
    return 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
  }

  private getPinchDist(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  private getScrollContainer(e: TouchEvent | MouseEvent): HTMLElement | null {
    const el = 'currentTarget' in e ? (e.currentTarget as HTMLElement) : null;
    return el?.querySelector('.overflow-auto') ?? null;
  }

  onDragStart(e: TouchEvent | MouseEvent) {
    if (this.isAnimatingSwipe) return;
    if ('touches' in e && e.touches.length >= 2) {
      this.isPinching = true;
      this.pinchStartDist = this.getPinchDist(e.touches);
      this.pinchStartZoom = this.viewerZoom();
      return;
    }
    this.isPinching = false;
    if (this.viewerZoom() > 1) {
      this.isPanning = true;
      const clientX = this.getPointerX(e);
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      this.panStartX = clientX;
      this.panStartY = clientY;
      const container = this.getScrollContainer(e);
      if (container) {
        this.panStartScrollLeft = container.scrollLeft;
        this.panStartScrollTop = container.scrollTop;
      }
      return;
    }
    this.isPanning = false;
    if (this.singlePhotoView()) return;
    this.viewWidth = window.innerWidth;
    this.dragStartX = this.getPointerX(e);
    this.viewerDragX.set(0);
    this.viewerDragActive.set(true);
    this.swipeTargetIdx.set(-1);
  }

  onDragMove(e: TouchEvent | MouseEvent) {
    if (this.isPinching && 'touches' in e && e.touches.length >= 2) {
      e.preventDefault();
      const dist = this.getPinchDist(e.touches);
      const ratio = dist / this.pinchStartDist;
      this.viewerZoom.set(Math.max(1, Math.min(5, this.pinchStartZoom * ratio)));
      return;
    }
    if (this.isPanning) {
      e.preventDefault();
      const clientX = this.getPointerX(e);
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const dx = clientX - this.panStartX;
      const dy = clientY - this.panStartY;
      const container = this.getScrollContainer(e);
      if (container) {
        container.scrollLeft = this.panStartScrollLeft - dx;
        container.scrollTop = this.panStartScrollTop - dy;
      }
      return;
    }
    if (!this.viewerDragActive()) return;
    e.preventDefault();
    const dx = this.getPointerX(e) - this.dragStartX;
    this.viewerDragX.set(dx);

    const idx = this.selectedIndex();
    if (!this.singlePhotoView() && this.swipeTargetIdx() === -1 && Math.abs(dx) > 10) {
      if (dx < 0 && idx < this.encryptedPhotos().length - 1) {
        this.swipeTargetIdx.set(idx + 1);
      } else if (dx > 0 && idx > 0) {
        this.swipeTargetIdx.set(idx - 1);
      }
    }
  }

  onDragEnd(e: TouchEvent | MouseEvent) {
    if (this.isPinching) {
      this.isPinching = false;
      return;
    }
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }
    if (!this.viewerDragActive()) return;
    this.viewerDragActive.set(false);
    const dx = this.getPointerXEnd(e) - this.dragStartX;
    const idx = this.selectedIndex();

    if (this.singlePhotoView()) {
      this.swipeTargetIdx.set(-1);
      this.viewerDragX.set(0);
      return;
    }

    const threshold = this.viewWidth * 0.25;

    if (dx < -threshold && idx < this.encryptedPhotos().length - 1) {
      this.swipeTargetIdx.set(idx + 1);
      this.viewerDragX.set(-this.viewWidth);
      this.isAnimatingSwipe = true;
      setTimeout(() => {
        this.selectedIndex.set(idx + 1);
        this.viewerZoom.set(1);
        this.viewerDragX.set(0);
        this.swipeTargetIdx.set(-1);
        this.isAnimatingSwipe = false;
        this.imageLoaded.set(false);
      }, 350);
    } else if (dx > threshold && idx > 0) {
      this.swipeTargetIdx.set(idx - 1);
      this.viewerDragX.set(this.viewWidth);
      this.isAnimatingSwipe = true;
      setTimeout(() => {
        this.selectedIndex.set(idx - 1);
        this.viewerZoom.set(1);
        this.viewerDragX.set(0);
        this.swipeTargetIdx.set(-1);
        this.isAnimatingSwipe = false;
        this.imageLoaded.set(false);
      }, 350);
    } else {
      this.swipeTargetIdx.set(-1);
      this.viewerDragX.set(0);
    }
  }

  private lastTapTime = 0;
  private tapTimer: ReturnType<typeof setTimeout> | null = null;

  onPhotoClick(e: MouseEvent) {
    const img = e.currentTarget as HTMLImageElement | null;
    if (!img) return;
    const now = Date.now();
    if (now - this.lastTapTime < 300) {
      if (this.tapTimer) {
        clearTimeout(this.tapTimer);
        this.tapTimer = null;
      }
      this.lastTapTime = 0;
      e.stopPropagation();
      const zoom = this.viewerZoom();
      if (zoom > 1) {
        this.viewerZoom.set(1);
      } else {
        this.viewerZoom.set(1.5);
        img.closest('.overflow-auto')?.scrollTo({
          left: (img.scrollWidth - (img.closest('.overflow-auto')?.clientWidth ?? 0)) / 2,
          top: (img.scrollHeight - (img.closest('.overflow-auto')?.clientHeight ?? 0)) / 2,
          behavior: 'smooth',
        });
      }
      return;
    }
    this.lastTapTime = now;
  }

  readonly showPinInput = signal(false);
  readonly showBiometric = signal(false);
  readonly pinError = signal('');
  readonly pinResetKey = signal(0);
  private pendingPinSrc = '';

  async onPinUnlocked(pin: string) {
    const valid = await this.auth.verifyPin(pin);
    if (!valid) {
      this.pinError.set('PIN incorrecto');
      this.pinResetKey.update(n => n + 1);
      return;
    }
    this.pinError.set('');
    this.showPinInput.set(false);
    if (this.pendingPinSrc) {
      this.openPhoto(this.pendingPinSrc, true);
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
        this.openPhoto(src, true);
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
        this.openPhoto(this.pendingPinSrc, true);
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
