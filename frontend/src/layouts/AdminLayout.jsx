import { BarChart3, CalendarDays, Layers3, MapPin, ScanLine, Tags, Ticket, WalletCards } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense, useLayoutEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { pageTransition } from "../utils/motionPresets.js";

const adminMenuItems = [
  { icon: BarChart3, label: "Dasbor", path: "/dashboard" },
  { icon: CalendarDays, label: "Acara", path: "/dashboard/events" },
  { icon: WalletCards, label: "Pesanan", path: "/dashboard/bookings" },
  { icon: Tags, label: "Kategori", path: "/dashboard/categories" },
  { icon: MapPin, label: "Venue", path: "/dashboard/venues" },
  { icon: Ticket, label: "Jenis Tiket", path: "/dashboard/ticket-types" },
  { icon: ScanLine, label: "Check-in", path: "/dashboard/check-in" },
];

function AdminContentFallback() {
  return (
    <div className="surface-card flex min-h-[180px] items-center justify-center p-5 text-sm font-semibold text-muted">
      Memuat halaman...
    </div>
  );
}

function AdminLayout() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <section className="container-page py-6 sm:py-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <aside className="surface-card h-fit self-start overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="bg-navy p-5 text-white sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-warm-accent/45 text-primary-700 sm:h-11 sm:w-11">
              <Layers3 size={22} />
            </div>
            <p className="mt-4 text-sm font-semibold text-sky">Panel Admin</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">LilTicket</h1>
          </div>
          <nav className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-1">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  className={({ isActive }) =>
                    `relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-sm font-semibold transition-colors duration-200 sm:px-4 ${
                      isActive ? "text-primary-600 shadow-sm" : "text-muted hover:bg-warm-accent/40 hover:text-primary-600"
                    }`
                  }
                  end={item.path === "/dashboard"}
                  key={item.path}
                  to={item.path}
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? <span className="absolute inset-0 rounded-xl border border-line bg-primary-600/10 transition-colors duration-200" /> : null}
                      <Icon className="relative z-10 shrink-0" size={18} />
                      <span className="relative z-10 truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <Suspense fallback={<AdminContentFallback />}>
            <motion.div
              {...pageTransition}
              className="min-w-0"
              key={location.pathname}
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
      </div>
    </section>
  );
}

export default AdminLayout;
