import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import EventBannerSlider from "../components/EventBannerSlider.jsx";
import EventCard from "../components/EventCard.jsx";
import { eventService } from "../services/eventService.js";
import { sectionReveal } from "../utils/motionPresets.js";

const categoryOptions = [
  "Music Concert",
  "Festival",
  "Arts & Culture",
  "Conference",
];

const cityOptions = ["Jakarta", "Bandung", "Surabaya"];

const defaultSort = "start_at_asc";
const defaultLimit = 6;

const sortOptions = [
  { label: "Tanggal: terdekat", value: "start_at_asc" },
  { label: "Tanggal: terbaru", value: "start_at_desc" },
];

const filterControlClass = "input-field transition-colors duration-200 hover:border-[#ff6b5f]/60 focus:border-[#ff4f45] focus:outline-none focus:ring-2 focus:ring-[#ff4f45]/20";
const listReveal = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 8 },
  transition: { duration: 0.16, ease: "easeOut" },
};

const cardReveal = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 8 },
};

function getErrorMessage(error) {
  return error.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi.";
}

function EventCardSkeleton() {
  return (
    <article className="cream-card flex h-full min-h-[430px] flex-col overflow-hidden">
      <div className="aspect-[4/5] w-full shrink-0 bg-gradient-to-br from-warm-accent/70 via-warm-surface to-warm-bg sm:aspect-[16/10]">
        <div className="h-full w-full animate-pulse bg-warm-cream/10" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="h-6 w-28 animate-pulse rounded-full bg-warm-accent/35" />
          <div className="mt-3 h-6 w-11/12 animate-pulse rounded-lg bg-warm-accent/25" />
          <div className="mt-2 h-6 w-8/12 animate-pulse rounded-lg bg-warm-accent/20" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-7/12 animate-pulse rounded-lg bg-warm-accent/20" />
          <div className="h-5 w-9/12 animate-pulse rounded-lg bg-warm-accent/20" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-24 animate-pulse rounded-lg bg-warm-accent/25" />
            <div className="h-4 w-32 animate-pulse rounded-lg bg-warm-accent/20" />
          </div>
          <div className="h-10 w-20 animate-pulse rounded-xl bg-primary-600/35" />
        </div>
      </div>
    </article>
  );
}

function EventsSkeletonGrid() {
  return (
    <div aria-hidden="true" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: defaultLimit }, (_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
}

function Events() {
  const hasLoadedRef = useRef(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    limit: defaultLimit,
    page: 1,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const requestParams = useMemo(
    () => ({
      category: category || undefined,
      city: city || undefined,
      limit: defaultLimit,
      page,
      search: debouncedSearch || undefined,
      sort,
    }),
    [category, city, debouncedSearch, page, sort],
  );

  const displayedEvents = useMemo(() => events.filter(Boolean), [events]);
  const totalPages = useMemo(() => Math.max(pagination.total_pages, 1), [pagination.total_pages]);
  const paginationLabel = useMemo(
    () => `Halaman ${pagination.page} dari ${totalPages} - ${pagination.total} acara`,
    [pagination.page, pagination.total, totalPages],
  );

  useEffect(() => {
    let isMounted = true;
    const isInitialLoad = !hasLoadedRef.current;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError("");

    eventService
      .getEvents(requestParams)
      .then((response) => {
        if (isMounted) {
          setEvents(response.data.events || []);
          setPagination(response.data.pagination || {
            limit: defaultLimit,
            page: 1,
            total: 0,
            total_pages: 0,
          });
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          if (isInitialLoad) {
            setEvents([]);
          }
          setError(getErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (isMounted) {
          hasLoadedRef.current = true;
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requestParams]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setPage(1);
  };

  const handleCityChange = (event) => {
    setCity(event.target.value);
    setPage(1);
  };

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const goToPreviousPage = () => {
    setPage((currentPage) => Math.max(currentPage - 1, 1));
  };

  const goToNextPage = () => {
    setPage((currentPage) =>
      Math.min(currentPage + 1, totalPages),
    );
  };

  return (
    <section className="container-page py-12">
      <motion.div {...sectionReveal} className="mb-8 max-w-2xl">
        <p className="badge-category">Acara</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
          Temukan acara mendatang
        </h1>
        <p className="mt-3 font-normal text-muted">
          Jelajahi konser, festival, konferensi, dan acara lokal dari database LilTicket.
        </p>
      </motion.div>

      <EventBannerSlider />

      <motion.div {...sectionReveal} className="surface-card mb-8 grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_160px_170px]">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            size={18}
          />
          <input
            className={`${filterControlClass} pl-11`}
            onChange={handleSearchChange}
            placeholder="Cari acara, kategori, atau venue"
            type="search"
            value={search}
          />
        </label>
        <select
          className={filterControlClass}
          onChange={handleCategoryChange}
          value={category}
        >
          <option value="">Semua kategori</option>
          {categoryOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className={filterControlClass} onChange={handleCityChange} value={city}>
          <option value="">Semua kota</option>
          {cityOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className={filterControlClass} onChange={handleSortChange} value={sort}>
          {sortOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </motion.div>

      {loading ? (
        <motion.div {...listReveal} className="space-y-8">
          <EventsSkeletonGrid />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-5 w-44 animate-pulse rounded-lg bg-warm-surface" />
            <div className="flex gap-3">
              <div className="h-10 w-24 animate-pulse rounded-xl bg-warm-surface" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-primary-600/25" />
            </div>
          </div>
        </motion.div>
      ) : null}

      {!loading && error ? (
        <motion.div {...sectionReveal} className="surface-card border-danger/20 bg-danger/5 p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight text-danger">
            Gagal memuat acara
          </h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </motion.div>
      ) : null}

      {!loading && !error && displayedEvents.length > 0 ? (
        <motion.div {...listReveal} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedEvents.map((event, index) => (
              <motion.div
                {...cardReveal}
                key={event.id}
                transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.015, 0.06) }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-muted">
              {paginationLabel}
              {refreshing ? <span className="sr-only"> Memperbarui hasil acara.</span> : null}
            </p>
            <div className="flex gap-3">
              <button
                className="btn-secondary px-4 py-2"
                disabled={page <= 1}
                onClick={goToPreviousPage}
                type="button"
              >
                Sebelumnya
              </button>
              <button
                className="btn-primary px-4 py-2"
                disabled={page >= totalPages}
                onClick={goToNextPage}
                type="button"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {!loading && !error && displayedEvents.length === 0 ? (
        <motion.div {...sectionReveal} className="surface-card p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight text-navy">
            Acara tidak ditemukan
          </h2>
          <p className="mt-2 text-sm text-muted">
            Coba kata kunci, kategori, atau kota lain.
          </p>
        </motion.div>
      ) : null}
    </section>
  );
}

export default Events;
