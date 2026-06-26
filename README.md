# CitApp - Sistema de Gestión de Turnos

CitApp es una aplicación web moderna construida con React y TypeScript que permite a negocios gestionar turnos y citas de forma eficiente. Los clientes pueden agendar turnos mediante links únicos sin necesidad de crear cuenta.

## Características

- **Autenticación**: Login y registro para dueños de negocio
- **Gestión de turnos**: Panel admin con calendario, edición y carga manual
- **Reservas públicas**: Link `/booking/:userId` sin cuenta del cliente
- **Dashboard**: Estadísticas de turnos pendientes, completados y del día
- **Horarios**: Configuración de días, duración, recesos y límite diario
- **Responsive**: Compatible con móvil y escritorio

## Tecnologías

- React 19 + TypeScript + Vite 7
- React Router + Zustand
- Firebase (Auth + Firestore)
- date-fns + Vitest

## Instalación local

```bash
npm install
cp .env.example .env.local
# Completar VITE_FIREBASE_* en .env.local (ver FIREBASE_SETUP.md)
npm run dev
```

La aplicación estará en `http://localhost:5173/`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build local |
| `npm run test:run` | Tests (Vitest) |
| `npm run lint` | ESLint |

## Deploy en Vercel (producción)

SPA con React Router. Vercel sirve el build estático de `dist/`; Firebase corre en el cliente.

### 1. Conectar el repositorio

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Importar repo de GitHub/GitLab/Bitbucket
3. Framework: **Vite** (auto-detectado)

### 2. Build settings

| Campo | Valor |
|-------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

[`vercel.json`](vercel.json) ya incluye rewrites para que rutas como `/booking/:userId` y `/admin/dashboard` no devuelvan 404 al refrescar.

### 3. Variables de entorno

En **Project → Settings → Environment Variables**, agregar (Production y Preview):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Mismos valores que en `.env.local`. Sin ellas el build puede pasar pero la app falla en runtime.

### 4. Firebase (obligatorio post-deploy)

1. **Authentication → Settings → Authorized domains**  
   Agregar `tu-proyecto.vercel.app` y dominio custom si aplica.

2. **Firestore → Rules**  
   Publicar reglas de [`firestore.rules`](firestore.rules) (booking público incluido). Ver también [`BOOKING_SYSTEM.md`](BOOKING_SYSTEM.md).

### 5. Verificación en prod

- [ ] Registro / login admin
- [ ] Dashboard y configuración de negocio
- [ ] Copiar link público y reservar turno
- [ ] Horarios pasados del día deshabilitados
- [ ] Refresh en `/booking/...` y `/admin/dashboard` (sin 404)

### Plan Hobby

Vercel Hobby permite **hasta 200 proyectos** por cuenta. Uso personal/side projects; uso comercial → revisar [plan Pro](https://vercel.com/docs/plans).

## Documentación adicional

- [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) — Firebase inicial
- [`BOOKING_SYSTEM.md`](BOOKING_SYSTEM.md) — Reservas públicas y reglas
- [`QUICKSTART.md`](QUICKSTART.md) — Guía rápida local

## Licencia

MIT
