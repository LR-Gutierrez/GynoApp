import { Injectable, inject } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AuthService } from './auth.service';
import { CryptoService } from './crypto.service';
import { DatabaseService } from './database.service';
import { EncryptedPhoto } from 'src/app/shared/models/patient.model';

@Injectable({ providedIn: 'root' })
export class EncryptedPhotoService {
  private auth = inject(AuthService);
  private crypto = inject(CryptoService);
  private database = inject(DatabaseService);

  private blobUrls = new Map<string, string>();

  async savePhotos(
    consultationId: string,
    items: { dataUrl: string; mimeType: string }[]
  ): Promise<string[]> {
    const key = this.auth.getMasterKey();
    if (!key) throw new Error('Not authenticated');

    const photoIds: string[] = [];

    for (const item of items) {
      const id = crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
      const { bytes, mimeType } = this.dataUrlToBytes(item.dataUrl);
      const { iv, encrypted } = await this.crypto.encrypt(bytes, key);

      const encoder = new TextEncoder();
      const ivHex = this.crypto.bufferToHex(iv.buffer as ArrayBuffer);
      const encryptedBase64 = this.bufferToBase64(encrypted);
      const mimeBytes = encoder.encode(mimeType);
      const ivLen = iv.length;

      const combined = new Uint8Array(1 + ivLen + mimeBytes.length + encrypted.length);
      combined[0] = mimeBytes.length;
      combined.set(iv, 1);
      combined.set(mimeBytes, 1 + ivLen);
      combined.set(encrypted, 1 + ivLen + mimeBytes.length);

      const combinedBase64 = this.bufferToBase64(combined);

      const path = `photos/${consultationId}/${id}.enc`;
      await Filesystem.writeFile({
        path,
        data: combinedBase64,
        directory: Directory.Data,
        recursive: true,
      });

      const db = await this.database.getDb();
      await db.run(
        `INSERT INTO encrypted_photos (id, consultationId, iv, encryptedPath, mimeType, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, consultationId, ivHex, path, mimeType, new Date().toISOString()]
      );

      photoIds.push(id);
    }

    return photoIds;
  }

  async loadPhotos(consultationId: string): Promise<{ id: string; src: string; mimeType: string }[]> {
    const key = this.auth.getMasterKey();
    if (!key) return [];

    const db = await this.database.getDb();
    const result = await db.query(
      'SELECT * FROM encrypted_photos WHERE consultationId = ? ORDER BY createdAt ASC',
      [consultationId]
    );
    const rows = result.values ?? [];

    const photos: { id: string; src: string; mimeType: string }[] = [];

    for (const row of rows) {
      try {
        const decrypted = await this.readAndDecrypt(row, key);
        const blob = new Blob([decrypted.slice()], { type: row.mimeType });
        const src = URL.createObjectURL(blob);
        this.blobUrls.set(row.id, src);
        photos.push({ id: row.id, src, mimeType: row.mimeType });
      } catch (e) {
        console.error(`Error decrypting photo ${row.id}:`, e);
      }
    }

    return photos;
  }

  async loadAllPhotos(
    consultationIds: string[]
  ): Promise<{ id: string; src: string; consultationId: string; mimeType: string }[]> {
    const key = this.auth.getMasterKey();
    if (!key) return [];

    const db = await this.database.getDb();
    const photos: { id: string; src: string; consultationId: string; mimeType: string }[] = [];

    for (const consultationId of consultationIds) {
      const result = await db.query(
        'SELECT * FROM encrypted_photos WHERE consultationId = ? ORDER BY createdAt ASC',
        [consultationId]
      );
      const rows = result.values ?? [];

      for (const row of rows) {
        try {
          const decrypted = await this.readAndDecrypt(row, key);
          const blob = new Blob([decrypted.slice()], { type: row.mimeType });
          const src = URL.createObjectURL(blob);
          this.blobUrls.set(row.id, src);
          photos.push({
            id: row.id,
            src,
            consultationId: row.consultationId,
            mimeType: row.mimeType,
          });
        } catch (e) {
          console.error(`Error decrypting photo ${row.id}:`, e);
        }
      }
    }

    return photos;
  }

  private async readAndDecrypt(row: any, key: CryptoKey): Promise<Uint8Array> {
    const fileResult = await Filesystem.readFile({
      path: row.encryptedPath,
      directory: Directory.Data,
    });
    const combined = this.base64ToBuffer(fileResult.data as string);

    const mimeLen = combined[0];
    const ivLen = 12;
    const iv = combined.slice(1, 1 + ivLen);
    const mimeBytes = combined.slice(1 + ivLen, 1 + ivLen + mimeLen);
    const encrypted = combined.slice(1 + ivLen + mimeLen);

    return this.crypto.decrypt(encrypted, iv, key);
  }

  async deletePhotos(photoIds: string[]): Promise<void> {
    const db = await this.database.getDb();

    for (const id of photoIds) {
      const result = await db.query('SELECT * FROM encrypted_photos WHERE id = ?', [id]);
      const rows = result.values ?? [];
      if (rows.length > 0) {
        try {
          await Filesystem.deleteFile({
            path: rows[0].encryptedPath,
            directory: Directory.Data,
          });
        } catch {
          // file may not exist
        }
      }
      await db.run('DELETE FROM encrypted_photos WHERE id = ?', [id]);

      const blobUrl = this.blobUrls.get(id);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        this.blobUrls.delete(id);
      }
    }
  }

  async deleteAllForConsultation(consultationId: string): Promise<void> {
    const db = await this.database.getDb();
    const result = await db.query('SELECT * FROM encrypted_photos WHERE consultationId = ?', [consultationId]);
    const rows = result.values ?? [];

    for (const row of rows) {
      try {
        await Filesystem.deleteFile({
          path: row.encryptedPath,
          directory: Directory.Data,
        });
      } catch {
        // file may not exist
      }
      const blobUrl = this.blobUrls.get(row.id);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        this.blobUrls.delete(row.id);
      }
    }

    await db.run('DELETE FROM encrypted_photos WHERE consultationId = ?', [consultationId]);
  }

  revokeAll() {
    for (const url of this.blobUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.blobUrls.clear();
  }

  private dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mimeType: string } {
    const comma = dataUrl.indexOf(',');
    const mimeMatch = dataUrl.substring(0, comma).match(/data:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64 = dataUrl.substring(comma + 1);
    const bytes = this.base64ToBuffer(base64);
    return { bytes, mimeType };
  }

  private bufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
