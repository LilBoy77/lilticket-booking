import { ArrowLeft, CalendarDays, MapPin, QrCode, TicketCheck } from "lucide-react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo-lilticket-tight.png";
import { ticketService } from "../services/ticketService.js";
import { sectionReveal, staggerContainer, staggerItem } from "../utils/motionPresets.js";
import { getStatusLabel } from "../utils/statusLabel.js";

const statusClassMap = {
  ACTIVE: "status-paid",
  CANCELLED: "status-failed",
  INACTIVE: "status-pending",
  PAID: "status-paid",
  PENDING: "status-pending",
  USED: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600",
};

function getStatusClass(status) {
  return statusClassMap[status] || "status-pending";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback || "Terjadi kesalahan. Silakan coba lagi.";
}

function TicketSkeleton() {
  return (
    <article className="premium-ticket mx-auto grid min-h-[320px] w-full max-w-5xl overflow-hidden lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="p-5 pl-7 sm:p-6 sm:pl-8">
        <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-warm-accent/30" />
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-warm-accent/25" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-warm-accent/25" />
          </div>
        </div>
        <div className="mt-6">
          <div className="h-4 w-20 animate-pulse rounded-lg bg-primary-600/25" />
          <div className="mt-3 h-7 w-10/12 animate-pulse rounded-lg bg-warm-accent/30" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="h-5 w-9/12 animate-pulse rounded-lg bg-warm-accent/20" />
            <div className="h-5 w-10/12 animate-pulse rounded-lg bg-warm-accent/20" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl bg-warm-accent/20" />
          <div className="h-24 animate-pulse rounded-2xl bg-warm-accent/20" />
          <div className="h-24 animate-pulse rounded-2xl bg-warm-accent/20" />
        </div>
        <div className="mt-6 h-11 w-44 animate-pulse rounded-xl bg-warm-accent/25" />
      </div>
      <aside className="flex items-center justify-center border-t-2 border-dashed border-line/50 bg-sky p-5 lg:border-l-2 lg:border-t-0">
        <div className="h-44 w-44 animate-pulse rounded-2xl bg-white/70" />
      </aside>
    </article>
  );
}

function TicketsSkeleton() {
  return (
    <motion.div animate="animate" className="grid gap-6" initial="initial" variants={staggerContainer}>
      {Array.from({ length: 2 }, (_, index) => (
        <motion.div key={index} variants={staggerItem}>
          <TicketSkeleton />
        </motion.div>
      ))}
    </motion.div>
  );
}

