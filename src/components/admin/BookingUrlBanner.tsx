import { FiCopy, FiCheck } from 'react-icons/fi';

interface BookingUrlBannerProps {
  bookingUrl: string;
  copied: boolean;
  onCopy: () => void;
}

export function BookingUrlBanner({ bookingUrl, copied, onCopy }: BookingUrlBannerProps) {
  return (
    <div className="booking-url-banner">
      <h2>Link para Reservas Públicas</h2>
      <div className="booking-url-row">
        <label className="sr-only" htmlFor="dashboard-booking-url">
          URL para compartir con clientes
        </label>
        <input
          id="dashboard-booking-url"
          type="text"
          value={bookingUrl}
          readOnly
          className="booking-url-input"
        />
        <button
          type="button"
          className="button booking-url-copy"
          onClick={onCopy}
          aria-label="Copiar link de reservas"
        >
          {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>
      <small className="booking-url-hint">
        Comparte este enlace con tus clientes para que puedan reservar turnos sin crear cuenta
      </small>
    </div>
  );
}
