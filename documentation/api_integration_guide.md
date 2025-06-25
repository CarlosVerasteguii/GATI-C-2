# Plan Maestro de Integración API para GATI-C

## 1. Visión General y Alineación con SRS/PRD

Esta guía detalla el plan completo para migrar GATI-C desde su actual implementación basada en localStorage hacia una arquitectura cliente-servidor robusta, alineada con:

- **SRS 1.2**: Backend como monolito modular en Node.js
- **SRS 1.3**: Comunicación entre módulos vía Event Bus (patrón Mediator)
- **SRS 2.1-2.4**: Arquitectura cliente-servidor desacoplada con API RESTful
- **SRS 3.1**: Gestión de estado con Zustand y UI Optimista
- **SRS 4.1**: Ciclo de vida de solicitudes estandarizado con validación Zod
- **SRS 6.1-6.4**: Autenticación JWT con cookies httpOnly
- **SRS 7.1-7.4**: Convenciones de API y estructura de respuesta estandarizada

## 2. Análisis de la Situación Actual

### 2.1 Estado Actual del Frontend

El frontend de GATI-C opera actualmente como una aplicación autónoma con:

- Estado global gestionado mediante React Context (`app-context.tsx`)
- Persistencia de datos en localStorage
- Simulación de operaciones CRUD sin backend real
- Navegación y flujos de usuario completos pero sin validación en servidor

### 2.2 Desafíos Identificados

1. **Dependencia de localStorage**: 
   - Limitaciones de almacenamiento (~5MB)
   - Sin persistencia entre dispositivos
   - Vulnerabilidad a borrado accidental por el usuario

2. **Ausencia de validación en servidor**:
   - Posibles inconsistencias de datos
   - Sin autorización real basada en roles

3. **Imposibilidad de operaciones concurrentes**:
   - Sin manejo de conflictos entre múltiples usuarios
   - Ausencia de bloqueos optimistas/pesimistas

4. **Falta de auditoría centralizada**:
   - El registro de cambios es local, no centralizado

## 3. Plan de Migración Detallado

### 3.1 Fase 1: Preparación de Infraestructura (2 semanas)

#### 3.1.1 Configuración del Entorno de Desarrollo

1. **Instalación de Dependencias**:
   ```bash
   npm install zustand axios zod @hookform/resolvers
   ```

   **Dependencias entre Tareas**: Ninguna
   
   **Riesgos**: Conflictos de versiones con dependencias existentes
   
   **Plan de Contingencia**: Auditar `package.json` antes de la instalación y resolver conflictos de versiones mediante `npm-check-updates`

2. **Configuración de Variables de Entorno**:
   - Crear `.env.local`, `.env.development`, `.env.production`
   - Definir `NEXT_PUBLIC_API_URL` para cada entorno

   **Dependencias entre Tareas**: Ninguna
   
   **Riesgos**: Exposición accidental de variables sensibles en el cliente
   
   **Plan de Contingencia**: Auditar que solo variables con prefijo `NEXT_PUBLIC_` sean accesibles desde el cliente

#### 3.1.2 Estructura de Carpetas y Archivos Base

1. **Crear Estructura de API**:
   ```
   /lib
     /api
       client.ts
       endpoints.ts
     /services
       [módulos].ts
   /store
     /slices
       [módulos].ts
   ```

   **Dependencias entre Tareas**: Instalación de dependencias
   
   **Riesgos**: Conflictos con estructura existente
   
   **Plan de Contingencia**: Mapeo completo de la estructura actual antes de implementar cambios

2. **Definir Tipos Base**:
   ```typescript
   // types/index.ts
   export interface ApiResponse<T> {
     success: boolean;
     data?: T;
     error?: {
       code: string;
       message: string;
     };
   }
   ```

   **Dependencias entre Tareas**: Ninguna
   
   **Riesgos**: Incompatibilidad con tipos existentes
   
   **Plan de Contingencia**: Realizar refactorización gradual de tipos existentes

#### 3.1.3 Cliente HTTP Base

Implementar `client.ts` con:
- Configuración base de Axios
- Interceptores para manejo de errores
- Soporte para cookies httpOnly

**Dependencias entre Tareas**: Definición de tipos base
   
**Riesgos**: 
- CORS no configurado en el backend
- Formato de respuesta inconsistente con lo esperado
   
