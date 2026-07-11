import { Component, signal, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';
import { GynoPageHeaderComponent } from 'src/app/shared/components/gyno-page-header/gyno-page-header.component';
import { GynoPhotoThumbnailComponent } from 'src/app/shared/components/gyno-photo-thumbnail/gyno-photo-thumbnail.component';
import { GynoSectionHeaderComponent } from 'src/app/shared/components/gyno-section-header/gyno-section-header.component';

interface TimelineConsultation {
  id: string;
  date: Date;
  dateLabel: string;
  title: string;
  description: string;
}

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
export class ConsultationDetailPage {
  private route = inject(ActivatedRoute);

  readonly consultationId = signal('');
  readonly galleryUnlocked = signal(false);
  readonly galleryLoading = signal(false);

  readonly allConsultations: TimelineConsultation[] = [
    {
      id: 'c3',
      date: new Date('2026-06-15'),
      dateLabel: '15 JUN, 2026',
      title: 'Control de rutina',
      description:
        'Presión arterial normal. Peso estable. Se recomienda continuar con tratamiento actual y próxima cita en 3 meses. La paciente reporta sentirse bien y no presenta molestias. Se realiza evaluación física completa y se encuentran resultados dentro de parámetros normales. Se recomienda mantener hábitos saludables y seguir con el tratamiento prescrito.',
    },
    {
      id: 'c2',
      date: new Date('2026-03-10'),
      dateLabel: '10 MAR, 2026',
      title: 'Seguimiento prenatal',
      description:
        'Ecografía de control muestra desarrollo fetal normal. Se ajusta suplemento de hierro. La paciente se encuentra en buen estado general, con parámetros vitales estables. Se realiza medición de altura uterina y se ausculta frecuencia cardíaca fetal dentro de rangos normales. Próxima cita en 4 semanas.',
    },
    {
      id: 'c1',
      date: new Date('2025-11-22'),
      dateLabel: '22 NOV, 2025',
      title: 'Primera consulta',
      description:
        'Paciente acude por primera vez. Se realiza historia clínica completa y exámenes de laboratorio generales. Se discuten antecedentes familiares y personales. No se reportan alergias conocidas. Se establece plan de seguimiento y se solicitan estudios complementarios.',
    },
  ];

  readonly allPhotos = [
    { id: 'p1', src: 'https://picsum.photos/seed/gyno1/400/400', consultationId: 'c3' },
    { id: 'p2', src: 'https://picsum.photos/seed/gyno2/400/400', consultationId: 'c3' },
    { id: 'p3', src: 'https://picsum.photos/seed/gyno3/400/400', consultationId: 'c2' },
    { id: 'p4', src: 'https://picsum.photos/seed/gyno4/400/400', consultationId: 'c2' },
    { id: 'p5', src: 'https://picsum.photos/seed/gyno5/400/400', consultationId: 'c1' },
    { id: 'p6', src: 'https://picsum.photos/seed/gyno6/400/400', consultationId: 'c1' },
  ];

  get consultation(): TimelineConsultation | undefined {
    return this.allConsultations.find(c => c.id === this.consultationId());
  }

  get photos() {
    return this.allPhotos.filter(p => p.consultationId === this.consultationId());
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
    return this.photos;
  }

  get photoCount(): number {
    return this.viewerPhotos.length;
  }

  constructor() {
    this.consultationId.set(this.route.snapshot.paramMap.get('consultationId') ?? '');
    document.addEventListener('ionBackButton', (ev: any) => {
      if (this.selectedIndex() >= 0) {
        ev.detail.register(10, () => this.closePhoto());
      }
    });
  }

  goBack() {
    history.back();
  }

  openPhoto(src: string, single = false) {
    const idx = this.viewerPhotos.findIndex(p => p.src === src);
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
    if (idx < this.viewerPhotos.length - 1) {
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
      if (dx < 0 && idx < this.viewerPhotos.length - 1) {
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

    if (dx < -threshold && idx < this.viewerPhotos.length - 1) {
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

  async unlockSinglePhoto(src: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        await BiometricAuth.authenticate({
          reason: 'Desbloquea esta foto',
        });
        this.openPhoto(src, true);
      } catch {
        // Usuario canceló o falló la autenticación
      }
    } else {
      this.openPhoto(src, true);
    }
  }

  async unlockGallery() {
    this.galleryLoading.set(true);
    let success = false;
    if (Capacitor.isNativePlatform()) {
      try {
        await BiometricAuth.authenticate({
          reason: 'Desbloquea las fotos de esta consulta',
        });
        success = true;
      } catch {
        success = false;
      }
    } else {
      success = true;
    }
    this.galleryUnlocked.set(success);
    this.galleryLoading.set(false);
  }

  lockGallery() {
    this.galleryUnlocked.set(false);
  }
}
