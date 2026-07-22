export interface SecurityQuestion {
  question: string;
  answerHash: string;
  salt: string;
}

export const PREDEFINED_QUESTIONS = [
  '¿Cuál es el nombre de tu mascota?',
  '¿En qué año conociste a tu pareja?',
  '¿Cuál es el nombre de tu mejor amigo?',
  '¿Cuál es tu comida favorita?',
  '¿Cuál es el apellido de soltera de tu madre?',
  '¿Cuál fue el nombre de tu primera escuela?',
  '¿Cuál es tu libro favorito?',
  '¿Cuál fue la marca de tu primer coche?',
] as const;