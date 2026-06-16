import { CheckCircle2, TicketCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { sectionReveal } from "../utils/motionPresets.js";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  return (
    <section className="container-page flex justify-center py-16">
      <motion.div {...sectionReveal} className="surface-card w-full max-w-xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 size={34} />
        </div>
        <p className="badge-category mt-6">Pembayaran Berhasil</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">
          Pembayaran berhasil
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Pesanan Anda sedang diproses. Jika webhook sudah diterima, tiket akan tampil sebagai tiket aktif di Tiket Saya.
        </p>
        {bookingId ? (
          <p className="mt-4 rounded-xl bg-soft px-4 py-3 text-sm font-semibold text-primary-600">
            ID Pesanan: {bookingId}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="btn-primary" to="/my-tickets">
            <TicketCheck size={18} />
            Kembali ke Tiket Saya
          </Link>
          <Link className="btn-secondary" to="/events">
            Kembali ke Acara
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export default PaymentSuccess;
