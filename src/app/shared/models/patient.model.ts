export interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  address?: string;
  antecedentes?: string;
  alergias?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  date: string;
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
