import { ArrowRight, CreditCard, Ticket, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BlurText from "../components/BlurText.jsx";
import EventCard from "../components/EventCard.jsx";
import HomeEventCarousel from "../components/HomeEventCarousel.jsx";
import heroBackground from "../assets/BG-lilticket.jpg";
import { eventService } from "../services/eventService.js";
import { sectionReveal, staggerContainer, staggerItem } from "../utils/motionPresets.js";

const advantages = [
  {
    title: "Pemesanan Mudah",
    description: "Temukan acara, pilih tiket, dan lanjutkan pembayaran dengan alur yang jelas.",
    icon: Zap,
  },
  {
    title: "Pembayaran Aman",
    description: "Terhubung dengan pembayaran yang aman dan status transaksi yang mudah dipahami.",
    icon: CreditCard,
  },
  {
    title: "E-Tiket",
    description: "Kelola tiket digital dari area akun yang responsif setelah pemesanan.",
    icon: Ticket,
  },
];

function Home() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    setEventsLoading(true);
    setEventsError("");

    eventService
      .getEvents({ sort: "start_at_asc" })
      .then((response) => {
        if (isMounted) {
          setFeaturedEvents((response.data.events || []).slice(0, 5));
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setFeaturedEvents([]);
          setEventsError(requestError.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setEventsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="bg-soft">
      <div
        className="relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `
            linear-gradient(108deg, rgba(8, 1, 1, 0.9) 0%, rgba(22, 4, 5, 0.78) 35%, rgba(38, 7, 7, 0.52) 62%, rgba(22, 4, 5, 0.28) 100%),
            radial-gradient(circle at 18% 16%, rgba(255, 107, 95, 0.16), transparent 30rem),
            url("${heroBackground}")
          `,
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,4,5,0.04),rgba(22,4,5,0.38))]" />
        <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,248,242,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,248,242,0.16)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="container-page relative grid min-h-[calc(100vh-5rem)] gap-10 pb-14 pt-10 sm:gap-12 sm:pb-16 sm:pt-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-start lg:pb-20 lg:pt-16 xl:pt-[4.5rem]">
          <motion.div {...sectionReveal} className="space-y-7 lg:pt-6">
            <div className="space-y-5">
              <BlurText
                animateBy="words"
                animationFrom={{ filter: "blur(10px)", opacity: 0, y: -28 }}
                className="max-w-[46rem] text-4xl font-extrabold leading-[1.06] tracking-tight text-warm-text sm:text-5xl lg:text-[3.55rem] xl:text-[4.15rem]"
                delay={90}
                direction="top"
                tag="h1"
                text="Pesan Tiket Acara Favorit Anda di LilTicket"
              />
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl text-base font-normal leading-8 text-muted sm:text-lg"
                initial={{ opacity: 0, y: 18 }}
                transition={{ delay: 0.45, duration: 0.6, ease: "easeOut" }}
              >
                Temukan konser, festival, konferensi, dan acara lokal dengan
                proses pemesanan yang cepat, rapi, dan responsif.
              </motion.p>
            </div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 18 }}
              transition={{ delay: 0.6, duration: 0.55, ease: "easeOut" }}
            >
              <Link className="btn-primary" to="/events">
                Jelajahi Acara
                <ArrowRight size={18} />
              </Link>
              <Link className="btn-secondary border-primary-500/30 bg-warm-burgundy/70 text-warm-text hover:bg-warm-accent/80" to="/register">
                Mulai Daftar
              </Link>
            </motion.div>
          </motion.div>

          <motion.div {...sectionReveal}>
            <HomeEventCarousel events={featuredEvents} />
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-warm-burgundy/80 to-transparent" />
      </div>

      <div className="bg-warm-burgundy/55 py-16">
        <div className="container-page">
          <motion.div {...sectionReveal} className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="badge-category">Acara Pilihan</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">
                Acara populer musim ini
              </h2>
            </div>
            <Link className="btn-secondary w-fit" to="/events">
              Lihat Semua Acara
            </Link>
          </motion.div>

          {eventsLoading ? (
            <div className="surface-card p-8 text-center text-sm font-semibold text-muted">
              Memuat acara pilihan...
            </div>
          ) : null}

          {!eventsLoading && eventsError ? (
            <div className="surface-card border-danger/20 bg-danger/5 p-8 text-center">
              <p className="text-sm font-semibold text-danger">{eventsError}</p>
            </div>
          ) : null}

          {!eventsLoading && !eventsError && featuredEvents.length > 0 ? (
            <motion.div animate="animate" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" initial="initial" variants={staggerContainer}>
              {featuredEvents.slice(0, 3).map((event) => (
                <motion.div key={event.id} variants={staggerItem}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </motion.div>
          ) : null}

          {!eventsLoading && !eventsError && featuredEvents.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted">
              Belum ada acara yang dipublikasikan.
            </div>
          ) : null}
        </div>
      </div>

      <div className="bg-soft py-16">
        <div className="container-page">
          <motion.div {...sectionReveal} className="mb-8 max-w-2xl">
            <p className="badge-category">Kenapa LilTicket</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">
              Dibuat untuk pemesanan tiket yang sederhana dan profesional
            </h2>
          </motion.div>

          <motion.div animate="animate" className="grid gap-6 md:grid-cols-3" initial="initial" variants={staggerContainer}>
            {advantages.map((item) => {
              const Icon = item.icon;

              return (
                <motion.article className="surface-card interactive-card p-6" key={item.title} variants={staggerItem}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky text-primary-600">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-navy">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm font-normal leading-6 text-muted">
                    {item.description}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Home;
