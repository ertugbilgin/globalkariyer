import React from 'react';

export function CvPreviewShell({ children }) {
    return (
        <div className="flex justify-center bg-slate-950/90 py-6 md:py-8">
            <div
                className="
          cv-page
          w-[780px]  /* yaklaşık A4 genişliği (px) */
          bg-white
          rounded-xl
          shadow-[0_24px_60px_rgba(15,23,42,0.65)]
          px-10
          py-10
          text-[13px]
          leading-relaxed
          text-slate-900
        "
            >
                {children}
            </div>
        </div>
    );
}
