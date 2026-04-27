const PAYMENT_COMPLETION_SIGNAL_KEY = 'flowspot:payment-completed-at';
const PAYMENT_COMPLETION_CHANNEL = 'flowspot-payment-status';
const PAYMENT_COMPLETION_TTL_MS = 15 * 60 * 1000;

type PaymentCompletionMessage = {
  type: 'payment-completed';
  at: number;
};

function getNow() {
  return Date.now();
}

export function emitPaymentCompletionSignal() {
  if (typeof window === 'undefined') {
    return;
  }

  const at = getNow();
  window.localStorage.setItem(PAYMENT_COMPLETION_SIGNAL_KEY, String(at));

  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(PAYMENT_COMPLETION_CHANNEL);
    channel.postMessage({ type: 'payment-completed', at } satisfies PaymentCompletionMessage);
    channel.close();
  }
}

export function hasRecentPaymentCompletionSignal() {
  if (typeof window === 'undefined') {
    return false;
  }

  const raw = window.localStorage.getItem(PAYMENT_COMPLETION_SIGNAL_KEY);
  if (!raw) {
    return false;
  }

  const at = Number(raw);
  if (!Number.isFinite(at)) {
    window.localStorage.removeItem(PAYMENT_COMPLETION_SIGNAL_KEY);
    return false;
  }

  if (getNow() - at > PAYMENT_COMPLETION_TTL_MS) {
    window.localStorage.removeItem(PAYMENT_COMPLETION_SIGNAL_KEY);
    return false;
  }

  return true;
}

export function subscribeToPaymentCompletionSignal(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === PAYMENT_COMPLETION_SIGNAL_KEY && event.newValue) {
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);

  let channel: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel(PAYMENT_COMPLETION_CHANNEL);
    channel.onmessage = (event: MessageEvent<PaymentCompletionMessage>) => {
      if (event.data?.type === 'payment-completed') {
        callback();
      }
    };
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    channel?.close();
  };
}
