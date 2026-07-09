# GynoApp — Plan de Desarrollo

App híbrida (Ionic + Angular) para gestión de historia clínica con álbum fotográfico encriptado, estilo MIUI Secret Album.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Ionic 8 + Angular 19 |
| Nativas | Capacitor (Cámara, File System, Biometría) |
| Base de datos | SQLite via `@capacitor-community/sqlite` |
| Criptografía | Web Crypto API (AES-256-CTR, PBKDF2) |
| Estilos | Tailwind CSS |
| Almacenamiento fotos | Directorio privado de la app (extensión `.gyno`) |

---

## Arquitectura del Proyecto

```
gyno-app/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── crypto.service.ts
│   │   │   │   ├── database.service.ts
│   │   │   │   ├── patient.service.ts
│   │   │   │   ├── consultation.service.ts
│   │   │   │   ├── photo.service.ts
│   │   │   │   └── backup.service.ts
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   └── utils/
│   │   │       └── crypto.utils.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── ui-kit/
│   │   │   ├── patients/
│   │   │   ├── consultations/
│   │   │   ├── photo-viewer/
│   │   │   └── settings/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── models/
│   │   │   └── pipes/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   ├── theme/
│   ├── index.html
│   └── main.ts
```

---

## Data Models

### Patient

```typescript
interface Patient {
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
```

### Consultation

```typescript
interface Consultation {
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
```

### EncryptedPhoto

```typescript
interface EncryptedPhoto {
  id: string;
  consultationId: string;
  iv: string;
  encryptedPath: string;
  mimeType: string;
  createdAt: string;
}
```

---

## Etapas del Desarrollo

### 🔷 Etapa 1: Scaffolding

| # | Tarea | Descripción |
|---|-------|-------------|
| 1.1 | `ionic start` | Crear proyecto Ionic/Angular blank con Capacitor |
| 1.2 | Instalar Tailwind | `npm i tailwindcss` + configurar `tailwind.config.js` |
| 1.3 | Instalar plugins | `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor-community/sqlite` |
| 1.4 | Crear directorios | `core/`, `features/`, `shared/` con sus subdirectorios |
| 1.5 | Configurar rutas | Lazy loading para cada feature |
| 1.6 | Configurar Tailwind | Archivos base, directivas `@tailwind`, clases utilitarias |
| 1.7 | Configurar Ionic | Tema base, colores primarios |

**✅ Auditoría Etapa 1:**
- [ ] `ionic serve` compila sin errores
- [ ] Tailwind CSS funciona correctamente
- [ ] Plugins de Capacitor instalados y configurados
- [ ] Estructura de directorios coincide con el plano
- [ ] Rutas lazy-loading están definidas
- [ ] Tema Ionic configurado

---

### 🔷 Etapa 2: Sistema de Diseño (UI Kit)

Crear componentes visuales puramente estéticos para definir el look & feel antes de programar features.

#### Componentes Base

| Componente | Inputs | Outputs | Descripción |
|------------|--------|---------|-------------|
| `PageHeader` | `title`, `showBack` | `back` | Encabezado consistente |
| `PatientCard` | `patient`, `avatar?` | `click`, `delete` | Tarjeta de paciente en lista |
| `ConsultationCard` | `consultation` | `click` | Tarjeta de consulta en historial |
| `FormField` | `label`, `type`, `error`, `icon` | `valueChange` | Input reutilizable con label + error |
| `PhotoThumbnail` | `src`, `encrypted`, `size` | `click` | Thumbnail de foto |
| `EmptyState` | `icon`, `message`, `actionLabel?` | `action` | Estado vacío para listas |
| `ConfirmDialog` | `title`, `message`, `confirmText`, `cancelText` | `confirm`, `cancel` | Modal de confirmación |
| `SearchBar` | `placeholder`, `value` | `search` | Barra de búsqueda |
| `FloatingActionButton` | `icon`, `label?` | `click` | FAB para añadir |
| `LoadingOverlay` | `message?` | — | Overlay de carga |

#### Flujo de trabajo

