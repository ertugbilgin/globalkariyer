import React from 'react';
import { useTranslation } from 'react-i18next';

const HeroSection = () => {
    const { t } = useTranslation();

    return (
        <div className="text-center space-y-6 mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                {t('hero.title_part1')} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{t('hero.title_part2')}</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
                {t('hero.description')}
            </p>
        </div>
    );
};

export default HeroSection;
