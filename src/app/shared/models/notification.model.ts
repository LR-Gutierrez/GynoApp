export type NotificationType =
  | 'cita_creada'
  | 'cita_cancelada'
  | 'cita_atendida'
  | 'recordatorio_cita'
  | 'backup_reminder';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, string>;
  read: boolean;
  createdAt: string;
}