1. Crear página `/ui-kit` con todos los componentes en vivo
2. Definir paleta de colores en `tailwind.config.js`
3. Definir tipografía (tamaños, pesos, jerarquía)
4. Crear cada componente de forma aislada con sus estados
5. Revisar y aprobar visualmente
6. Replicar patrones en todas las features siguientes

**✅ Auditoría Etapa 2:**
- [ ] Página `/ui-kit` existe con todos los componentes visibles
- [ ] Paleta de colores definida y coherente
- [ ] Componentes reutilizables (Inputs/Outputs bien definidos)
- [ ] Componentes responsivos (móvil 320px → tablet 768px)
- [ ] Estados: loading, empty, error, normal en cada componente
- [ ] Todos los componentes compilan sin errores
- [ ] Componentes aprobados visualmente

---

### 🔷 Etapa 3: Base de Datos Local

| # | Tarea | Descripción |
|---|-------|-------------|
| 3.1 | DatabaseService | Inicializar conexión SQLite, crear/abrir DB |
| 3.2 | Crear tablas | `patients`, `consultations`, `encrypted_photos` |
| 3.3 | Patient CRUD | Servicio con create, read, update, delete |
| 3.4 | Consultation CRUD | Servicio con create, read, update, delete |
| 3.5 | Photo metadata CRUD | Solo metadatos de fotos (no binarios) |
| 3.6 | Sistema de migraciones | Versión de DB para actualizaciones futuras |

**✅ Auditoría Etapa 3:**
- [ ] DB se crea al iniciar la app
- [ ] Tablas tienen columnas y tipos correctos
- [ ] CRUD pacientes funciona correctamente
- [ ] CRUD consultas funciona correctamente
- [ ] Relación paciente → consulta → foto es correcta (FK)
- [ ] Migraciones funcionan sin perder datos

---

### 🔷 Etapa 4: Autenticación

| # | Tarea | Descripción |
|---|-------|-------------|
| 4.1 | Registro PIN | Primera vez: crear PIN de 4-6 dígitos |
| 4.2 | Derivación PBKDF2 | Derivar master key AES-256 desde el PIN |
| 4.3 | Hash seguro | Almacenar solo hash del PIN, nunca el PIN plano |
| 4.4 | Login PIN | Verificar PIN contra hash almacenado |
| 4.5 | Integrar biometría | Capacitor Biometrics (Face ID / huella) |
| 4.6 | AuthGuard | Proteger rutas internas |
| 4.7 | Sesión segura | Mantener master key en memoria volátil |

**✅ Auditoría Etapa 4:**
- [ ] PIN se registra y verifica correctamente
- [ ] Biometría funciona como alternativa al PIN
- [ ] AuthGuard redirige a `/auth` si no hay sesión
- [ ] Master key se deriva consistentemente
- [ ] PIN almacenado como hash, no en texto plano
- [ ] Al cerrar app se limpia la master key de memoria

---

### 🔷 Etapa 5: CRUD Pacientes

| # | Tarea | Descripción |
|---|-------|-------------|
| 5.1 | PatientListPage | Lista con búsqueda usando SearchBar |
| 5.2 | PatientFormPage | Crear/editar paciente |
| 5.3 | PatientDetailPage | Info del paciente + lista de consultas |
| 5.4 | Validaciones | Nombre requerido, edad numérica, teléfono |
| 5.5 | Diseño responsive | Usando componentes de UI Kit aprobados |

**✅ Auditoría Etapa 5:**
- [ ] Lista carga desde SQLite
- [ ] Búsqueda filtra por nombre
- [ ] Crear paciente → aparece en lista
- [ ] Editar paciente → se actualiza en DB
- [ ] Eliminar paciente → borra consultas y fotos asociadas
- [ ] Validaciones funcionan (campos requeridos, tipos)
- [ ] UI coincide con los templates aprobados en Etapa 2
- [ ] Estados empty/loading/error funcionan

---

### 🔷 Etapa 6: Consultas + Fotos Encriptadas

