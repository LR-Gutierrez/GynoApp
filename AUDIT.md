# GyncApp — Auto-Auditoría

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
| **PatientCard** | `gync-patient-card` | `patient`, `avatar` | `clicked`, `delete` |
| **ConsultationCard** | `gync-consultation-card` | `consultation` | `clicked` |
| **StatusCard** | `gync-status-card` | `name`, `initials`, `lastVisit`, `chips` | `clicked` |
| **FormField** | `gync-form-field` | `label`, `type`, `placeholder`, `error`, `value` | `valueChange` (via model) |
| **SearchBar** | `gync-search-bar` | `placeholder`, `value` | `search` |
| **PhotoThumbnail** | `gync-photo-thumbnail` | `type`, `src`, `encrypted`, `size` | `clicked` |
| **EmptyState** | `gync-empty-state` | `icon`, `message`, `actionLabel` | `action` |
| **LoadingOverlay** | `gync-loading-overlay` | `visible`, `message` | — |
| **ConfirmDialog** | `gync-confirm-dialog` | `visible`, `title`, `message`, `confirmText`, `cancelText` | `confirm`, `cancel` |
| **SecurityBadge** | `gync-security-badge` | `type`, `text` | — |
| **PageHeader** | `gync-page-header` | `title`, `subtitle`, `showBack`, `showAction` | `back`, `action` |
| **Fab** | `gync-fab` | `icon`, `label` | `clicked` |
| **PatientTable** | `gync-patient-table` | `patients`, `totalCount`, `pageSize` | `filter`, `rowAction` |

**Mejoras de estilos:**
- ~882 líneas de SCSS del `ui-kit.page.scss` movidas a `global.scss` como estilos compartidos
- Componentes usan Tailwind CSS v4 para layout y espaciado
- Ionic custom properties (`--background`, `--border-radius`, etc.) mantenidas en `global.scss` (necesarias para Ionic)
- Animación `pulse-dot` definida globalmente
- Safelist de Tailwind actualizada con clases dinámicas

**Build:** ✅ `ng build` exitoso (0 warnings)

---

## Etapa 3: Base de Datos Local

**Estado:** 🔴 PENDIENTE

- [ ] DB se crea al iniciar la app
- [ ] Tablas tienen columnas y tipos correctos
- [ ] CRUD pacientes funciona correctamente
- [ ] CRUD consultas funciona correctamente
- [ ] Relación paciente → consulta → foto es correcta (FK)
- [ ] Migraciones funcionan sin perder datos

**Build:** ❌ No ejecutado

---

## Etapa 4: Autenticación

**Estado:** 🔴 PENDIENTE

- [ ] PIN se registra y verifica correctamente
- [ ] Biometría funciona como alternativa al PIN
- [ ] AuthGuard redirige a `/auth` si no hay sesión
- [ ] Master key se deriva consistentemente (mismo PIN → misma key)
- [ ] PIN almacenado como hash, no en texto plano
- [ ] Al cerrar app se limpia la master key de memoria

**Build:** ❌ No ejecutado

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
- [ ] Foto encriptada se guarda como `.gync` en directorio privado
- [ ] Foto `.gync` NO aparece en galería del sistema
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
| 3. Base de Datos | 🔴 |
| 4. Autenticación | 🔴 |
| 5. Pacientes | 🔴 |
| 6. Consultas + Fotos | 🔴 |
| 7. Exportación | 🔴 |
| 8. Pulido | 🔴 |

**Progreso:** 2 / 8 etapas completadas

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
