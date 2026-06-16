import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const AdminCheckIn = lazy(() => import("./pages/AdminCheckIn.jsx"));
const BookingTickets = lazy(() => import("./pages/BookingTickets.jsx"));
const EventDetail = lazy(() => import("./pages/EventDetail.jsx"));
const Events = lazy(() => import("./pages/Events.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const ManageBookings = lazy(() => import("./pages/ManageBookings.jsx"));
const ManageCategories = lazy(() => import("./pages/ManageCategories.jsx"));
const ManageEvents = lazy(() => import("./pages/ManageEvents.jsx"));
const ManageTicketTypes = lazy(() => import("./pages/ManageTicketTypes.jsx"));
const ManageVenues = lazy(() => import("./pages/ManageVenues.jsx"));
const MyTickets = lazy(() => import("./pages/MyTickets.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed.jsx"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const TicketDetail = lazy(() => import("./pages/TicketDetail.jsx"));

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute redirectTo="/dashboard" requiredRole="CUSTOMER">
                    <MyTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets/:ticketId"
                element={
                  <ProtectedRoute>
                    <TicketDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/:bookingId/tickets"
                element={
                  <ProtectedRoute>
                    <BookingTickets />
                  </ProtectedRoute>
                }
              />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failed" element={<PaymentFailed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="events" element={<ManageEvents />} />
                <Route path="categories" element={<ManageCategories />} />
                <Route path="venues" element={<ManageVenues />} />
                <Route path="ticket-types" element={<ManageTicketTypes />} />
                <Route path="bookings" element={<ManageBookings />} />
                <Route path="check-in" element={<AdminCheckIn />} />
              </Route>
              <Route path="/admin/*" element={<Navigate replace to="/dashboard" />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
