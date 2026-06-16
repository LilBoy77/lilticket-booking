import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import fallbackImage from "../assets/BG-lilticket.jpg";

const fallbackSlides = [
  {
    id: "hero-fallback",
    image: fallbackImage,
  },
];

function getEventImage(event) {
  return event?.poster_url || event?.banner_url || event?.image || "";
}

function HomeEventCarousel({ events = [] }) {
  const slides = useMemo(() => {
    const eventSlides = events
      .filter(Boolean)
      .slice(0, 5)
      .map((event, index) => ({
        id: event.id ?? `${getEventImage(event)}-${index}`,
        image: getEventImage(event) || fallbackImage,
      }));

    return eventSlides.length > 0 ? eventSlides : fallbackSlides;
  }, [events]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  useEffect(() => {
    setActiveIndex(0);
  }, [slides]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  const activeSlide = slides[activeIndex] || slides[0];
  const activeImage = activeSlide?.image || fallbackImage;
  const hasImage = activeImage && !failedImages[activeSlide.id];

  return (
    <div
      className="group relative overflow-hidden rounded-[2rem] border border-primary-500/30 bg-warm-burgundy/75 p-3 shadow-2xl shadow-black/35 backdrop-blur-xl"
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,107,95,0.22),transparent_28%),linear-gradient(135deg,rgba(255,248,242,0.08),transparent_42%)]" />
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-warm-surface/80">
        <div className="relative aspect-[4/5] min-h-[360px] overflow-hidden sm:aspect-[16/13] lg:aspect-[4/5] lg:min-h-[430px]">
          <img alt="" className="absolute inset-0 h-full w-full object-cover" src={fallbackImage} />
          <AnimatePresence initial={false}>
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0"
              exit={{ opacity: 0, scale: 1.03 }}
              initial={{ opacity: 0, scale: 1.04 }}
              key={activeSlide.id}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              {hasImage ? (
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  decoding="async"
                  fetchPriority={activeIndex === 0 ? "high" : "auto"}
                  loading="eager"
                  onError={() => setFailedImages((current) => ({ ...current, [activeSlide.id]: true }))}
                  src={activeImage}
                />
              ) : (
                <img alt="" className="h-full w-full object-cover" src={fallbackImage} />
              )}
            </motion.div>
          </AnimatePresence>
          {slides.length > 1 ? (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
              {slides.map((slide, index) => (
                <button
                  aria-label={`Tampilkan slide ${index + 1}`}
                  className={`h-2.5 rounded-full border border-white/25 shadow-sm shadow-black/30 transition-all duration-300 ${
                    index === activeIndex ? "w-8 bg-primary-600" : "w-2.5 bg-white/45 hover:bg-white/70"
                  }`}
                  key={slide.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default HomeEventCarousel;