**Plan de Contingencia**:
- Implementar adaptadores para manejar diferentes formatos de respuesta
- Configurar modo de desarrollo para simular respuestas del backend

### 3.2 Fase 2: Autenticación (2 semanas)

#### 3.2.1 Servicio de Autenticación

1. **Implementar `auth.service.ts`**:
   - Métodos para login, logout, verificación de sesión
   - Manejo de JWT en cookies httpOnly

   **Dependencias entre Tareas**: Cliente HTTP base
   
   **Riesgos**: 
   - Incompatibilidad con el flujo de autenticación del backend
   - Problemas con SameSite cookies en desarrollo local
   
   **Plan de Contingencia**:
   - Implementar adaptador para manejar diferentes flujos de autenticación
   - Configuración específica para desarrollo local

2. **Store de Autenticación con Zustand**:
   - Estado de usuario actual
   - Estado de carga y errores
   - Acciones para login/logout

   **Dependencias entre Tareas**: Servicio de autenticación
   
   **Riesgos**: Pérdida de estado de autenticación en recargas de página
   
   **Plan de Contingencia**: Implementar persistencia del estado con `zustand/middleware/persist`

#### 3.2.2 Middleware de Protección de Rutas

1. **Implementar `middleware.ts` para Next.js**:
   - Verificación de rutas públicas vs. privadas
   - Redirección a login si no hay autenticación

   **Dependencias entre Tareas**: Store de autenticación
   
   **Riesgos**: 
   - Bloqueo accidental de rutas públicas
   - Problemas con rutas dinámicas
   
   **Plan de Contingencia**:
   - Lista completa de rutas públicas y privadas
   - Pruebas exhaustivas de navegación

2. **Componente HOC para Protección de Componentes**:
   - Verificación de permisos por rol (SRS 6.4)
   - Renderizado condicional basado en permisos

   **Dependencias entre Tareas**: Middleware de protección
   
   **Riesgos**: Exposición accidental de funcionalidades restringidas
   
   **Plan de Contingencia**: Auditoría de seguridad de componentes críticos

#### 3.2.3 Actualización de Componentes de Login/Logout

1. **Refactorizar Página de Login**:
   - Integración con store de autenticación
   - Manejo de errores de autenticación
   - Redirección post-login

   **Dependencias entre Tareas**: Store de autenticación
   
   **Riesgos**: Experiencia de usuario degradada durante la transición
   
   **Plan de Contingencia**: Implementación paralela con feature flag para cambiar entre implementaciones

2. **Actualizar Componente de Logout**:
   - Integración con store de autenticación
   - Limpieza de estado y cookies

   **Dependencias entre Tareas**: Store de autenticación
   
   **Riesgos**: Sesiones huérfanas
   
   **Plan de Contingencia**: Verificación de limpieza completa del estado y cookies

### 3.3 Fase 3: Migración de Módulos Core (4 semanas)

#### 3.3.1 Módulo de Inventario

1. **Servicio de API de Inventario**:
   - Implementación de endpoints según SRS 7.2-7.3
   - Manejo de documentos adjuntos

   **Dependencias entre Tareas**: Cliente HTTP base
   
   **Riesgos**: 
   - Discrepancias en estructura de datos entre frontend y backend
   - Manejo de archivos grandes (hasta 100MB según PRD)
   
   **Plan de Contingencia**:
   - Implementar adaptadores de datos
   - Configurar subida de archivos en chunks para archivos grandes

2. **Store de Inventario con Zustand**:
   - Estado de productos, carga y errores
   - Acciones CRUD con UI Optimista

   **Dependencias entre Tareas**: Servicio de API de Inventario
   
   **Riesgos**: Pérdida de funcionalidades existentes durante la migración
   
   **Plan de Contingencia**: Implementación paralela con feature flag

3. **Refactorizar Componentes de Inventario**:
   - Migración desde Context API a Zustand
   - Implementación de manejo de errores

   **Dependencias entre Tareas**: Store de Inventario
   
   **Riesgos**: Regresiones en la UI
   
   **Plan de Contingencia**: Pruebas exhaustivas de UI y suite de pruebas automatizadas

#### 3.3.2 Módulo de Tareas Pendientes

