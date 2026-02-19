import api from '../api/client';
import toast from 'react-hot-toast';

/**
 * Load Razorpay script
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Display Razorpay payment modal
 */
export const displayRazorpay = async (courseId, user) => {
  try {
    // Load Razorpay script
    const res = await loadRazorpayScript();

    if (!res) {
      toast.error('Razorpay SDK failed to load. Please check your connection.');
      return false;
    }

    // Create order on backend
    const { data } = await api.post(`/enrollment/create-order/${courseId}`);

    const options = {
      key: data.data.keyId,
      amount: data.data.amount * 100,
      currency: data.data.currency,
      name: 'LMS Platform',
      description: data.data.courseName,
      order_id: data.data.orderId,
      prefill: {
        name: data.data.studentName,
        email: data.data.studentEmail,
      },
      theme: {
        color: '#6366f1',
      },
      handler: async function (response) {
        try {
          // Verify payment on backend
          const verifyResponse = await api.post('/enrollment/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            courseId: courseId,
          });

          if (verifyResponse.data.success) {
            toast.success('🎉 Payment successful! You are now enrolled!');
            // Redirect to course page or dashboard
            window.location.href = `/learning/${courseId}`;
          }
        } catch (error) {
          toast.error('Payment verification failed. Please contact support.');
          console.error(error);
        }
      },
      modal: {
        ondismiss: function () {
          toast.error('Payment cancelled');
        },
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    return true;
  } catch (error) {
    console.error('Payment error:', error);
    toast.error(error.response?.data?.message || 'Failed to initiate payment');
    return false;
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate discount percentage
 */
export const calculateDiscount = (originalPrice, discountPrice) => {
  if (!discountPrice || discountPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
};

/**
 * Check if discount is valid
 */
export const isDiscountValid = (discountValidTill) => {
  if (!discountValidTill) return false;
  return new Date(discountValidTill) >= new Date();
};