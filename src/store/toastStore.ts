import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastState {
  toast: Toast;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: {
    message: '',
    type: 'info',
    visible: false,
  },
  showToast: (message, type = 'info') =>
    set({
      toast: { message, type, visible: true },
    }),
  hideToast: () =>
    set((state) => ({
      toast: { ...state.toast, visible: false },
    })),
}));
