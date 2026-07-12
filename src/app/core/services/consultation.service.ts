import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Consultation } from 'src/app/shared/models/patient.model';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private database = inject(DatabaseService);

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
      `INSERT INTO consultations (id, patientId, date, motivo, diagnostico, tratamiento, receta, notas, examenes, photoIds, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, consultation.patientId, consultation.date, consultation.motivo, consultation.diagnostico,
       consultation.tratamiento, consultation.receta ?? null, consultation.notas ?? null,
       consultation.examenes ?? null, JSON.stringify(consultation.photoIds), now]
    );
    return { id, ...consultation, createdAt: now };
  }

  async update(consultation: Consultation): Promise<void> {
    const db = await this.database.getDb();
    await db.run(
      `UPDATE consultations SET date = ?, motivo = ?, diagnostico = ?, tratamiento = ?, receta = ?,
       notas = ?, examenes = ?, photoIds = ? WHERE id = ?`,
      [consultation.date, consultation.motivo, consultation.diagnostico, consultation.tratamiento,
       consultation.receta ?? null, consultation.notas ?? null, consultation.examenes ?? null,
       JSON.stringify(consultation.photoIds), consultation.id]
    );
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
      motivo: row.motivo,
      diagnostico: row.diagnostico,
      tratamiento: row.tratamiento,
      receta: row.receta ?? undefined,
      notas: row.notas ?? undefined,
      examenes: row.examenes ?? undefined,
      photoIds: JSON.parse(row.photoIds || '[]'),
      createdAt: row.createdAt,
    };
  }
}
