import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import { paymentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import useDocuments from '../../hooks/useDocuments';
import { formatCurrency } from '../../utils/helpers';
import Button from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Skeleton';

/**
 * Landing page after the Paystack checkout. The reference in the URL is
 * verified by the server (never trusted from the browser) before showing success.
 */
const PaymentCallback = () => {
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');
  const [state, setState] = useState({ status: 'verifying', payment: null, message: '' });
  const documents = useDocuments();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // verify once, even under React StrictMode
    started.current = true;
    if (!reference) {
      setState({ status: 'failed', payment: null, message: 'No payment reference was provided.' });
      return;
    }
    paymentService.verify(reference)
      .then(({ data }) => setState({ status: 'success', payment: data, message: '' }))
      .catch((error) => setState({ status: 'failed', payment: null, message: getErrorMessage(error, 'We could not confirm your payment.') }));
  }, [reference]);

  return (
    <section className="container-page py-20 max-w-xl">
      <div className="card text-center !p-10">
        {state.status === 'verifying' && (
          <>
            <Spinner size="lg" />
            <h1 className="text-2xl font-bold text-gray-900 mt-6">Confirming your payment...</h1>
            <p className="text-gray-500 mt-2">Please do not close this page.</p>
          </>
        )}

        {state.status === 'success' && (
          <>
            <HiOutlineCheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Payment successful</h1>
            <p className="text-gray-500 mt-2">
              We received {formatCurrency(state.payment.amount)} for booking{' '}
              <span className="font-medium text-gray-700">{state.payment.appointment?.reference}</span>. Your appointment is confirmed
              and a receipt has been emailed to you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/my-bookings" className="btn-primary">View My Bookings</Link>
              <Button variant="secondary" loading={documents.busyId === state.payment.id} onClick={() => documents.downloadReceipt(state.payment)}>
                Download Receipt
              </Button>
            </div>
          </>
        )}

        {state.status === 'failed' && (
          <>
            <HiOutlineXCircle className="w-20 h-20 text-red-500 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Payment not completed</h1>
            <p className="text-gray-500 mt-2">{state.message}</p>
            <p className="text-gray-500 mt-2">Your booking is still saved. You can try again or pay at the salon.</p>
            <Link to="/my-bookings" className="btn-primary mt-8">Go to My Bookings</Link>
          </>
        )}
      </div>
    </section>
  );
};

export default PaymentCallback;
