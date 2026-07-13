export interface Patient {
  id: string;
  name: string;
  cedula?: string;
  birthDate: string;
  phone: string;
  address?: string;
  antecedentes?: string;
  alergias?: string;
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
  createdAt: string;
}

export interface EncryptedPhoto {
  id: string;
  consultationId: string;
  iv: string;
  encryptedPath: string;
  mimeType: string;
  createdAt: string;
}
