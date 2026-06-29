# Sistema de Reservas Públicas - CitApp

## Nuevas Funcionalidades

### 1. Configuración del Negocio (Settings)

El dashboard ahora incluye una página de configuración completa donde puedes:

- **Información del negocio**: Nombre y descripción
- **Duración de turnos**: De 15 a 120 minutos
- **Tiempo de receso**: De 0 a 30 minutos entre turnos
- **Horarios de atención**: Configura días y horas de trabajo para cada día de la semana
- **URL pública de booking**: Genera y comparte un enlace único para que tus clientes reserven turnos

#### Acceso a Configuración

Desde el Dashboard Admin, haz clic en el botón **⚙️ Configuración** en la parte superior derecha.

### 2. Página de Reserva Pública

Los clientes pueden reservar turnos sin necesidad de crear una cuenta usando tu URL única.

Características:
- **Calendario de 7 días**: Muestra los próximos 7 días disponibles
- **Horarios disponibles**: Visualiza todos los slots disponibles basados en tu configuración
- **Formulario simple**: Solo nombre, email, teléfono (opcional) y notas
- **Confirmación instantánea**: Los turnos se guardan directamente en tu agenda

#### URL de Booking

Tu URL pública tiene el formato:
```
https://tudominio.com/booking/[TU_TOKEN_UNICO]
```

Puedes copiar la URL desde la página de Configuración y compartirla con tus clientes.

## Configuración de Firebase

### Reglas de Seguridad de Firestore

Para que el sistema de reservas públicas funcione correctamente, debes actualizar las reglas de seguridad de Firestore:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Reglas**
4. Reemplaza las reglas existentes con el contenido del archivo `firestore.rules`
5. Haz clic en **Publicar**

Las reglas permiten:
- ✅ Los usuarios autenticados pueden leer/escribir sus propios datos
- ✅ El público puede leer `publicProfiles` (solo config del negocio, sin PII)
- ✅ El público puede leer `bookingSlots` (solo horarios ocupados, sin datos de clientes)
- ✅ El público puede crear citas (con validación de campos requeridos)
- ❌ El público NO puede leer citas completas ni `businessSettings`
- ❌ El público NO puede modificar o eliminar citas existentes

> **Breaking change:** La URL pública usa `/booking/:token` (token opaco). Links antiguos con Firebase UID dejan de funcionar. Guardá settings y recompartí el nuevo link.

### Estructura de Datos

#### BusinessSettings (privado — solo owner)

Almacena la configuración completa del negocio. Solo accesible por el admin autenticado.

#### publicProfiles (público — lectura por token)

Proyección pública sincronizada al guardar settings. El ID del documento es `publicBookingToken`:

```typescript
{
  userId: string,
  businessName: string,
  businessDescription?: string,
  appointmentDuration: number,
  breakTime: number,
  dailySessionLimit: number,
  allowHolidayAppointments: boolean,
  publicBookingEnabled: boolean,
  workingHours: { /* ... */ }
}
```

#### bookingSlots (público — solo horarios)

`bookingSlots/{userId}/days/{date}`:

```typescript
{
  occupied: [{ startTime: string, endTime: string }]
}
```

#### Appointments (Firestore Collection)

Las reservas públicas crean documentos con:
```typescript
{
  userId: string,          // ID del negocio
  clientName: string,      // Nombre del cliente
  clientEmail: string,     // Email del cliente
  clientPhone?: string,    // Teléfono opcional
  date: string,           // Fecha (YYYY-MM-DD)
  startTime: string,      // Hora inicio (HH:mm)
  endTime: string,        // Hora fin (HH:mm)
  status: 'pending',      // Estado inicial
  notes?: string,         // Notas opcionales
  createdAt: string       // Timestamp de creación
}
```

## Flujo de Uso

### Para el Propietario del Negocio

1. **Configurar el negocio**
   - Ir a Dashboard → Configuración
   - Completar nombre y descripción
   - Configurar duración de turnos y recesos
   - Activar días de trabajo y establecer horarios
   - Guardar configuración

2. **Compartir URL de booking**
   - En Configuración, copiar la URL pública
   - Compartir el enlace por email, redes sociales, WhatsApp, etc.

3. **Gestionar reservas**
   - Ver todas las reservas en el Dashboard
   - Filtrar por fecha
   - Marcar como completadas o cancelar

### Para los Clientes

1. **Acceder a la URL de booking**
   - Abrir el enlace compartido por el negocio

2. **Seleccionar fecha y hora**
   - Elegir un día del calendario
   - Ver horarios disponibles
   - Seleccionar un slot

3. **Completar datos**
   - Ingresar nombre y email (obligatorios)
   - Agregar teléfono y notas (opcionales)
   - Confirmar reserva

4. **Confirmación**
   - Recibir confirmación en pantalla
   - El turno queda guardado en la agenda del negocio

## Cálculo de Slots Disponibles

El sistema calcula automáticamente los horarios disponibles considerando:

- ✅ Horarios de atención configurados
- ✅ Duración de cada turno
- ✅ Tiempo de receso entre turnos
- ✅ Turnos ya reservados
- ✅ Solo muestra slots futuros (no permite reservar en el pasado)

### Ejemplo de Cálculo

Si configuras:
- Horario: 9:00 - 17:00
- Duración del turno: 30 minutos
- Receso: 15 minutos

Los slots disponibles serán:
- 9:00 - 9:30
- 9:45 - 10:15
- 10:30 - 11:00
- ... y así sucesivamente

Si alguien reserva el slot de 10:30, ese horario desaparece de la lista para otros clientes.

## Estilos y Diseño

### Responsive Design

Ambas páginas (Settings y PublicBooking) están optimizadas para:
- 📱 **Móviles**: Grid adaptativo, formularios verticales
- 💻 **Escritorio**: Layouts de múltiples columnas, mayor espaciado

### Temas Visuales

- **Página de Settings**: Fondo claro, cards con sombras, formularios organizados
- **Página de Booking**: Gradiente púrpura llamativo, cards blancos, botones interactivos

## Próximas Mejoras Sugeridas

- [ ] **Notificaciones por email**: Confirmar reservas automáticamente
- [ ] **Recordatorios**: Enviar recordatorios 24h antes
- [ ] **Cancelación pública**: Permitir que clientes cancelen con un link único
- [ ] **Múltiples servicios**: Configurar diferentes tipos de servicio con duraciones distintas
- [ ] **Pagos online**: Integrar Stripe/PayPal para reservas con pago
- [ ] **Integración con Google Calendar**: Sincronizar turnos automáticamente
- [ ] **Zona horaria**: Soporte para diferentes zonas horarias
- [ ] **Widget embebido**: Código para insertar el calendario en otros sitios web

## Troubleshooting

### "Este link de reservas no está disponible"

- Verifica que `publicBookingEnabled` esté en `true` en Firestore
- Confirma que el token en la URL coincida con el de la configuración

### No se muestran slots disponibles

- Verifica que el día seleccionado esté habilitado en la configuración
- Confirma que el horario de atención esté correctamente configurado
- Revisa que no hayan pasado todas las horas del día (no se muestran slots pasados)

### Error al crear reserva

- Verifica que las reglas de Firestore estén correctamente configuradas
- Confirma que todos los campos obligatorios estén completos
- Revisa la consola del navegador para ver el error específico

## Soporte

Para más información o reporte de bugs, consulta la documentación del proyecto o contacta al equipo de desarrollo.
