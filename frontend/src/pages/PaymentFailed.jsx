import { AlertCircle, CreditCard, LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { paymentService } from "../services/paymentService.js";
import { sectionReveal } from "../utils/motionPresets.js";

function getErrorMessage(error) {
  return error.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi.";
}

function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRetryPayment = async () => {
    if (!bookingId) {
      setError("ID pesanan tidak ditemukan.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await paymentService.createXenditPayment(bookingId);
      const checkoutUrl = response.data.checkout_url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError("Link checkout tidak tersedia.");
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-page flex justify-center py-16">
      <motion.div {...sectionReveal} className="surface-card w-full max-w-xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <AlertCircle size={34} />
        </div>
        <p className="badge-category mt-6">Pembayaran Gagal</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">
          Pembayaran gagal atau dibatalkan
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Anda bisa mencoba membuka ulang checkout selama booking masih menunggu pembayaran.
        </p>
        {bookingId ? (
          <p className="mt-4 rounded-xl bg-soft px-4 py-3 text-sm font-semibold text-primary-600">
            ID Pesanan: {bookingId}
          </p>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-70" disabled={loading || !bookingId} onClick={handleRetryPayment} type="button">
            {loading ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Coba Bayar Lagi
              </>
            )}
          </button>
          <Link className="btn-secondary" to="/my-tickets">
            Tiket Saya
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export default PaymentFailed;
