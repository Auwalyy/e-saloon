import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { paymentService } from '../services';
import { getErrorMessage } from '../services/api';
import { downloadBlob } from '../utils/helpers';

/**
 * Downloads receipt / invoice PDFs for a payment.
 * `busyId` identifies the payment currently downloading (for button spinners).
 */
const useDocuments = () => {
  const [busyId, setBusyId] = useState(null);

  const download = useCallback(async (type, payment) => {
    setBusyId(payment.id);
    try {
      const isReceipt = type === 'receipt';
      const blob = await (isReceipt ? paymentService.downloadReceipt(payment.id) : paymentService.downloadInvoice(payment.id));
      downloadBlob(blob, `${type}-${isReceipt ? payment.receiptNumber : payment.reference}.pdf`);
    } catch (error) {
      toast.error(getErrorMessage(error, `Unable to download the ${type}`));
    } finally {
      setBusyId(null);
    }
  }, []);

  return {
    busyId,
    downloadReceipt: (payment) => download('receipt', payment),
    downloadInvoice: (payment) => download('invoice', payment),
  };
};

export default useDocuments;
