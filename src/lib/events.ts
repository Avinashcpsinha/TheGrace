/**
 * Cross-component custom events (window-dispatched).
 *
 * EV_BOOK_PROGRESS — fired by BookHero with detail { progress: number }
 *   0 = closed, 1 = fully open, >1 = book receding / site take-over.
 *   The header listens and reveals itself once progress >= 1.
 *
 * EV_TOAST — fired by anything with detail { message: string }; the
 *   Toaster in chrome renders it.
 */
export const EV_BOOK_PROGRESS = "tg:book-progress";
export const EV_TOAST = "tg:toast";

export const emitBookProgress = (progress: number) => {
  window.dispatchEvent(new CustomEvent(EV_BOOK_PROGRESS, { detail: { progress } }));
};

export const toast = (message: string) => {
  window.dispatchEvent(new CustomEvent(EV_TOAST, { detail: { message } }));
};
