import type { AppointmentStats } from '../../utils/appointmentStats';

interface AdminStatsProps {
  stats: AppointmentStats;
}

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="dashboard-stats">
      <div className="stat-card">
        <h3>Total de Turnos</h3>
        <p className="stat-number">{stats.total}</p>
      </div>
      <div className="stat-card">
        <h3>Pendientes</h3>
        <p className="stat-number warning">{stats.pending}</p>
      </div>
      <div className="stat-card">
        <h3>Completados</h3>
        <p className="stat-number success">{stats.completed}</p>
      </div>
      <div className="stat-card">
        <h3>Hoy</h3>
        <p className="stat-number">{stats.today}</p>
      </div>
    </div>
  );
}
