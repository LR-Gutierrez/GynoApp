import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Consultation, ConsultationStatus } from 'src/app/shared/models/patient.model';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private database = inject(DatabaseService);

  async getAll(): Promise<Consultation[]> {
    const db = await this.database.getDb();
    const result = await db.query('SELECT * FROM consultations ORDER BY date ASC, time ASC');
    return (result.values ?? []).map(this.mapRow);
  }

  async getByPatient(patientId: string): Promise<Consultation[]> {
    const db = await this.database.getDb();
    const result = await db.query(
      'SELECT * FROM consultations WHERE patientId = ? ORDER BY date DESC',
      [patientId]
    );
    return (result.values ?? []).map(this.mapRow);
  }

  async getById(id: string): Promise<Consultation | null> {
    const db = await this.database.getDb();
    const result = await db.query('SELECT * FROM consultations WHERE id = ?', [id]);
    const rows = result.values ?? [];
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async create(consultation: Omit<Consultation, 'id' | 'createdAt'>): Promise<Consultation> {
    const db = await this.database.getDb();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await db.run(
      `INSERT INTO consultations (id, patientId, date, time, motivo, diagnostico, tratamiento, receta, notas, examenes, photoIds, status, peso, PA, AU, FCF, presentacion, edema, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, consultation.patientId, consultation.date, consultation.time ?? null, consultation.motivo, consultation.diagnostico,
       consultation.tratamiento, consultation.receta ?? null, consultation.notas ?? null,
       consultation.examenes ?? null, JSON.stringify(consultation.photoIds), consultation.status,
       consultation.peso ?? null, consultation.PA ?? null, consultation.AU ?? null, consultation.FCF ?? null,
       consultation.presentacion ?? null, consultation.edema ?? null, now]
    );
    return { id, ...consultation, createdAt: now };
  }

  async update(consultation: Consultation): Promise<void> {
    const db = await this.database.getDb();
    await db.run(
      `UPDATE consultations SET date = ?, time = ?, motivo = ?, diagnostico = ?, tratamiento = ?, receta = ?,
       notas = ?, examenes = ?, photoIds = ?, status = ?, peso = ?, PA = ?, AU = ?, FCF = ?, presentacion = ?, edema = ?
       WHERE id = ?`,
      [consultation.date, consultation.time ?? null, consultation.motivo, consultation.diagnostico, consultation.tratamiento,
       consultation.receta ?? null, consultation.notas ?? null, consultation.examenes ?? null,
       JSON.stringify(consultation.photoIds), consultation.status,
       consultation.peso ?? null, consultation.PA ?? null, consultation.AU ?? null, consultation.FCF ?? null,
       consultation.presentacion ?? null, consultation.edema ?? null,
       consultation.id]
    );
  }

  async updateStatus(id: string, status: ConsultationStatus): Promise<void> {
    const db = await this.database.getDb();
    await db.run('UPDATE consultations SET status = ? WHERE id = ?', [status, id]);
  }

  async delete(id: string): Promise<void> {
    const db = await this.database.getDb();
    await db.run('DELETE FROM consultations WHERE id = ?', [id]);
  }

  private mapRow(row: any): Consultation {
    return {
      id: row.id,
      patientId: row.patientId,
      date: row.date,
      time: row.time ?? undefined,
      motivo: row.motivo,
      diagnostico: row.diagnostico,
      tratamiento: row.tratamiento,
      receta: row.receta ?? undefined,
      notas: row.notas ?? undefined,
      examenes: row.examenes ?? undefined,
      photoIds: JSON.parse(row.photoIds || '[]'),
      status: row.status ?? 'atendida',
      createdAt: row.createdAt,
      peso: row.peso ?? undefined,
      PA: row.PA ?? undefined,
      AU: row.AU ?? undefined,
      FCF: row.FCF ?? undefined,
      presentacion: row.presentacion ?? undefined,
      edema: row.edema ?? undefined,
    };
  }
}
