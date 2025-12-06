import { X, Check } from "lucide-react";
import { useState } from "react";

export default function PaywallModal({ isOpen, onClose, feature, result, jobDesc, onLogin }) {
    const [loading, setLoading] = useState(false);
    const [loadingTarget, setLoadingTarget] = useState(null); // hangi buton için loading

    if (!isOpen) return null;

    // Common Premium Benefits for reuse
    const commonPremiumBenefits = [
        "Unlimited interview prep kits",
        "Unlimited AI cover letters",
        "Unlimited CV optimizations & downloads",
        "Unlimited Job Match reports",
        "Priority AI processing",
        "New features included at no extra cost"
    ];

    const features = {
        cv: {
            title: "Unlock Your Optimized CV",
            subtitle: "Download your fully rewritten, ATS-optimized CV or go Premium for unlimited access.",
            singleTitle: "Optimized CV Download",
            singlePrice: "$4.99",
            premiumPrice: "$9.99 / month",
            endpoint: "/pay/cv-download",
            singleBenefits: [
                "Passed through 90% of ATS systems",
                "Fully rewritten with impact-driven English",
                "Delivered in editable DOCX format",
                "Optimized specifically for this role"
            ],
            premiumBenefits: commonPremiumBenefits
        },
        cover_letter: {
            title: "Create a Tailored Cover Letter",
            subtitle: "Get a professional cover letter for this job or go Premium for unlimited generation.",
            singleTitle: "Single Cover Letter",
            singlePrice: "$3.99",
            premiumPrice: "$9.99 / month",
            endpoint: "/pay/cover-letter",
            singleBenefits: [
                "Fully personalized cover letter",
                "Uses your optimized CV + job description",
                "Professional English tone (ATS-friendly)",
                "Ready-to-send DOCX format"
            ],
            premiumBenefits: commonPremiumBenefits
        },
        interview_prep: {
            title: "Unlock Your Interview Prep Options",
            subtitle: "Choose a one-time kit for this job or go Premium for unlimited interview prep, cover letters, and CV optimizations.",
            singleTitle: "Interview Prep Kit for this job",
            singlePrice: "$6.99",
            premiumPrice: "$9.99 / month",
            endpoint: "/pay/interview-prep",
            singleBenefits: [
                "20+ job-specific interview questions",
                "STAR-format answer samples",
                "Behavioral + technical questions",
                "Recruiter-style guidance",
                "Downloadable DOCX file"
            ],
            premiumBenefits: commonPremiumBenefits
        },
        premium: {
            // Premium direct purchase (e.g. from header)
            title: "GoGlobalCV Premium",
            subtitle: "Your all-in-one AI career toolkit — unlimited everything.",
            price: "$9.99 / month",
            microcopy: "Cancel anytime from your Billing page.",
            endpoint: "/pay/premium",
            buttonText: "Start Premium",
            benefits: commonPremiumBenefits,
            isPremium: true
        }
    };

    const content = features[feature] || features.cv;

    const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === "true";

    const handlePurchase = async (endpoint, billingType = "monthly", targetKey = "primary") => {
        if (!paymentsEnabled) {
            alert("Payments are coming soon! You'll be able to purchase this feature after launch.");
            return;
        }

        setLoading(true);
        setLoadingTarget(targetKey);
        try {
            // Save analysis state to sessionStorage BEFORE redirect
            // This allows user to return to their analysis results after payment
            if (result) {
                sessionStorage.setItem('temp_analysis', JSON.stringify(result));
            }
            if (jobDesc) {
                sessionStorage.setItem('temp_job_desc', jobDesc);
            }

            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
            const body =
                billingType === "yearly"
                    ? { billing: "yearly" }
                    : billingType === "one_time"
                        ? { billing: "one_time" }
                        : {};

            const res = await fetch(`${apiUrl}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Payment init failed", error);
        } finally {
            setLoading(false);
            setLoadingTarget(null);
        }
    };

    // ✳️ DUAL LAYOUT (CV, Cover Letter, Interview Prep)
    if (feature !== 'premium') {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="relative w-full max-w-[95vw] sm:max-w-3xl max-h-[95vh] sm:max-h-none overflow-y-auto bg-white rounded-2xl shadow-2xl animate-scale-in">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-50 bg-white rounded-full shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-3 sm:p-6 md:p-8 space-y-3 sm:space-y-6">
                        {/* Header */}
                        <div className="space-y-2 text-center">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                                {content.title}
                            </h2>
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
                                {content.subtitle}
                            </p>
                            {/* Mobile Top Login Link */}
                            <button
                                onClick={onLogin}
                                className="md:hidden text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline pt-1"
                            >
                                Already a member? Log In
                            </button>
                        </div>

                        {/* Two options */}
                        <div className="grid gap-2 sm:gap-4 md:grid-cols-2">
                            {/* Single Option */}
                            <div className="border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between bg-gray-50/60">
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="text-[10px] sm:text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                        Single Purchase
                                    </div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                        {content.singleTitle}
                                    </h3>
                                    <ul className="space-y-2 mt-2">
                                        {content.singleBenefits.map((b, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start gap-2 text-sm text-gray-700"
                                            >
                                                <Check className="w-4 h-4 text-purple-600 mt-[2px] shrink-0" />
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-4 sm:mt-5">
                                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                        {content.singlePrice}
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                                        One-time payment.
                                    </p>

                                    <button
                                        onClick={() =>
                                            handlePurchase(content.endpoint, "one_time", "single")
                                        }
                                        disabled={loading}
                                        className="mt-3 sm:mt-4 w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-[#6A5BFF] hover:bg-[#5544FF] text-white text-sm sm:text-base font-semibold rounded-lg shadow-md shadow-purple-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {paymentsEnabled
                                            ? (loading && loadingTarget === "single" ? "Processing..." : "Unlock Now")
                                            : "Coming Soon"}
                                    </button>
                                </div>
                            </div>

                            {/* Premium Option */}
                            <div className="border border-purple-300 rounded-xl p-4 sm:p-6 flex flex-col justify-between bg-gradient-to-b from-purple-50 to-white relative">
                                <div className="absolute -top-2 right-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-purple-600 text-[10px] sm:text-xs font-semibold text-white shadow-md">
                                    Most Popular
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="text-[10px] sm:text-xs font-semibold tracking-wide text-purple-600 uppercase">
                                        GoGlobalCV Premium
                                    </div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                        Unlimited Career Tools
                                    </h3>
                                    <ul className="space-y-2 mt-2">
                                        {content.premiumBenefits.map((b, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start gap-2 text-sm text-gray-700"
                                            >
                                                <Check className="w-4 h-4 text-purple-600 mt-[2px] shrink-0" />
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-4 sm:mt-5">
                                    <div className="text-xl sm:text-2xl font-bold text-purple-700">
                                        {content.premiumPrice}
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                                        Billed monthly. Cancel anytime.
                                    </p>

                                    <button
                                        onClick={() =>
                                            handlePurchase("/pay/premium", "monthly", "premium-monthly")
                                        }
                                        disabled={loading}
                                        className="mt-3 sm:mt-4 w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base font-semibold rounded-lg shadow-md shadow-purple-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {paymentsEnabled
                                            ? (loading && loadingTarget === "premium-monthly" ? "Processing..." : "Start Premium")
                                            : "Coming Soon"}
                                    </button>

                                    <button
                                        onClick={() =>
                                            handlePurchase("/pay/premium", "yearly", "premium-yearly")
                                        }
                                        disabled={loading}
                                        className="mt-2 w-full py-3 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {paymentsEnabled
                                            ? (loading && loadingTarget === "premium-yearly" ? "Processing..." : "Save 65% with Yearly ($39.99)")
                                            : "Coming Soon"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="text-[11px] text-center text-gray-400 mt-2">
                            You’ll be redirected to a secure checkout. You can manage or cancel your
                            Premium subscription anytime from your Billing page. No long-term
                            commitment.
                        </p>

                        <button
                            onClick={onClose}
                            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
                        >
                            Maybe later
                        </button>
                    </div>

                    {/* Login Link */}
                    <div className="px-8 pb-6 text-center">
                        <button
                            onClick={onLogin}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
                        >
                            Already a member? Log In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ✳️ SINGLE LAYOUT (Only for direct Premium purchase)
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 space-y-6">
                    {/* Header */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                            {content.title}
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {content.subtitle}
                        </p>
                        <button
                            onClick={onLogin}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline pt-1"
                        >
                            Already a member? Log In
                        </button>
                    </div>

                    {/* Benefits */}
                    <ul className="space-y-3">
                        {content.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                                <Check className="w-5 h-5 text-purple-600 shrink-0" />
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Price */}
                    <div className="text-center pt-2">
                        <div className="text-3xl font-bold text-purple-600">
                            {content.price}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            or{" "}
                            <span className="font-semibold text-purple-600">
                                $39.99 / year
                            </span>{" "}
                            (Save 65%)
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{content.microcopy}</p>
                    </div>

                    {/* CTA Button */}
                    <div className="space-y-3">
                        <button
                            onClick={() =>
                                handlePurchase(content.endpoint, "monthly", "primary")
                            }
                            disabled={loading}
                            className="w-full py-3.5 px-6 bg-[#6A5BFF] hover:bg-[#5544FF] text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {paymentsEnabled
                                ? (loading && loadingTarget === "primary" ? "Processing..." : content.buttonText)
                                : "Coming Soon"}
                        </button>

                        {/* Yearly Button */}
                        <button
                            onClick={() =>
                                handlePurchase(content.endpoint, "yearly", "yearly")
                            }
                            disabled={loading}
                            className="w-full py-3 px-6 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {paymentsEnabled
                                ? (loading && loadingTarget === "yearly" ? "Processing..." : "Upgrade to Yearly ($39.99)")
                                : "Coming Soon"}
                        </button>
                    </div>

                    <p className="text-[11px] text-center text-gray-400">
                        You’ll be redirected to a secure checkout. You can manage or cancel Premium
                        anytime from your Billing page.
                    </p>

                    {/* Cancel */}
                    <button
                        onClick={onClose}
                        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Maybe later
                    </button>

                    {/* Login Link */}
                    <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                        <button
                            onClick={onLogin}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
                        >
                            Already a member? Log In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
