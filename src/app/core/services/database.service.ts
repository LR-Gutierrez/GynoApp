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

    const statements: string[] = [];

    if (currentVersion < 1) {
      statements.push(
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
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
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
      );
    }

    if (currentVersion < 2) {
      statements.push(
        `CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY DEFAULT 'default',
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          specialty TEXT NOT NULL,
          specialties TEXT NOT NULL DEFAULT '[]',
          badge TEXT NOT NULL DEFAULT '',
          photoUrl TEXT
        )`,
        `INSERT OR IGNORE INTO profiles (id, firstName, lastName, specialty, specialties, badge)
        VALUES ('default', 'Roberto', 'García', 'Ginecología y Obstetricia', '["Ginecología","Obstetricia"]', 'Médico')`,
      );
    }

    if (currentVersion < 3) {
      try {
        await connection.run(`ALTER TABLE patients ADD COLUMN cedula TEXT`, [], false);
      } catch {
        // la columna ya existe en instalaciones previas
      }
    }

    if (currentVersion < 4) {
      try {
        await connection.run(`ALTER TABLE patients ADD COLUMN birthDate TEXT`, [], false);
      } catch {
        // la columna ya existe en instalaciones previas
      }
    }

    if (currentVersion < 5) {
      try {
        await connection.run(`ALTER TABLE patients ADD COLUMN age INTEGER`, [], false);
      } catch {
        // la columna ya existe en instalaciones previas
      }
    }

    if (currentVersion < 6) {
      try {
        await connection.run(`ALTER TABLE patients ADD COLUMN cedula TEXT`, [], false);
      } catch {
        // la columna ya existe en instalaciones previas
      }
    }

    if (currentVersion < 7) {
      try {
        await connection.run(`ALTER TABLE consultations ADD COLUMN time TEXT`, [], false);
      } catch {
        // la columna ya existe en instalaciones previas
      }
    }

    if (currentVersion < 8) {
      statements.push(
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
      );
    }

    if (currentVersion < 9) {
      try {
        await connection.run(`ALTER TABLE consultations ADD COLUMN status TEXT NOT NULL DEFAULT 'atendida'`, [], false);
      } catch {
        // columna ya existe
      }
    }

    if (currentVersion < 10) {
      // Fix: ensure time and status columns exist (failed ALTER TABLE on some setups)
      const pragma = await connection.query(`PRAGMA table_info(consultations)`, []);
      const columns = (pragma.values ?? []).map((r: any) => r.name);
      if (!columns.includes('time')) {
        try {
          await connection.run(`ALTER TABLE consultations ADD COLUMN time TEXT`, [], false);
        } catch {}
      }
      if (!columns.includes('status')) {
        try {
          await connection.run(`ALTER TABLE consultations ADD COLUMN status TEXT NOT NULL DEFAULT 'atendida'`, [], false);
        } catch {}
      }
    }

    if (currentVersion < 11) {
      // version 11 was designed to add pregnancy columns but had issues on web SQLite
    }

    if (currentVersion < 12) {
      const addPatientCol = async (col: string, def: string) => {
        try { await connection.run(`ALTER TABLE patients ADD COLUMN ${col} ${def}`, [], false); } catch {}
      };
      const addConsultCol = async (col: string, def: string) => {
        try { await connection.run(`ALTER TABLE consultations ADD COLUMN ${col} ${def}`, [], false); } catch {}
      };
      await addPatientCol('embarazada', 'INTEGER DEFAULT 0');
      await addPatientCol('FUR', 'TEXT');
      await addPatientCol('FPP', 'TEXT');
      await addPatientCol('gestas', 'INTEGER DEFAULT 0');
      await addPatientCol('partos', 'INTEGER DEFAULT 0');
      await addPatientCol('cesareas', 'INTEGER DEFAULT 0');
      await addPatientCol('abortos', 'INTEGER DEFAULT 0');
      await addConsultCol('peso', 'REAL');
      await addConsultCol('PA', 'TEXT');
      await addConsultCol('AU', 'REAL');
      await addConsultCol('FCF', 'INTEGER');
      await addConsultCol('presentacion', 'TEXT');
      await addConsultCol('edema', 'TEXT');
    }

    if (currentVersion < 13) {
      await this.ensurePatientColumns(connection);
      await this.ensureConsultColumns(connection);
    }

    if (currentVersion < 14) {
      statements.push(
        `CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data TEXT NOT NULL DEFAULT '{}',
          read INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL
        )`,
      );
    }

    for (const sql of statements) {
      await connection.run(sql, [], false);
    }

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

  private async ensurePatientColumns(connection: SQLiteDBConnection) {
    const result = await connection.query('PRAGMA table_info(patients)', [], false);
    if (!result.values) return;
    const existing = new Set(result.values.map((r: any) => r.name));

    const cols: [string, string][] = [
      ['embarazada', 'INTEGER DEFAULT 0'],
      ['FUR', 'TEXT'],
      ['FPP', 'TEXT'],
      ['gestas', 'INTEGER DEFAULT 0'],
      ['partos', 'INTEGER DEFAULT 0'],
      ['cesareas', 'INTEGER DEFAULT 0'],
      ['abortos', 'INTEGER DEFAULT 0'],
    ];

    for (const [col, def] of cols) {
      if (!existing.has(col)) {
        await connection.run(`ALTER TABLE patients ADD COLUMN ${col} ${def}`, [], false);
      }
    }
  }

  private async ensureConsultColumns(connection: SQLiteDBConnection) {
    const result = await connection.query('PRAGMA table_info(consultations)', [], false);
    if (!result.values) return;
    const existing = new Set(result.values.map((r: any) => r.name));

    const cols: [string, string][] = [
      ['peso', 'REAL'],
      ['PA', 'TEXT'],
      ['AU', 'REAL'],
      ['FCF', 'INTEGER'],
      ['presentacion', 'TEXT'],
      ['edema', 'TEXT'],
    ];

    for (const [col, def] of cols) {
      if (!existing.has(col)) {
        await connection.run(`ALTER TABLE consultations ADD COLUMN ${col} ${def}`, [], false);
      }
    }
  }

  async close() {
    await this.sqlite.closeConnection(DB_NAME, false);
    this.db = null;
  }
}