1. **Servicio de API de Tareas**:
   - Endpoints para tareas pendientes
   - Soporte para Carga Rápida y Retiro Rápido

   **Dependencias entre Tareas**: Cliente HTTP base
   
   **Riesgos**: Complejidad en la sincronización de estados de tareas
   
   **Plan de Contingencia**: Implementar sistema de polling para actualizaciones de estado

2. **Store de Tareas con Zustand**:
   - Estado de tareas, carga y errores
   - Acciones para crear, procesar y cancelar tareas

   **Dependencias entre Tareas**: Servicio de API de Tareas
   
   **Riesgos**: Inconsistencias en el flujo de trabajo de tareas
   
   **Plan de Contingencia**: Validación de flujos completos de trabajo

3. **Refactorizar Componentes de Tareas**:
   - Migración desde Context API a Zustand
   - Implementación de manejo de errores

   **Dependencias entre Tareas**: Store de Tareas
   
   **Riesgos**: Regresiones en la UI
   
   **Plan de Contingencia**: Pruebas de usuario para validar flujos de trabajo

#### 3.3.3 Módulo de Préstamos y Asignaciones

1. **Servicios de API**:
   - Endpoints para préstamos y asignaciones
   - Manejo de estados y transiciones

   **Dependencias entre Tareas**: Cliente HTTP base, Servicio de Inventario
   
   **Riesgos**: 
   - Inconsistencias en la lógica de negocio entre frontend y backend
   - Conflictos en actualizaciones concurrentes
   
   **Plan de Contingencia**: 
   - Documentación detallada de reglas de negocio
   - Implementación de bloqueos optimistas

2. **Stores con Zustand**:
   - Estados separados para préstamos y asignaciones
   - Acciones con UI Optimista

   **Dependencias entre Tareas**: Servicios de API correspondientes
   
   **Riesgos**: Interdependencias complejas entre inventario, préstamos y asignaciones
   
   **Plan de Contingencia**: Diseño de pruebas de integración entre módulos

3. **Refactorizar Componentes**:
   - Migración desde Context API a Zustand
   - Implementación de manejo de errores

   **Dependencias entre Tareas**: Stores correspondientes
   
   **Riesgos**: Regresiones en la UI
   
   **Plan de Contingencia**: Pruebas de regresión automatizadas

### 3.4 Fase 4: Módulos Secundarios y Configuración (2 semanas)

#### 3.4.1 Módulo de Configuración

1. **Servicio de API de Configuración**:
   - Endpoints para categorías, marcas, ubicaciones
   - Gestión de usuarios (solo Admin)

   **Dependencias entre Tareas**: Cliente HTTP base
   
   **Riesgos**: Permisos incorrectos para operaciones sensibles
   
   **Plan de Contingencia**: Matriz de control de acceso detallada

2. **Store de Configuración con Zustand**:
   - Estados para categorías, marcas, ubicaciones
   - Estado para gestión de usuarios

   **Dependencias entre Tareas**: Servicio de API de Configuración
   
   **Riesgos**: Cacheo excesivo de datos de configuración
   
   **Plan de Contingencia**: Estrategia de invalidación de caché

3. **Refactorizar Componentes de Configuración**:
   - Migración desde Context API a Zustand
   - Implementación de manejo de errores

   **Dependencias entre Tareas**: Store de Configuración
   
   **Riesgos**: Regresiones en la UI
   
   **Plan de Contingencia**: Pruebas de usuario para validar flujos de trabajo

#### 3.4.2 Módulo de Historial y Auditoría

1. **Servicio de API de Historial**:
   - Endpoints para logs de auditoría
   - Filtrado y paginación

   **Dependencias entre Tareas**: Cliente HTTP base
   
   **Riesgos**: Volumen de datos excesivo
   
   **Plan de Contingencia**: Implementación de paginación eficiente y filtros avanzados

2. **Store de Historial con Zustand**:
   - Estado para logs de auditoría
   - Acciones para filtrado y paginación

   **Dependencias entre Tareas**: Servicio de API de Historial
   
   **Riesgos**: Rendimiento con grandes volúmenes de datos
   
   **Plan de Contingencia**: Estrategias de carga bajo demanda y virtualización

