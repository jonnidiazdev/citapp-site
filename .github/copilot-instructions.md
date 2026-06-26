# CitApp - Instrucciones para Desarrollo

## Información del Proyecto

CitApp es un sistema de gestión de turnos y citas construido con React, TypeScript y Vite. Similar a turnito.app, permite que clientes gestionen sus propios turnos y que administradores controlen la disponibilidad.

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Authentication + Firestore)
- **Enrutamiento**: React Router v7
- **State Management**: Zustand
- **Estilos**: CSS puro
- **HTTP Client**: Axios (para APIs externas si se necesitas)
- **Utilidades de Fechas**: date-fns
- **Iconografía**: react-icons

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.tsx      # Layout con navbar
│   ├── Login.tsx       # Formulario de login
│   ├── Register.tsx    # Formulario de registro
│   └── ProtectedRoute.tsx # Protección de rutas por rol
├── pages/              # Páginas principales
│   ├── Home.tsx        # Página de inicio
│   ├── ClientAppointments.tsx # Panel de clientes
│   └── AdminDashboard.tsx # Panel de administración
├── store/              # Zustand stores
│   ├── authStore.ts   # Autenticación
│   ├── appointmentStore.ts # Gestión de turnos
│   └── businessStore.ts    # Datos del negocio
├── services/           # Servicios y configuración
│   ├── firebase.ts     # Configuración de Firebase
│   ├── authService.ts  # Autenticación con Firebase
│   └── appointmentService.ts # Turnos con Firestore
├── types/              # TypeScript types
│   └── index.ts       # Tipos compartidos
└── styles/             # Estilos CSS
    └── *.css          # Estilos específicos
```

## Convenciones de Código

### TypeScript
- Siempre usar type-only imports para tipos: `import type { MyType } from '../types'`
- Interfaces para contratos de datos
- Tipos genéricos donde sea apropiado
- Nombres descriptivos en camelCase

### React
- Functional components solamente
- Hooks para lógica de estado
- Props bien tipadas
- Nombres de componentes en PascalCase

### Estilos
- CSS modules cuando sea posible
- Variables CSS para colores y espaciado
- Mobile-first approach
- Responsive design

## Guía para Contribuir

### Agregar una Nueva Página

1. Crear archivo en `src/pages/NombrePagina.tsx`
2. Exportar componente default
3. Agregar ruta en `src/App.tsx`
4. Crear estilos en `src/styles/nombre-pagina.css` si es necesario

### Agregar un Nuevo Componente

1. Crear archivo en `src/components/NombreComponente.tsx`
2. Tipear props correctamente
3. Usar type-only imports para tipos
4. Crear estilos si es necesario

### Agregar un Nuevo Store

1. Crear archivo en `src/store/nombreStore.ts`
2. Usar Zustand para crear el store
3. Exportar hooks de acceso

### Agregar un Nuevo Servicio

1. Crear archivo en `src/services/nombreService.ts`
2. Implementar fallback a localStorage si es necesario
3. Manejo de errores adecuado
4. Type-safe con TypeScript

## Reglas de Estilo

### CSS
- Usar nombres de clases descriptivos en kebab-case
- Variables CSS para colores: `--primary-color: #667eea`
- Breakpoints: Mobile-first, tablet (768px), desktop (1024px)
- Paleta de colores:
  - Primario: `#667eea`
  - Secundario: `#764ba2`
  - Exitoso: `#27ae60`
  - Error: `#e74c3c`
  - Advertencia: `#f39c12`

### Componentes
- Props interface nombrada `{ComponentName}Props`
- Componentes pequeños y reutilizables
- Documentación de props con JSDoc si es complejo
- Manejo de errores y loading states

## Testing (Futuro)

Cuando se agreguen tests:
- Usar Vitest para unit tests
- React Testing Library para component tests
- Cobertura mínima: 80%

## API Integration

El proyecto usa Firebase como backend:

**Autenticación (Firebase Auth):**
- Email/Password authentication
- User sessions automáticas
- Logout

**Base de Datos (Firestore):**

Colecciones principales:
- `users/`: Documentos de usuarios
- `appointments/`: Documentos de turnos

Estructura de seguridad:
- Cada usuario solo puede ver sus propios datos
- Solo el owner de un turno puede editarlo/borrarlo
- Las reglas de seguridad están en Firestore Rules

Para configurar Firebase, ver `FIREBASE_SETUP.md`

## Deploying

### Build para Producción
```bash
npm run build
```

Archivos generados en `dist/`

### Variables de Entorno
- Crear `.env.local` basado en `.env.example`
- Para producción, actualizar `VITE_API_URL`

## Debugging

### Local Storage
- Auth: `localStorage.getItem('user')`
- Turnos: `localStorage.getItem('citapp_appointments')`

### DevTools
- React DevTools para inspeccionar componentes
- Redux DevTools no es necesario (Zustand es simple)

## Roadmap

- [ ] Persistencia en backend
- [ ] Notificaciones por email
- [ ] Calendario avanzado
- [ ] Pagos online
- [ ] Reportes
- [ ] Multiidioma
- [ ] Dark mode
- [ ] Integración Google Calendar

## Notas Importantes

1. El proyecto usa `verbatimModuleSyntax` en tsconfig - siempre usar type-only imports
2. Zustand es simple y no requiere configuración adicional
3. Los estilos son CSS puro, sin pre-procesadores
4. Actualmente usa localStorage, migrar a backend cuando esté listo
5. React Router v7 maneja subruta de clientes y admin automáticamente

## Recursos Útiles

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Router v7](https://reactrouter.com)
- [Vite Guide](https://vitejs.dev)
- [date-fns](https://date-fns.org)
