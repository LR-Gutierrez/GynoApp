# GynoApp — Auto-Auditoría

Checklist de verificación por etapa. Cada ítem debe ser verificado y marcado antes de avanzar a la siguiente etapa.

---

## Etapa 1: Scaffolding

**Estado:** ✅ COMPLETADA

- [x] `ionic serve` compila sin errores
- [x] Tailwind CSS funciona correctamente
- [x] Plugins de Capacitor instalados y configurados
- [x] Estructura de directorios coincide con el plano
- [x] Rutas lazy-loading están definidas
- [x] Tema Ionic configurado

**Build:** ✅ `ng build` exitoso

---

## Etapa 2: Sistema de Diseño (UI Kit)

**Estado:** ✅ COMPLETADA

- [x] Página `/ui-kit` existe con todos los componentes visibles
- [x] Paleta de colores definida y coherente en tailwind.css
- [x] Componentes reutilizables (Inputs/Outputs bien definidos)
- [x] Componentes responsivos (móvil → tablet)
- [x] Estados: loading, empty, error, normal en cada componente
- [x] Todos los componentes compilan sin errores
- [x] Tailwind CSS v4 styles apply correctly (utilities detected and generated via CLI)

### Refactor: UI Kit → Componentes Reutilizables (2026-07-08)

Se extrajeron todos los patrones visuales del UI Kit a componentes standalone reutilizables:

| Componente | Selector | Inputs | Outputs |
|---|---|---|---|
| **PatientCard** | `gyno-patient-card` | `patient`, `avatar` | `clicked`, `delete` |
| **ConsultationCard** | `gyno-consultation-card` | `consultation` | `clicked` |
| **StatusCard** | `gyno-status-card` | `name`, `initials`, `lastVisit`, `chips` | `clicked` |
| **FormField** | `gyno-form-field` | `label`, `type`, `placeholder`, `error`, `value` | `valueChange` (via model) |
| **SearchBar** | `gyno-search-bar` | `placeholder`, `value` | `search` |
| **PhotoThumbnail** | `gyno-photo-thumbnail` | `type`, `src`, `encrypted`, `size` | `clicked` |
| **EmptyState** | `gyno-empty-state` | `icon`, `message`, `actionLabel` | `action` |
| **LoadingOverlay** | `gyno-loading-overlay` | `visible`, `message` | — |
| **ConfirmDialog** | `gyno-confirm-dialog` | `visible`, `title`, `message`, `confirmText`, `cancelText` | `confirm`, `cancel` |
| **SecurityBadge** | `gyno-security-badge` | `type`, `text` | — |
| **PageHeader** | `gyno-page-header` | `title`, `subtitle`, `showBack`, `showAction` | `back`, `action` |
| **Fab** | `gyno-fab` | `icon`, `label` | `clicked` |
| **PatientTable** | `gyno-patient-table` | `patients`, `totalCount`, `pageSize` | `filter`, `rowAction` |

**Mejoras de estilos:**
- ~882 líneas de SCSS del `ui-kit.page.scss` movidas a `global.scss` como estilos compartidos
- Componentes usan Tailwind CSS v4 para layout y espaciado
- Ionic custom properties (`--background`, `--border-radius`, etc.) mantenidas en `global.scss` (necesarias para Ionic)
- Animación `pulse-dot` definida globalmente
- Safelist de Tailwind actualizada con clases dinámicas

**Build:** ✅ `ng build` exitoso (0 warnings)

---

## Etapa 3: Base de Datos Local

**Estado:** ✅ COMPLETADA

- [x] DB se crea al iniciar la app
- [x] Tablas tienen columnas y tipos correctos
- [x] CRUD pacientes funciona correctamente
- [x] CRUD consultas funciona correctamente
- [x] Relación paciente → consulta → foto es correcta (FK)
- [x] Migraciones funcionan sin perder datos

**Build:** ✅ `ng build` exitoso

---

## Etapa 4: Autenticación

**Estado:** ✅ COMPLETADA

