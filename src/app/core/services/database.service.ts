import { Injectable, inject } from '@angular/core';
import { SQLiteConnection, SQLiteDBConnection, CapacitorSQLite } from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';

const DB_NAME = 'gynoapp.db';
const DB_VERSION = 14;

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private platform = inject(Platform);
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private initPromise: Promise<SQLiteDBConnection> | null = null;
  private readonly INIT_TIMEOUT = 15000;

  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database initialization timed out')), this.INIT_TIMEOUT)
    );

    this.initPromise = Promise.race([this._init(), timeout]).then((conn) => {
      this.db = conn;
      return conn;
    }).catch((err) => {
      this.initPromise = null;
      throw err;
    });
    return this.initPromise;
  }

  private async _init() {
    if (this.platform.is('hybrid')) {
      await this.sqlite.checkConnectionsConsistency();
    }

    const isWeb = !this.platform.is('hybrid');
    if (isWeb) {
      await this.sqlite.initWebStore();
    }

    const connection = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
    await connection.open();

    await this.runMigrations(connection);

    return connection;
  }

  private async runMigrations(connection: SQLiteDBConnection) {
    const version = await connection.getVersion();
    const currentVersion = version.version ?? 0;

    if (currentVersion >= DB_VERSION) return;

    for (const table of ['notifications', 'appointments', 'encrypted_photos', 'consultations', 'patients', 'profiles']) {
      try { await connection.run(`DROP TABLE IF EXISTS ${table}`, [], false); } catch {}
    }

    await connection.run(
      `CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        birthDate TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT,
        antecedentes TEXT,
        alergias TEXT,
        cedula TEXT,
        age INTEGER,
        embarazada INTEGER DEFAULT 0,
        FUR TEXT,
        FPP TEXT,
        gestas INTEGER DEFAULT 0,
        partos INTEGER DEFAULT 0,
        cesareas INTEGER DEFAULT 0,
        abortos INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
      [],
      false,
    );

    await connection.run(
      `CREATE TABLE IF NOT EXISTS consultations (
        id TEXT PRIMARY KEY,
        patientId TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        motivo TEXT NOT NULL,
        diagnostico TEXT NOT NULL,
        tratamiento TEXT NOT NULL,
        receta TEXT,
        notas TEXT,
        examenes TEXT,
        photoIds TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'atendida',
        peso REAL,
        PA TEXT,
        AU REAL,
        FCF INTEGER,
        presentacion TEXT,
        edema TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
      )`,
      [],
      false,
    );

    await connection.run(
      `CREATE TABLE IF NOT EXISTS encrypted_photos (
        id TEXT PRIMARY KEY,
        consultationId TEXT NOT NULL,
        iv TEXT NOT NULL,
        encryptedPath TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
      )`,
      [],
      false,
    );

    await connection.run(
      `CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY DEFAULT 'default',
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        specialty TEXT NOT NULL,
        specialties TEXT NOT NULL DEFAULT '[]',
        badge TEXT NOT NULL DEFAULT '',
        photoUrl TEXT
      )`,
      [],
      false,
    );

    await connection.run(
      `CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patientId TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        createdAt TEXT NOT NULL,
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
      )`,
      [],
      false,
    );

    await connection.run(
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT NOT NULL DEFAULT '{}',
        read INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      )`,
      [],
      false,
    );

    await connection.run(
      `INSERT OR IGNORE INTO profiles (id, firstName, lastName, specialty, specialties, badge)
      VALUES ('default', 'Roberto', 'García', 'Ginecología y Obstetricia', '["Ginecología","Obstetricia"]', 'Médico')`,
      [],
      false,
    );

    await connection.run(`PRAGMA user_version = ${DB_VERSION}`, [], false);
  }

  async getProfile(): Promise<{ firstName: string; lastName: string; specialty: string; specialties: string[]; badge: string; photoUrl?: string } | null> {
    const db = await this.getDb();
    const result = await db.query('SELECT * FROM profiles WHERE id = ?', ['default']);
    if (result.values?.length) {
      const row = result.values[0];
      return {
        firstName: row.firstName,
        lastName: row.lastName,
        specialty: row.specialty,
        specialties: JSON.parse(row.specialties ?? '[]'),
        badge: row.badge,
        photoUrl: row.photoUrl ?? undefined,
      };
    }
    return null;
  }

  async saveProfile(profile: { firstName: string; lastName: string; specialty: string; specialties: string[]; badge: string; photoUrl?: string }): Promise<void> {
    const db = await this.getDb();
    await db.run(
      `INSERT OR REPLACE INTO profiles (id, firstName, lastName, specialty, specialties, badge, photoUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'default',
        profile.firstName,
        profile.lastName,
        profile.specialty,
        JSON.stringify(profile.specialties),
        profile.badge,
        profile.photoUrl ?? null,
      ],
    );
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
