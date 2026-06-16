import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

function buildKeyframes(from, steps) {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((step) => Object.keys(step))]);
  const keyframes = {};

  keys.forEach((key) => {
    keyframes[key] = [from[key], ...steps.map((step) => step[key])];
  });

  return keyframes;
}

function BlurText({
  animateBy = "words",
  animationFrom,
  animationTo,
  className = "",
  delay = 200,
  direction = "top",
  easing = (value) => value,
  onAnimationComplete,
  rootMargin = "0px",
  stepDuration = 0.35,
  tag: Tag = "p",
  text = "",
  threshold = 0.1,
}) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }

    const currentElement = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(currentElement);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(currentElement);

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const defaultFrom = useMemo(
    () =>
      direction === "top"
        ? { filter: "blur(10px)", opacity: 0, y: -50 }
        : { filter: "blur(10px)", opacity: 0, y: 50 },
    [direction],
  );

  const defaultTo = useMemo(
    () => [
      {
        filter: "blur(5px)",
        opacity: 0.5,
        y: direction === "top" ? 5 : -5,
      },
      { filter: "blur(0px)", opacity: 1, y: 0 },
    ],
    [direction],
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, index) => (stepCount === 1 ? 0 : index / (stepCount - 1)));
  const MotionTag = Tag === "h1" ? motion.h1 : Tag === "h2" ? motion.h2 : Tag === "span" ? motion.span : motion.p;

  return (
    <MotionTag ref={ref} className={`flex flex-wrap ${className}`}>
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
        const spanTransition = {
          delay: (index * delay) / 1000,
          duration: totalDuration,
          ease: easing,
          times,
        };

        return (
          <motion.span
            animate={inView ? animateKeyframes : fromSnapshot}
            className="inline-block will-change-[transform,filter,opacity]"
            initial={fromSnapshot}
            key={`${segment}-${index}`}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
            transition={spanTransition}
          >
            {segment === " " ? "\u00A0" : segment}
            {animateBy === "words" && index < elements.length - 1 ? "\u00A0" : null}
          </motion.span>
        );
      })}
    </MotionTag>
  );
}

export default BlurText;
