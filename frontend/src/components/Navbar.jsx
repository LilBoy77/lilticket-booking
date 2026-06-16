import { LogOut, Menu, Ticket, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo-lilticket-tight.png";
import { useAuth } from "../hooks/useAuth.js";

const baseNavItems = [
  { label: "Beranda", path: "/" },
  { label: "Acara", path: "/events" },
];

const customerNavItems = [
  ...baseNavItems,
  { label: "Tiket Saya", path: "/my-tickets" },
];

const adminNavItems = [
  { label: "Beranda", path: "/" },
  { label: "Dasbor", path: "/dashboard" },
];

const guestNavItems = [
  ...baseNavItems,
  { label: "Masuk", path: "/login" },
  { label: "Daftar", path: "/register", variant: "primary" },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";
  const isCustomer = user?.role === "CUSTOMER";
  const navItems = isAdmin ? adminNavItems : isCustomer ? customerNavItems : guestNavItems;

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate("/", { replace: true });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-warm-bg/90 shadow-lg shadow-black/20 backdrop-blur-xl">
      <nav className="container-page flex min-h-16 items-center justify-between gap-3 py-1 md:gap-6 md:py-0.5">
        <Link className="flex w-[150px] shrink-0 origin-left items-center overflow-visible md:w-[185px] lg:w-[210px]" onClick={closeMobileMenu} to="/">
          <img
            alt="LilTicket"
            className="h-[54px] w-[150px] shrink-0 origin-left scale-[1.04] object-contain md:h-[68px] md:w-[185px] md:scale-[1.08] lg:h-[76px] lg:w-[210px] lg:scale-[1.12]"
            src={logo}
          />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-5 md:flex">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                item.variant === "primary"
                  ? `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-600/20 ${
                      isActive
                        ? "bg-secondary text-warm-cardText shadow-secondary/15"
                        : "bg-primary-600 text-warm-cardText shadow-primary-600/15 hover:bg-secondary"
                    }`
                  : `rounded-lg px-1 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600/20 ${
                      isActive ? "text-primary-600" : "text-muted hover:text-primary-600"
                    }`
              }
              end={item.path === "/"}
              key={item.path}
              to={item.path}
            >
              {item.variant === "primary" ? <Ticket size={16} /> : null}
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <button
              className="btn-secondary px-3 py-2"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={16} />
              Keluar
            </button>
          ) : null}
        </div>

        <button
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-warm-surface/80 text-muted transition-colors duration-200 hover:border-primary-500/40 hover:bg-warm-accent/50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 md:hidden"
          onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      {mobileMenuOpen ? (
        <div className="border-t border-line bg-warm-bg/95 shadow-lg shadow-black/20 backdrop-blur-xl md:hidden">
          <div className="container-page grid gap-2 py-3 text-sm font-semibold text-muted">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  item.variant === "primary"
                    ? `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600/20 ${
                        isActive
                          ? "bg-secondary text-warm-cardText"
                          : "bg-primary-600 text-warm-cardText hover:bg-secondary"
                      }`
                    : `rounded-xl px-4 py-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600/20 ${
                        isActive ? "bg-primary-600/10 text-primary-600" : "hover:bg-warm-accent/50 hover:text-primary-600"
                      }`
                }
                end={item.path === "/"}
                key={item.path}
                onClick={closeMobileMenu}
                to={item.path}
              >
                {item.variant === "primary" ? <Ticket size={16} /> : null}
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <button className="btn-secondary mt-2 w-full px-4 py-3" onClick={handleLogout} type="button">
                <LogOut size={16} />
                Keluar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
