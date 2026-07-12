import { Injectable, inject } from '@angular/core';
import { SQLiteConnection, SQLiteDBConnection, CapacitorSQLite } from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';

const DB_NAME = 'gynoapp.db';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private platform = inject(Platform);
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;

  async init() {
    if (this.platform.is('hybrid')) {
      await this.sqlite.checkConnectionsConsistency();
    }

    const isWeb = !this.platform.is('hybrid');
    if (isWeb) {
      await this.sqlite.initWebStore();
    }

    this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
    await this.db.open();

    const version = await this.db.getVersion();
    if (!version.version || version.version < DB_VERSION) {
      await this.runMigrations(version.version ?? 0);
    }

    return this.db;
  }

  private async runMigrations(currentVersion: number) {
    if (!this.db) return;
    const upgrades = this.getUpgrades(currentVersion);
    if (upgrades.length > 0) {
      await this.sqlite.addUpgradeStatement(DB_NAME, upgrades);
      await this.db.open();
    }
  }

  private getUpgrades(currentVersion: number) {
    const upgrades: { toVersion: number; statements: string[] }[] = [];

    if (currentVersion < 1) {
      upgrades.push({
        toVersion: 1,
        statements: [
          `CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            phone TEXT NOT NULL,
            address TEXT,
            antecedentes TEXT,
            alergias TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )`,
          `CREATE TABLE IF NOT EXISTS consultations (
            id TEXT PRIMARY KEY,
            patientId TEXT NOT NULL,
            date TEXT NOT NULL,
            motivo TEXT NOT NULL,
            diagnostico TEXT NOT NULL,
            tratamiento TEXT NOT NULL,
            receta TEXT,
            notas TEXT,
            examenes TEXT,
            photoIds TEXT NOT NULL DEFAULT '[]',
            createdAt TEXT NOT NULL,
            FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
          )`,
          `CREATE TABLE IF NOT EXISTS encrypted_photos (
            id TEXT PRIMARY KEY,
            consultationId TEXT NOT NULL,
            iv TEXT NOT NULL,
            encryptedPath TEXT NOT NULL,
            mimeType TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
          )`,
        ],
      });
    }

    return upgrades;
  }

  async getDb(): Promise<SQLiteDBConnection> {
    if (!this.db) {
      return await this.init();
    }
    return this.db;
  }

  async close() {
    await this.sqlite.closeConnection(DB_NAME, false);
    this.db = null;
  }
}
