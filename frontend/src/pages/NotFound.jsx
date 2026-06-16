import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="container-page flex min-h-[60vh] items-center justify-center py-12">
      <div className="text-center">
        <p className="badge-category">404</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-navy">
          Halaman tidak ditemukan
        </h1>
        <Link className="btn-primary mt-8" to="/">
          Kembali ke Beranda
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
