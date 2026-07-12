import { Injectable, signal } from '@angular/core';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface PatientRef {
  id: string;
  name: string;
  age: number;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  readonly appointmentsByDate = signal<Record<string, Appointment[]>>({
    '2026-7-10': [
      { id: 'a1', patientId: '1', patientName: 'María García', time: '09:00', reason: 'Control de rutina', status: 'scheduled' },
      { id: 'a2', patientId: '1', patientName: 'Ana López', time: '10:30', reason: 'Seguimiento prenatal', status: 'scheduled' },
    ],
    '2026-7-11': [
      { id: 'a3', patientId: '1', patientName: 'Carmen Rojas', time: '14:00', reason: 'Resultados de laboratorio', status: 'scheduled' },
      { id: 'a4', patientId: '1', patientName: 'Laura Fernández', time: '11:00', reason: 'Primera consulta', status: 'completed' },
    ],
    '2026-7-15': [
      { id: 'a5', patientId: '1', patientName: 'Sofia Mendoza', time: '08:30', reason: 'Control postnatal', status: 'cancelled' },
      { id: 'a6', patientId: '1', patientName: 'Valentina Torres', time: '16:00', reason: 'Ecografía', status: 'scheduled' },
    ],
    '2026-8-5': [
      { id: 'a7', patientId: '1', patientName: 'María García', time: '09:00', reason: 'Control de rutina', status: 'scheduled' },
    ],
  });

  readonly patients: PatientRef[] = [
    { id: '1', name: 'María García', age: 34, phone: '+58 412-1234567' },
    { id: '2', name: 'Beatriz Gómez', age: 31, phone: '+58 414-1112233' },
    { id: '3', name: 'Claudia Paredes', age: 25, phone: '+58 414-2223344' },
    { id: '4', name: 'Diana Rivas', age: 39, phone: '+58 414-3334455' },
    { id: '5', name: 'Fernanda Pardo', age: 45, phone: '+58 414-4445566' },
    { id: '6', name: 'Sofía Martínez', age: 28, phone: '+58 414-5556677' },
  ];

  private nextId = 8;

  addAppointment(data: {
    date: string;
    time: string;
    patientId: string;
    patientName: string;
    reason: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  }): string {
    const id = 'a' + this.nextId++;
    const [y, m, d] = data.date.split('-');
    const dateKey = `${y}-${parseInt(m) - 1}-${parseInt(d)}`;
    const appt: Appointment = {
      id,
      patientId: data.patientId,
      patientName: data.patientName,
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
}
