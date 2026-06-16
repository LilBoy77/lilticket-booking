import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import { ticketService } from "../services/ticketService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { getStatusLabel } from "../utils/statusLabel.js";
import { required } from "../utils/validation.js";

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback || "Terjadi kesalahan. Silakan coba lagi.";
}

function getErrorTicket(error) {
  return error.response?.data?.data?.ticket || error.response?.data?.ticket || null;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClass(status) {
  if (status === "ACTIVE" || status === "CONFIRMED" || status === "PAID") {
    return "status-paid";
  }

  if (status === "USED" || status === "CANCELLED" || status === "FAILED" || status === "EXPIRED") {
    return "status-failed";
  }

  return "status-pending";
}

function getNoticeClass(type) {
  if (type === "success") {
    return "border-success/20 bg-success/10 text-success";
  }

  if (type === "warning") {
    return "border-warning/25 bg-warning/10 text-warning";
  }

  return "border-danger/20 bg-danger/10 text-danger";
}

function getNormalizedTicketCode(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const checkInIndex = pathSegments.findIndex((segment) => segment.toLowerCase() === "check-in");
    const codeSegment = checkInIndex >= 0 ? pathSegments[checkInIndex + 1] : pathSegments[pathSegments.length - 1];

    return decodeURIComponent(codeSegment || trimmedValue).trim();
  } catch (_error) {
    return trimmedValue;
  }
}

function getOwnerDisplay(ticket) {
  return ticket?.owner_name || ticket?.customer_name || ticket?.holder_name || ticket?.owner_email || ticket?.customer_email || "-";
}

function getPaymentAmount(ticket) {
  return ticket?.payment_amount ?? ticket?.total_amount ?? ticket?.payment?.amount ?? null;
}

function AdminCheckIn() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticket, setTicket] = useState(null);
  const [fieldError, setFieldError] = useState("");
  const [notice, setNotice] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const { showToast } = useToast();

  const validateTicketCode = () => {
    const message = required(getNormalizedTicketCode(ticketCode), "Kode tiket");

    setFieldError(message);
    if (message) {
      showToast({ message: "Periksa kembali data yang wajib diisi.", type: "warning" });
    }

    return !message;
  };

  const handleTicketCodeChange = (event) => {
    setTicketCode(event.target.value);
    setFieldError("");
    setNotice(null);
  };

  const handleCheckIn = async (event) => {
    event.preventDefault();
    setNotice(null);
    setTicket(null);

    if (!validateTicketCode()) {
      return;
    }

    setCheckingIn(true);

    try {
      const normalizedTicketCode = getNormalizedTicketCode(ticketCode);
      const response = await ticketService.checkInTicket(normalizedTicketCode);
      setTicketCode(normalizedTicketCode);
      setTicket(response.data.ticket);
      setNotice({ message: "Check-in berhasil. Tiket valid.", type: "success" });
      showToast({ message: "Check-in berhasil. Tiket valid.", type: "success" });
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Gagal melakukan check-in tiket.");
      const errorTicket = getErrorTicket(requestError);
      const noticeType = message === "Tiket sudah digunakan." ? "warning" : "error";

      setTicket(errorTicket);
      setNotice({ message, type: noticeType });
      showToast({ message, type: noticeType });
    } finally {
      setCheckingIn(false);
    }
  };

  const eventName = ticket?.event_name || ticket?.event_title || "-";
  const venueName = ticket?.venue?.name || ticket?.venue_name || "-";
  const venueCity = ticket?.venue?.city || ticket?.venue_city || "-";
  const eventDateTime = ticket?.event_datetime || ticket?.start_at;
  const paymentAmount = getPaymentAmount(ticket);

  return (
    <div className="space-y-6">
      <div>
        <p className="badge-category">Check-in Tiket</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">Verifikasi dan check-in tiket</h1>
        <p className="mt-2 text-sm text-muted">Gunakan kode tiket dari hasil QR e-tiket atau tiket cetak.</p>
      </div>

      <form className="surface-card grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start" onSubmit={handleCheckIn}>
        <div className="min-w-0">
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="ticket-code">
            Masukkan kode tiket
          </label>
          <input
            className={
              fieldError
                ? "input-field border-danger focus:border-danger focus:ring-danger/10"
                : "input-field border-[#ff4f45]/30 bg-warm-burgundy/90 focus:border-[#ff4f45] focus:ring-[#ff4f45]/20"
            }
            id="ticket-code"
            onChange={handleTicketCodeChange}
            placeholder="Masukkan kode tiket"
            value={ticketCode}
          />
          <p className="mt-2 text-xs font-medium text-muted">
            Masukkan kode tiket dari QR e-ticket. Jika QR berisi URL check-in, kode akan dibaca otomatis.
          </p>
          {fieldError ? <p className="mt-2 text-xs font-semibold text-danger">{fieldError}</p> : null}
        </div>
        <button
          className="btn-primary w-full whitespace-nowrap px-5 py-3 disabled:cursor-not-allowed disabled:opacity-70 md:mt-7 md:w-auto"
          disabled={checkingIn}
          type="submit"
        >
          {checkingIn ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Validasi & Check-in
            </>
          )}
        </button>
      </form>

      {notice ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${getNoticeClass(notice.type)}`}>
          {notice.message}
        </div>
      ) : null}

      {ticket ? (
        <div className="surface-card overflow-hidden">
          <div className="border-b border-line p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-all text-sm font-semibold text-primary-600">{ticket.ticket_code}</p>
                <h2 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-navy">{eventName}</h2>
                <p className="mt-1 text-sm text-muted">
                  {venueName}, {venueCity}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={getStatusClass(ticket.ticket_status)}>{getStatusLabel(ticket.ticket_status)}</span>
                <span className={getStatusClass(ticket.booking_status)}>{getStatusLabel(ticket.booking_status)}</span>
                <span className={getStatusClass(ticket.payment_status)}>Pembayaran {getStatusLabel(ticket.payment_status)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
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
              <p className="mt-2 text-sm font-extrabold text-navy">{ticket.ticket_type?.name || ticket.ticket_type_name || "-"}</p>
            </div>
            <div className="rounded-2xl bg-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Nama Pemilik Tiket</p>
              <p className="mt-2 break-words text-sm font-extrabold text-navy">{getOwnerDisplay(ticket)}</p>
            </div>
            <div className="rounded-2xl bg-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Waktu Acara</p>
              <p className="mt-2 text-sm font-extrabold text-navy">{formatDateTime(eventDateTime)}</p>
            </div>
            <div className="rounded-2xl bg-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Nominal Pembayaran</p>
              <p className="mt-2 text-sm font-extrabold text-navy">
                {paymentAmount !== null && paymentAmount !== undefined ? formatCurrency(Number(paymentAmount)) : "-"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminCheckIn;