function BookingTickets() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError("");

    if (!bookingId) {
      setTickets([]);
      setError("ID pesanan tidak ditemukan pada URL.");
      setLoading(false);

      return () => {
        isMounted = false;
      };
    }

    ticketService
      .getTicketsByBookingId(bookingId)
      .then((response) => {
        if (isMounted) {
          setTickets(response.data.tickets || []);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setTickets([]);
          setError(getErrorMessage(requestError, "Gagal memuat e-tiket."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  return (
    <section className="container-page py-12">
      <motion.div {...sectionReveal} className="mb-8 max-w-2xl">
        <button
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff4f45]/35 bg-[#260707]/55 px-4 py-2 text-sm font-semibold text-[#fff7ef] transition-colors duration-200 hover:border-[#ff6b5f] hover:bg-[#ff4f45]/10 hover:text-[#ff6b5f] focus:border-[#ff6b5f] focus:outline-none focus:ring-2 focus:ring-[#ff4f45]/20"
          onClick={() => navigate("/my-tickets")}
          type="button"
        >
          <ArrowLeft size={16} />
          Kembali ke Tiket Saya
        </button>
        <p className="badge-category">E-Tiket</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">
          Tiket untuk pesanan ini
        </h1>
        <p className="mt-3 text-muted">
          Setiap tiket memiliki QR code dan kode tiket untuk check-in di venue.
        </p>
      </motion.div>

      {loading ? (
        <TicketsSkeleton />
      ) : null}

      {!loading && error ? (
        <motion.div {...sectionReveal} className="surface-card border-danger/20 bg-danger/5 p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight text-danger">Gagal memuat e-tiket</h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <Link className="btn-primary mt-6" to="/my-tickets">
            Kembali ke Tiket Saya
          </Link>
        </motion.div>
      ) : null}

      {!loading && !error && tickets.length === 0 ? (
        <motion.div {...sectionReveal} className="surface-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky text-primary-600">
            <TicketCheck size={28} />
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-navy">Belum ada e-tiket</h2>
          <p className="mt-2 text-sm text-muted">
            Tiket akan muncul setelah pembayaran Anda terkonfirmasi.
          </p>
          <Link className="btn-primary mt-6" to="/my-tickets">
            Kembali ke Tiket Saya
          </Link>
        </motion.div>
      ) : null}

      {!loading && !error && tickets.length > 0 ? (
        <motion.div animate="animate" className="grid gap-6" initial="initial" variants={staggerContainer}>
          {tickets.map((ticket) => (
            <motion.article className="premium-ticket mx-auto w-full max-w-5xl overflow-hidden" key={ticket.ticket_id} variants={staggerItem}>
              {/* Ribbon Accent */}
              <div className="ticket-ribbon-accent" />

              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 p-5 sm:p-6 pl-7 sm:pl-8">
                  <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <img alt="LilTicket" className="h-10 w-auto max-w-[170px] shrink-0 object-contain sm:h-11 sm:max-w-[200px]" src={logo} />
                    <div className="flex flex-wrap gap-2">
                      <span className={getStatusClass(ticket.ticket_status)}>
                        {getStatusLabel(ticket.ticket_status)}
                      </span>
                      <span className={getStatusClass(ticket.payment_status)}>
                        {getStatusLabel(ticket.payment_status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Acara</p>
                    <h2 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-navy">
                      {ticket.event_title}
                    </h2>
                    <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2">
                      <p className="flex min-w-0 items-start gap-2">
                        <MapPin className="mt-0.5 shrink-0" size={16} />
                        <span className="break-words">{ticket.venue_name}, {ticket.venue_city}</span>
                      </p>
                      <p className="flex min-w-0 items-start gap-2">
                        <CalendarDays className="mt-0.5 shrink-0" size={16} />
                        <span className="break-words">{formatDateTime(ticket.start_at)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-soft p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kode Tiket</p>
                      <p className="mt-2 break-all text-sm font-extrabold text-navy">{ticket.ticket_code}</p>
                    </div>
                    <div className="rounded-2xl bg-soft p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kode Booking</p>
                      <p className="mt-2 break-all text-sm font-extrabold text-navy">{ticket.booking_code}</p>
                    </div>
                    <div className="rounded-2xl bg-soft p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Jenis Tiket</p>
                      <p className="mt-2 break-words text-sm font-extrabold text-navy">{ticket.ticket_type_name || "-"}</p>
                    </div>
                  </div>

                  <Link className="btn-secondary mt-6 w-full sm:w-auto" to={`/tickets/${ticket.ticket_id}`}>
                    Lihat Tiket Lengkap
                  </Link>
                </div>

                <aside className="relative flex min-w-0 flex-col items-center justify-center border-t-2 border-dashed border-line/50 bg-sky p-5 text-center sm:p-6 lg:border-l-2 lg:border-t-0">
                  {/* Semicircular Cutouts on divider */}
                  <div className="ticket-cutout-circle left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
                  <div className="ticket-cutout-circle right-0 top-0 translate-x-1/2 -translate-y-1/2 lg:right-auto lg:left-0 lg:top-auto lg:bottom-0 lg:-translate-x-1/2 lg:translate-y-1/2" />

                  <div className="mx-auto max-w-full rounded-2xl qr-container-glow">
                    <QRCodeCanvas bgColor="#FFFFFF" fgColor="#0B1F3A" includeMargin size={170} value={ticket.ticket_code} />
                  </div>
                  <QrCode className="mt-4 text-primary-600 ticket-icon-tilt" size={24} />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary-600">
                    QR Check-in
                  </p>
                </aside>
              </div>
            </motion.article>
          ))}
        </motion.div>
      ) : null}
    </section>
  );
}

export default BookingTickets;