3. **Refactorizar Componentes de Historial**:
   - Migración desde Context API a Zustand
   - Implementación de manejo de errores

   **Dependencias entre Tareas**: Store de Historial
   
   **Riesgos**: Regresiones en la UI
   
   **Plan de Contingencia**: Pruebas de rendimiento con conjuntos de datos grandes

### 3.5 Fase 5: Validación e Integración Final (2 semanas)

#### 3.5.1 Implementación de Validación con Zod

1. **Esquemas de Validación**:
   - Definir esquemas Zod para todos los formularios
   - Integración con React Hook Form

   **Dependencias entre Tareas**: Stores de todos los módulos
   
   **Riesgos**: 
   - Inconsistencias entre validación frontend y backend
   - Mensajes de error poco claros para el usuario
   
   **Plan de Contingencia**: 
   - Documentación de reglas de validación entre equipos
   - Personalización de mensajes de error para mejorar UX

2. **Refactorizar Formularios**:
   - Migración a React Hook Form + Zod
   - Implementación de validación en tiempo real

   **Dependencias entre Tareas**: Esquemas de validación
   
   **Riesgos**: Degradación de la experiencia de usuario
   
   **Plan de Contingencia**: Pruebas A/B de formularios críticos

#### 3.5.2 Optimización de UI Optimista

1. **Revisión de Patrones de UI Optimista**:
   - Auditoría de todas las acciones del usuario
   - Implementación de rollbacks y recuperación

   **Dependencias entre Tareas**: Stores de todos los módulos
   
   **Riesgos**: 
   - Inconsistencias visuales durante operaciones fallidas
   - Feedback insuficiente al usuario
   
   **Plan de Contingencia**: 
   - Sistema de notificaciones Toast mejorado
   - Pruebas de escenarios de fallo

2. **Implementación de Indicadores de Estado**:
   - Skeletons para estados de carga
   - Animaciones para transiciones de estado

   **Dependencias entre Tareas**: Revisión de patrones de UI Optimista
   
   **Riesgos**: Sobrecarga visual
   
   **Plan de Contingencia**: Pruebas de usabilidad con usuarios reales

#### 3.5.3 Pruebas de Integración End-to-End

1. **Definición de Casos de Prueba**:
   - Flujos completos de usuario
   - Escenarios de error y recuperación

   **Dependencias entre Tareas**: Implementación de todos los módulos
   
   **Riesgos**: Cobertura insuficiente de casos de uso
   
   **Plan de Contingencia**: Sesiones de pair testing con stakeholders

2. **Ejecución de Pruebas**:
   - Pruebas manuales de flujos críticos
   - Automatización de pruebas con Cypress/Playwright

   **Dependencias entre Tareas**: Definición de casos de prueba
   
   **Riesgos**: Entornos de prueba inestables
   
   **Plan de Contingencia**: Infraestructura dedicada para pruebas

## 4. Estrategia de Despliegue Incremental

### 4.1 Feature Flags

Implementar un sistema de feature flags para habilitar/deshabilitar características:

```typescript
// lib/features.ts
export const FEATURES = {
  USE_API_AUTH: process.env.NEXT_PUBLIC_USE_API_AUTH === 'true',
  USE_API_INVENTORY: process.env.NEXT_PUBLIC_USE_API_INVENTORY === 'true',
  USE_API_TASKS: process.env.NEXT_PUBLIC_USE_API_TASKS === 'true',
  USE_API_LOANS: process.env.NEXT_PUBLIC_USE_API_LOANS === 'true',
  USE_API_ASSIGNMENTS: process.env.NEXT_PUBLIC_USE_API_ASSIGNMENTS === 'true',
  USE_API_CONFIGURATION: process.env.NEXT_PUBLIC_USE_API_CONFIGURATION === 'true',
};
```

**Riesgos**:
- Complejidad adicional en el código
- Olvido de eliminar flags obsoletos

**Plan de Contingencia**:
- Revisiones de código dedicadas a la limpieza de flags
- Documentación clara de flags activos

### 4.2 Despliegue por Módulos

Secuencia de despliegue recomendada:

1. **Infraestructura Base** (cliente HTTP, tipos, middleware)
2. **Autenticación**
3. **Inventario**
4. **Tareas Pendientes**
5. **Préstamos y Asignaciones**
6. **Configuración**
7. **Historial y Auditoría**

Para cada módulo:

