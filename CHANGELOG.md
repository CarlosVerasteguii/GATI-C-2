# GATI-C Project Changelog

Todas las modificaciones significativas del proyecto deben ser documentadas aquí. El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **🚀 Sistema de Navegación Enterprise-Grade Completado (4 mejoras críticas):**
  - **Indicadores de Carga:** Loading spinners inteligentes con auto-timeout de 5 segundos
  - **Badge Contador de Tareas:** Polling automático cada 60 segundos con colores semánticos (SRS compliance)
  - **Atajos de Teclado:** Navegación ultrarrápida con estándares VS Code (Ctrl+B, Ctrl+Shift+D/I/T)
  - **Breadcrumbs Inteligentes:** Navegación contextual automática con truncamiento inteligente
- **Hooks Personalizados de Navegación:**
  - `useNavigation()` - Manejo de estados de carga y transiciones
  - `usePendingTasks()` - Polling automático de tareas pendientes con RBAC
  - `useGatiKeyboardShortcuts()` - Sistema extensible de atajos de teclado
- **Componentes de Navegación Avanzados:**
  - `Breadcrumbs` - Migas de pan con detección automática de rutas
  - `KeyboardShortcutsHelp` - Modal de ayuda interactivo (Ctrl+?)
  - `NavigationDemo` - Componente de demostración de mejoras
- **Documentación Técnica Completa:** `navigation_improvements.md` con especificaciones enterprise
- **Sistema Completo de Toasts Enterprise (55 implementaciones):**
  - Toasts de progreso para operaciones masivas (Bulk Edit, Assign, Retire, Lend)
  - Validación inteligente en tiempo real (números de serie duplicados, emails, fechas, costos)
  - Estados de sistema y sincronización automática cada 30 segundos
  - Búsqueda inteligente con sugerencias cuando no hay resultados
  - Autoguardado con feedback de progreso para todas las operaciones CRUD
- **Cumplimiento WCAG 2.1 AA:** Implementación completa de accesibilidad enterprise
  - `role="alert"` y `aria-live="assertive"` en todos los toasts críticos
  - Duraciones inteligentes (2-6 segundos) según criticidad del mensaje
  - Soporte completo para lectores de pantalla y navegación por teclado
- **Trazabilidad Absoluta:** Integración con sistema de actividades recientes
  - Cada acción crítica registra contexto completo (usuario, fecha, detalles)
  - Historial inmutable para auditorías CFE
  - Cadena de responsabilidad clara en flujos de aprobación
- Implementación de detección de dispositivo mediante hook personalizado `useDevice` para optimizar la experiencia de usuario en diferentes dispositivos
- **Documentación Enterprise:** 
  - Guías de implementación de toasts para diferentes escenarios
  - Mejores prácticas de UX para software gubernamental
  - Documentación de API de toasts con ejemplos de uso

### Changed
- **🔄 Arquitectura de Navegación Mejorada:** Sistema modular con hooks especializados
  - Sidebar responsive con colapso inteligente (Ctrl+B)
  - Badge dinámico solo para Admin/Editor (RBAC compliance)
  - Breadcrumbs responsive (ocultos en mobile automáticamente)
  - Indicadores de carga por item y globales
- **Migración Completa del Sistema de Toasts:** De básico Radix UI a sistema enterprise ultra-limpio
  - APIs mejoradas: `showSuccess()`, `showError()`, `showWarning()`, `showInfo()`
  - Fondos sólidos profesionales con sutiles efectos de sombra
  - Máximo 3 toasts simultáneos con queue inteligente
  - Soporte completo para modo oscuro
- **UX Contextual Mejorada:** Toasts específicos por rol de usuario
  - Administrador: Feedback completo para gestión crítica
  - Editor: Toasts ágiles para flujo de campo eficiente
  - Lector: Feedback mínimo, no invasivo
- Estandarización de la estructura de layout en toda la aplicación siguiendo las mejores prácticas de Next.js App Router
- Refactorización del componente `app/(app)/inventario/page.tsx` para usar correctamente el layout del grupo de rutas
- Fusión de la funcionalidad completa de configuración en `app/(app)/configuracion/page.tsx`

### Deprecated
- Marcado como obsoleto el uso directo de `AppLayout` en páginas individuales

### Removed
- Eliminada página duplicada en `app/dashboard/page.tsx` que causaba conflicto de rutas con `app/(app)/dashboard/page.tsx`
- Eliminado componente duplicado `app/app-layout.tsx` para evitar confusiones con `components/app-layout.tsx`
- Eliminada ruta duplicada `app/configuracion/page.tsx` que causaba conflicto con `app/(app)/configuracion/page.tsx`
- **Toasts Invasivos Eliminados:** Removidas notificaciones innecesarias que interrumpían el flujo
  - Toasts de configuración de columnas (visibilidad, ordenamiento)
  - Notificaciones de cambio de vista (inmediatamente visible)
  - Feedback excesivo de filtros básicos

### Fixed
- **Problema de Transparencia en Toasts:** Corregidos fondos casi transparentes
  - Implementados fondos 100% sólidos: `bg-emerald-50` (sin transparencia)
  - Modo oscuro sólido: `dark:bg-emerald-900`
  - Efectos elegantes: `shadow-lg shadow-emerald-500/25`
  - Anillos definidos: `ring-1 ring-emerald-200`
- Resuelto error de compilación "You cannot have two parallel pages that resolve to the same path" al eliminar la página duplicada
- Corregido error sintáctico en `app/(app)/dashboard/page.tsx` eliminando comentarios JSX inválidos y mejorando la estructura
- Solucionada inconsistencia en la aplicación de layouts entre diferentes páginas de la aplicación
- Resuelto conflicto de rutas duplicadas en la sección de configuración

### Security
- **Validación Segura:** Toasts no exponen información técnica sensible
- **Sanitización de Entradas:** Validación en tiempo real previene errores de seguridad
- **Logs de Auditoría:** Trazabilidad completa para cumplimiento gubernamental CFE

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