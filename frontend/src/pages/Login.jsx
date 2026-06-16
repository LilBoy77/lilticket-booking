import { Eye, EyeOff, LoaderCircle, Lock, Mail, ShieldCheck, TicketCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoLilTicket from "../assets/logo-lilticket-tight.png";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { getErrorMessage } from "../utils/errorMessage.js";
import { sectionReveal } from "../utils/motionPresets.js";
import { isValidEmail, minLength, required } from "../utils/validation.js";

function getRedirectPath(user, fallbackPath) {
  const normalizedFallbackPath =
    typeof fallbackPath === "string"
      ? fallbackPath
      : fallbackPath?.pathname || "";

  if (user?.role === "ADMIN") {
    return normalizedFallbackPath.startsWith("/dashboard") ? normalizedFallbackPath : "/dashboard";
  }

  if (normalizedFallbackPath && !normalizedFallbackPath.startsWith("/dashboard")) {
    return normalizedFallbackPath;
  }

  return "/";
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const nextErrors = {
      email: !required(form.email) ? "Email wajib diisi." : !isValidEmail(form.email) ? "Format email tidak valid." : "",
      password: !required(form.password)
        ? "Password wajib diisi."
        : !minLength(form.password, 6)
          ? "Password minimal 6 karakter."
          : "",
    };
    const activeErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));

    setFieldErrors(activeErrors);
    if (Object.keys(activeErrors).length > 0) {
      showToast({ message: Object.values(activeErrors)[0], type: "error" });
    }

    return Object.keys(activeErrors).length === 0;
  };

  const getInputClass = (fieldName) =>
    fieldErrors[fieldName]
      ? "w-full rounded-2xl border border-danger bg-warm-burgundy/80 px-12 py-3.5 text-sm font-semibold text-warm-text outline-none transition-all duration-200 placeholder:text-muted/60 hover:bg-warm-surface focus:border-danger focus:ring-2 focus:ring-danger/15"
      : "w-full rounded-2xl border border-line bg-warm-burgundy/80 px-12 py-3.5 text-sm font-semibold text-warm-text outline-none transition-all duration-200 placeholder:text-muted/60 hover:border-primary-500/40 hover:bg-warm-surface focus:border-primary-500 focus:ring-2 focus:ring-primary-600/20";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setError("");
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const loggedInUser = await login({
        email: form.email.trim(),
        password: form.password,
      });
      showToast({ message: "Berhasil masuk.", type: "success" });
      navigate(getRedirectPath(loggedInUser, location.state?.from), { replace: true });
    } catch (requestError) {
      const message = requestError?.response?.data?.message
        ? getErrorMessage(requestError)
        : "Email atau password salah.";
      setError(message);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#160405_0%,#260707_42%,#080101_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_18%,rgba(255,107,95,0.18),transparent_28rem),radial-gradient(circle_at_82%_24%,rgba(255,248,242,0.08),transparent_24rem)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-warm-bg to-transparent" />

      <div className="container-page grid min-h-[calc(100vh-8rem)] items-center gap-8 py-10 lg:grid-cols-[1fr_460px] lg:py-14">
        <motion.div {...sectionReveal} className="max-w-2xl">
          <img alt="LilTicket" className="h-12 w-auto" src={logoLilTicket} />
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-warm-surface/55 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted">
            <TicketCheck size={16} />
            Tiket acara pilihan
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-warm-text sm:text-5xl">
            Masuk ke LilTicket dengan lebih mudah.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-muted">
            Kelola pesanan, lihat tiket elektronik, dan lanjutkan pembelian tiket dari satu akun.
          </p>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-muted sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-warm-surface/45 p-4">
              <ShieldCheck className="mb-3 text-primary-600" size={22} />
              Sesi aman untuk akses tiket Anda.
            </div>
            <div className="rounded-2xl border border-line bg-warm-surface/45 p-4">
              <TicketCheck className="mb-3 text-primary-600" size={22} />
              Pesanan tersimpan setelah pembayaran.
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-primary-500/25 bg-warm-surface/75 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34),0_0_32px_rgba(255,79,69,0.12)] backdrop-blur-xl sm:p-7"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="rounded-[1.5rem] border border-line bg-warm-burgundy/45 p-5 sm:p-7">
            <h2 className="text-3xl font-extrabold tracking-tight text-warm-text">
              Masuk
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Masukkan email dan password untuk melanjutkan.
            </p>

            {location.state?.message ? (
              <div className="mt-6 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                {location.state.message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                {error}
              </div>
            ) : null}

            <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-bold text-warm-text" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.email)}
                    autoComplete="email"
                    className={getInputClass("email")}
                    disabled={loading}
                    id="email"
                    name="email"
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    type="email"
                    value={form.email}
                  />
                </div>
                {fieldErrors.email ? <p className="mt-2 text-xs font-semibold text-danger" id="email-error">{fieldErrors.email}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-warm-text" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.password)}
                    autoComplete="current-password"
                    className={getInputClass("password")}
                    disabled={loading}
                    id="password"
                    name="password"
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                  />
                  <button
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-warm-accent/60 hover:text-warm-text focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    disabled={loading}
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                    type="button"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password ? <p className="mt-2 text-xs font-semibold text-danger" id="password-error">{fieldErrors.password}</p> : null}
              </div>
              <button className="btn-primary w-full justify-center rounded-2xl py-3.5 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading} type="submit">
                {loading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Belum punya akun?{" "}
              <Link className="font-extrabold text-primary-600 transition-colors hover:text-secondary" to="/register">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Login;
