import { useState } from 'react'

export const toast = {
  _toasts: [],
  _listeners: [],
  
  addToast(toast) {
    this._toasts = [...this._toasts, toast]
    this._notifyListeners()
  },

  removeToast(id) {
    this._toasts = this._toasts.filter(toast => toast.id !== id)
    this._notifyListeners()
  },

  subscribe(listener) {
    this._listeners = [...this._listeners, listener]
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener)
    }
  },

  _notifyListeners() {
    this._listeners.forEach(listener => listener(this._toasts))
  }
}

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  useState(() => {
    const unsubscribe = toast.subscribe(setToasts);
    return () => unsubscribe();
  }, []);

  const showToast = (newToast) => {
    const id = Date.now();
    const toastData = {
      id,
      title: newToast.title,
      description: newToast.description,
      variant: newToast.variant || "default",
      duration: newToast.duration || 3000,
    };

    toast.addToast(toastData); // ✅ Use `toastData`, not `toast`

    if (toastData.duration > 0) {
      setTimeout(() => {
        toast.removeToast(id);
      }, toastData.duration);
    }
  };

  return { toasts, showToast };
};

export const ToastContainer = () => {
  const { toasts } = useToast()

  const variantStyles = {
    default: 'bg-white border border-gray-200',
    destructive: 'bg-red-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${variantStyles[toast.variant]} rounded-md shadow-lg p-4 min-w-[200px] transition-all duration-300`}
        >
          <div className="font-medium">{toast.title}</div>
          {toast.description && (
            <div className="text-sm mt-1">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  )
}
