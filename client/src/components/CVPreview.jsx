import React from 'react';
import { Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateDocxBlob } from '../lib/docxGenerator';
import { CvPreviewShell } from './CvPreviewShell';

const CVPreview = ({ result, printRef, onDownload, isPaid }) => {
    const { t } = useTranslation();

    // Helper to detect bullet points
    const isBulletParagraph = (text) => {
        return /^([•\-\*])\s+/.test(text) || text.trim().startsWith('•') || text.trim().startsWith('-');
    };

    const stripBullet = (text) => {
        return text.replace(/^([•\-\*])\s+/, "").trim();
    };

    // Helper to strip <mark> tags
    const stripMarkTags = (text) => {
        return text
            .replace(/<mark[^>]*>/g, "")  // opening tag
            .replace(/<\/mark>/g, "");    // closing tag
    };

    // Group paragraphs into <ul> blocks
    const renderParagraphBlocks = (text, isPaid) => {
        if (!text) return null;

        // Strip marks first
        const cleanText = stripMarkTags(text);

        const blocks = cleanText.split('\n').filter(line => line.trim().length > 0).map((line, index) => ({
            id: `p-${index}`,
            text: line.trim()
        }));

        const elements = [];
        let currentListItems = [];
        let bulletCount = 0;

        const flushList = () => {
            if (currentListItems.length > 0) {
                elements.push(
                    <ul key={`list-${elements.length}`}>
                        {currentListItems}
                    </ul>
                );
                currentListItems = [];
            }
        };

        blocks.forEach((block, index) => {
            // Check for Headers (## or ###)
            if (block.text.startsWith('##')) {
                flushList();
                const level = block.text.startsWith('###') ? 3 : 2;
                const content = block.text.replace(/^#+\s*/, '');

                if (level === 2) {
                    elements.push(
                        <h2 key={block.id}>{content}</h2>
                    );
                } else {
                    elements.push(
                        <p key={block.id} className="cv-role-title">{content}</p>
                    );
                }
            }
            // Check for Bullets
            else if (isBulletParagraph(block.text)) {
                const content = stripBullet(block.text);
                bulletCount++;

                // Blur logic: If not paid and bullet count > 3, blur it
                const shouldBlur = !isPaid && bulletCount > 3;
                const blurClass = shouldBlur ? "blur-[6px] select-none opacity-60" : "";

                // Handle bolding within bullets (**text**)
                const parts = content.split(/(\*\*.*?\*\*)/g);
                const formattedContent = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });

                currentListItems.push(
                    <li key={block.id} className={blurClass}>
                        {formattedContent}
                    </li>
                );
            }
            // Normal Paragraphs
            else {
                flushList();
                // Handle bolding within paragraphs
                const parts = block.text.split(/(\*\*.*?\*\*)/g);
                const formattedContent = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });

                elements.push(
                    <p key={block.id}>
                        {formattedContent}
                    </p>
                );
            }
        });

        flushList();
        return elements;
    };

    return (
        <div className="lg:col-span-7 sticky top-24 w-full overflow-hidden">
            <div className="panel-glass bg-slate-950/70 p-1 md:p-4 border border-slate-700/70 w-full overflow-hidden">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-500 px-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {t('preview')}
                </div>

                {result.uiSuggestions?.fontReason?.tr && (
                    <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded-xl mb-4 flex items-start gap-3 mx-2">
                        <Wand2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-200 break-words">
                            <span className="font-bold text-blue-400">Font Seçimi ({result.uiSuggestions.selectedFont}):</span> {result.uiSuggestions.fontReason.tr}
                        </div>
                    </div>
                )}

                <div className="rounded-2xl bg-slate-900/60 border border-slate-700/70 overflow-hidden shadow-inner w-full">
                    {/* Mobile Wrapper: Scrollable container for all screens */}
                    <div className={`relative w-full h-[500px] sm:h-[600px] md:h-[800px] lg:h-[1000px] ${isPaid ? 'overflow-y-auto' : 'overflow-hidden'} overflow-x-hidden custom-scrollbar bg-slate-900/50 flex justify-center lg:justify-start lg:pl-10`}>
                        {/* CV Container: Scaled to fit different screens */}
                        <div ref={printRef} className="origin-top lg:origin-top-left transform transition-transform duration-300
                        scale-[0.35] 
                        sm:scale-[0.45] 
                        md:scale-[0.55] 
                        lg:scale-[0.6] 
                        xl:scale-[0.75] 
                        2xl:scale-[0.85]
                        mb-10">
                            <CvPreviewShell>
                                <div className="relative overflow-hidden h-full">
                                    <div className={!isPaid ? "opacity-30 pointer-events-none select-none" : ""}>
                                        {/* Header Section */}
                                        <div>
                                            <h1>
                                                {result.contactInfo?.name || "AD SOYAD"}
                                            </h1>
                                            <p className="cv-contact-line">
                                                {[
                                                    result.contactInfo?.location,
                                                    result.contactInfo?.email,
                                                    result.contactInfo?.phone,
                                                    result.contactInfo?.linkedin
                                                ].filter(Boolean).join(' | ')}
                                            </p>
                                        </div>

                                        {/* Body Content */}
                                        <div className="relative">
                                            {renderParagraphBlocks(result.optimizedCv, isPaid)}
                                        </div>
                                    </div>

                                    {!isPaid && (
                                        <div className="absolute inset-0 flex items-start justify-center z-20 pt-48">
                                            <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl text-center max-w-sm mx-4 border border-white/50">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Your Optimized CV</h3>
                                                <p className="text-sm text-gray-600 mb-6">
                                                    Get full access to your AI-enhanced CV, download in DOCX format, and remove all watermarks.
                                                </p>
                                                <button
                                                    onClick={onDownload}
                                                    className="w-full py-3 px-6 bg-[#6A5BFF] hover:bg-[#5544FF] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25"
                                                >
                                                    Unlock full CV (.docx) – $4.99
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CvPreviewShell>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Download Button */}
            <div className="mt-4 flex justify-center lg:hidden">
                <button
                    onClick={onDownload}
                    className="
                            inline-flex items-center gap-2 rounded-xl 
                            bg-indigo-600 px-6 py-3 text-sm font-bold text-white 
                            shadow-lg shadow-indigo-500/20 
                            hover:bg-indigo-500 transition-all
                        "
                >
                    <Wand2 className="w-4 h-4" />
                    {t('header.download_cv', 'Download CV')}
                </button>
            </div>
        </div>
    );
};

export default CVPreview;
