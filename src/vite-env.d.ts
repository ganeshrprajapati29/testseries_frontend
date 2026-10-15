/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API. Defaults to "/api" (same origin, proxied by Vite/Nginx). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

interface Window {
  Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };
}
