export const pageTransition = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 10 },
  transition: { duration: 0.22, ease: "easeOut" },
};

export const sectionReveal = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 12 },
  transition: { duration: 0.22, ease: "easeOut" },
};

export const softReveal = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 10 },
  transition: { duration: 0.2, ease: "easeOut" },
};

export const staggerContainer = {
  animate: {
    opacity: 1,
    transition: {
      delayChildren: 0.025,
      staggerChildren: 0.04,
    },
  },
  initial: { opacity: 0 },
};

export const staggerItem = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 10 },
  transition: { duration: 0.2, ease: "easeOut" },
};
