import { Link } from 'react-router-dom';

/** Shown for any address that does not match a route. */
const NotFound = () => (
  <section className="container-page py-28 text-center">
    <p className="text-7xl font-serif font-bold text-gold-500">404</p>
    <h1 className="text-3xl font-bold text-gray-900 mt-4">Page not found</h1>
    <p className="text-gray-500 mt-3 max-w-md mx-auto">
      The page you are looking for may have been moved or no longer exists.
    </p>
    <div className="mt-8 flex justify-center gap-4 flex-wrap">
      <Link to="/" className="btn-primary">Back to Home</Link>
      <Link to="/services" className="btn-secondary">Browse Services</Link>
    </div>
  </section>
);

export default NotFound;
