import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './routes/ProtectedRoute';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import { PageLoader } from './components/ui/Skeleton';

// Pages are code-split so visitors only download what they open.
const Home = lazy(() => import('./pages/customer/Home'));
const About = lazy(() => import('./pages/customer/About'));
const Services = lazy(() => import('./pages/customer/Services'));
const Gallery = lazy(() => import('./pages/customer/Gallery'));
const Stylists = lazy(() => import('./pages/customer/Stylists'));
const Pricing = lazy(() => import('./pages/customer/Pricing'));
const Reviews = lazy(() => import('./pages/customer/Reviews'));
const Contact = lazy(() => import('./pages/customer/Contact'));
const BookAppointment = lazy(() => import('./pages/customer/BookAppointment'));
const MyBookings = lazy(() => import('./pages/customer/MyBookings'));
const Profile = lazy(() => import('./pages/customer/Profile'));
const Settings = lazy(() => import('./pages/customer/Settings'));
const PaymentCallback = lazy(() => import('./pages/customer/PaymentCallback'));
const NotFound = lazy(() => import('./pages/customer/NotFound'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminAppointments = lazy(() => import('./pages/admin/AdminAppointments'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminEmployees = lazy(() => import('./pages/admin/AdminEmployees'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

const App = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Customer website */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/stylists" element={<Stylists />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/book" element={<BookAppointment />} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Authentication */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Admin dashboard */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  </Suspense>
);

export default App;
