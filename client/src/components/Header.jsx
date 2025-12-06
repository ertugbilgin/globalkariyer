import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Menu, X, Globe, Wand2, MessageCircleQuestion, RotateCcw, LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { isInAppBrowser } from '../lib/inAppBrowser';
import { useTranslation } from 'react-i18next';
import LoginModal from './LoginModal';

const Header = ({ onDownload, result, onOpenCoverLetter, onOpenInterviewPrep, onReset, user, isPremium, onLoginSuccess, onLogout, isLoginModalOpen, setIsLoginModalOpen, onManageSubscription }) => {
    const { t, i18n } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleDownloadClick = () => {
        if (isInAppBrowser()) {
            alert(t('header.browser_alert'));
            return;
        }
        onDownload();
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <>
            <header className="sticky top-4 z-50 mb-6 px-2 md:px-0">
                <div
                    className="
                        mx-auto flex max-w-[95%] xl:max-w-7xl items-center justify-between
                        rounded-2xl border border-slate-800/80
                        bg-slate-900/70 backdrop-blur-xl
                        px-3 py-3 md:px-5 md:py-3.5
                        shadow-[0_12px_40px_rgba(15,23,42,0.9)]
                    "
                >
                    {/* LEFT SIDE: Logo + Action Buttons */}
                    <div className="flex items-center gap-4 lg:gap-6">
                        {/* Logo Group */}
                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                            <div
                                className="
                                    flex h-10 w-10 items-center justify-center rounded-2xl 
                                    bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-500
                                    shadow-[0_0_18px_rgba(79,70,229,0.7)]
                                "
                            >
                                <Globe className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white tracking-tight">
                                    GoGlobalCV<span className="text-indigo-300">.com</span>
                                </span>
                                <span className="hidden md:block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                                    {t('header.subtitle')}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons (Desktop) - Moved here next to logo */}
                        {result && (
                            <div className="hidden md:flex items-center gap-2 border-l border-slate-700/50 pl-4 lg:pl-6">
                                <button
                                    onClick={onOpenCoverLetter}
                                    className="
                                        inline-flex items-center gap-2 px-3 py-2 rounded-xl
                                        bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white
                                        border border-slate-700/50 hover:border-slate-600
                                        transition-all text-xs font-medium whitespace-nowrap
                                    "
                                >
                                    <Wand2 className="h-3.5 w-3.5 text-indigo-400" />
                                    {t('cover_letter.create_btn', 'Create Cover Letter')}
                                </button>

                                <button
                                    onClick={onOpenInterviewPrep}
                                    className="
                                        inline-flex items-center gap-2 px-3 py-2 rounded-xl
                                        bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white
                                        border border-slate-700/50 hover:border-slate-600
                                        transition-all text-xs font-medium whitespace-nowrap
                                    "
                                >
                                    <MessageCircleQuestion className="h-3.5 w-3.5 text-sky-400" />
                                    {t('header.interview_prep', 'Interview Prep')}
                                </button>

                                <button
                                    onClick={onReset}
                                    className="
                                        inline-flex items-center gap-2 px-3 py-2 rounded-xl
                                        bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white
                                        border border-slate-700/50 hover:border-slate-600
                                        transition-all text-xs font-medium whitespace-nowrap
                                    "
                                >
                                    <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                                    {t('dashboard.new_analysis', 'New Analysis')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE: Language + Profile */}
                    <div className="flex items-center gap-3 md:gap-4">

                        {/* Language Dropdown (Desktop) */}
                        <div className="hidden md:block">
                            <LanguageDropdown currentLang={i18n.language} onChange={changeLanguage} />
                        </div>

                        {/* Login / User Menu (Desktop) */}
                        <div className="hidden md:flex items-center border-l border-slate-700/50 pl-4">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end">
                                        {isPremium ? (
                                            <>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold shadow-sm shadow-amber-500/10">
                                                    <span className="text-sm">👑</span>
                                                    PREMIUM
                                                </div>
                                                <button
                                                    onClick={onManageSubscription}
                                                    className="text-[10px] text-slate-400 hover:text-white underline mt-1 transition-colors"
                                                >
                                                    Manage Subscription
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 text-xs font-medium">
                                                <User className="w-3.5 h-3.5" />
                                                {user.email}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={onLogout}
                                        className="text-slate-400 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5 ml-2"
                                        title="Sign Out"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="text-slate-300 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/50"
                                >
                                    <LogIn className="w-3.5 h-3.5" />
                                    Member Login
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-slate-400 hover:text-white"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-3 animate-fade-in-up z-50">
                        <div className="flex items-center justify-between rounded-xl bg-slate-800/50 p-2 border border-slate-700/50 mb-4">
                            <span className="text-xs text-slate-400 font-medium pl-2">Language:</span>
                            <div className="flex items-center gap-1">
                                <LangChip label="EN" active={i18n.language === 'en'} onClick={() => changeLanguage('en')} />
                                <LangChip label="CN" active={i18n.language === 'zh'} onClick={() => changeLanguage('zh')} />
                                <LangChip label="TR" active={i18n.language === 'tr'} onClick={() => changeLanguage('tr')} />
                            </div>
                        </div>

                        {/* Login Mobile */}
                        <div className="pb-4 border-b border-slate-700/50 mb-4">
                            {user ? (
                                <div className="space-y-3">
                                    <div className="text-center">
                                        {isPremium ? (
                                            <>
                                                <div className="inline-flex items-center justify-center gap-2 text-amber-400 text-sm font-bold bg-amber-500/10 py-2 px-4 rounded-lg border border-amber-500/20 mb-2">
                                                    <span className="text-lg">👑</span>
                                                    PREMIUM MEMBER
                                                </div>
                                                <button
                                                    onClick={() => { onManageSubscription(); setIsMobileMenuOpen(false); }}
                                                    className="block w-full text-center text-xs text-slate-400 hover:text-white underline py-1"
                                                >
                                                    Manage Subscription
                                                </button>
                                            </>
                                        ) : (
                                            <div className="inline-flex items-center justify-center gap-2 text-slate-400 text-sm font-medium py-2 px-4 mb-2">
                                                <User className="w-4 h-4" />
                                                {user.email}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 transition-colors font-medium"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Member Login
                                </button>
                            )}
                        </div>

                        {result && (
                            <>
                                <button
                                    onClick={() => { handleDownloadClick(); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    <FileText className="w-5 h-5" />
                                    <span className="font-medium">{t('header.download_cv', 'Download CV')}</span>
                                </button>

                                <button
                                    onClick={() => { onOpenCoverLetter(); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    <Wand2 className="w-5 h-5 text-indigo-400" />
                                    <span className="font-medium">{t('cover_letter.create_btn', 'Create Cover Letter')}</span>
                                </button>

                                <button
                                    onClick={() => { onOpenInterviewPrep(); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    <MessageCircleQuestion className="w-5 h-5 text-sky-400" />
                                    <span className="font-medium">{t('header.interview_prep', 'Interview Prep')}</span>
                                </button>

                                <button
                                    onClick={() => { onReset(); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    <RotateCcw className="w-5 h-5 text-amber-400" />
                                    <span className="font-medium">{t('dashboard.new_analysis', 'New Analysis')}</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </header>

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLoginSuccess={onLoginSuccess}
            />
        </>
    );
};

// New Dropdown Component
const LanguageDropdown = ({ currentLang, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'zh', label: '中文' },
        { code: 'tr', label: 'Türkçe' }
    ];

    const currentLabel = languages.find(l => l.code === (currentLang || 'en'))?.label || 'English';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
                    flex items-center gap-2 px-3 py-2 rounded-xl
                    bg-slate-800/50 hover:bg-slate-800 
                    border border-slate-700/50 hover:border-slate-600
                    text-slate-300 hover:text-white
                    text-xs font-medium transition-all
                "
            >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => { onChange(lang.code); setIsOpen(false); }}
                                className={`
                                    w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors
                                    ${currentLang === lang.code
                                        ? 'bg-indigo-500/10 text-indigo-400'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }
                                `}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const LangChip = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
            px-2.5 py-1 text-[10px] font-semibold rounded-full 
            transition-all
            ${active
                ? "bg-slate-100 text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
            }
        `}
    >
        {label}
    </button>
);

export default Header;