| # | Tarea | Descripción |
|---|-------|-------------|
| 6.1 | ConsultationFormPage | Formulario con todos los campos |
| 6.2 | CryptoService | AES-256-CTR + PBKDF2 con Web Crypto API |
| 6.3 | Tomar foto | Capacitor Camera plugin |
| 6.4 | Encriptar foto | IV único (128 bits) + AES-256-CTR → archivo `.gyno` |
| 6.5 | Guardar foto encriptada | Almacenar en directorio privado de la app |
| 6.6 | PhotoViewerPage | Desencriptar y mostrar foto en visor |
| 6.7 | Múltiples fotos por consulta | Galería de thumbnails |

**✅ Auditoría Etapa 6:**
- [ ] AES-256-CTR encripta/desencripta correctamente
- [ ] Cada foto tiene IV único de 128 bits
- [ ] Foto encriptada se guarda como `.gyno` en directorio privado
- [ ] Foto `.gyno` NO aparece en galería del sistema
- [ ] Visor desencripta y muestra sin fugas a disco
- [ ] Foto desencriptada solo está en RAM
- [ ] Múltiples fotos por consulta funcionan

---

### 🔷 Etapa 7: Exportación/Importación

| # | Tarea | Descripción |
|---|-------|-------------|
| 7.1 | BackupService | Empaquetar DB + fotos en archivo único |
| 7.2 | Encriptar backup | Backup completo encriptado con clave derivada del PIN |
| 7.3 | Exportar .gynobak | Guardar en Descargas o compartir |
| 7.4 | Importar .gynobak | Leer, desencriptar, restaurar DB + fotos |
| 7.5 | SettingsPage | Ajustes: exportar, importar, cambiar PIN |

**✅ Auditoría Etapa 7:**
- [ ] Backup exporta DB + fotos completas
- [ ] Backup encriptado no se puede leer sin el PIN
- [ ] Importación restaura datos en dispositivo nuevo
- [ ] Cambiar PIN re-encripta datos o gestiona claves viejas
- [ ] SettingsPage funcional

---

### 🔷 Etapa 8: Pulido y Pruebas

| # | Tarea | Descripción |
|---|-------|-------------|
| 8.1 | UI/UX refinamiento | Transiciones, skeletons, loading states |
| 8.2 | Manejo de errores | Toasts, alerts, try-catch en servicios |
| 8.3 | Pruebas de seguridad | No fugas de datos en logs, memoria, caché |
| 8.4 | Performance | Lazy loading, virtual scroll |
| 8.5 | Build producción | `ionic build` + `npx cap copy` |

**✅ Auditoría Etapa 8 (Final):**
- [ ] No hay datos sensibles en logs ni caché
- [ ] Foto desencriptada solo en memoria, nunca en disco
- [ ] Al cerrar sesión se limpia la memoria
- [ ] App funciona offline completamente
- [ ] Build de producción sin errores
- [ ] Checklist completo de auditoría aprobado

---

## Sistema de Auto-Auditoría

Cada etapa tiene un checklist de verificación. El flujo es:

```
1. Leer la etapa actual del checklist en AUDIT.md
2. Implementar cada tarea de la etapa
3. Verificar cada ítem de auditoría
4. SI algún ítem falla → corregir
5. SI todos pasan → marcar como COMPLETADA en AUDIT.md
6. Pasar a la siguiente etapa
```

Al final de cada etapa se ejecuta `npx ionic build` para confirmar que no hay errores de compilación.

---

## Decisiones Técnicas

| Aspecto | Decisión | Motivo |
|---------|----------|--------|
| Encriptación | AES-256-CTR (Web Crypto API) | Nativo en browser, sin librerías extra |
| Derivación de clave | PBKDF2 con 600,000 iteraciones | OWASP recommended |
| IV | Aleatorio 128 bits por archivo | Más seguro que IV fijo de MIUI |
| Contenedor de fotos | `.gyno` con header: `IV (16 bytes) + data` | Formato simple auto-contenido |
| Almacenamiento | Directorio privado de la app | No accesible desde galería |
| DB local | SQLite | Persistente, rápida, consultas complejas |