1. Desplegar con feature flag desactivado
2. Activar para un grupo reducido de usuarios (10%)
3. Monitorear errores y rendimiento
4. Rollout completo o rollback según resultados

**Riesgos**:
- Interdependencias no identificadas entre módulos
- Experiencia inconsistente para usuarios durante la transición

**Plan de Contingencia**:
- Mapeo completo de dependencias entre módulos
- Comunicación clara a usuarios sobre cambios y mejoras

### 4.3 Monitoreo y Rollback

1. **Implementar Monitoreo**:
   - Logging de errores de cliente con Sentry
   - Métricas de rendimiento con Web Vitals

   **Riesgos**: Sobrecarga de datos de monitoreo
   
   **Plan de Contingencia**: Filtrado inteligente de eventos y agregación

2. **Plan de Rollback**:
   - Procedimiento documentado para cada módulo
   - Puntos de decisión claros

   **Riesgos**: Tiempo de respuesta lento ante problemas críticos
   
   **Plan de Contingencia**: Equipo de respuesta rápida designado

## 5. Análisis de Riesgos y Mitigación

### 5.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |
|--------|-------------|---------|--------------------------|
| Incompatibilidad de API | Alta | Alto | Implementar adaptadores y mapeos de datos |
| Problemas de rendimiento | Media | Alto | Pruebas de carga temprana, optimización proactiva |
| Pérdida de datos durante migración | Baja | Crítico | Backups completos, migración en paralelo |
| Conflictos de dependencias | Media | Medio | Auditoría de package.json, lock files |
| Errores de CORS | Alta | Medio | Configuración temprana, pruebas en entorno similar a producción |

### 5.2 Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |
|--------|-------------|---------|--------------------------|
| Resistencia al cambio | Alta | Medio | Comunicación clara, formación a usuarios |
| Interrupción de operaciones | Media | Alto | Despliegue fuera de horario laboral, rollback rápido |
| Funcionalidades críticas no disponibles | Media | Alto | Priorización basada en necesidades de negocio |
| Inconsistencia de datos | Media | Crítico | Validación exhaustiva, scripts de reconciliación |

## 6. Herramientas y Recursos Necesarios

### 6.1 Dependencias Técnicas

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "react-hook-form": "^7.48.0"
  },
  "devDependencies": {
    "cypress": "^13.0.0",
    "@sentry/nextjs": "^7.80.0"
  }
}
```

### 6.2 Recursos Humanos

- 2 Desarrolladores Frontend (tiempo completo)
- 1 Desarrollador Backend (consultas)
- 1 QA (pruebas)
- Product Owner (validación de requisitos)

### 6.3 Documentación Requerida

- API Swagger/OpenAPI del backend
- Diagramas de flujo de procesos de negocio
- Matriz de permisos por rol actualizada

## 7. Cronograma Detallado

| Fase | Duración | Dependencias | Entregables |
|------|----------|--------------|-------------|
| 1. Preparación de Infraestructura | 2 semanas | Ninguna | Cliente HTTP, estructura de carpetas, tipos base |
| 2. Autenticación | 2 semanas | Fase 1 | Login/logout funcional, protección de rutas |
| 3. Módulos Core | 4 semanas | Fase 2 | Inventario, Tareas, Préstamos y Asignaciones |
| 4. Módulos Secundarios | 2 semanas | Fase 3 | Configuración, Historial |
| 5. Validación e Integración | 2 semanas | Fase 4 | Pruebas completas, optimizaciones |
| **Total** | **12 semanas** | | |

## 8. Conclusión y Próximos Pasos

La migración de GATI-C a una arquitectura cliente-servidor robusta es un proyecto complejo pero estructurado. Este plan detallado:

1. Alinea la implementación con los requisitos del SRS y PRD
2. Identifica y mitiga riesgos en cada fase
3. Proporciona un camino claro para la migración incremental
4. Establece puntos de control y planes de contingencia

### Próximos Pasos Inmediatos

1. Validar este plan con stakeholders
2. Configurar entorno de desarrollo con acceso a API de prueba
3. Implementar cliente HTTP base y probar conectividad
4. Iniciar desarrollo del módulo de autenticación

La implementación exitosa de este plan resultará en una aplicación GATI-C más robusta, escalable y alineada con los requisitos empresariales, manteniendo la experiencia de usuario fluida que define al producto. 