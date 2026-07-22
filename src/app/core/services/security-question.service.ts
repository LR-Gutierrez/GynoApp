import { Injectable, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CryptoService } from './crypto.service';

const QUESTION_KEY = 'gyno_security_question';
const ANSWER_SALT_KEY = 'gyno_security_answer_salt';
const ANSWER_HASH_KEY = 'gyno_security_answer_hash';

@Injectable({ providedIn: 'root' })
export class SecurityQuestionService {
  private crypto = inject(CryptoService);

  async hasQuestion(): Promise<boolean> {
    const q = await Preferences.get({ key: QUESTION_KEY });
    return !!q.value;
  }

  async getQuestion(): Promise<string | null> {
    const q = await Preferences.get({ key: QUESTION_KEY });
    return q.value ?? null;
  }

  async save(question: string, answer: string) {
    const saltRaw = await this.crypto.generateSalt();
    const saltHex = this.crypto.bufferToHex(saltRaw.buffer as ArrayBuffer);
    const hash = await this.crypto.hashAnswer(answer, saltHex);
    await Preferences.set({ key: QUESTION_KEY, value: question });
    await Preferences.set({ key: ANSWER_SALT_KEY, value: saltHex });
    await Preferences.set({ key: ANSWER_HASH_KEY, value: hash });
  }

  async verify(answer: string): Promise<boolean> {
    const salt = await Preferences.get({ key: ANSWER_SALT_KEY });
    const storedHash = await Preferences.get({ key: ANSWER_HASH_KEY });
    if (!salt.value || !storedHash.value) return false;
    const hash = await this.crypto.hashAnswer(answer, salt.value);
    return hash === storedHash.value;
  }

  async clear() {
    await Preferences.remove({ key: QUESTION_KEY });
    await Preferences.remove({ key: ANSWER_SALT_KEY });
    await Preferences.remove({ key: ANSWER_HASH_KEY });
  }
}
