import { motion } from "framer-motion";
import { Suspense, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Navbar from "../components/Navbar.jsx";
import { pageTransition } from "../utils/motionPresets.js";

function CustomerContentFallback() {
  return (
    <section className="container-page min-h-[45vh] py-12">
      <div className="surface-card p-5 text-center text-sm font-semibold text-muted">
        Memuat halaman...
      </div>
    </section>
  );
}

function MainLayout() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/dashboard");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-soft text-dark">
      <Navbar />
      <main className="min-w-0 flex-1">
        {isAdminPath ? (
          <Outlet />
        ) : (
          <Suspense fallback={<CustomerContentFallback />}>
            <motion.div
              {...pageTransition}
              className="min-w-0"
              key={location.pathname}
            >
              <Outlet />
            </motion.div>
          </Suspense>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
