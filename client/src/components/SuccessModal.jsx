import { CheckCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SuccessModal({ isOpen, onClose, feature, onOpenFeature }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const featureDetails = {
        cv_download: {
            icon: '📥',
            title: 'CV Download Unlocked!',
            description: 'Your optimized CV download is now ready.',
            buttonText: 'Download Now'
        },
        cover_letter: {
            icon: '✉️',
            title: 'Cover Letter Unlocked!',
            description: 'You now have access to AI-powered cover letter generation.',
            buttonText: 'Generate Cover Letter'
        },
        interview_prep: {
            icon: '🎯',
            title: 'Interview Prep Unlocked!',
            description: 'You now have access to personalized interview preparation.',
            buttonText: 'Start Practicing'
        },
        premium: {
            icon: '⭐',
            title: 'Welcome to Premium!',
            description: 'You now have unlimited access to all features.',
            buttonText: 'Explore Features'
        }
    };

    const details = featureDetails[feature] || featureDetails.premium;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl animate-scale-in p-8 text-center">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Success Icon */}
                <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>

                {/* Feature Icon */}
                <div className="text-5xl mb-4">{details.icon}</div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-3">
                    {t(`success.${feature}.title`, details.title)}
                </h2>

                {/* Description */}
                <p className="text-slate-400 mb-6">
                    {t(`success.${feature}.description`, details.description)}
                </p>

                {/* CTA Button */}
                <button
                    onClick={() => {
                        onClose();
                        if (onOpenFeature) {
                            onOpenFeature();
                        }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
                >
                    {t(`success.${feature}.button`, details.buttonText)}
                </button>

                {/* Secondary action */}
                <button
                    onClick={onClose}
                    className="mt-3 w-full text-sm text-slate-400 hover:text-white transition-colors"
                >
                    {t('success.later', 'I\'ll check it out later')}
                </button>
            </div>
        </div>
    );
}
