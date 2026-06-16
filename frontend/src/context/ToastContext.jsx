import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ToastViewport } from "../components/ui/Toast.jsx";

const ToastContext = createContext(null);
const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = "info" }) => {
      if (!message) {
        return;
      }

      const id = crypto.randomUUID();
      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id,
          message,
          type,
        },
      ]);

      setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport dismissToast={dismissToast} toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast harus digunakan di dalam ToastProvider");
  }

  return context;
}
