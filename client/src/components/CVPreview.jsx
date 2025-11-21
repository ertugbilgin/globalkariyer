import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { LayoutTemplate, MapPin, Mail, Phone, Linkedin, Wand2 } from 'lucide-react';

const components = {
    mark: ({ node, ...props }) => (
        <span className="relative group cursor-help inline-block border-b-2 border-yellow-400 bg-yellow-100/10 px-0.5 rounded">
            <span {...props} />
            <span className="absolute hidden group-hover:block z-50 w-64 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-2xl -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 border border-slate-700/50 backdrop-blur-md">
                <span className="font-bold text-yellow-400 block mb-1.5 flex items-center gap-1.5 border-b border-slate-700 pb-1"><Wand2 className="w-3 h-3" /> AI İyileştirmesi</span>
                <span className="leading-relaxed text-slate-300">{props['data-reason']}</span>
            </span>
        </span>
    )
};

const getFontFamily = (fontName) => {
    const font = fontName || 'Inter';
    if (font.includes('Times')) return "'Times New Roman', serif";
    if (font.includes('Arial')) return "Arial, sans-serif";
    return "'Inter', sans-serif";
};

const CVPreview = ({ result, printRef }) => {
    return (
        <div className="lg:col-span-7 sticky top-24">
            <div className="bg-slate-800 rounded-t-xl p-3 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Önizleme</span>
            </div>

            {result.uiSuggestions?.fontReason?.tr && (
                <div className="bg-blue-900/20 border-x border-blue-500/20 p-3 flex items-start gap-3">
                    <Wand2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-200">
                        <span className="font-bold text-blue-400">Font Seçimi ({result.uiSuggestions.selectedFont}):</span> {result.uiSuggestions.fontReason.tr}
                    </div>
                </div>
            )}

            <div className="bg-slate-900/50 p-1 md:p-8 rounded-b-xl border border-slate-800 overflow-hidden">
                {/* Mobile Wrapper: Fixed height, full width, relative positioning */}
                <div className="relative w-full h-[340px] sm:h-[600px] md:h-[800px] lg:h-[1000px] overflow-hidden md:overflow-y-auto custom-scrollbar">
                    {/* CV Container: Scaled to fit different screens */}
                    <div ref={printRef} className="absolute top-0 left-1/2 -translate-x-1/2 origin-top transform transition-transform duration-300
                        scale-[0.4] 
                        sm:scale-[0.55] 
                        md:scale-[0.65] 
                        lg:scale-[0.8] 
                        xl:scale-[0.9] 
                        2xl:scale-100
                        bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl"
                        style={{ fontFamily: getFontFamily(result.uiSuggestions?.selectedFont), lineHeight: '1.5' }}>

                        <div className="border-b-2 border-slate-900 pb-6 mb-6">
                            <h1 className="text-4xl font-black uppercase tracking-wide text-slate-900">{result.contactInfo?.name || 'İsim'}</h1>
                            <div className="text-sm text-slate-600 mt-3 flex flex-wrap gap-x-6 gap-y-2 font-medium">
                                {result.contactInfo?.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-600" /> {result.contactInfo.location}</span>}
                                {result.contactInfo?.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-600" /> {result.contactInfo.email}</span>}
                                {result.contactInfo?.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-blue-600" /> {result.contactInfo.phone}</span>}
                                {result.contactInfo?.linkedin && <span className="flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn</span>}
                            </div>
                        </div>
                        <div className="prose prose-slate max-w-none 
                            prose-headings:uppercase prose-headings:font-bold prose-headings:text-blue-700 
                            prose-h2:border-b prose-h2:border-blue-200 prose-h2:pb-1 prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-lg
                            prose-h3:text-slate-800 prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-base
                            prose-h4:text-slate-700 prose-h4:italic prose-h4:text-sm
                            prose-p:text-sm prose-p:leading-relaxed prose-p:my-2 prose-p:text-slate-700 text-justify 
                            prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2 
                            prose-li:text-sm prose-li:marker:text-blue-600 prose-li:pl-1 prose-li:my-0.5 
                            prose-strong:font-bold prose-strong:text-slate-900">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]} components={components}>{result.optimizedCv}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVPreview;
