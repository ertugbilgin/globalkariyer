import { Globe, FileText } from 'lucide-react';
import { isInAppBrowser } from '../lib/inAppBrowser';

const Header = ({ result, onDownload }) => {
    const handleDownloadClick = () => {
        if (isInAppBrowser()) {
            alert("⚠️ LinkedIn/Instagram tarayıcısı dosya indirmeyi engelleyebilir.\n\nLütfen sağ üstteki '...' menüsünden 'Tarayıcıda Aç' (Open in Browser) seçeneğini kullanın.");
            return;
        }
        onDownload();
    };

    return (
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                        <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-xl font-bold text-white tracking-tight">GlobalKariyer<span className="text-blue-400">.ai</span></h1>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Yurt Dışı Kariyer Asistanı</p>
                    </div>
                    <div className="sm:hidden">
                        <h1 className="text-lg font-bold text-white tracking-tight">GlobalKariyer<span className="text-blue-400">.ai</span></h1>
                    </div>
                </div>
                {result && (
                    <button onClick={handleDownloadClick} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20 hover:scale-105 text-sm whitespace-nowrap">
                        <FileText className="w-4 h-4" /> <span className="hidden sm:inline">CV İndir (.docx)</span><span className="sm:hidden">İndir</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
