import { ArrowLeft, CalendarDays, MapPin, TicketCheck } from "lucide-react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo-lilticket-tight.png";
import { ticketService } from "../services/ticketService.js";
import { sectionReveal } from "../utils/motionPresets.js";
import { getStatusLabel } from "../utils/statusLabel.js";

const statusClassMap = {
  ACTIVE: "status-paid",
  INACTIVE: "status-pending",
  USED: "status-failed",
};

const ticketStatusLabelMap = {
  ACTIVE: "Aktif",
  USED: "Sudah digunakan",
};

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

function TicketDetailSkeleton() {
  return (
    <section className="container-page py-12">
      <motion.div {...sectionReveal} className="mb-8 max-w-2xl">
        <div className="mb-5 h-10 w-48 animate-pulse rounded-full bg-warm-surface" />
        <div className="h-7 w-24 animate-pulse rounded-full bg-warm-accent/35" />
        <div className="mt-4 h-9 w-80 max-w-full animate-pulse rounded-lg bg-warm-accent/25" />
        <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-warm-accent/20" />
      </motion.div>
      <motion.div {...sectionReveal} className="surface-card mx-auto grid min-h-[420px] max-w-5xl overflow-hidden lg:grid-cols-[1fr_320px]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-12 w-44 animate-pulse rounded-lg bg-warm-accent/30" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-warm-accent/25" />
          </div>
          <div className="mt-8">
            <div className="h-4 w-20 animate-pulse rounded-lg bg-primary-600/25" />
            <div className="mt-3 h-8 w-10/12 animate-pulse rounded-lg bg-warm-accent/30" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="h-5 w-9/12 animate-pulse rounded-lg bg-warm-accent/20" />
              <div className="h-5 w-10/12 animate-pulse rounded-lg bg-warm-accent/20" />
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="h-28 animate-pulse rounded-2xl bg-warm-accent/20" />
            <div className="h-28 animate-pulse rounded-2xl bg-warm-accent/20" />
            <div className="h-28 animate-pulse rounded-2xl bg-warm-accent/20" />
            <div className="h-28 animate-pulse rounded-2xl bg-warm-accent/20" />
          </div>
        </div>
        <aside className="flex items-center justify-center border-t border-line bg-gradient-to-br from-sky to-white p-5 sm:p-8 lg:border-l lg:border-t-0">
          <div className="h-56 w-56 animate-pulse rounded-3xl bg-white/70" />
        </aside>
      </motion.div>
    </section>
  );
}

function TicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError("");

    ticketService
      .getTicketById(ticketId)
      .then((response) => {
        if (isMounted) {
          setTicket(response.data.ticket);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setTicket(null);
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
  }, [ticketId]);

  if (loading) {
    return <TicketDetailSkeleton />;
  }

  if (error || !ticket) {
    return (
      <section className="container-page py-16">
        <motion.div {...sectionReveal} className="surface-card p-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">E-tiket tidak ditemukan</h1>
          <p className="mt-2 text-sm text-muted">{error || "Tiket yang diminta tidak tersedia."}</p>
          <Link className="btn-primary mt-6" to="/my-tickets">
            Kembali ke Tiket Saya
          </Link>
        </motion.div>
      </section>
    );
  }

  const qrValue = ticket.ticket_code;
  const ticketListPath = ticket.booking_id ? `/bookings/${ticket.booking_id}/tickets` : "/my-tickets";

  return (
    <section className="container-page py-12">
      <motion.div {...sectionReveal} className="mb-8 max-w-2xl">
        <button
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff4f45]/35 bg-[#260707]/55 px-4 py-2 text-sm font-semibold text-[#fff7ef] transition-colors duration-200 hover:border-[#ff6b5f] hover:bg-[#ff4f45]/10 hover:text-[#ff6b5f] focus:border-[#ff6b5f] focus:outline-none focus:ring-2 focus:ring-[#ff4f45]/20"
          onClick={() => navigate(ticketListPath)}
          type="button"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Tiket
        </button>
        <p className="badge-category">E-Tiket</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">
          Tiket aktif Anda
        </h1>
        <p className="mt-3 text-muted">
          Tunjukkan QR Code ini kepada petugas check-in.
        </p>
      </motion.div>

      <motion.div {...sectionReveal} className="surface-card mx-auto max-w-5xl overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
              <img alt="LilTicket" className="h-12 w-fit max-w-[220px] object-contain" src={logo} />
              <span className={statusClassMap[ticket.ticket_status] || "status-pending"}>
                {ticketStatusLabelMap[ticket.ticket_status] || getStatusLabel(ticket.ticket_status)}
              </span>
            </div>

            <div className="mt-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Acara</p>
              <h2 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                {ticket.event_title}
              </h2>
              <div className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <MapPin size={17} />
                  {ticket.venue_name}, {ticket.venue_city}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays size={17} />
                  {formatDateTime(ticket.start_at)}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kode Tiket</p>
                <p className="mt-2 break-all text-lg font-extrabold text-navy">{ticket.ticket_code}</p>
              </div>
              <div className="rounded-2xl bg-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kode Booking</p>
                <p className="mt-2 break-all text-lg font-extrabold text-navy">{ticket.booking_code}</p>
              </div>
              <div className="rounded-2xl bg-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Jenis Tiket</p>
                <p className="mt-2 text-lg font-extrabold text-navy">{ticket.ticket_type_name || "-"}</p>
              </div>
              <div className="rounded-2xl bg-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Status Pembayaran</p>
                <p className="mt-2 text-lg font-extrabold text-success">{getStatusLabel(ticket.payment_status)}</p>
              </div>
            </div>
          </div>

          <aside className="flex flex-col items-center justify-center border-t border-line bg-gradient-to-br from-sky to-white p-5 text-center sm:p-8 lg:border-l lg:border-t-0">
            <div className="max-w-full rounded-3xl border border-primary-200 bg-white p-4 shadow-sm shadow-primary-600/10 sm:p-5">
              <QRCodeCanvas
                bgColor="#FFFFFF"
                fgColor="#0B1F3A"
                includeMargin
                level="M"
                size={200}
                value={qrValue}
              />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Kode Tiket</p>
            <p className="mt-2 max-w-full break-all rounded-2xl bg-white/75 px-4 py-3 text-sm font-extrabold text-navy">
              {ticket.ticket_code}
            </p>
            <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-warm-accent/45 text-primary-700">
              <TicketCheck size={28} />
            </div>
            <p className="mt-4 text-sm font-semibold text-muted">Pindai QR Code</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              QR Code ini berisi kode tiket unik untuk validasi check-in.
            </p>
          </aside>
        </div>
      </motion.div>

      <motion.div {...sectionReveal} className="mt-6">
        <Link className="btn-secondary w-full sm:w-auto" to="/my-tickets">
          Kembali ke Tiket Saya
        </Link>
      </motion.div>
    </section>
  );
}

export default TicketDetail;
