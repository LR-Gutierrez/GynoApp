import { Component, signal, inject, HostListener, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoPhotoThumbnailComponent } from 'src/app/shared/components/gyno-photo-thumbnail/gyno-photo-thumbnail.component';
import { GynoSectionHeaderComponent } from 'src/app/shared/components/gyno-section-header/gyno-section-header.component';
import { GynoPinInputComponent } from 'src/app/shared/components/gyno-pin-input/gyno-pin-input.component';
import { PatientService } from 'src/app/core/services/patient.service';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { EncryptedPhotoService } from 'src/app/core/services/encrypted-photo.service';
import { AuthService } from 'src/app/core/services/auth.service';
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
export class ConsultationDetailPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);
  private encryptedPhotoService = inject(EncryptedPhotoService);
  private auth = inject(AuthService);

  readonly loading = signal(true);
  readonly consultation = signal<Consultation | null>(null);
  readonly patient = signal<Patient | null>(null);
  readonly photos = signal<{ id: string; src: string; consultationId: string; mimeType: string }[]>([]);

  readonly galleryUnlocked = signal(false);
  readonly galleryLoading = signal(false);

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
    if (c.time) label += ` · ${c.time}`;
    return label;
  }

  async ngOnInit() {
    this.loading.set(true);
    try {
      const consultationId = this.route.snapshot.paramMap.get('consultationId') ?? '';
      const patientId = this.route.snapshot.paramMap.get('id') ?? '';

      const [c, p] = await Promise.all([
        this.consultationService.getById(consultationId),
        this.patientService.getById(patientId),
      ]);

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
    const patientId = this.route.snapshot.paramMap.get('id');
    if (patientId) {
      this.router.navigate(['/home/patient', patientId]);
    } else {
      this.router.navigate(['/home']);
    }
  }

  // Photo viewer

  readonly selectedIndex = signal(-1);
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

  private lastTapTime = 0;
  private tapTimer: ReturnType<typeof setTimeout> | null = null;

  get viewerPhotos() {
    return this.photos();
  }

  get photoCount(): number {
    return this.photos().length;
  }

  constructor() {
    document.addEventListener('ionBackButton', (ev: any) => {
      if (this.selectedIndex() >= 0) {
        ev.detail.register(10, () => this.closePhoto());
      }
    });
  }

  openPhoto(src: string, single = false) {
    const idx = this.photos().findIndex(p => p.src === src);
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
    if (idx < this.photos().length - 1) {
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
      if (dx < 0 && idx < this.photos().length - 1) {
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

    if (dx < -threshold && idx < this.photos().length - 1) {
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

  lockGallery() {
    this.galleryUnlocked.set(false);
  }

  ionViewWillLeave() {
    this.encryptedPhotoService.revokeAll();
  }
}
