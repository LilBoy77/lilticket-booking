import { CalendarDays, CreditCard, Eye, LoaderCircle, MapPin, QrCode, TicketCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import { bookingService } from "../services/bookingService.js";
import { paymentService } from "../services/paymentService.js";
import { getErrorMessage } from "../utils/errorMessage.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { sectionReveal, staggerContainer, staggerItem } from "../utils/motionPresets.js";
import { getStatusLabel } from "../utils/statusLabel.js";

const statusClassMap = {
  CANCELLED: "status-failed",
  CONFIRMED: "status-paid",
  EXPIRED: "status-failed",
  FAILED: "status-failed",
  PAID: "status-paid",
  PENDING: "status-pending",
  WAITING_PAYMENT: "status-pending",
};

function getStatusClass(status) {
  return statusClassMap[status] || "status-pending";
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

function getPaymentStatus(booking) {
  return booking.payment_status || booking.payment?.status || "PENDING";
}

function getBookingStatus(booking) {
  return booking.booking_status || booking.status || "WAITING_PAYMENT";
}

function getCheckoutUrl(booking) {
  return booking.payment?.checkout_url || booking.checkout_url || "";
}

function isActiveTicket(booking) {
  return getBookingStatus(booking) === "CONFIRMED" || getPaymentStatus(booking) === "PAID";
}

function canPayBooking(booking) {
  return getPaymentStatus(booking) === "PENDING" || getBookingStatus(booking) === "WAITING_PAYMENT";
}

function getEventTitle(booking) {
  return booking.event_title || booking.event?.title || "Acara tanpa judul";
}

function getEventStartAt(booking) {
  return booking.event_start_at || booking.event?.start_at;
}

function getVenueLabel(booking) {
  const venueName = booking.venue_name || booking.event?.venue?.name;
  const venueCity = booking.venue_city || booking.event?.venue?.city;

  if (!venueName && !venueCity) {
    return "-";
  }

  return [venueName, venueCity].filter(Boolean).join(", ");
}

function getBookingId(booking) {
  return booking.booking_id || booking.id || "";
}

function TicketBookingSkeleton() {
  return (
    <article className="surface-card grid min-h-[190px] gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-5">
        <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-warm-accent/35" />
        <div className="min-w-0 flex-1">
          <div className="h-6 w-8/12 animate-pulse rounded-lg bg-warm-accent/30" />
          <div className="mt-3 h-5 w-36 animate-pulse rounded-lg bg-primary-600/25" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-warm-accent/25" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-warm-accent/25" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="h-5 w-10/12 animate-pulse rounded-lg bg-warm-accent/20" />
            <div className="h-5 w-9/12 animate-pulse rounded-lg bg-warm-accent/20" />
          </div>
          <div className="mt-4 h-5 w-28 animate-pulse rounded-lg bg-warm-accent/25" />
        </div>
      </div>
      <div className="flex flex-col gap-3 md:items-end md:justify-center">
        <div className="h-10 w-full animate-pulse rounded-xl bg-primary-600/25 md:w-36" />
      </div>
    </article>
  );
}

function MyTicketsSkeleton() {
  return (
    <motion.div animate="animate" className="grid gap-5" initial="initial" variants={staggerContainer}>
      {Array.from({ length: 3 }, (_, index) => (
        <motion.div key={index} variants={staggerItem}>
          <TicketBookingSkeleton />
        </motion.div>
      ))}
    </motion.div>
  );
}

function MyTickets() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoadingId, setPaymentLoadingId] = useState("");
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [ticketLoadingId, setTicketLoadingId] = useState("");
  const [ticketError, setTicketError] = useState("");
  const routeMessage = location.state?.message || "";

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError("");

    bookingService
      .getMyBookings()
      .then((response) => {
        if (isMounted) {
          setBookings(response.data.bookings || []);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setBookings([]);
          setError(getErrorMessage(requestError, "Gagal memuat pesanan Anda."));
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
  }, []);

  const sortedBookings = useMemo(
    () => [...bookings].sort((left, right) => new Date(right.created_at) - new Date(left.created_at)),
    [bookings],
  );

  const handleContinuePayment = async (bookingId) => {
    setPaymentError("");
    setPaymentLoadingId(bookingId);

    try {
      const booking = bookings.find((bookingItem) => getBookingId(bookingItem) === bookingId);
      const existingCheckoutUrl = booking ? getCheckoutUrl(booking) : "";

      if (existingCheckoutUrl) {
        showToast({ message: "Membuka halaman pembayaran...", type: "info" });
        window.location.assign(existingCheckoutUrl);
        return;
      }

      const response = await paymentService.createXenditPayment(bookingId);
      const checkoutUrl = response.data.checkout_url;

      if (checkoutUrl) {
        showToast({ message: "Membuka halaman pembayaran...", type: "info" });
        window.location.assign(checkoutUrl);
      } else {
        const message = "Link checkout tidak tersedia.";
        setPaymentError(message);
        showToast({ message, type: "error" });
      }
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Terjadi kesalahan. Silakan coba lagi.");
      setPaymentError(message);
      showToast({ message, type: "error" });
    } finally {
      setPaymentLoadingId("");
    }
  };

  const handleViewTicket = async (bookingId) => {
    setTicketError("");

    if (!bookingId) {
      setTicketError("ID pesanan tidak ditemukan pada data booking.");
      return;
    }

    setTicketLoadingId(bookingId);
    navigate(`/bookings/${bookingId}/tickets`);
  };

  return (
    <section className="container-page py-12">
      <motion.div {...sectionReveal} className="mb-8 max-w-2xl">
        <p className="badge-category">Tiket Saya</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">Daftar Pesanan Tiket</h1>
        <p className="mt-3 text-muted">
          Kelola pesanan tiket dan lanjutkan pembayaran yang tertunda.
        </p>
      </motion.div>

      {paymentError ? (
        <div className="mb-6 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {paymentError}
        </div>
      ) : null}

      {ticketError ? (
        <div className="mb-6 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {ticketError}
        </div>
      ) : null}

      {routeMessage ? (
        <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700">
          {routeMessage}
        </div>
      ) : null}

      {loading ? (
        <MyTicketsSkeleton />
      ) : null}

      {!loading && error ? (
        <motion.div {...sectionReveal} className="surface-card border-danger/20 bg-danger/5 p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight text-danger">Gagal memuat pesanan</h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </motion.div>
      ) : null}

      {!loading && !error && sortedBookings.length === 0 ? (
        <motion.div {...sectionReveal} className="surface-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky text-primary-600">
            <TicketCheck size={28} />
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-navy">Belum ada pesanan</h2>
          <p className="mt-2 text-sm text-muted">Temukan acara dan pesan tiket pertama Anda.</p>
          <Link className="btn-primary mt-6" to="/events">
            Jelajahi Acara
          </Link>
        </motion.div>
      ) : null}

      {!loading && !error && sortedBookings.length > 0 ? (
        <motion.div animate="animate" className="grid gap-5" initial="initial" variants={staggerContainer}>
          {sortedBookings.map((booking) => {
            const bookingId = getBookingId(booking);
            const bookingStatus = getBookingStatus(booking);
            const paymentStatus = getPaymentStatus(booking);
            const activeTicket = isActiveTicket(booking);
            const canViewTicket = activeTicket;
            const canContinuePayment = canPayBooking(booking) && !canViewTicket;

            return (
              <motion.article
                className="surface-card group grid gap-5 p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#ff6b5f]/60 hover:shadow-[0_18px_45px_rgba(255,79,69,0.16)] sm:p-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center"
                key={bookingId || booking.booking_code}
                variants={staggerItem}
              >
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sky text-primary-600 transition-transform duration-300 ease-out group-hover:scale-[1.03]">
                    {activeTicket ? <QrCode size={34} /> : <TicketCheck size={34} />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="min-w-0 break-words text-xl font-bold tracking-tight text-navy">
                      {getEventTitle(booking)}
                    </h2>
                    <p className="mt-2 break-all text-sm font-semibold text-primary-600">{booking.booking_code}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={getStatusClass(bookingStatus)}>{getStatusLabel(bookingStatus)}</span>
                      <span className={getStatusClass(paymentStatus)}>{getStatusLabel(paymentStatus)}</span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                      <p className="flex min-w-0 items-start gap-2">
                        <CalendarDays className="mt-0.5 shrink-0" size={16} />
                        <span className="break-words">{formatDateTime(getEventStartAt(booking))}</span>
                      </p>
                      <p className="flex min-w-0 items-start gap-2">
                        <MapPin className="mt-0.5 shrink-0" size={16} />
                        <span className="break-words">{getVenueLabel(booking)}</span>
                      </p>
                    </div>
                    <p className="mt-3 text-sm font-bold text-navy">
                      Total {formatCurrency(Number(booking.total_amount))}
                    </p>
                    {activeTicket ? (
                      <p className="mt-2 text-sm font-semibold text-success">Tiket aktif</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:items-end md:justify-center">
                  {canContinuePayment ? (
                    <button
                      className="btn-primary w-full justify-center rounded-xl px-4 py-2 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
                      disabled={!bookingId || paymentLoadingId === bookingId}
                      onClick={() => handleContinuePayment(bookingId)}
                      type="button"
                    >
                      {paymentLoadingId === bookingId ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} />
                          Bayar Sekarang
                        </>
                      )}
                    </button>
                  ) : null}
                  {canViewTicket ? (
                    <button
                      className="btn-primary w-full justify-center rounded-xl px-4 py-2 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
                      disabled={!bookingId || ticketLoadingId === bookingId}
                      onClick={() => handleViewTicket(bookingId)}
                      type="button"
                    >
                      {ticketLoadingId === bookingId ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Lihat E-Tiket
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      ) : null}

    </section>
  );
}

export default MyTickets;
