import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/formatCurrency.js";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getCategoryName(event) {
  return event.category?.name || event.category || "Acara";
}

function getLocation(event) {
  if (event.venue?.city && event.venue?.name) {
    return `${event.venue.name}, ${event.venue.city}`;
  }

  return event.location || event.venue?.name || "-";
}

function getDate(event) {
  return event.date || formatDate(event.start_at);
}

function getPriceText(event) {
  if (typeof event.price === "number") {
    return formatCurrency(event.price);
  }

  if (typeof event.starting_price === "number") {
    return formatCurrency(event.starting_price);
  }

  return "Lihat tiket";
}

function EventCard({ event }) {
  const [posterFailed, setPosterFailed] = useState(false);
  const posterUrl = event.poster_url || "";

  useEffect(() => {
    setPosterFailed(false);
  }, [posterUrl]);

  return (
    <article className="cream-card group flex h-full min-h-[430px] flex-col overflow-hidden transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#ff6b5f]/60 hover:shadow-[0_18px_45px_rgba(255,79,69,0.16)]">
      <div className="aspect-[4/5] w-full shrink-0 overflow-hidden bg-gradient-to-br from-warm-accent via-warm-surface to-warm-bg sm:aspect-[16/10]">
        {posterUrl && !posterFailed ? (
          <img
            alt={`Poster ${event.title}`}
            className="block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setPosterFailed(true)}
            src={posterUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-600">
            <Ticket size={56} strokeWidth={1.6} />
          </div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <div>
          <p className="badge-category">{getCategoryName(event)}</p>
          <h3 className="mt-2 line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-7 tracking-tight text-navy">
            {event.title}
          </h3>
        </div>

        <div className="space-y-2 text-sm text-muted">
          <p className="flex min-h-6 items-center gap-2">
            <CalendarDays className="shrink-0" size={16} />
            <span className="line-clamp-1">{getDate(event)}</span>
          </p>
          <p className="flex min-h-6 items-center gap-2">
            <MapPin className="shrink-0" size={16} />
            <span className="line-clamp-1">{getLocation(event)}</span>
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dark">
              {getPriceText(event)}
            </p>
            <p className="mt-1 text-xs font-medium text-muted">
              {event.availableTickets
                ? `${event.availableTickets} tiket tersisa`
              : "Cek tipe tiket"}
            </p>
          </div>
          <Link className="btn-primary w-full px-4 py-2 sm:w-auto" to={`/events/${event.id}`}>
            Detail
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(EventCard);
