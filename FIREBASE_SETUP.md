# Configuración de Firebase

Este proyecto usa Firebase para autenticación y base de datos en tiempo real (Firestore).

## Pasos para Configurar Firebase

### 1. Crear un Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Add project"
3. Ingresa el nombre: **CitApp**
4. Acepta los términos y crea el proyecto

### 2. Habilitar Autenticación

1. En Firebase Console, ve a **Authentication** (o Autenticación)
2. Haz clic en **Get Started**
3. En la pestaña **Sign-in method**, habilita:
   - Email/Password

### 3. Crear una Base de Datos Firestore

1. Ve a **Firestore Database**
2. Haz clic en **Create database**
3. Selecciona:
   - **Location**: us-central1 (o tu región)
   - **Start in production mode**
4. Haz clic en **Create**

### 4. Establecer Reglas de Seguridad

1. En Firestore, ve a la pestaña **Rules**
2. Reemplaza con las siguientes reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Haz clic en **Publish**

### 5. Obtener Credenciales de Firebase

1. En Firebase Console, haz clic en el ícono de engranaje (⚙️) → **Project settings**
2. Ve a la pestaña **Your apps**
3. Haz clic en **Add app** → Selecciona **Web** (</>)
4. Ingresa el nombre: **CitApp**
5. Registra la app
6. Copia la configuración que se muestra

Debería verse así:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDx...",
  authDomain: "citapp-xxx.firebaseapp.com",
  projectId: "citapp-xxx",
  storageBucket: "citapp-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

### 6. Configurar Variables de Entorno

1. Abre o crea el archivo `.env.local` en la raíz del proyecto
2. Copia tu configuración de Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSyDx...
VITE_FIREBASE_AUTH_DOMAIN=citapp-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=citapp-xxx
VITE_FIREBASE_STORAGE_BUCKET=citapp-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...
```

### 7. Iniciar la Aplicación

```bash
npm run dev
```

Abre `http://localhost:5173/` en tu navegador.

## Pruebar la Aplicación

### Registro
1. Haz clic en **Registrarse**
2. Ingresa:
   - Email: tu@email.com
   - Contraseña: cualquier contraseña
   - Nombre: Tu Nombre
3. Se creará una cuenta en Firebase y serás redirigido al dashboard

### Login
1. Haz clic en **Iniciar Sesión**
2. Ingresa tus credenciales
3. Verás el panel de gestión

### Crear Turnos
En el dashboard puedes:
- Ver estadísticas de turnos
- Seleccionar fechas
- Ver turnos del día (si los hay)

## Estructura de Datos en Firestore

### Colección: `users`
```
{
  id: "uid-del-usuario",
  email: "user@email.com",
  name: "Juan Pérez",
  role: "admin",
  createdAt: "2026-02-10T..."
}
```

### Colección: `appointments`
```
{
  id: "auto-generado",
  userId: "uid-del-usuario",
  clientName: "Cliente",
  clientEmail: "cliente@email.com",
  date: "2026-02-15",
  startTime: "09:00",
  endTime: "10:00",
  status: "pending",
  notes: "Notas...",
  createdAt: "2026-02-10T..."
}
```

## Troubleshooting

### Error: "Firebase app not initialized"
- Verifica que las variables de entorno en `.env.local` son correctas
- Las variables deben empezar con `VITE_`

### Error: "Permission denied"
- Verifica las reglas de seguridad en Firestore
- Asegúrate de que el usuario esté autenticado

### Error: "User not found"
- Intenta hacer logout y login nuevamente
- Verifica que el documento del usuario existe en Firestore

## Seguridad

⚠️ **Importante:**
- Las credenciales de Firebase son públicas (se envían al cliente)
- Las reglas de seguridad de Firestore protegen los datos
- Nunca compartas tu `projectId` en repositorios públicos

## Próximos Pasos

- [ ] Implementar links únicos para clientes
- [ ] Agregar notificaciones por email
- [ ] Implementar pagos
- [ ] Agregar análisis

## Soporte

Para más información sobre Firebase:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
