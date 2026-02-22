import api from '../api/client';
import toast from 'react-hot-toast';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Open Razorpay for a mock test purchase.
 * onSuccess callback is called after payment is verified.
 */
export const displayRazorpayMockTest = async (testId, user, onSuccess) => {
  try {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Razorpay SDK failed to load. Check your connection.');
      return false;
    }

    const { data } = await api.post(`/mock-tests/${testId}/create-order`);
    const order = data.data;

    const options = {
      key: order.keyId,
      amount: order.amount * 100,
      currency: order.currency,
      name: 'LMS Platform',
      description: order.testName,
      order_id: order.orderId,
      prefill: { name: order.studentName, email: order.studentEmail },
      theme: { color: '#6366f1' },
      handler: async (response) => {
        try {
          const verifyRes = await api.post('/mock-tests/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            mockTestId: testId,
          });
          if (verifyRes.data.success) {
            toast.success('Payment successful! Starting test...');
            onSuccess && onSuccess();
          }
        } catch {
          toast.error('Payment verification failed. Please contact support.');
        }
      },
      modal: { ondismiss: () => toast.error('Payment cancelled') },
    };

    new window.Razorpay(options).open();
    return true;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to initiate payment');
    return false;
  }
};