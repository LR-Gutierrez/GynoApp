import { Component, input, output, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'gyno-pin-input',
  templateUrl: './gyno-pin-input.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule],
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }

      .pin-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid var(--color-outline);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .pin-dot.filled {
        background: var(--color-primary);
        border-color: var(--color-primary);
        transform: scale(1.1);
      }

      .pin-dot.error {
        border-color: var(--color-error);
        background: transparent;
        animation: shake 0.4s ease-in-out;
      }
      .pin-dot.error.filled {
        background: var(--color-error);
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }

      .key-btn {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: none;
        background: var(--color-surface-container-high);
        color: var(--color-on-surface);
        font-size: 1.5rem;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.1s ease;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .key-btn:active {
        background: var(--color-surface-container-highest);
        transform: scale(0.93);
      }
      .key-btn.empty {
        background: transparent;
        cursor: default;
        pointer-events: none;
      }

      .backdrop-enter {
        animation: backdropFade 0.3s ease-out;
      }
      @keyframes backdropFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .sheet-enter {
        animation: sheetSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes sheetSlideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      .is-dragging { transition: none !important; }
      .is-closing { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }
      .is-snapping { transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important; }
    `,
  ],
})
export class GynoPinInputComponent {
  readonly visible = input(false);
  readonly title = input('Ingresa tu PIN');
  readonly subtitle = input('');
  readonly error = input('');
  readonly showBack = input(false);
  readonly showConfirm = input(false);
  readonly confirmLabel = input('Confirmar');
  readonly confirmDisabled = input(false);
  readonly showBiometric = input(false);
  readonly pinLength = input(6);
  readonly resetKey = input(0);

  readonly pinChange = output<string>();
  readonly pinComplete = output<string>();
  readonly confirm = output<void>();
  readonly biometricClick = output<void>();
  readonly back = output<void>();
  readonly cancel = output<void>();

  @ViewChild('pinInput') pinInputRef!: ElementRef<HTMLInputElement>;

  readonly pin = signal<string[]>([]);

  readonly dragOffsetY = signal(0);
  readonly isDragging = signal(false);
  readonly isClosing = signal(false);
  readonly isSnapping = signal(false);

  private focusTimer: ReturnType<typeof setTimeout> | null = null;
  private holdTimer: ReturnType<typeof setInterval> | null = null;
  private dragStartY = 0;

  readonly sheetTransform = computed(() => {
    if (this.isClosing()) return 'translateY(100%)';
    if (this.isDragging() || this.isSnapping()) return `translateY(${this.dragOffsetY()}px)`;
    return null;
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.clearPin();
        this.isClosing.set(false);
        this.isSnapping.set(false);
        this.isDragging.set(false);
        this.dragOffsetY.set(0);
      }
    });

    effect(() => {
      this.resetKey();
      this.clearPin();
    });
  }

  private clearPin() {
    this.pin.set([]);
    this.pushToInput('');
  }

  private close() {
    if (this.focusTimer) clearTimeout(this.focusTimer);
    this.clearPin();
    this.cancel.emit();
  }

  resumeFocus() {
    if (this.focusTimer) clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => this.pinInputRef?.nativeElement.focus(), 200);
  }

  onCancel() {
    if (this.isDragging() || this.isSnapping()) return;
    this.isClosing.set(true);
    setTimeout(() => this.close(), 300);
  }

  // --- Drag to dismiss ---

  onHandlePointerDown(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    this.dragStartY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    this.isDragging.set(true);
    this.dragOffsetY.set(0);
    this.isClosing.set(false);
    document.addEventListener('mousemove', this.onPointerMove);
    document.addEventListener('mouseup', this.onPointerUp);
    document.addEventListener('touchmove', this.onPointerMove, { passive: false });
    document.addEventListener('touchend', this.onPointerUp);
  }

  private onPointerMove = (e: MouseEvent | TouchEvent) => {
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = y - this.dragStartY;
    if (delta > 0) {
      this.dragOffsetY.set(Math.min(delta, window.innerHeight * 0.6));
    }
  };

  private onPointerUp = () => {
    document.removeEventListener('mousemove', this.onPointerMove);
    document.removeEventListener('mouseup', this.onPointerUp);
    document.removeEventListener('touchmove', this.onPointerMove);
    document.removeEventListener('touchend', this.onPointerUp);

    const offset = this.dragOffsetY();
    if (offset > 100) {
      this.isClosing.set(true);
      setTimeout(() => this.close(), 300);
    } else if (offset > 0) {
      this.isSnapping.set(true);
      this.isDragging.set(false);
      requestAnimationFrame(() => {
        this.dragOffsetY.set(0);
        setTimeout(() => this.isSnapping.set(false), 280);
      });
    } else {
      this.isDragging.set(false);
    }
  };

  // --- PIN input ---

  onDigit(d: string) {
    const current = this.getPinString();
    if (current.length >= this.pinLength()) return;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    const next = current + d;
    this.pushToInput(next);
    this.pin.set(next.split(''));
    this.pinChange.emit(next);
    if (next.length === this.pinLength()) {
      this.pinComplete.emit(next);
    }
  }

  onBackspace() {
    const current = this.getPinString();
    if (current.length === 0) return;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    const next = current.slice(0, -1);
    this.pushToInput(next);
    this.pin.set(next.split(''));
    this.pinChange.emit(next);
  }

  onBackspaceHoldStart() {
    this.holdTimer = setInterval(() => {
      if (this.getPinString().length === 0) {
        this.onBackspaceHoldEnd();
        return;
      }
      this.onBackspace();
    }, 80);
  }

  onBackspaceHoldEnd() {
    if (this.holdTimer) {
      clearInterval(this.holdTimer);
      this.holdTimer = null;
    }
  }

  private getPinString(): string {
    const el = this.pinInputRef?.nativeElement;
    return el ? el.value.replace(/\D/g, '').slice(0, this.pinLength()) : '';
  }

  private pushToInput(val: string) {
    const el = this.pinInputRef?.nativeElement;
    if (el) el.value = val;
  }

  onBackClick() {
    this.back.emit();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key >= '0' && event.key <= '9') {
      this.onDigit(event.key);
      return;
    }
    if (event.key === 'Backspace') {
      this.onBackspace();
      return;
    }
    if (event.key === 'Enter' && this.showConfirm()) {
      this.confirm.emit();
      return;
    }
    if (event.key === 'Escape') {
      this.onCancel();
      return;
    }
  }

  focusInput() {
    this.pinInputRef?.nativeElement.focus();
  }
}
