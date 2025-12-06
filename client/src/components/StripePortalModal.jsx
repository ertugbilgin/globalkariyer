import React from 'react';
import { Loader2 } from 'lucide-react';

const StripePortalModal = ({ isOpen }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Redirecting to Stripe
                </h3>

                <p className="text-slate-600 text-sm">
                    Please wait while we securely transfer you to the customer portal to manage your subscription...
                </p>

                <div className="mt-6 text-xs text-slate-400">
                    You will be redirected automatically
                </div>
            </div>
        </div>
    );
};

export default StripePortalModal;
