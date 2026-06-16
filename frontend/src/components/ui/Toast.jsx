import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

const toastStyles = {
  error: {
    icon: XCircle,
    iconClass: "text-danger",
    panel: "border-danger/60 bg-warm-burgundy text-warm-cream",
  },
  info: {
    icon: Info,
    iconClass: "text-primary-500",
    panel: "border-primary-500/50 bg-warm-burgundy text-warm-cream",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-success",
    panel: "border-success/50 bg-warm-burgundy text-warm-cream",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-warning",
    panel: "border-warning/50 bg-warm-burgundy text-warm-cream",
  },
};

export function ToastViewport({ dismissToast, toasts }) {
  return (
    <div className="fixed left-4 right-4 top-4 z-50 flex flex-col items-stretch gap-3 sm:left-auto sm:w-[calc(100%-2rem)] sm:max-w-sm">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type] || toastStyles.info;
        const Icon = style.icon;

        return (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl shadow-black/25 backdrop-blur ${style.panel}`}
            key={toast.id}
            role="status"
          >
            <Icon className={`mt-0.5 shrink-0 ${style.iconClass}`} size={18} />
            <p className="min-w-0 flex-1 text-sm font-semibold leading-6">{toast.message}</p>
            <button
              aria-label="Tutup notifikasi"
              className="shrink-0 rounded-lg p-1 text-warm-muted hover:bg-warm-accent/60 hover:text-warm-text"
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
