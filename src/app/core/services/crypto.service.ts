import { Injectable } from '@angular/core';

const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

@Injectable({ providedIn: 'root' })
export class CryptoService {

  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  async deriveKey(pin: string, salt: Uint8Array, extractable = false): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: KEY_LENGTH },
      extractable,
      ['encrypt', 'decrypt']
    );
  }

  async generateSalt(): Promise<Uint8Array> {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  }

  async encrypt(data: Uint8Array, key: CryptoKey): Promise<{ iv: Uint8Array; encrypted: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encrypted = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
        key,
        data.buffer as ArrayBuffer
      )
    );
    return { iv, encrypted };
  }

  async decrypt(encrypted: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const data = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      encrypted.buffer as ArrayBuffer
    );
    return new Uint8Array(data);
  }

  async hashAnswer(answer: string, saltHex: string): Promise<string> {
    const salt = this.hexToBuffer(saltHex);
    const key = await this.deriveKey(answer, salt, true);
    const exported = await crypto.subtle.exportKey('raw', key);
    return this.bufferToHex(exported);
  }

  async hashPin(pin: string): Promise<{ salt: string; hash: string }> {
    const salt = await this.generateSalt();
    const key = await this.deriveKey(pin, salt, true);
    const exported = await crypto.subtle.exportKey('raw', key);
    const hash = this.bufferToHex(exported);
    return {
      salt: this.bufferToHex(salt.buffer as ArrayBuffer),
      hash,
    };
  }

  async verifyPin(pin: string, saltHex: string, hashHex: string): Promise<boolean> {
    const salt = this.hexToBuffer(saltHex);
    const key = await this.deriveKey(pin, salt, true);
    const exported = await crypto.subtle.exportKey('raw', key);
    const computedHash = this.bufferToHex(exported);
    return computedHash === hashHex;
  }

  bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}
