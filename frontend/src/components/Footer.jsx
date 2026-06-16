import { Link } from "react-router-dom";

function Footer() {
  const navigationLinks = [
    { label: "Beranda", path: "/" },
    { label: "Acara", path: "/events" },
    { label: "Tiket Saya", path: "/my-tickets" },
    { label: "Dasbor", path: "/dashboard" },
  ];
  const featureItems = [
    "Pemesanan Tiket",
    "E-Ticket & QR Code",
    "Pembayaran Online",
    "Check-in Venue",
  ];
  const helpItems = [
    "Cara Pesan",
    "Status Pembayaran",
    "Hubungi Admin",
    "Bantuan",
  ];

  return (
    <footer className="mt-12 rounded-t-[2rem] border-t border-[#ff4f45]/20 bg-[#fff8f2] text-[#1f1414] shadow-[0_-16px_50px_rgba(255,79,69,0.08)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.85fr_0.95fr_0.85fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ff4f45]/20 bg-white shadow-[0_10px_28px_rgba(255,79,69,0.12)]">
                <img
                  alt="Logo Tic LilTicket"
                  className="h-7 w-7 object-contain"
                  src="/tic-logo.png"
                />
              </span>
              <div>
                <p className="text-lg font-extrabold tracking-tight text-[#1f1414]">
                  LilTicket
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff4f45]">
                  Event Ticketing
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#6f4a42]">
              Platform pemesanan tiket event, konser, festival, dan acara lokal dengan proses cepat, aman, dan responsif.
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <p className="font-semibold text-[#1f1414]">Kontak email</p>
              <a className="font-medium text-[#6f4a42] transition-colors duration-200 hover:text-[#ff4f45]" href="mailto:lilticket@gmail.com">
                lilticket@gmail.com
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#1f1414]">
              Navigasi
            </h2>
            <div className="mt-5 space-y-3">
              {navigationLinks.map((item) => (
                <Link
                  className="block text-sm font-semibold text-[#6f4a42] transition-colors duration-200 hover:text-[#ff4f45]"
                  key={item.path}
                  to={item.path}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#1f1414]">
              Fitur
            </h2>
            <div className="mt-5 space-y-3">
              {featureItems.map((item) => (
                <p className="text-sm font-semibold text-[#6f4a42]" key={item}>
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#1f1414]">
              Bantuan
            </h2>
            <div className="mt-5 space-y-3">
              {helpItems.map((item) => (
                <p className="text-sm font-semibold text-[#6f4a42]" key={item}>
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[#ff4f45]/15 pt-6 text-sm text-[#6f4a42] sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; 2026 LilTicket. Seluruh hak cipta dilindungi.
          </p>
          <div className="text-xs font-semibold text-[#8a5f55] sm:text-right">
            <p>Dibuat untuk project React Lanjutan.</p>
            <p>Made by Ulil Kocak</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
