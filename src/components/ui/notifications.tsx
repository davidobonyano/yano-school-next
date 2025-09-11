"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

// ===== TOAST SYSTEM =====
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; onHide: (id: string) => void }> = ({ toasts, onHide }) => {
  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500 text-white border-green-600';
      case 'error': return 'bg-red-500 text-white border-red-600';
      case 'warning': return 'bg-yellow-500 text-white border-yellow-600';
      case 'info': return 'bg-blue-500 text-white border-blue-600';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return faCheckCircle;
      case 'error': return faExclamationTriangle;
      case 'warning': return faExclamationTriangle;
      case 'info': return faInfoCircle;
      default: return faInfoCircle;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 min-w-80 max-w-96 transform transition-all duration-300 ease-in-out`}
        >
          <FontAwesomeIcon icon={getIcon(toast.type)} className="flex-shrink-0" />
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onHide(toast.id)}
            className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

// ===== CONFIRMATION MODAL SYSTEM =====
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  loading = false,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case "danger":
        return "destructive" as const;
      case "warning":
        return "default" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={getTypeStyles()}>
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button onClick={onClose} variant="outline" disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm} 
            variant={getButtonVariant()}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===== ALERT MODAL (for critical errors) =====
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "error" | "warning" | "info";
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title = "Alert",
  message,
  type = "info",
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={getTypeStyles()}>
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} variant="default">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===== COMBINED HOOK =====
export const useNotifications = () => {
  const { showToast } = useToast();
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type?: "error" | "warning" | "info";
  }>({ isOpen: false, message: "" });

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
    loading?: boolean;
  }>({ 
    isOpen: false, 
    title: "", 
    message: "", 
    onConfirm: () => {} 
  });

  // Toast functions
  const showSuccessToast = (message: string) => showToast(message, 'success');
  const showErrorToast = (message: string) => showToast(message, 'error');
  const showWarningToast = (message: string) => showToast(message, 'warning');
  const showInfoToast = (message: string) => showToast(message, 'info');

  // Alert modal functions
  const showAlert = (message: string, title?: string, type?: "error" | "warning" | "info") => {
    setAlertModal({ isOpen: true, message, title, type });
  };

  const hideAlert = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  // Confirmation modal functions
  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: "danger" | "warning" | "info";
    }
  ) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      type: options?.type,
      loading: false,
    });
  };

  const hideConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  };

  const setConfirmationLoading = (loading: boolean) => {
    setConfirmationModal(prev => ({ ...prev, loading }));
  };

  return {
    // Toast functions
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    
    // Alert modal functions
    showAlert,
    hideAlert,
    
    // Confirmation modal functions
    showConfirmation,
    hideConfirmation,
    setConfirmationLoading,
    
    // Modal components
    AlertModal: () => (
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    ),
    ConfirmationModal: () => (
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={hideConfirmation}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
        type={confirmationModal.type}
        loading={confirmationModal.loading}
      />
    ),
  };
};

// Legacy hook for backward compatibility
export const useAlertModal = () => {
  const { showAlert, hideAlert, AlertModal } = useNotifications();
  return { showAlert, hideAlert, AlertModal };
};
