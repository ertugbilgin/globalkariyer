import React, { useState } from 'react';
import { X, Check, Lock, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentModal = ({ onClose, onSuccess, price = "4.99" }) => {
    const { t } = useTranslation();
    const [processing, setProcessing] = useState(false);

    const handlePay = () => {
        setProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setProcessing(false);
            onSuccess();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        {t('payment.unlock_title', 'Unlock Your CV')}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-slate-600 mb-4">
                            {t('payment.description', 'Get your ATS-optimized, professionally formatted CV now.')}
                        </p>
                        <div className="text-4xl font-black text-slate-900 mb-1">
                            ${price}
                        </div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                            {t('payment.one_time', 'One-time payment')}
                        </p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <li className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            {t('payment.feature_docx', 'Download editable .docx file')}
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            {t('payment.feature_ats', 'ATS Optimization applied')}
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            {t('payment.feature_format', 'Professional formatting')}
                        </li>
                    </ul>

                    {/* Mock Card Form */}
                    <div className="space-y-3 opacity-50 pointer-events-none select-none grayscale" aria-hidden="true">
                        <div className="h-10 bg-slate-100 rounded border border-slate-200 w-full"></div>
                        <div className="flex gap-3">
                            <div className="h-10 bg-slate-100 rounded border border-slate-200 w-1/2"></div>
                            <div className="h-10 bg-slate-100 rounded border border-slate-200 w-1/2"></div>
                        </div>
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t('payment.processing', 'Processing...')}
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                {t('payment.pay_button', 'Pay & Download')}
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-center text-slate-400">
                        {t('payment.secure_note', 'Secured by Lemon Squeezy. 100% Money-back guarantee.')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
