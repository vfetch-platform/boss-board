type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastListener = (msg: string, type: ToastType) => void;

const listeners: ToastListener[] = [];

function emit(msg: string, type: ToastType) {
  listeners.forEach((fn) => fn(msg, type));
}

export const toast = {
  success: (msg: string) => emit(msg, 'success'),
  error: (msg: string) => emit(msg, 'error'),
  warning: (msg: string) => emit(msg, 'warning'),
  info: (msg: string) => emit(msg, 'info'),
};

export function subscribeToast(fn: ToastListener) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
