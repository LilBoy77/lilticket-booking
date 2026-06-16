import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import { bookingService } from "../services/bookingService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { sectionReveal } from "../utils/motionPresets.js";
import { getStatusLabel } from "../utils/statusLabel.js";

const bookingStatuses = ["WAITING_PAYMENT", "CONFIRMED", "CANCELLED"];
const paymentStatuses = ["PENDING", "PAID", "FAILED", "EXPIRED"];

function getErrorMessage(error) {
  return error.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi.";
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
  if (status === "PAID" || status === "CONFIRMED") {
    return "status-paid";
  }

  if (status === "FAILED" || status === "EXPIRED" || status === "CANCELLED") {
    return "status-failed";
  }

  return "status-pending";
}

function getBookingStatus(booking) {
  return booking.booking_status || booking.status || "-";
}

function getPaymentStatus(booking) {
  return booking.payment_status || booking.payment?.status || "-";
}

function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ limit: 10, page: 1, total: 0, total_pages: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const params = useMemo(
    () => ({
      limit: 10,
      page,
      payment_status: paymentStatus || undefined,
      search: search.trim() || undefined,
      status: status || undefined,
    }),
    [page, paymentStatus, search, status],
  );

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError("");

    bookingService
      .getAdminBookings(params)
      .then((response) => {
        if (isMounted) {
          setBookings(response.data.bookings || []);
          setPagination(response.data.pagination || { limit: 10, page: 1, total: 0, total_pages: 0 });
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          const message = getErrorMessage(requestError);
          setBookings([]);
          setError(message);
          showToast({ message, type: "error" });
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
  }, [params]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handlePaymentStatusChange = (event) => {
    setPaymentStatus(event.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <motion.div {...sectionReveal}>
        <p className="badge-category">Pesanan</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">Kelola pesanan</h1>
      </motion.div>

      <motion.div {...sectionReveal} className="surface-card grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_180px_180px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input className="input-field pl-11" onChange={handleSearchChange} placeholder="Cari pelanggan, acara, atau kode booking" type="search" value={search} />
        </label>
        <select className="input-field" onChange={handleStatusChange} value={status}>
          <option value="">Semua pesanan</option>
          {bookingStatuses.map((item) => <option key={item} value={item}>{getStatusLabel(item)}</option>)}
        </select>
        <select className="input-field" onChange={handlePaymentStatusChange} value={paymentStatus}>
          <option value="">Semua pembayaran</option>
          {paymentStatuses.map((item) => <option key={item} value={item}>{getStatusLabel(item)}</option>)}
        </select>
      </motion.div>

      {loading ? <div className="surface-card p-8 text-center text-sm font-semibold text-muted">Memuat pesanan...</div> : null}
      {!loading && error ? <div className="surface-card border-danger/20 bg-danger/5 p-8 text-center text-sm font-semibold text-danger">{error}</div> : null}

      {!loading && !error ? (
        <motion.div {...sectionReveal} className="surface-card overflow-hidden">
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] w-full text-left text-sm">
                <thead className="bg-soft text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-4">Pesanan</th>
                    <th className="px-5 py-4">Acara</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Status Pesanan</th>
                    <th className="px-5 py-4">Pembayaran</th>
                    <th className="px-5 py-4">Dibuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {bookings.map((booking) => {
                    const bookingStatus = getBookingStatus(booking);
                    const paymentStatusText = getPaymentStatus(booking);

                    return (
                      <tr key={booking.id}>
                        <td className="px-5 py-4">
                          <p className="font-bold text-navy">{booking.booking_code}</p>
                          <p className="mt-1 text-sm text-muted">{booking.user.full_name} - {booking.user.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-xs break-words font-semibold text-navy">{booking.event.title}</p>
                          <p className="mt-1 text-sm text-muted">{booking.event.venue.name}, {booking.event.venue.city}</p>
                        </td>
                        <td className="px-5 py-4 font-bold text-navy">{formatCurrency(Number(booking.total_amount))}</td>
                        <td className="px-5 py-4">
                          <span className={getStatusClass(bookingStatus)}>{getStatusLabel(bookingStatus)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={getStatusClass(paymentStatusText)}>{getStatusLabel(paymentStatusText)}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted">{formatDateTime(booking.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted">Belum ada pesanan.</div>
          )}
        </motion.div>
      ) : null}

      {!loading && !error && pagination.total > 0 ? (
        <motion.div {...sectionReveal} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-muted">
            Halaman {pagination.page} dari {Math.max(pagination.total_pages, 1)} - {pagination.total} pesanan
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="btn-secondary w-full px-4 py-2 sm:w-auto" disabled={page <= 1} onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))} type="button">
              Sebelumnya
            </button>
            <button className="btn-primary w-full px-4 py-2 sm:w-auto" disabled={page >= pagination.total_pages} onClick={() => setPage((currentPage) => Math.min(currentPage + 1, Math.max(pagination.total_pages, 1)))} type="button">
              Berikutnya
            </button>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

export default ManageBookings;
