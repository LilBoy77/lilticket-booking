import { ArrowLeft, CalendarDays, Clock, ExternalLink, LoaderCircle, MapPin, Minus, Plus, Ticket, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { bookingService } from "../services/bookingService.js";
import { eventService } from "../services/eventService.js";
import { getErrorMessage } from "../utils/errorMessage.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { sectionReveal, staggerContainer, staggerItem } from "../utils/motionPresets.js";
import { isPositiveNumber, required } from "../utils/validation.js";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStartingPrice(ticketTypes) {
  if (!ticketTypes.length) {
    return null;
  }

  return Math.min(...ticketTypes.map((ticketType) => Number(ticketType.price)));
}

function hasQuotaData(ticketType) {
  return ticketType?.quota !== undefined && ticketType?.quota !== null
    && ticketType?.sold_quantity !== undefined && ticketType?.sold_quantity !== null;
}

function getRemainingTickets(ticketType) {
  if (!hasQuotaData(ticketType)) {
    return null;
  }

  return Math.max(Number(ticketType.quota) - Number(ticketType.sold_quantity), 0);
}

function getRemainingLabel(ticketType) {
  const remaining = getRemainingTickets(ticketType);

  if (remaining === null) {
    return "Kuota tersedia";
  }

  return `${remaining} dari ${ticketType.quota} tiket tersedia`;
}

function formatSalePeriod(ticketType) {
  if (!ticketType?.sale_start_at && !ticketType?.sale_end_at) {
    return "Periode penjualan mengikuti kebijakan acara.";
  }

  if (ticketType.sale_start_at && ticketType.sale_end_at) {
    return `${formatDateTime(ticketType.sale_start_at)} - ${formatDateTime(ticketType.sale_end_at)}`;
  }

  if (ticketType.sale_start_at) {
    return `Mulai dijual ${formatDateTime(ticketType.sale_start_at)}`;
  }

  return `Berakhir ${formatDateTime(ticketType.sale_end_at)}`;
}

function getStatusLabel(status) {
  const labels = {
    CANCELLED: "Dibatalkan",
    DRAFT: "Draf",
    PUBLISHED: "Terbit",
  };

  return labels[status] || status || "-";
}

function EventBreadcrumb({ title }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex min-w-0 items-center gap-2 text-sm font-semibold">
      <Link
        className="inline-flex items-center gap-1.5 text-primary-600 transition-all duration-200 hover:text-[#ff6b5f]"
        to="/events"
      >
        <ArrowLeft size={15} />
        Acara
      </Link>
      <span className="text-muted/70">/</span>
      <span className="min-w-0 truncate text-muted">{title || "Detail Acara"}</span>
    </nav>
  );
}

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: authLoading, user } = useAuth();
  const { showToast } = useToast();
  const redirectTimeoutRef = useRef(null);
  const ticketSectionRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    setLoading(true);
    setError("");

    if (!id) {
      setEvent(null);
      setError("Acara tidak ditemukan");
      setLoading(false);
      return () => {
        isMounted = false;
        controller.abort();
      };
    }

    eventService
      .getEventById(id, { signal: controller.signal })
      .then((response) => {
        if (isMounted) {
          const eventData = response.data.event;
          const ticketTypes = eventData.ticket_types || [];
          const firstAvailableTicket = ticketTypes.find((ticketType) => getRemainingTickets(ticketType) !== 0);

          setEvent(eventData);
          setBannerFailed(false);
          setPosterFailed(false);
          setSelectedTicketTypeId(firstAvailableTicket?.id || ticketTypes[0]?.id || "");
        }
      })
      .catch((requestError) => {
        if (requestError?.code === "ERR_CANCELED") {
          return;
        }

        if (isMounted) {
          setEvent(null);
          setError("Acara tidak ditemukan");
        }
      })
      .finally(() => {
        if (isMounted && !controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const ticketTypes = event?.ticket_types || [];
  const venue = event?.venue || {};
  const selectedTicketType = useMemo(
    () => ticketTypes.find((ticketType) => ticketType.id === selectedTicketTypeId) || null,
    [selectedTicketTypeId, ticketTypes],
  );
  const remainingTickets = selectedTicketType ? getRemainingTickets(selectedTicketType) : 0;
  const isSelectedSoldOut = remainingTickets === 0;
  const maxQuantity = remainingTickets === null ? 10 : Math.max(remainingTickets, 1);
  const subtotal = selectedTicketType ? Number(selectedTicketType.price) * quantity : 0;
  const startingPrice = getStartingPrice(ticketTypes);
  const hasKnownAvailability = ticketTypes.every((ticketType) => hasQuotaData(ticketType));
  const availableTickets = hasKnownAvailability
    ? ticketTypes.reduce((total, ticketType) => total + getRemainingTickets(ticketType), 0)
    : null;
  const eventPosterUrl = event?.poster_url || "";
  const eventBannerUrl = event?.banner_url || eventPosterUrl;
  const venueLocationLabel = [venue.city, venue.province].filter(Boolean).join(", ");
  const fullAddress = [venue.name, venue.address, venue.city, venue.province].filter(Boolean).join(", ");
  const mapsEmbedUrl = fullAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
    : "";
  const mapsSearchUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : "";
  const bookingValidationError = useMemo(() => {
    if (!required(selectedTicketTypeId) || !selectedTicketType) {
      return "Pilih tipe tiket terlebih dahulu.";
    }

    if (isSelectedSoldOut) {
      return "Tiket ini sudah habis.";
    }

    if (!Number.isInteger(quantity) || !isPositiveNumber(quantity)) {
      return "Jumlah minimal 1.";
    }

    if (remainingTickets !== null && quantity > remainingTickets) {
      return "Jumlah tidak boleh melebihi sisa kuota.";
    }

    return "";
  }, [isSelectedSoldOut, quantity, remainingTickets, selectedTicketType, selectedTicketTypeId]);

  useEffect(() => {
    setQuantity((currentQuantity) => Math.min(Math.max(currentQuantity, 1), maxQuantity));
  }, [maxQuantity, selectedTicketTypeId]);

  const handleTicketTypeChange = (ticketTypeId) => {
    setSelectedTicketTypeId(ticketTypeId);
    setBookingError("");
    setSuccessMessage("");
  };

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => Math.max(currentQuantity - 1, 1));
  };

  const increaseQuantity = () => {
    setQuantity((currentQuantity) => Math.min(currentQuantity + 1, maxQuantity));
  };

  const scrollToTicketSection = () => {
    ticketSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleQuantityChange = (changeEvent) => {
    const nextQuantity = Number(changeEvent.target.value);

    if (!Number.isInteger(nextQuantity)) {
      setQuantity(1);
      return;
    }

    setQuantity(Math.min(Math.max(nextQuantity, 1), maxQuantity));
  };

  const handleBookTicket = async () => {
    setBookingError("");
    setSuccessMessage("");

    if (authLoading) {
      return;
    }

    if (!user) {
      const message = "Silakan masuk terlebih dahulu sebelum memesan tiket.";

      setBookingError(message);
      showToast({ message, type: "error" });
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = setTimeout(() => {
        navigate("/login", {
          state: {
            from: location.pathname,
            message,
          },
        });
      }, 700);
      return;
    }

    if (bookingValidationError) {
      setBookingError(bookingValidationError);
      return;
    }

    setBookingLoading(true);

    try {
      const response = await bookingService.createBooking({
        event_id: event.id,
        items: [
          {
            quantity,
            ticket_type_id: selectedTicketType.id,
          },
        ],
      });
      const createdBooking = response.data.booking;
      const message = `Pesanan ${createdBooking.booking_code} berhasil dibuat. Silakan lanjutkan pembayaran dari Tiket Saya.`;

      setSuccessMessage(message);
      showToast({ message: "Pesanan tiket berhasil dibuat.", type: "success" });
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = setTimeout(() => {
        navigate("/my-tickets", {
          state: {
            message,
          },
        });
      }, 700);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Terjadi kesalahan. Silakan coba lagi.");
      setBookingError(message);
      showToast({ message, type: "error" });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="container-page py-16">
        <EventBreadcrumb title="Memuat detail acara" />
        <div className="surface-card p-8 text-center text-sm font-semibold text-muted">
          Memuat detail acara...
        </div>
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="container-page py-16">
        <EventBreadcrumb title="Acara tidak ditemukan" />
        <div className="surface-card p-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">Acara tidak ditemukan</h1>
          <p className="mt-2 text-sm text-muted">{error || "Acara tidak ditemukan"}</p>
          <Link className="btn-primary mt-6" to="/events">
            Kembali ke Acara
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-14">
      <motion.div {...sectionReveal} className="relative min-h-[340px] overflow-hidden bg-warm-bg md:min-h-[440px]">
        {eventBannerUrl && !bannerFailed ? (
          <img
            alt={`Banner ${event.title}`}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setBannerFailed(true)}
            src={eventBannerUrl}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,95,80,0.16)_0%,#310b0b_42%,#080101_100%)]" />
        )}
        <div className="absolute inset-0 bg-warm-bg/48" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-warm-bg via-warm-bg/70 to-transparent">
          <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 lg:px-8">
            {event.category?.name ? (
              <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                {event.category.name}
              </span>
            ) : null}
            <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {event.title}
            </h1>
          </div>
        </div>
      </motion.div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EventBreadcrumb title={event.title} />
        <motion.div {...sectionReveal} className="cream-card p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {event.category?.name ? <span className="badge-category">{event.category.name}</span> : null}
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-600">
              {getStatusLabel(event.status)}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-5xl">{event.title}</h1>
          <div className="mt-6 grid gap-4 text-sm text-muted md:grid-cols-2 lg:grid-cols-4">
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 shrink-0 text-primary-600" size={20} />
              <div>
                <p className="font-bold text-navy">Tanggal Acara</p>
                <p className="mt-1 leading-6">{formatDateTime(event.start_at)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="mt-0.5 shrink-0 text-primary-600" size={20} />
              <div>
                <p className="font-bold text-navy">{venue.name || "Venue belum tersedia"}</p>
                <p className="mt-1 leading-6">{venueLocationLabel || "Lokasi belum tersedia"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Ticket className="mt-0.5 shrink-0 text-primary-600" size={20} />
              <div>
                <p className="font-bold text-navy">Harga Mulai Dari</p>
                <p className="mt-1 leading-6">{startingPrice === null ? "Tiket belum tersedia" : formatCurrency(startingPrice)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="mt-0.5 shrink-0 text-primary-600" size={20} />
              <div>
                <p className="font-bold text-navy">Tiket Tersedia</p>
                <p className="mt-1 leading-6">{availableTickets === null ? "Kuota tersedia" : `${availableTickets} tiket`}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
          <motion.aside {...sectionReveal} className="surface-card h-fit overflow-hidden lg:sticky lg:top-28">
            <div className="bg-soft p-4">
              <p className="badge-category">Info Tiket</p>
            </div>
            <div className="p-5">
              <div className="overflow-hidden rounded-2xl border border-line bg-soft">
                {eventPosterUrl && !posterFailed ? (
                  <img
                    alt={`Poster ${event.title}`}
                    className="aspect-[3/4] w-full object-cover"
                    onError={() => setPosterFailed(true)}
                    src={eventPosterUrl}
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center text-primary-600">
                    <Ticket size={58} strokeWidth={1.6} />
                  </div>
                )}
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Acara</p>
                  <p className="mt-1 break-words text-lg font-extrabold leading-6 text-navy">{event.title}</p>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-start justify-between gap-3 border-t border-line pt-3">
                    <span className="font-semibold text-muted">Harga mulai</span>
                    <span className="text-right font-extrabold text-navy">{startingPrice === null ? "-" : formatCurrency(startingPrice)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-t border-line pt-3">
                    <span className="font-semibold text-muted">Status tiket</span>
                    <span className="text-right font-extrabold text-primary-600">
                      {ticketTypes.length === 0 || availableTickets === 0 ? "Belum tersedia" : "Tersedia"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-t border-line pt-3">
                    <span className="font-semibold text-muted">Venue</span>
                    <span className="text-right font-extrabold text-navy">{venue.name || "Belum tersedia"}</span>
                  </div>
                </div>
              </div>
              <button className="btn-secondary w-full justify-center lg:hidden" onClick={scrollToTicketSection} type="button">
                Pilih Tiket
              </button>
            </div>
          </motion.aside>

          <div className="space-y-6">
            <motion.div animate="animate" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" initial="initial" variants={staggerContainer}>
              <motion.div className="surface-card interactive-card p-5" variants={staggerItem}>
                <CalendarDays className="mb-3 text-primary-600" size={22} />
                <p className="text-sm text-muted">Tanggal mulai</p>
                <p className="font-semibold text-navy">{formatDateTime(event.start_at)}</p>
              </motion.div>
              <motion.div className="surface-card interactive-card p-5" variants={staggerItem}>
                <Clock className="mb-3 text-primary-600" size={22} />
                <p className="text-sm text-muted">Tanggal selesai</p>
                <p className="font-semibold text-navy">{formatDateTime(event.end_at)}</p>
              </motion.div>
              <motion.div className="surface-card interactive-card p-5" variants={staggerItem}>
                <Users className="mb-3 text-primary-600" size={22} />
                <p className="text-sm text-muted">Tiket tersedia</p>
                <p className="font-semibold text-navy">{availableTickets === null ? "Kuota tersedia" : `${availableTickets} tiket`}</p>
              </motion.div>
              <motion.div className="surface-card interactive-card p-5" variants={staggerItem}>
                <Ticket className="mb-3 text-primary-600" size={22} />
                <p className="text-sm text-muted">Kategori</p>
                <p className="font-semibold text-navy">{event.category?.name || "-"}</p>
              </motion.div>
            </motion.div>

            <motion.div {...sectionReveal} className="cream-card scroll-mt-28 p-6" id="pilih-tiket" ref={ticketSectionRef}>
              <div className="mb-5">
                <p className="badge-category">Pilihan Tiket</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-navy">Pilih jumlah tiket</h2>
              </div>

              {ticketTypes.length > 0 ? (
                <div className="space-y-4">
                  {ticketTypes.map((ticketType) => {
                    const remaining = getRemainingTickets(ticketType);
                    const isSelected = selectedTicketTypeId === ticketType.id;
                    const isSoldOut = remaining === 0;

                    return (
                      <button
                        className={`w-full rounded-2xl border bg-white p-5 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                          isSelected ? "border-primary-600 shadow-md shadow-primary-600/10" : "border-line hover:border-primary-600/30 hover:bg-warm-accent/40"
                        }`}
                        disabled={isSoldOut}
                        key={ticketType.id}
                        onClick={() => handleTicketTypeChange(ticketType.id)}
                        type="button"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-navy">{ticketType.name}</h3>
                            <p className="mt-1 text-sm leading-6 text-muted">{ticketType.description || "Tiket untuk acara ini."}</p>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary-600">
                              {formatSalePeriod(ticketType)}
                            </p>
                            <p className="mt-2 text-sm font-medium text-muted">{getRemainingLabel(ticketType)}</p>
                          </div>
                          <div className="shrink-0 text-left md:text-right">
                            <p className="text-2xl font-extrabold text-navy">{formatCurrency(Number(ticketType.price))}</p>
                            {isSoldOut ? (
                              <span className="mt-2 inline-flex rounded-full bg-danger/10 px-3 py-1 text-xs font-bold text-danger">
                                Habis
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-line bg-soft p-8 text-center text-sm text-muted">
                  Tiket belum tersedia.
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-line bg-soft p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-end">
                  <div>
                    <p className="text-sm text-muted">Tiket dipilih</p>
                    <p className="mt-1 text-xl font-extrabold text-navy">{selectedTicketType?.name || "Belum ada tiket dipilih"}</p>
                    <p className="mt-1 text-sm font-semibold text-primary-600">
                      {selectedTicketType
                        ? remainingTickets === null
                          ? "Kuota tersedia"
                          : `${remainingTickets} tersedia`
                        : "Pilih salah satu tiket."}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="ticket-quantity">Pilih jumlah tiket</label>
                    <div className="flex items-center overflow-hidden rounded-xl border border-line bg-white">
                      <button className="px-3 py-3 text-navy disabled:text-muted" disabled={bookingLoading || isSelectedSoldOut || quantity <= 1} onClick={decreaseQuantity} type="button">
                        <Minus size={16} />
                      </button>
                      <input
                        className="min-w-0 flex-1 border-x border-line px-3 py-3 text-center text-sm font-bold text-navy outline-none"
                        disabled={bookingLoading || isSelectedSoldOut || !selectedTicketType}
                        id="ticket-quantity"
                        max={maxQuantity}
                        min="1"
                        onChange={handleQuantityChange}
                        type="number"
                        value={quantity}
                      />
                      <button className="px-3 py-3 text-navy disabled:text-muted" disabled={bookingLoading || isSelectedSoldOut || quantity >= maxQuantity} onClick={increaseQuantity} type="button">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-lg font-extrabold text-navy">
                    <span>Total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                {bookingError ? (
                  <div className="mt-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                    {bookingError}
                  </div>
                ) : null}

                {!bookingError && bookingValidationError ? (
                  <p className="mt-4 text-sm font-semibold text-danger">{bookingValidationError}</p>
                ) : null}

                {successMessage ? (
                  <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-4">
                    <p className="text-sm font-semibold text-primary-600">Pesanan berhasil</p>
                    <p className="mt-1 text-sm leading-6 text-navy">{successMessage}</p>
                  </div>
                ) : null}

                <button
                  className="btn-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={bookingLoading || Boolean(successMessage)}
                  onClick={handleBookTicket}
                  type="button"
                >
                  {bookingLoading ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Lanjutkan Pemesanan"
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div {...sectionReveal} className="surface-card p-6">
              <p className="badge-category">Tentang Acara</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-navy">Tentang Acara</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-muted">
                {event.description || "Deskripsi acara belum tersedia."}
              </p>
            </motion.div>

            <motion.div {...sectionReveal} className="surface-card overflow-hidden">
              <div className="p-6">
                <p className="badge-category">Lokasi Acara</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-navy">Lokasi Acara</h2>
                {!fullAddress ? (
                  <p className="mt-4 rounded-2xl bg-soft p-4 text-sm font-semibold text-muted">
                    Alamat acara belum lengkap.
                  </p>
                ) : null}
                <div className="mt-5 grid gap-4 text-sm text-muted sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-navy">Venue</p>
                    <p className="mt-1">{venue.name || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy">Alamat</p>
                    <p className="mt-1">{venue.address || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy">Kota</p>
                    <p className="mt-1">{venue.city || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy">Provinsi</p>
                    <p className="mt-1">{venue.province || "-"}</p>
                  </div>
                </div>
                {mapsSearchUrl ? (
                  <a className="btn-secondary mt-5" href={mapsSearchUrl} rel="noreferrer" target="_blank">
                    <ExternalLink size={16} />
                    Buka di Google Maps
                  </a>
                ) : null}
              </div>
              {mapsEmbedUrl ? (
                <iframe
                  className="h-72 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapsEmbedUrl}
                  title={`Peta lokasi ${venue.name || event.title}`}
                />
              ) : null}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EventDetail;
