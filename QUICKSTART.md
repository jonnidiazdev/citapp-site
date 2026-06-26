# Guía de Inicio Rápido - CitApp

## Gestión de Turnos para Negocios

CitApp está diseñada para que **dueños de negocios** gestionen los turnos de sus clientes de forma eficiente.

### Características Principales

- **Panel de Gestión**: Dashboard completo para administrar tus turnos
- **Links Únicos**: Genera links personalizados para que tus clientes agenden sin registro
- **Visualización de Turnos**: Ve todos tus turnos organizados por fecha
- **Estadísticas**: Dashboard con métricas de tus turnos

## Pasos para Ejecutar Localmente

1. **Instalar dependencias**
   ```bash
   cd /Users/jondiaz/Documents/Projectos/citapp-site
   npm install
   ```

2. **Configurar Firebase**
   - Se necesita una cuenta de Firebase
   - Ver `FIREBASE_SETUP.md` para instrucciones detalladas
   - Copiar las credenciales en `.env.local`

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación**
   - Abre tu navegador en `http://localhost:5173/`

## Flujo de Prueba

### Registro
1. Haz clic en "Registrarse"
2. Completa los datos:
   - Nombre: Tu Nombre o Nombre del Negocio
   - Email: tuemail@example.com
   - Contraseña: cualquier contraseña
3. Se te redirigirá automáticamente a tu panel de gestión

### Login
1. Haz clic en "Iniciar Sesión"
2. Ingresa tus credenciales
3. Serás redirigido a tu panel de gestión

## Características Principales

### Panel de Gestión
- Dashboard con estadísticas de turnos (total, pendientes, completados)
- Selector de fecha para ver turnos del día
- Vista de todos los turnos del día seleccionado
- Acciones para editar o eliminar turnos
- Sistema para generar links únicos para clientes (próximamente)

## Estructura del Proyecto

La aplicación está organizada en:

- **src/pages/**: Páginas principales (Home, ClientAppointments, AdminDashboard)
- **src/components/**: Componentes reutilizables (Login, Register, Layout)
- **src/store/**: Gestión de estado con Zustand
- **src/services/**: Servicios para API y autenticación
- **src/types/**: Tipos TypeScript

## Próximos Pasos

Para completar la aplicación, puedes:

1. **Backend API**: Crear un servidor Node.js/Express que implemente los endpoints esperados
2. **Sistema de Links Únicos**: Implementar generación de links para que clientes agenden sin cuenta
3. **Funcionalidad de Turnos**: Implementar la lógica completa para agendar, editar y cancelar turnos
4. **Notificaciones**: Agregar notificaciones por email/SMS para recordatorios
5. **Calendario Mejorado**: Visualización mensual/semanal con drag-and-drop
6. **Base de Datos**: Integrar una base de datos (MongoDB, PostgreSQL, etc.)

## Troubleshooting

**Puerto 5173 en uso:**
```bash
npm run dev -- --port 3001
```

**Limpiar node_modules:**
```bash
rm -rf node_modules
npm install
```

**Compilación fallando:**
```bash
npm run build
```

## Contacto y Soporte

Para más información sobre características o problemas, revisa el README.md principal.
