import { CalendarDays, Clock3, CreditCard, TicketCheck, Users, WalletCards } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { adminService } from "../services/adminService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { sectionReveal, staggerContainer, staggerItem } from "../utils/motionPresets.js";
import { getStatusLabel } from "../utils/statusLabel.js";

function getErrorMessage(error) {
  return error.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi.";
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
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

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError("");

    adminService
      .getDashboard()
      .then((response) => {
        if (isMounted) {
          setDashboard(response.data);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getErrorMessage(requestError));
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

  const summaryItems = [
    { icon: CalendarDays, label: "Total acara", value: formatNumber(dashboard?.total_events) },
    { icon: WalletCards, label: "Total pesanan", value: formatNumber(dashboard?.total_bookings) },
    { icon: CreditCard, label: "Pesanan dibayar", value: formatNumber(dashboard?.total_paid_bookings) },
    { icon: Clock3, label: "Pesanan tertunda", value: formatNumber(dashboard?.total_pending_bookings) },
    { icon: Users, label: "Total pendapatan", value: formatCurrency(Number(dashboard?.total_revenue || 0)) },
    { icon: TicketCheck, label: "Tiket terjual", value: formatNumber(dashboard?.total_tickets_sold) },
  ];

  return (
    <div className="space-y-6">
      <motion.div {...sectionReveal}>
        <p className="badge-category">Dasbor</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">Ringkasan Admin</h1>
        <p className="mt-2 text-sm text-muted">Pantau aktivitas acara, pendapatan, dan pesanan terbaru.</p>
      </motion.div>

      {loading ? (
        <div className="surface-card p-8 text-center text-sm font-semibold text-muted">Memuat dasbor...</div>
      ) : null}

      {!loading && error ? (
        <div className="surface-card border-danger/20 bg-danger/5 p-8 text-center text-sm font-semibold text-danger">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <motion.div animate="animate" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" initial="initial" variants={staggerContainer}>
            {summaryItems.map((item) => {
              const Icon = item.icon;

              return (
                <motion.article className="surface-card interactive-card p-4 sm:p-5" key={item.label} variants={staggerItem}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky text-primary-600 sm:h-12 sm:w-12">
                    <Icon size={22} />
                  </div>
                  <p className="mt-4 text-sm text-muted sm:mt-5">{item.label}</p>
                  <p className="mt-1 break-words text-xl font-extrabold tracking-tight text-navy sm:text-2xl">{item.value}</p>
                </motion.article>
              );
            })}
          </motion.div>

          <motion.div {...sectionReveal} className="surface-card overflow-hidden">
            <div className="border-b border-line p-5">
              <h2 className="text-xl font-bold tracking-tight text-navy">Pesanan terbaru</h2>
            </div>
            <div className="divide-y divide-line">
              {(dashboard?.latest_bookings || []).map((booking) => {
                const paymentStatus = booking.payment?.status || "-";

                return (
                  <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_180px_140px_120px] lg:items-center" key={booking.id}>
                    <div className="min-w-0">
                      <p className="break-words font-bold text-navy">{booking.event.title}</p>
                      <p className="mt-1 text-sm font-semibold text-primary-600">{booking.booking_code}</p>
                      <p className="mt-1 break-words text-sm text-muted">{booking.user.full_name} - {booking.user.email}</p>
                    </div>
                    <p className="text-sm font-bold text-navy">{formatCurrency(Number(booking.total_amount))}</p>
                    <span className={getStatusClass(booking.status)}>{getStatusLabel(booking.status)}</span>
                    <span className={getStatusClass(paymentStatus)}>{getStatusLabel(paymentStatus)}</span>
                  </div>
                );
              })}
              {(dashboard?.latest_bookings || []).length === 0 ? (
                <div className="p-8 text-center text-sm text-muted">Belum ada pesanan terbaru.</div>
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </div>
  );
}

export default AdminDashboard;
