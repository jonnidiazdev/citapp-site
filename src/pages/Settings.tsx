import { useState, useActionState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormStatus } from 'react-dom';
import { useAuthStore } from '../store/authStore';
import { businessSettingsService } from '../services/businessSettingsService';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import { useToast } from '../components/ui/useToast';
import type { DayWorkingHours } from '../types';
import { FiCopy, FiCheck } from 'react-icons/fi';
import '../styles/settings.css';

const daysMap: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Guardando...' : 'Guardar Configuración'}
    </button>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { showToast } = useToast();
  const { settings, setSettings, loading, save } = useBusinessSettings();
  const [copied, setCopied] = useState(false);

  const [, saveAction] = useActionState(async () => {
    if (!settings) return { error: 'No hay configuración' };
    try {
      await save(settings);
      showToast('Configuración guardada exitosamente', 'success');
      setTimeout(() => navigate('/admin/dashboard'), 1500);
      return { success: true };
    } catch {
      showToast('Error al guardar la configuración', 'error');
      return { error: 'Error al guardar' };
    }
  }, null);

  const updateDayConfig = (day: string, field: keyof DayWorkingHours, value: boolean | string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      workingHours: {
        ...settings.workingHours,
        [day]: {
          ...settings.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  const copyBookingUrl = () => {
    if (!user) return;
    const url = businessSettingsService.getPublicBookingUrl(user.id);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Link copiado', 'success');
  };

  if (loading) {
    return (
      <div className="settings-container">
        <p>Cargando configuración...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="settings-container">
        <h1>Configuración de Negocio</h1>
        <button
          type="button"
          className="button"
          onClick={() => businessSettingsService.saveSettings({}).then(() => window.location.reload())}
        >
          Crear Configuración Inicial
        </button>
      </div>
    );
  }

  const bookingUrl = user ? businessSettingsService.getPublicBookingUrl(user.id) : '';

  return (
    <div className="settings-container">
      <h1>Configuración de Negocio</h1>

      <div className="settings-section">
        <h2>Información del Negocio</h2>
        <div className="form-group">
          <label htmlFor="business-name">Nombre del Negocio</label>
          <input
            id="business-name"
            type="text"
            value={settings.businessName}
            onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            placeholder="Mi Negocio"
          />
        </div>
        <div className="form-group">
          <label htmlFor="business-description">Descripción</label>
          <textarea
            id="business-description"
            value={settings.businessDescription || ''}
            onChange={(e) => setSettings({ ...settings, businessDescription: e.target.value })}
            placeholder="Describe tu negocio y servicios..."
            rows={3}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>Configuración de Turnos</h2>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="appointment-duration">Duración de cada turno (minutos)</label>
            <select
              id="appointment-duration"
              value={settings.appointmentDuration}
              onChange={(e) =>
                setSettings({ ...settings, appointmentDuration: parseInt(e.target.value) })
              }
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={40}>40 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="break-time">Tiempo de receso entre turnos (minutos)</label>
            <select
              id="break-time"
              value={settings.breakTime}
              onChange={(e) => setSettings({ ...settings, breakTime: parseInt(e.target.value) })}
            >
              <option value={0}>Sin receso</option>
              <option value={5}>5 minutos</option>
              <option value={10}>10 minutos</option>
              <option value={15}>15 minutos</option>
              <option value={20}>20 minutos</option>
              <option value={30}>30 minutos</option>
            </select>
          </div>
        </div>
        <div className="form-group holiday-scheduling-toggle">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.allowHolidayAppointments}
              onChange={(e) =>
                setSettings({ ...settings, allowHolidayAppointments: e.target.checked })
              }
            />
            Permitir agendar en feriados y días no laborables de Argentina
          </label>
          <small>
            Si desactivás esta opción, el sistema bloqueará reservas en días marcados como feriados o
            no laborables.
          </small>
        </div>
      </div>

      <div className="settings-section">
        <h2>Límite de Sesiones por Día</h2>
        <div className="form-group">
          <label htmlFor="daily-limit">
            Máximo de sesiones permitidas por día: <strong>{settings.dailySessionLimit}</strong>
          </label>
          <input
            id="daily-limit"
            type="range"
            min="1"
            max={Math.max(settings.dailySessionLimit, 30)}
            value={settings.dailySessionLimit}
            onChange={(e) =>
              setSettings({ ...settings, dailySessionLimit: parseInt(e.target.value) })
            }
            className="slider"
          />
          <small>
            Este límite se calcula automáticamente basado en tu horario de atención, duración de
            turnos y recesos.
          </small>
        </div>
      </div>

      <div className="settings-section">
        <h2>Horarios de Atención</h2>
        <div className="working-hours">
          {Object.entries(daysMap).map(([key, label]) => (
            <div key={key} className="day-config">
              <div className="day-header">
                <input
                  type="checkbox"
                  checked={settings.workingHours[key]?.enabled || false}
                  onChange={(e) => updateDayConfig(key, 'enabled', e.target.checked)}
                />
                <label>{label}</label>
              </div>
              {settings.workingHours[key]?.enabled && (
                <div className="time-inputs">
                  <input
                    type="time"
                    value={settings.workingHours[key]?.startTime || '09:00'}
                    onChange={(e) => updateDayConfig(key, 'startTime', e.target.value)}
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={settings.workingHours[key]?.endTime || '18:00'}
                    onChange={(e) => updateDayConfig(key, 'endTime', e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h2>Link Público de Reservas</h2>
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.publicBookingEnabled}
              onChange={(e) =>
                setSettings({ ...settings, publicBookingEnabled: e.target.checked })
              }
            />
            Habilitar reservas públicas
          </label>
        </div>
        {settings.publicBookingEnabled && (
          <div className="booking-url-section">
            <label htmlFor="booking-url">URL para compartir con clientes:</label>
            <div className="url-display">
              <input id="booking-url" type="text" value={bookingUrl} readOnly className="url-input" />
              <button type="button" className="button" onClick={copyBookingUrl}>
                {copied ? <FiCheck /> : <FiCopy />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="hint">
              Comparte este link con tus clientes para que puedan reservar turnos sin necesidad de
              crear cuenta.
            </p>
          </div>
        )}
      </div>

      <form action={saveAction} className="settings-actions">
        <SaveButton />
      </form>
    </div>
  );
}
