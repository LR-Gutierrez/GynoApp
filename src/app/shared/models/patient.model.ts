export interface Patient {
  id: string;
  name: string;
  cedula?: string;
  birthDate: string;
  phone: string;
  address?: string;
  antecedentes?: string;
  alergias?: string;
  embarazada?: boolean;
  FUR?: string;
  FPP?: string;
  gestas?: number;
  partos?: number;
  cesareas?: number;
  abortos?: number;
  createdAt: string;
  updatedAt: string;
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateFPP(FUR: string): string {
  const fur = new Date(FUR);
  fur.setDate(fur.getDate() + 280);
  return fur.toISOString().split('T')[0];
}

export function gestacionalWeeks(FUR: string): number {
  const fur = new Date(FUR);
  const now = new Date();
  const diff = now.getTime() - fur.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

export type ConsultationStatus = 'programada' | 'atendida' | 'cancelada';

export interface Consultation {
  id: string;
  patientId: string;
  date: string;
  time?: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  receta?: string;
  notas?: string;
  examenes?: string;
  photoIds: string[];
  status: ConsultationStatus;
  createdAt: string;
  peso?: number;
  PA?: string;
  AU?: number;
  FCF?: number;
  presentacion?: string;
  edema?: string;
}

export interface EncryptedPhoto {
  id: string;
  consultationId: string;
  iv: string;
  encryptedPath: string;
  mimeType: string;
  createdAt: string;
}
