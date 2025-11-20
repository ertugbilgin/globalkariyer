import React from 'react';

const HeroSection = () => {
    return (
        <div className="text-center space-y-6 mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                CV'niz Global Standartlara <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Hazır mı?</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Yapay zeka ile CV'nizi saniyeler içinde analiz edin, ATS skorunu öğrenin ve yurt dışı başvuruları için profesyonelce yeniden yazın.
            </p>
        </div>
    );
};

export default HeroSection;
