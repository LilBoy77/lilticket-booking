import { useEffect, useMemo, useState } from "react";
import { eventSlideImages } from "../data/eventSlideImages.js";

function EventBannerSlider() {
  const slides = useMemo(() => eventSlideImages.filter((slide) => slide.imageUrl), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div
        aria-hidden="true"
        className="mb-8 aspect-[16/9] w-full rounded-3xl border border-[#ff6b5f]/25 bg-gradient-to-br from-warm-accent via-warm-surface to-warm-bg shadow-[0_18px_55px_rgba(255,79,69,0.12)] md:aspect-[21/9]"
      />
    );
  }

  return (
    <section aria-label="Slider gambar acara" className="mb-8">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-[#ff6b5f]/25 bg-gradient-to-br from-warm-accent via-warm-surface to-warm-bg shadow-[0_18px_55px_rgba(255,79,69,0.12)] md:aspect-[21/9]">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const hasFailed = failedImages[slide.id];

          return (
            <div
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-500 ease-out ${isActive ? "opacity-100" : "opacity-0"}`}
              key={slide.id}
            >
              {hasFailed ? (
                <div className="h-full w-full bg-gradient-to-br from-warm-accent via-warm-surface to-warm-bg" />
              ) : (
                <img
                  alt={slide.alt}
                  className="h-full w-full object-cover"
                  decoding="async"
                  loading={index === 0 ? "eager" : "lazy"}
                  onError={() => {
                    setFailedImages((currentFailedImages) => ({
                      ...currentFailedImages,
                      [slide.id]: true,
                    }));
                  }}
                  src={slide.imageUrl}
                />
              )}
            </div>
          );
        })}
      </div>

      {slides.length > 1 ? (
        <div aria-hidden="true" className="mt-4 flex justify-center gap-2">
          {slides.map((slide, index) => (
            <span
              className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? "w-7 bg-primary-600" : "w-2 bg-warm-muted/45"}`}
              key={slide.id}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default EventBannerSlider;
