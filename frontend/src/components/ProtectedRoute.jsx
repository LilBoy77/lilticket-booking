import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

function ProtectedRoute({ children, redirectTo = "/", requiredRole }) {
  const location = useLocation();
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <section className="container-page py-16">
        <div className="surface-card p-8 text-center text-sm font-semibold text-muted">
          Memeriksa sesi...
        </div>
      </section>
    );
  }

  if (!user) {
    return <Navigate replace state={{ from: `${location.pathname}${location.search}` }} to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate replace to={redirectTo} />;
  }

  return children;
}

export default ProtectedRoute;
