import { Eye, EyeOff, LoaderCircle, Lock, Mail, Phone, Sparkles, TicketCheck, User } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoLilTicket from "../assets/logo-lilticket-tight.png";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { getErrorMessage } from "../utils/errorMessage.js";
import { sectionReveal } from "../utils/motionPresets.js";
import { isValidEmail, minDigits, minLength, onlyDigits, required } from "../utils/validation.js";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
    phone_number: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({
    confirm_password: false,
    password: false,
  });

  const validateForm = () => {
    const phoneNumber = form.phone_number.trim();
    const nextErrors = {
      email: !required(form.email) ? "Email wajib diisi." : !isValidEmail(form.email) ? "Format email tidak valid." : "",
      full_name: !required(form.full_name)
        ? "Nama wajib diisi."
        : !minLength(form.full_name, 3)
          ? "Nama minimal 3 karakter."
          : "",
      password: !required(form.password)
        ? "Password wajib diisi."
        : !minLength(form.password, 6)
          ? "Password minimal 6 karakter."
          : "",
      confirm_password: !required(form.confirm_password)
        ? "Konfirmasi password wajib diisi."
        : form.password !== form.confirm_password
          ? "Konfirmasi password tidak sama."
          : "",
      phone_number:
        phoneNumber && !onlyDigits(phoneNumber)
          ? "Nomor telepon hanya boleh berisi angka."
          : phoneNumber && !minDigits(phoneNumber, 10)
            ? "Nomor telepon minimal 10 digit."
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

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((currentValue) => ({
      ...currentValue,
      [fieldName]: !currentValue[fieldName],
    }));
  };

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
      await register({
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        password: form.password,
        phone_number: form.phone_number.trim(),
      });
      showToast({ message: "Pendaftaran berhasil. Silakan masuk.", type: "success" });
      navigate("/login", {
        replace: true,
        state: {
          message: "Pendaftaran berhasil. Silakan masuk dengan akun Anda.",
        },
      });
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#160405_0%,#260707_42%,#080101_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(255,107,95,0.17),transparent_28rem),radial-gradient(circle_at_86%_20%,rgba(255,248,242,0.08),transparent_24rem)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-warm-bg to-transparent" />

      <div className="container-page grid min-h-[calc(100vh-8rem)] items-center gap-8 py-10 lg:grid-cols-[1fr_500px] lg:py-14">
        <motion.div {...sectionReveal} className="max-w-2xl">
          <img alt="LilTicket" className="h-12 w-auto" src={logoLilTicket} />
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-warm-surface/55 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted">
            <Sparkles size={16} />
            Daftar cepat
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-warm-text sm:text-5xl">
            Buat akun dan mulai pesan tiket.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-muted">
            Satu akun untuk menyimpan pesanan, melihat status pembayaran, dan membuka tiket elektronik.
          </p>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-muted sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-warm-surface/45 p-4">
              <TicketCheck className="mb-3 text-primary-600" size={22} />
              Tiket siap diakses setelah pesanan berhasil.
            </div>
            <div className="rounded-2xl border border-line bg-warm-surface/45 p-4">
              <User className="mb-3 text-primary-600" size={22} />
              Data akun dipakai untuk riwayat pemesanan.
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
              Daftar
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Isi data akun untuk mulai menggunakan LilTicket.
            </p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                {error}
              </div>
            ) : null}

            <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-bold text-warm-text" htmlFor="full_name">
                  Nama
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input
                    aria-describedby={fieldErrors.full_name ? "full-name-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.full_name)}
                    autoComplete="name"
                    className={getInputClass("full_name")}
                    disabled={loading}
                    id="full_name"
                    name="full_name"
                    onChange={handleChange}
                    placeholder="Nama lengkap"
                    type="text"
                    value={form.full_name}
                  />
                </div>
                {fieldErrors.full_name ? <p className="mt-2 text-xs font-semibold text-danger" id="full-name-error">{fieldErrors.full_name}</p> : null}
              </div>
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
                <label className="mb-2 block text-sm font-bold text-warm-text" htmlFor="phone_number">
                  Nomor telepon
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input
                    aria-describedby={fieldErrors.phone_number ? "phone-number-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.phone_number)}
                    autoComplete="tel"
                    className={getInputClass("phone_number")}
                    disabled={loading}
                    id="phone_number"
                    inputMode="numeric"
                    name="phone_number"
                    onChange={handleChange}
                    placeholder="Contoh: 081234567890"
                    type="tel"
                    value={form.phone_number}
                  />
                </div>
                {fieldErrors.phone_number ? <p className="mt-2 text-xs font-semibold text-danger" id="phone-number-error">{fieldErrors.phone_number}</p> : null}
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
                    autoComplete="new-password"
                    className={getInputClass("password")}
                    disabled={loading}
                    id="password"
                    name="password"
                    onChange={handleChange}
                    placeholder="Minimal 6 karakter"
                    type={visiblePasswords.password ? "text" : "password"}
                    value={form.password}
                  />
                  <button
                    aria-label={visiblePasswords.password ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-warm-accent/60 hover:text-warm-text focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    disabled={loading}
                    onClick={() => togglePasswordVisibility("password")}
                    type="button"
                  >
                    {visiblePasswords.password ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password ? <p className="mt-2 text-xs font-semibold text-danger" id="password-error">{fieldErrors.password}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-warm-text" htmlFor="confirm_password">
                  Konfirmasi password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input
                    aria-describedby={fieldErrors.confirm_password ? "confirm-password-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.confirm_password)}
                    autoComplete="new-password"
                    className={getInputClass("confirm_password")}
                    disabled={loading}
                    id="confirm_password"
                    name="confirm_password"
                    onChange={handleChange}
                    placeholder="Ulangi password"
                    type={visiblePasswords.confirm_password ? "text" : "password"}
                    value={form.confirm_password}
                  />
                  <button
                    aria-label={visiblePasswords.confirm_password ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                    className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-warm-accent/60 hover:text-warm-text focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    disabled={loading}
                    onClick={() => togglePasswordVisibility("confirm_password")}
                    type="button"
                  >
                    {visiblePasswords.confirm_password ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirm_password ? <p className="mt-2 text-xs font-semibold text-danger" id="confirm-password-error">{fieldErrors.confirm_password}</p> : null}
              </div>
              <button className="btn-primary w-full justify-center rounded-2xl py-3.5 disabled:cursor-not-allowed disabled:opacity-70" disabled={loading} type="submit">
                {loading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  "Daftar"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Sudah punya akun?{" "}
              <Link className="font-extrabold text-primary-600 transition-colors hover:text-secondary" to="/login">
                Masuk
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Register;
