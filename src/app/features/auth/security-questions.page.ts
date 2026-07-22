import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecurityQuestionService } from 'src/app/core/services/security-question.service';
import { PREDEFINED_QUESTIONS } from 'src/app/shared/models/security-question.model';

@Component({
  selector: 'app-security-questions',
  templateUrl: './security-questions.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }
    `,
  ],
})
export class SecurityQuestionsPage {
  private router = inject(Router);
  private securityQuestionService = inject(SecurityQuestionService);

  readonly questions = PREDEFINED_QUESTIONS;
  readonly selectedQuestion = signal('');
  readonly answer = signal('');
  readonly answerConfirm = signal('');
  readonly error = signal('');
  readonly saving = signal(false);

  goBack() {
    this.router.navigate(['/auth']);
  }

  async save() {
    this.error.set('');

    if (!this.selectedQuestion()) {
      this.error.set('Selecciona una pregunta de seguridad');
      return;
    }

    if (this.answer().length < 3) {
      this.error.set('La respuesta debe tener al menos 3 caracteres');
      return;
    }

    if (this.answer() !== this.answerConfirm()) {
      this.error.set('Las respuestas no coinciden');
      return;
    }

    this.saving.set(true);
    try {
      await this.securityQuestionService.save(this.selectedQuestion(), this.answer().toLowerCase().trim());
      this.router.navigate(['/auth/biometric-setup']);
    } catch {
      this.error.set('Error al guardar la pregunta de seguridad');
    } finally {
      this.saving.set(false);
    }
  }

  skip() {
    this.router.navigate(['/auth/biometric-setup']);
  }
}