- [x] PIN se registra y verifica correctamente
- [x] Biometría funciona como alternativa al PIN
- [x] AuthGuard redirige a `/auth` si no hay sesión
- [x] Master key se deriva consistentemente (mismo PIN → misma key)
- [x] PIN almacenado como hash, no en texto plano
- [x] Al cerrar app se limpia la master key de memoria

**Build:** ✅ `ng build` exitoso

---

## Etapa 5: CRUD Pacientes

**Estado:** 🔴 PENDIENTE

- [ ] Lista carga desde SQLite
- [ ] Búsqueda filtra por nombre
- [ ] Crear paciente → aparece en lista
- [ ] Editar paciente → se actualiza en DB
- [ ] Eliminar paciente → borra consultas y fotos asociadas
- [ ] Validaciones funcionan (campos requeridos, tipos)
- [ ] UI coincide con los templates aprobados en Etapa 2
- [ ] Estados empty/loading/error funcionan

**Build:** ❌ No ejecutado

---

## Etapa 6: Consultas + Fotos Encriptadas

**Estado:** 🔴 PENDIENTE

- [ ] AES-256-CTR encripta/desencripta correctamente
- [ ] Cada foto tiene IV único de 128 bits
- [ ] Foto encriptada se guarda como `.gyno` en directorio privado
- [ ] Foto `.gyno` NO aparece en galería del sistema
- [ ] Visor desencripta y muestra sin fugas a disco
- [ ] Foto desencriptada solo está en RAM
- [ ] Múltiples fotos por consulta funcionan

**Build:** ❌ No ejecutado

---

## Etapa 7: Exportación/Importación

**Estado:** 🔴 PENDIENTE

- [ ] Backup exporta DB + fotos completas
- [ ] Backup encriptado no se puede leer sin el PIN
- [ ] Importación restaura datos en dispositivo nuevo
- [ ] Cambiar PIN re-encripta datos o gestiona claves viejas
- [ ] SettingsPage funcional

**Build:** ❌ No ejecutado

---

## Etapa 8: Pulido y Pruebas

**Estado:** 🔴 PENDIENTE

- [ ] No hay datos sensibles en logs ni caché
- [ ] Foto desencriptada solo en memoria, nunca en disco
- [ ] Al cerrar sesión se limpia la memoria
- [ ] App funciona offline completamente
- [ ] Build de producción sin errores
- [ ] Checklist completo de auditoría aprobado

**Build:** ❌ No ejecutado

---

## Resumen Global

| Etapa | Estado |
|-------|--------|
| 1. Scaffolding | ✅ |
| 2. UI Kit + Componentes | ✅ |
| 3. Base de Datos | ✅ |
| 4. Autenticación | ✅ |
| 5. Pacientes | 🔴 |
| 6. Consultas + Fotos | 🔴 |
| 7. Exportación | 🔴 |
| 8. Pulido | 🔴 |

**Progreso:** 4 / 8 etapas completadas

---

### Fix: Tailwind v4 Styles Not Applying (2026-07-07)

**Problem:** The app rendered unstyled ("como ver una pagina en html plano"). Custom `--color-primary-*` theme variables and Tailwind utility classes were not being generated in the build output.

**Root Causes (3 issues):**
1. **Wrong builder:** Used `@angular-devkit/build-angular:application` which doesn't support PostCSS. Switched to `browser` builder.
2. **Wrong config format:** Angular only reads `postcss.config.json` (JSON), not `postcss.config.js` (CommonJS).
3. **Tailwind v4 PostCSS plugin re-strips utilities:** When `@tailwindcss/postcss` runs in webpack, it re-processes already-generated CSS and strips undetected utilities (no filesystem scanning in webpack context).

**Solution:** Pre-generate `tailwind.scss` via Tailwind CLI (`@tailwindcss/cli`), which scans the filesystem and detects class usage correctly. The generated file is added to `angular.json` styles array **without** any PostCSS config to avoid re-processing.
- `src/tailwind.src.css` → source with `@import "tailwindcss"` + `@theme`
- `src/tailwind.scss` → CLI output, imported in `angular.json`
- `npm run tailwind` → regenerates via CLI
- `prebuild` hook ensures regeneration before every build
