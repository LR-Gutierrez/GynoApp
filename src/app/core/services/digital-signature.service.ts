import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const KEY_STORAGE = 'gyno_signing_key_jwk';
const PUBKEY_STORAGE = 'gyno_signing_pub_fingerprint';

@Injectable({ providedIn: 'root' })
export class DigitalSignatureService {
  private keyPair: CryptoKeyPair | null = null;

  async init(): Promise<void> {
    if (this.keyPair) return;

    const stored = await Preferences.get({ key: KEY_STORAGE });
    if (stored.value) {
      try {
        const { publicKey, privateKey } = JSON.parse(stored.value);
        this.keyPair = {
          publicKey: await crypto.subtle.importKey('jwk', publicKey, { name: 'RSA-PSS', hash: 'SHA-256' }, true, ['verify']),
          privateKey: await crypto.subtle.importKey('jwk', privateKey, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['sign']),
        };
        return;
      } catch {
        await Preferences.remove({ key: KEY_STORAGE });
      }
    }

    this.keyPair = await crypto.subtle.generateKey(
      { name: 'RSA-PSS', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['sign', 'verify']
    );

    const [publicJwk, privateJwk] = await Promise.all([
      crypto.subtle.exportKey('jwk', this.keyPair.publicKey),
      crypto.subtle.exportKey('jwk', this.keyPair.privateKey),
    ]);
    await Preferences.set({ key: KEY_STORAGE, value: JSON.stringify({ publicKey: publicJwk, privateKey: privateJwk }) });

    const fp = await this.computeFingerprint();
    await Preferences.set({ key: PUBKEY_STORAGE, value: fp });
  }

  ready(): boolean {
    return this.keyPair !== null;
  }

  private async computeFingerprint(): Promise<string> {
    const pub = await crypto.subtle.exportKey('spki', this.keyPair!.publicKey);
    const hash = await crypto.subtle.digest('SHA-256', pub);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
  }

  async getFingerprint(): Promise<string> {
    await this.init();
    return this.computeFingerprint();
  }

  async getStoredFingerprint(): Promise<string | null> {
    const r = await Preferences.get({ key: PUBKEY_STORAGE });
    return r.value ?? null;
  }

  async getPublicKeyB64(): Promise<string> {
    await this.init();
    const pub = await crypto.subtle.exportKey('spki', this.keyPair!.publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(pub)));
  }

  async importPublicKey(pubKeyB64: string): Promise<CryptoKey> {
    const bytes = Uint8Array.from(atob(pubKeyB64), c => c.charCodeAt(0));
    return crypto.subtle.importKey('spki', bytes, { name: 'RSA-PSS', hash: 'SHA-256' }, true, ['verify']);
  }

  async sign(data: BufferSource): Promise<string> {
    await this.init();
    const sig = await crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, this.keyPair!.privateKey, data);
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }

  async verify(data: BufferSource, signatureBase64: string, pubKeyB64: string): Promise<boolean> {
    const pubKey = await this.importPublicKey(pubKeyB64);
    const sig = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
    return crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, pubKey, sig, data);
  }
}
