import { Injectable, inject, signal } from '@angular/core';
import { DatabaseService } from 'src/app/core/services/database.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { calculateAge } from 'src/app/shared/models/patient.model';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private database = inject(DatabaseService);
  private patientService = inject(PatientService);

  readonly appointmentsByDate = signal<Record<string, Appointment[]>>({});
  readonly patients = signal<{ id: string; name: string; age: number; phone: string }[]>([]);

  async loadAll() {
    const db = await this.database.getDb();
    const result = await db.query(
      `SELECT a.*, p.name AS patientName
       FROM appointments a
       LEFT JOIN patients p ON a.patientId = p.id
       ORDER BY a.date ASC, a.time ASC`
    );
    const rows = result.values ?? [];

    const byDate: Record<string, Appointment[]> = {};
    for (const row of rows) {
      const [y, m, d] = row.date.split('-');
      const dateKey = `${y}-${parseInt(m)}-${parseInt(d)}`;
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push({
        id: row.id,
        patientId: row.patientId,
        patientName: row.patientName ?? '',
        time: row.time,
        reason: row.reason,
        status: row.status,
      });
    }
    this.appointmentsByDate.set(byDate);

    const allPatients = await this.patientService.getAll();
    this.patients.set(allPatients.map(p => ({
      id: p.id,
      name: p.name,
      age: calculateAge(p.birthDate),
      phone: p.phone,
    })));
  }

  async addAppointment(data: {
    date: string;
    time: string;
    patientId: string;
    reason: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  }): Promise<string> {
    const db = await this.database.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const [y, m, d] = data.date.split('-');
    const dateKey = `${y}-${parseInt(m)}-${parseInt(d)}`;

    const patient = await this.patientService.getById(data.patientId);

    await db.run(
      `INSERT INTO appointments (id, patientId, date, time, reason, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.patientId, data.date, data.time, data.reason, data.status, now]
    );

    const appt: Appointment = {
      id,
      patientId: data.patientId,
      patientName: patient?.name ?? '',
      time: data.time,
      reason: data.reason,
      status: data.status,
    };

    this.appointmentsByDate.update(records => {
      const existing = records[dateKey] ?? [];
      const sorted = [...existing, appt].sort((a, b) => a.time.localeCompare(b.time));
      return { ...records, [dateKey]: sorted };
    });

    return id;
  }

  async updateAppointmentStatus(id: string, status: 'scheduled' | 'completed' | 'cancelled') {
    const db = await this.database.getDb();
    await db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);

    this.appointmentsByDate.update(records => {
      const updated: Record<string, Appointment[]> = {};
      for (const [key, appts] of Object.entries(records)) {
        updated[key] = appts.map(a => a.id === id ? { ...a, status } : a);
      }
      return updated;
    });
  }
}
