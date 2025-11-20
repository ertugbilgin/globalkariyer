import React from 'react';
import { Upload, ArrowRight, TrendingUp, BarChart3, CheckSquare, CheckCircle, AlertCircle, Info } from 'lucide-react';

const SkillBar = ({ label, score, color }) => {
    const safeScore = Number(score) || 0;
    let barColor = "bg-blue-500";
    if (color.includes("purple")) barColor = "bg-purple-500";
    if (color.includes("amber")) barColor = "bg-amber-500";
    if (color.includes("emerald")) barColor = "bg-emerald-500";

    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold tracking-wide">{label}</span>
                <span className={`${color} font-bold`}>{safeScore}/10</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700/50 shadow-inner overflow-hidden">
                <div className={`h-full rounded-full ${barColor} shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-1000 ease-out`} style={{ width: `${Math.min(safeScore * 10, 100)}%` }}></div>
            </div>
        </div>
    );
};

const AnalysisDashboard = ({ result, onReset }) => {
    const currentScore = result?.scores?.current || 50;
    const potentialScore = result?.scores?.potential || 85;

    return (
        <div className="space-y-6 animate-fade-in">
            <button onClick={onReset} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700"><Upload className="w-4 h-4" /> Yeni Analiz</button>

            <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex flex-col items-center"><div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-slate-600 bg-slate-800"><span className="text-xl font-bold text-slate-400">{currentScore}</span></div><span className="text-[10px] uppercase font-bold text-slate-500 mt-2">Mevcut</span></div>
                    <ArrowRight className="w-6 h-6 text-slate-600" />
                    <div className="flex flex-col items-center"><div className="relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-emerald-500 bg-slate-800 shadow-lg shadow-emerald-500/20"><span className="text-3xl font-black text-white">{potentialScore}</span></div><span className="text-[10px] uppercase font-bold text-emerald-400 mt-2">Potansiyel</span></div>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-emerald-400 mb-1">Mülakat Şansınız: {result.scores?.interviewRate || "Yüksek"} 🚀</h4>
                        <p className="text-xs text-emerald-200/80 leading-relaxed">Sağ taraftaki optimize edilmiş CV ile şansınızı artırın.</p>
                    </div>
                </div>

                <div className="space-y-4 mb-6 bg-slate-900/40 p-5 rounded-xl border border-slate-700/50">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4"><BarChart3 className="w-3 h-3" /> ATS Detay Analizi</h4>
                    <SkillBar label="Bulunabilirlik (Searchability)" score={result.scores?.breakdown?.searchability} color="text-blue-400" />
                    <SkillBar label="Teknik Yetkinlik (Hard Skills)" score={result.scores?.breakdown?.hardSkills} color="text-purple-400" />
                    <SkillBar label="Sosyal Beceriler (Soft Skills)" score={result.scores?.breakdown?.softSkills} color="text-amber-400" />
                    <SkillBar label="ATS Formatı (Formatting)" score={result.scores?.breakdown?.formatting} color="text-emerald-400" />
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border-l-4 border-blue-500 text-sm text-slate-300 mb-2">
                    <strong className="block mb-1 text-blue-400 text-xs uppercase tracking-wider font-bold">Analiz Raporu</strong>
                    {result.summary?.tr}
                    <div className="mt-3 pt-3 border-t border-slate-700"><strong className="block mb-1 text-emerald-400 text-xs uppercase tracking-wider font-bold">🚀 Yapılan İyileştirmeler</strong><ul className="space-y-1">{result.summary?.improvements?.map((imp, i) => (<li key={i} className="flex items-start gap-2 text-xs text-slate-400"><span className="text-emerald-500 mt-0.5">•</span> {imp}</li>))}</ul></div>
                </div>
            </div>

            {result.atsModifications && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2 mb-4"><CheckSquare className="w-4 h-4" /> ATS Format Kontrolü</h3>
                    <ul className="space-y-2">
                        {result.atsModifications.map((item, i) => (
                            <li key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-800/50 transition-colors"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><div><p className="text-xs text-slate-300">{item.detail || item.action}</p></div></li>
                        ))}
                    </ul>
                </div>
            )}

            {result.missingKeywords?.length > 0 && (
                <div className="bg-amber-900/10 border border-amber-500/20 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-amber-400 uppercase mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Önerilen Anahtar Kelimeler</h3>
                    <div className="space-y-3">
                        {result.missingKeywords.map((item, i) => (
                            <div key={i} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-colors">
                                <div className="text-amber-200 font-bold text-sm mb-2">{item.keyword}</div>
                                <div className="text-xs text-emerald-300 bg-emerald-900/20 p-2 rounded mb-2 border border-emerald-500/20"><span className="font-bold">Örnek:</span> "{item.usageTip?.tr || item.usageTip}"</div>
                                <div className="flex items-start gap-1.5 mt-2 border-t border-slate-800 pt-2"><Info className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" /><p className="text-xs text-slate-400 font-medium">{item.benefit}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisDashboard;
