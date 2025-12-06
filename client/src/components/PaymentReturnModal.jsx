import { useState, useEffect } from 'react';
import { XCircle, CheckCircle, AlertCircle, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentReturnModal({ type, isOpen, onClose, onRetry }) {
    const [autoCloseTimer, setAutoCloseTimer] = useState(null);

    useEffect(() => {
        if (isOpen && type === 'success') {
            // Auto-close success after 3 seconds
            const timer = setTimeout(() => {
                onClose?.();
            }, 3000);
            setAutoCloseTimer(timer);
            return () => clearTimeout(timer);
        }
    }, [isOpen, type, onClose]);

    if (!isOpen) return null;

    const configs = {
        success: {
            icon: CheckCircle,
            iconColor: 'text-emerald-400',
            bgGradient: 'from-emerald-500/20 to-sky-500/20',
            borderColor: 'border-emerald-500/30',
            title: 'Payment Successful! 🎉',
            message: 'Your purchase has been completed. All features are now unlocked!',
            primaryButton: { text: 'Continue', action: onClose }
        },
        cancelled: {
            icon: AlertCircle,
            iconColor: 'text-amber-400',
            bgGradient: 'from-amber-500/20 to-orange-500/20',
            borderColor: 'border-amber-500/30',
            title: 'Payment Cancelled',
            message: "No worries - your analysis is still here! You can upgrade anytime to unlock all features.",
            primaryButton: { text: 'Continue Analyzing', action: onClose },
            secondaryButton: { text: 'Try Again', action: onRetry }
        },
        failed: {
            icon: XCircle,
            iconColor: 'text-red-400',
            bgGradient: 'from-red-500/20 to-pink-500/20',
            borderColor: 'border-red-500/30',
            title: 'Payment Failed',
            message: 'Something went wrong with your payment. Please try again or contact support if the issue persists.',
            primaryButton: { text: 'Try Again', action: onRetry },
            secondaryButton: { text: 'Contact Support', action: () => window.location.href = 'mailto:support@goglobalcv.com' }
        }
    };

    const config = configs[type] || configs.cancelled;
    const Icon = config.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className={`relative w-full max-w-md bg-gradient-to-br ${config.bgGradient} backdrop-blur-xl rounded-3xl border ${config.borderColor} shadow-2xl p-8`}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="flex justify-center mb-6"
                    >
                        <div className={`p-4 rounded-full bg-slate-900/50 ${config.iconColor}`}>
                            <Icon className="w-12 h-12" strokeWidth={2} />
                        </div>
                    </motion.div>

                    {/* Content */}
                    <div className="text-center space-y-4 mb-8">
                        <h2 className="text-2xl font-bold text-white">
                            {config.title}
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            {config.message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={config.primaryButton.action}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                        >
                            {config.primaryButton.text}
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        {config.secondaryButton && (
                            <button
                                onClick={config.secondaryButton.action}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 border border-slate-700 transition-colors"
                            >
                                {config.secondaryButton.text}
                            </button>
                        )}
                    </div>

                    {/* Auto-close indicator for success */}
                    {type === 'success' && (
                        <p className="text-xs text-slate-500 text-center mt-4">
                            Closing automatically in 3 seconds...
                        </p>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
