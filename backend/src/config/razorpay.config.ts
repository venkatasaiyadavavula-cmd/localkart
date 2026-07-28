import Razorpay from 'razorpay';

let cachedInstance: Razorpay | null = null;

/** Lazily create Razorpay client so imports do not require credentials at module load. */
export function getRazorpayInstance(): Razorpay {
  if (!cachedInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error(
        'Razorpay is not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)',
      );
    }
    cachedInstance = new Razorpay({ key_id, key_secret });
  }
  return cachedInstance;
}

/** Test-only: clear cached client when env changes between tests. */
export function resetRazorpayInstanceForTests(): void {
  cachedInstance = null;
}

/** Default export: lazy proxy so existing `razorpayInstance.orders.create` call sites keep working. */
const razorpayLazy = new Proxy({} as Razorpay, {
  get(_target, prop, receiver) {
    const instance = getRazorpayInstance();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export default razorpayLazy;
