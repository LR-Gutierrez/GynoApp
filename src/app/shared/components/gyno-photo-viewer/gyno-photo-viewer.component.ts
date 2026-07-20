import { Component, input, model, signal, computed, HostListener, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface ViewerPhoto {
  id: string;
  src: string;
  consultationId: string;
  mimeType: string;
}

@Component({
  selector: 'gyno-photo-viewer',
  templateUrl: './gyno-photo-viewer.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule],
  host: { style: 'display: contents' },
  styles: [
    `
      .viewer-enter {
        animation: viewerFadeIn 0.25s ease-out;
      }
      @keyframes viewerFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .chrome-visible { opacity: 1; pointer-events: auto; }
      .chrome-hidden { opacity: 0; pointer-events: none; }
      .dot-active { background: white; transform: scale(1.15); }
      .dot-inactive { background: rgba(255,255,255,0.4); }
    `,
  ],
})
export class GynoPhotoViewerComponent {
  private sanitizer = inject(DomSanitizer);

  readonly photos = input<ViewerPhoto[]>([]);
  readonly selectedIndex = model(-1);
  readonly visible = model(false);

  readonly chromeVisible = signal(true);
  private chromeTimer: ReturnType<typeof setTimeout> | null = null;
  readonly imageLoaded = signal(false);
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

  readonly currentPhoto = computed(() => {
    const idx = this.selectedIndex();
    const all = this.photos();
    return idx >= 0 && idx < all.length ? all[idx] : null;
  });

  readonly swipeTargetPhoto = computed(() => {
    const idx = this.swipeTargetIdx();
    const all = this.photos();
    return idx >= 0 && idx < all.length ? all[idx] : null;
  });

  readonly totalPhotos = computed(() => this.photos().length);
  readonly isFirst = computed(() => this.selectedIndex() <= 0);
  readonly isLast = computed(() => this.selectedIndex() >= this.totalPhotos() - 1);

  readonly pdfUrl = computed(() => {
    const photo = this.currentPhoto();
    if (!photo || photo.mimeType !== 'application/pdf') return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(photo.src);
  });

  openPhoto(src: string) {
    const idx = this.photos().findIndex(p => p.src === src);
    this.selectedIndex.set(idx);
    this.viewerZoom.set(1);
    this.viewerDragX.set(0);
    this.viewerDragActive.set(false);
    this.swipeTargetIdx.set(-1);
    this.isPanning = false;
    this.isAnimatingSwipe = false;
    this.imageLoaded.set(false);
    this.visible.set(true);
    document.body.style.overflow = 'hidden';
    this.showChromeTemporarily();
  }

  closePhoto() {
    this.visible.set(false);
    this.selectedIndex.set(-1);
    document.body.style.overflow = '';
    if (this.chromeTimer) clearTimeout(this.chromeTimer);
  }

  @HostListener('document:ionBackButton', ['$event'])
  onBackButton(ev: any) {
    if (this.visible()) {
      ev.detail.register(10, () => this.closePhoto());
    }
  }

  @HostListener('window:keydown', ['$event'])
  onViewerKeydown(e: KeyboardEvent) {
    if (!this.visible()) return;
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); this.prevPhoto(); break;
      case 'ArrowRight': e.preventDefault(); this.nextPhoto(); break;
      case 'Escape': this.closePhoto(); break;
    }
  }

  onViewerClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.chrome-area') || target.closest('.nav-btn') || target.closest('.dot-btn')) return;
    this.toggleChrome();
  }

  private toggleChrome() {
    if (this.chromeVisible()) {
      this.chromeVisible.set(false);
      if (this.chromeTimer) clearTimeout(this.chromeTimer);
    } else {
      this.showChromeTemporarily();
    }
  }

  private showChromeTemporarily() {
    this.chromeVisible.set(true);
    if (this.chromeTimer) clearTimeout(this.chromeTimer);
    this.chromeTimer = setTimeout(() => {
      if (!this.isDraggingOrZoomed()) this.chromeVisible.set(false);
    }, 2500);
  }

  private isDraggingOrZoomed(): boolean {
    return this.viewerZoom() > 1 || this.viewerDragActive() || this.isPanning || this.isAnimatingSwipe;
  }

  hideChrome() {
    this.chromeVisible.set(false);
    if (this.chromeTimer) clearTimeout(this.chromeTimer);
  }

  onImageLoad() {
    this.imageLoaded.set(true);
  }

  prevPhoto() {
    if (this.isFirst()) return;
    this.selectedIndex.update(i => i - 1);
    this.viewerZoom.set(1);
    this.viewerDragX.set(0);
    this.imageLoaded.set(false);
    this.showChromeTemporarily();
  }

  nextPhoto() {
    if (this.isLast()) return;
    this.selectedIndex.update(i => i + 1);
    this.viewerZoom.set(1);
    this.viewerDragX.set(0);
    this.imageLoaded.set(false);
    this.showChromeTemporarily();
  }

  private getPointerX(e: MouseEvent | TouchEvent): number {
    return 'touches' in e ? e.touches[0].clientX : e.clientX;
  }

  private getPointerXEnd(e: MouseEvent | TouchEvent): number {
    return 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
  }

  private getPinchDist(e: TouchEvent): number {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getScrollContainer(): HTMLElement | null {
    return document.querySelector('.zoom-container');
  }

  onViewerPointerDown(e: MouseEvent | TouchEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.chrome-area') || target.closest('.nav-btn') || target.closest('.dot-btn')) return;

    if ('touches' in e && e.touches.length >= 2) {
      this.isPinching = true;
      this.pinchStartDist = this.getPinchDist(e);
      this.pinchStartZoom = this.viewerZoom();
      return;
    }

    const zoom = this.viewerZoom();
    if (zoom > 1) {
      this.isPanning = true;
      this.panStartX = this.getPointerX(e);
      this.panStartY = ('touches' in e ? e.touches[0].clientY : e.clientY);
      const sc = this.getScrollContainer();
      this.panStartScrollLeft = sc?.scrollLeft ?? 0;
      this.panStartScrollTop = sc?.scrollTop ?? 0;
      return;
    }

    this.dragStartX = this.getPointerX(e);
    this.viewerDragActive.set(true);
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
    document.addEventListener('touchmove', this.onDragMove, { passive: false });
    document.addEventListener('touchend', this.onDragEnd);
  }

  private onDragMove = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();

    if (this.isPinching && 'touches' in e && e.touches.length >= 2) {
      const dist = this.getPinchDist(e);
      if (this.pinchStartDist > 0) {
        const scale = Math.max(1, Math.min(5, this.pinchStartZoom * (dist / this.pinchStartDist)));
        this.viewerZoom.set(scale);
      }
      return;
    }

    if (this.isPanning) {
      const dx = this.getPointerX(e) - this.panStartX;
      const dy = ('touches' in e ? e.touches[0].clientY : e.clientY) - this.panStartY;
      const sc = this.getScrollContainer();
      if (sc) {
        sc.scrollLeft = this.panStartScrollLeft - dx;
        sc.scrollTop = this.panStartScrollTop - dy;
      }
      return;
    }

    if (!this.viewerDragActive()) return;
    const delta = this.getPointerX(e) - this.dragStartX;
    const maxDrag = window.innerWidth * 0.35;
    this.viewerDragX.set(Math.max(-maxDrag, Math.min(maxDrag, delta)));
    this.viewerDragActive.set(true);
  };

  private onDragEnd = (e: MouseEvent | TouchEvent) => {
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
    document.removeEventListener('touchmove', this.onDragMove);
    document.removeEventListener('touchend', this.onDragEnd);

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

    const photos = this.photos();
    const delta = this.getPointerXEnd(e) - this.dragStartX;
    const threshold = 80;

    if (Math.abs(delta) > threshold && this.viewerZoom() <= 1) {
      this.isAnimatingSwipe = true;
      const dir = delta > 0 ? -1 : 1;
      const targetIdx = this.selectedIndex() + dir;

      if (targetIdx < 0 || targetIdx >= photos.length) {
        this.viewerDragX.set(0);
        this.isAnimatingSwipe = false;
        return;
      }

      this.swipeTargetIdx.set(targetIdx);
      const swipeDir = delta > 0 ? 1 : -1;
      this.viewerDragX.set(swipeDir * window.innerWidth);

      setTimeout(() => {
        this.selectedIndex.set(targetIdx);
        this.viewerDragX.set(0);
        this.swipeTargetIdx.set(-1);
        this.viewerZoom.set(1);
        this.imageLoaded.set(false);
        this.isAnimatingSwipe = false;
        this.showChromeTemporarily();
      }, 280);
    } else {
      this.viewerDragX.set(0);
    }
  };

  onPhotoClick(e: MouseEvent) {
    if (this.viewerZoom() > 1) {
      this.viewerZoom.set(1);
      const sc = this.getScrollContainer();
      if (sc) { sc.scrollLeft = 0; sc.scrollTop = 0; }
      return;
    }

    const now = Date.now();
    if (now - this.lastTapTime < 300) {
      if (this.tapTimer) clearTimeout(this.tapTimer);
      this.lastTapTime = 0;
      this.viewerZoom.set(2.5);
      return;
    }
    this.lastTapTime = now;

    this.tapTimer = setTimeout(() => {
      this.lastTapTime = 0;
    }, 300);
  }
}
