# GATI-C Project Changelog

Todas las modificaciones significativas del proyecto deben ser documentadas aquí. El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- 

### Changed
- 

### Deprecated
- 

### Removed
- Eliminada página duplicada en `app/dashboard/page.tsx` que causaba conflicto de rutas con `app/(app)/dashboard/page.tsx`

### Fixed
- Resuelto error de compilación "You cannot have two parallel pages that resolve to the same path" al eliminar la página duplicada
- Corregido error sintáctico en `app/(app)/dashboard/page.tsx` eliminando comentarios JSX inválidos y mejorando la estructura

### Security
- 

---

## [v8.1] - 2024-XX-XX

### Added
- **Documentación de Diagnóstico:** Se ha creado el archivo `docs-setup.md` para documentar problemas comunes de arranque y sus soluciones.
- **Script de Mantenimiento:** Se ha añadido el script `reset-project.ps1` para automatizar la limpieza del entorno de desarrollo (eliminar `node_modules`, `.next`, etc.).

### Fixed
- **Conflicto de Dependencias:** Se solucionaron los problemas de `peer dependencies` al reinstalar los paquetes con la flag `--legacy-peer-deps`.
- **Entorno Local:** Se creó un archivo `.env.local` para asegurar que las variables de entorno necesarias para el arranque estén presentes.
- **Procesos en Segundo Plano:** Se documentó el método para identificar y detener procesos de Node.js que puedan ocupar el puerto de desarrollo.

**Nota:** Este changelog marca la primera versión funcional en el entorno de desarrollo local (`localhost`). 