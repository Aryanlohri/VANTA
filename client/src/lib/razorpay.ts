// ============================================
// Razorpay Checkout Helper
// ============================================

import { paymentApi } from './api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

/** Load Razorpay checkout script */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface CheckoutOptions {
  plan: 'pro' | 'team';
  billingCycle: 'monthly' | 'annual';
  userEmail?: string;
  userName?: string;
  onSuccess: (data: { plan: string; status: string; reviews_limit: number }) => void;
  onError: (error: string) => void;
}

/**
 * Opens Razorpay checkout modal for plan upgrade.
 */
export async function initiateCheckout({
  plan,
  billingCycle,
  userEmail,
  userName,
  onSuccess,
  onError,
}: CheckoutOptions): Promise<void> {
  // 1. Load Razorpay script
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onError('Failed to load payment gateway. Please try again.');
    return;
  }

  // 2. Create order on backend
  let orderData;
  try {
    const res = await paymentApi.createOrder({ plan, billing_cycle: billingCycle });
    orderData = res.data.data;
  } catch (err: any) {
    onError(err.response?.data?.error?.message || 'Failed to create payment order');
    return;
  }

  // 3. Open Razorpay checkout
  const options = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'VANTA',
    description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — ${billingCycle}`,
    order_id: orderData.order_id,
    prefill: {
      email: userEmail || '',
      name: userName || '',
    },
    theme: {
      color: '#898989',
      backdrop_color: 'rgba(3,3,3,0.85)',
    },
    handler: async (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      // 4. Verify payment on backend
      try {
        const verifyRes = await paymentApi.verifyPayment({
          ...response,
          plan,
          billing_cycle: billingCycle,
        });
        onSuccess(verifyRes.data.data);
      } catch (err: any) {
        onError(err.response?.data?.error?.message || 'Payment verification failed');
      }
    },
    modal: {
      ondismiss: () => {
        // User closed the modal without paying
      },
    },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.on('payment.failed', (response: any) => {
    onError(response.error?.description || 'Payment failed');
  });
  razorpay.open();
}
