import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Patient, calculateAge } from 'src/app/shared/models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private database = inject(DatabaseService);

  async getAll(): Promise<Patient[]> {
    const db = await this.database.getDb();
    const result = await db.query('SELECT * FROM patients ORDER BY name ASC');
    return (result.values ?? []).map(this.mapRow);
  }

  async search(query: string): Promise<Patient[]> {
    const db = await this.database.getDb();
    const result = await db.query(
      'SELECT * FROM patients WHERE name LIKE ? ORDER BY name ASC',
      [`%${query}%`]
    );
    return (result.values ?? []).map(this.mapRow);
  }

  async getById(id: string): Promise<Patient | null> {
    const db = await this.database.getDb();
    const result = await db.query('SELECT * FROM patients WHERE id = ?', [id]);
    const rows = result.values ?? [];
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findByCedula(cedula: string): Promise<Patient | null> {
    const db = await this.database.getDb();
    const result = await db.query('SELECT * FROM patients WHERE cedula = ?', [cedula]);
    const rows = result.values ?? [];
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async create(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const db = await this.database.getDb();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await db.run(
      `INSERT INTO patients (id, name, cedula, birthDate, age, phone, address, antecedentes, alergias, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, patient.name, patient.cedula ?? null, patient.birthDate, calculateAge(patient.birthDate), patient.phone, patient.address ?? null, patient.antecedentes ?? null, patient.alergias ?? null, now, now]
    );
    return { id, ...patient, createdAt: now, updatedAt: now };
  }

  async update(patient: Patient): Promise<void> {
    const db = await this.database.getDb();
    const now = new Date().toISOString();
    await db.run(
      `UPDATE patients SET name = ?, cedula = ?, birthDate = ?, age = ?, phone = ?, address = ?, antecedentes = ?, alergias = ?, updatedAt = ?
       WHERE id = ?`,
      [patient.name, patient.cedula ?? null, patient.birthDate, calculateAge(patient.birthDate), patient.phone, patient.address ?? null, patient.antecedentes ?? null, patient.alergias ?? null, now, patient.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await this.database.getDb();
    await db.run('DELETE FROM patients WHERE id = ?', [id]);
  }

  private mapRow(row: any): Patient {
    return {
      id: row.id,
      name: row.name,
      cedula: row.cedula ?? undefined,
      birthDate: row.birthDate,
      phone: row.phone,
      address: row.address ?? undefined,
      antecedentes: row.antecedentes ?? undefined,
      alergias: row.alergias ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
