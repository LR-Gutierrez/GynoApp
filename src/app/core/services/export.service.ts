import { Injectable, inject } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { PatientService } from './patient.service';
import { ConsultationService } from './consultation.service';
import { EncryptedPhotoService } from './encrypted-photo.service';
import { AuthService } from './auth.service';
import { CryptoService } from './crypto.service';
import { DatabaseService } from './database.service';
import * as JSZip from 'jszip';


export interface ExportStats {
  patients: number;
  consultations: number;
  photos: number;
  estimatedSizeBytes: number;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);
  private photoService = inject(EncryptedPhotoService);
  private auth = inject(AuthService);
  private crypto = inject(CryptoService);
  private database = inject(DatabaseService);

  async getExportStats(): Promise<ExportStats> {
    const [patients, consultations] = await Promise.all([
      this.patientService.getAll(),
      this.consultationService.getAll(),
    ]);

    const photoCount = await this.photoService.countPhotos();

    let estimatedSizeBytes = 0;
    try {
      const key = this.auth.getMasterKey();
      if (key && consultations.length > 0) {
        const db = await this.database.getDb();
        const sampleIds = consultations.slice(0, 3).map(c => c.id);
        const ph = sampleIds.map(() => '?').join(',');
        const sampleResult = await db.query(
          `SELECT * FROM encrypted_photos WHERE consultationId IN (${ph}) LIMIT 10`,
          sampleIds
        );
        const rows = sampleResult.values ?? [];
        let totalEncrypted = 0;
        let sampleCount = 0;
        for (const row of rows.slice(0, 3)) {
          const fileResult = await Filesystem.readFile({
            path: row.encryptedPath,
            directory: Directory.Data,
          });
          const combined = this.base64ToBuffer(fileResult.data as string);
          const mimeLen = combined[0];
          const ivLen = 12;
          const encrypted = combined.slice(1 + ivLen + mimeLen);
          totalEncrypted += encrypted.length;
          sampleCount++;
        }
        if (sampleCount > 0) {
          const avg = totalEncrypted / sampleCount;
          estimatedSizeBytes = avg * photoCount;
        }
      }
    } catch {
      estimatedSizeBytes = 0;
    }

    return {
      patients: patients.length,
      consultations: consultations.length,
      photos: photoCount,
      estimatedSizeBytes,
    };
  }

  async exportToGyncbak(
    onProgress?: (current: number, total: number, label: string) => void
  ): Promise<Blob> {
    const key = this.auth.getMasterKey();
    if (!key) throw new Error('Not authenticated');

    onProgress?.(0, 1, 'Cargando datos...');

    const [patients, consultations] = await Promise.all([
      this.patientService.getAll(),
      this.consultationService.getAll(),
    ]);

    const patientMap = new Map(patients.map(p => [p.id, p]));

    const sanitize = (name: string) =>
      name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').substring(0, 64);

    // --- Build CSV ---
    onProgress?.(0, 1, 'Generando CSV...');

    const csvHeader = 'Paciente,Fecha,Hora,Motivo,Diagnóstico,Tratamiento,Receta,Notas,Exámenes,Estado';
    const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const csvRows = consultations.map(c => {
      const p = patientMap.get(c.patientId);
      return [
        esc(p?.name ?? '—'),
        c.date,
        c.time ?? '',
        esc(c.motivo),
        esc(c.diagnostico),
        esc(c.tratamiento),
        esc(c.receta ?? ''),
        esc(c.notas ?? ''),
        esc(c.examenes ?? ''),
        c.status,
      ].join(',');
    });
    const csv = '\uFEFF' + csvHeader + '\n' + csvRows.join('\n');

    // --- Build ZIP ---
    onProgress?.(0, 1, 'Armando ZIP...');

    const zip = new JSZip();
    zip.file('historial_completo.csv', csv);

    // Group consultations by patient
    const grouped = new Map<string, typeof consultations>();
    for (const c of consultations) {
      if (!grouped.has(c.patientId)) {
        grouped.set(c.patientId, []);
      }
      grouped.get(c.patientId)!.push(c);
    }

    // Track used folder names
    const usedNames = new Map<string, number>();

    // Count total photos for progress
    let totalPhotos = 0;
    for (const [, cons] of grouped) {
      for (const c of cons) {
        totalPhotos += (c.photoIds ?? []).length;
      }
    }
    let processedPhotos = 0;

    // Process each patient
    for (const [patientId, patientConsultations] of grouped) {
      const p = patientMap.get(patientId);
      if (!p) continue;

      const rawName = sanitize(p.name);
      const index = usedNames.get(rawName) ?? 0;
      const folderName = index === 0 ? rawName : `${rawName}_${index + 1}`;
      usedNames.set(rawName, index + 1);

      const folder = zip.folder(folderName);
      if (!folder) continue;

      // Patient info (no IDs)
      folder.file('paciente.json', JSON.stringify({
        name: p.name,
        cedula: p.cedula ?? null,
        birthDate: p.birthDate,
        phone: p.phone,
        address: p.address ?? null,
        antecedentes: p.antecedentes ?? null,
        alergias: p.alergias ?? null,
      }, null, 2));

      const photosFolder = folder.folder('fotos');

      // Sort consultations by date then time
      patientConsultations.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time ?? '').localeCompare(b.time ?? '');
      });

      for (const c of patientConsultations) {
        const timeSuffix = c.time ? `_${c.time.replace(':', '-')}` : '';
        const safeDate = c.date.replace(/:/g, '-');
        const baseName = `${safeDate}${timeSuffix}`;

        // Decrypt and add photos for this consultation in batches
        const photoIds = c.photoIds ?? [];
        const batchSize = 5;

        const photoEntries: { fileName: string; mimeType: string }[] = [];

        for (let i = 0; i < photoIds.length; i += batchSize) {
          const batch = photoIds.slice(i, i + batchSize);
          const decryptedBatch = await this.decryptPhotoBatch(batch, key);

          for (let j = 0; j < decryptedBatch.length; j++) {
            const photoIndex = i + j;
            const ext = decryptedBatch[j].mimeType.split('/')[1] ?? 'bin';
            const fileName = `${baseName}_${photoIndex + 1}.${ext}`;

            if (photosFolder) {
              photosFolder.file(fileName, decryptedBatch[j].data);
            }

            photoEntries.push({ fileName, mimeType: decryptedBatch[j].mimeType });

            processedPhotos++;
            onProgress?.(processedPhotos, totalPhotos, `Foto ${processedPhotos} de ${totalPhotos}`);
          }
        }

        // Consultation JSON with photo metadata
        folder.file(`${baseName}.json`, JSON.stringify({
          date: c.date,
          time: c.time ?? null,
          motivo: c.motivo,
          diagnostico: c.diagnostico,
          tratamiento: c.tratamiento,
          receta: c.receta ?? null,
          notas: c.notas ?? null,
          examenes: c.examenes ?? null,
          status: c.status,
          fotos: photoEntries.map(pe => ({
            archivo: pe.fileName,
            mimeType: pe.mimeType,
          })),
        }, null, 2));
      }
    }

    onProgress?.(totalPhotos, totalPhotos, 'Comprimiendo ZIP...');

    // Generate zip as uint8array
    const zipBytes = await zip.generateAsync({
      type: 'uint8array',
      streamFiles: true,
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    onProgress?.(totalPhotos, totalPhotos, 'Encriptando respaldo...');

    // Encrypt the zip with the master key
    const { iv, encrypted } = await this.crypto.encrypt(zipBytes, key);

    // Build .gyncbak header
    // [GYNC:4][version:4 LE][saltLen:4 LE][salt][iv:12][encrypted...]
    const headerMagic = new TextEncoder().encode('GYNC');
    const versionBuf = new Uint8Array(4);
    new DataView(versionBuf.buffer).setUint32(0, 1, true);

    const { Preferences } = await import('@capacitor/preferences');
    const saltPref = await Preferences.get({ key: 'gyno_pin_salt' });
    const salt = saltPref.value
      ? this.crypto.hexToBuffer(saltPref.value)
      : new Uint8Array(0);

    const saltLenBuf = new Uint8Array(4);
    new DataView(saltLenBuf.buffer).setUint32(0, salt.length, true);

    const gyncbak = new Uint8Array(
      headerMagic.length +
        versionBuf.length +
        saltLenBuf.length +
        salt.length +
        iv.length +
        encrypted.length
    );

    let off = 0;
    gyncbak.set(headerMagic, off); off += headerMagic.length;
    gyncbak.set(versionBuf, off); off += versionBuf.length;
    gyncbak.set(saltLenBuf, off); off += saltLenBuf.length;
    gyncbak.set(salt, off); off += salt.length;
    gyncbak.set(iv, off); off += iv.length;
    gyncbak.set(encrypted, off);

    onProgress?.(totalPhotos, totalPhotos, 'Listo');

    return new Blob([gyncbak], { type: 'application/octet-stream' });
  }

  private async decryptPhotoBatch(
    photoIds: string[],
    key: CryptoKey
  ): Promise<{ data: Uint8Array; mimeType: string }[]> {
    const db = await this.database.getDb();
    const results: { data: Uint8Array; mimeType: string }[] = [];

    const ph = photoIds.map(() => '?').join(',');
    const queryResult = await db.query(
      `SELECT * FROM encrypted_photos WHERE id IN (${ph})`,
      photoIds
    );
    const rows = queryResult.values ?? [];

    const tasks = rows.map(async (row: any) => {
      try {
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
        const decrypted = await this.crypto.decrypt(encrypted, iv, key);
        return { data: decrypted.slice(), mimeType: row.mimeType };
      } catch (e) {
        console.error(`Error decrypting photo ${row.id}:`, e);
        return null;
      }
    });

    const resolved = await Promise.all(tasks);
    for (const r of resolved) {
      if (r) results.push(r);
    }

    return results;
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private bufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  async importFromGyncbak(
    data: Uint8Array,
    pin: string | null,
    onProgress?: (label: string) => void
  ): Promise<{ patients: number; consultations: number; photos: number }> {
    const encoder = new TextEncoder();
    const magic = encoder.encode('GYNC');
    const magicLen = magic.length;

    // Validate minimum length
    if (data.length < magicLen + 4 + 4 + 12 + 12) {
      throw new Error('Archivo .gyncbak inválido o corrupto.');
    }

    // Verify magic
    for (let i = 0; i < magicLen; i++) {
      if (data[i] !== magic[i]) {
        throw new Error('El archivo no es un respaldo válido de GynoApp.');
      }
    }

    let offset = magicLen;

    // Read version (uint32 LE)
    const version = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
    offset += 4;
    if (version !== 1) {
      throw new Error(`Versión de respaldo ${version} no soportada.`);
    }

    // Read salt length (uint32 LE)
    const saltLen = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
    offset += 4;

    if (data.length < offset + saltLen + 12) {
      throw new Error('Archivo .gyncbak inválido o corrupto.');
    }

    // Read salt
    const salt = data.slice(offset, offset + saltLen);
    offset += saltLen;

    // Read IV (12 bytes)
    const iv = data.slice(offset, offset + 12);
    offset += 12;

    // Read encrypted payload
    const encrypted = data.slice(offset);

    // Derive key: if PIN provided, use it + salt; otherwise use master key (same-device)
    let key: CryptoKey;
    if (pin) {
      key = await this.crypto.deriveKey(pin, salt);
    } else {
      const mk = this.auth.getMasterKey();
      if (!mk) throw new Error('No hay sesión activa.');
      key = mk;
    }

    // Decrypt
    let decryptedZip: Uint8Array;
    try {
      decryptedZip = await this.crypto.decrypt(encrypted, iv, key);
    } catch {
      throw new Error('PIN incorrecto. No se puede descifrar el respaldo.');
    }

    // Load zip
    const zip = await JSZip.loadAsync(decryptedZip);

    // Find patient folders (entries containing paciente.json)
    const folderNames = new Set<string>();
    zip.forEach((relativePath) => {
      if (relativePath.endsWith('/paciente.json')) {
        const parts = relativePath.split('/');
        if (parts.length >= 1) {
          folderNames.add(parts[0]);
        }
      }
    });

    let patientCount = 0;
    let consultationCount = 0;
    let photoCount = 0;

    for (const folderName of folderNames) {
      onProgress?.(`Importando ${folderName}...`);

      // Read paciente.json
      const patientEntry = zip.file(`${folderName}/paciente.json`);
      if (!patientEntry) continue;

      const patientRaw: any = JSON.parse(await patientEntry.async('string'));

      // Upsert patient by cedula
      let patient = patientRaw.cedula
        ? await this.patientService.findByCedula(patientRaw.cedula)
        : null;

      if (patient) {
        // Update existing patient
        const updated = { ...patient };
        if (patientRaw.name !== undefined) updated.name = patientRaw.name;
        if (patientRaw.birthDate !== undefined) updated.birthDate = patientRaw.birthDate;
        if (patientRaw.phone !== undefined) updated.phone = patientRaw.phone;
        if (patientRaw.address !== undefined) updated.address = patientRaw.address ?? undefined;
        if (patientRaw.antecedentes !== undefined) updated.antecedentes = patientRaw.antecedentes ?? undefined;
        if (patientRaw.alergias !== undefined) updated.alergias = patientRaw.alergias ?? undefined;
        await this.patientService.update(updated);
      } else {
        // Create new patient
        patient = await this.patientService.create({
          name: patientRaw.name ?? '—',
          cedula: patientRaw.cedula ?? undefined,
          birthDate: patientRaw.birthDate ?? '2000-01-01',
          phone: patientRaw.phone ?? '',
          address: patientRaw.address ?? undefined,
          antecedentes: patientRaw.antecedentes ?? undefined,
          alergias: patientRaw.alergias ?? undefined,
        });
      }

      // Find all consultation JSONs in this folder
      const consultFiles: string[] = [];
      zip.forEach((relativePath) => {
        if (
          relativePath.startsWith(`${folderName}/`) &&
          relativePath.endsWith('.json') &&
          !relativePath.endsWith('/paciente.json') &&
          !relativePath.endsWith('/') // skip directories
        ) {
          consultFiles.push(relativePath);
        }
      });

      // Sort for deterministic order
      consultFiles.sort();

      for (const cfPath of consultFiles) {
        const baseName = cfPath.split('/').pop()!.replace('.json', '');
        onProgress?.(`${folderName} — consulta ${baseName}...`);

        const consultRaw: any = JSON.parse(await zip.file(cfPath)!.async('string'));

        if (!consultRaw.date) {
          console.warn(`Skipping ${cfPath}: missing date`);
          continue;
        }

        // Create consultation (without photos first)
        let consultation;
        try {
          consultation = await this.consultationService.create({
            patientId: patient!.id,
            date: consultRaw.date,
            time: consultRaw.time || undefined,
            motivo: consultRaw.motivo ?? '',
            diagnostico: consultRaw.diagnostico ?? '',
            tratamiento: consultRaw.tratamiento ?? '',
            receta: consultRaw.receta || undefined,
            notas: consultRaw.notas || undefined,
            examenes: consultRaw.examenes || undefined,
            photoIds: [],
            status: consultRaw.status ?? 'atendida',
          });
        } catch (e) {
          console.error(`Error importing consultation ${cfPath}:`, e);
          continue;
        }

        consultationCount++;

        // Build mimeType map from JSON metadata (or guess from extension)
        const fotoMeta = new Map<string, string>();
        if (Array.isArray(consultRaw.fotos)) {
          for (const f of consultRaw.fotos) {
            if (f.archivo && f.mimeType) {
              fotoMeta.set(f.archivo, f.mimeType);
            }
          }
        }

        const extToMime: Record<string, string> = {
          jpg: 'image/jpeg', jpeg: 'image/jpeg',
          png: 'image/png', webp: 'image/webp',
          gif: 'image/gif', bmp: 'image/bmp',
          svg: 'image/svg+xml',
          mp4: 'video/mp4', mov: 'video/quicktime',
          '3gp': 'video/3gpp', avi: 'video/x-msvideo',
          mkv: 'video/x-matroska', webm: 'video/webm',
        };

        // Find photos for this consultation
        const photoPrefix = `${folderName}/fotos/${baseName}`;
        const photoEntries: { name: string; data: Uint8Array; mimeType: string }[] = [];

        // Collect photos matching this consultation's baseName
        const photoPaths: string[] = [];
        zip.forEach((relativePath) => {
          if (relativePath.startsWith(photoPrefix) && !relativePath.endsWith('/')) {
            photoPaths.push(relativePath);
          }
        });
        photoPaths.sort();

        for (const pp of photoPaths) {
          const entry = zip.file(pp);
          if (!entry) continue;
          const photoBytes = await entry.async('uint8array');
          const fileName = pp.split('/').pop()!;
          const mimeType = fotoMeta.get(fileName) ?? extToMime[pp.split('.').pop() ?? ''] ?? 'image/jpeg';
          photoEntries.push({ name: pp, data: photoBytes, mimeType });
        }

        if (photoEntries.length > 0) {
          try {
            const items = photoEntries.map(pe => ({
              dataUrl: `data:${pe.mimeType};base64,${this.bufferToBase64(pe.data)}`,
              mimeType: pe.mimeType,
            }));

            const savedIds = await this.photoService.savePhotos(consultation.id, items);

            // Update consultation with photo IDs
            consultation.photoIds = savedIds;
            await this.consultationService.update(consultation);

            photoCount += savedIds.length;
          } catch (e) {
            console.error(`Error saving photos for consultation ${cfPath}:`, e);
          }
        }
      }

      patientCount++;
    }

    return { patients: patientCount, consultations: consultationCount, photos: photoCount };
  }
}
