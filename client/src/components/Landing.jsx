import { useTranslation, Trans } from 'react-i18next';

export default function Landing() {
    const { t } = useTranslation();

    return (
        <div className="w-full animate-fade-in-up">
            {/* Hero */}
            {/* Hero */}
            <section className="text-center py-12 px-4 md:py-20 md:px-6">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    {t('landing.hero.title_part1')} <span className="text-indigo-400 block md:inline">{t('landing.hero.title_part2')}</span>
                </h1>
                <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-8">
                    {t('landing.hero.subtitle_part1')}
                    <span className="text-indigo-300 font-semibold"> {t('landing.hero.job_match_score')}</span>{' '}
                    {t('landing.hero.subtitle_part2')}
                </p>

                <a
                    href="#upload"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3 md:px-8 md:py-4 rounded-xl shadow-lg transition transform hover:scale-105 inline-block text-sm md:text-base"
                >
                    {t('landing.hero.cta')}
                </a>

                <p className="text-slate-500 text-[10px] md:text-xs mt-4">
                    {t('landing.hero.privacy')}
                </p>
            </section>

            {/* 3-step explainer */}
            <section className="py-16 px-6 bg-slate-900/40 border-y border-slate-800">
                <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('landing.steps.1.title')}</h3>
                        <p className="text-slate-400 text-sm">
                            <Trans i18nKey="landing.steps.1.desc" components={[<strong className="text-indigo-400 font-semibold" />]} />
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('landing.steps.2.title')}</h3>
                        <p className="text-slate-400 text-sm">
                            <Trans i18nKey="landing.steps.2.desc" components={[<strong className="text-indigo-400 font-semibold" />]} />
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('landing.steps.3.title')}</h3>
                        <p className="text-slate-400 text-sm">
                            <Trans i18nKey="landing.steps.3.desc" components={[<strong className="text-indigo-400 font-semibold" />]} />
                        </p>
                    </div>
                </div>
            </section>

            {/* Job Match highlight */}
            <section className="py-20 px-6 text-center max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">{t('landing.jobmatch.title')}</h2>
                <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
                    {t('landing.jobmatch.desc')}
                </p>

                <div className="grid md:grid-cols-3 gap-6 text-left">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-indigo-300 font-semibold mb-2">{t('landing.jobmatch.item1.title')}</h3>
                        <p className="text-slate-400 text-sm">{t('landing.jobmatch.item1.desc')}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-indigo-300 font-semibold mb-2">{t('landing.jobmatch.item2.title')}</h3>
                        <p className="text-slate-400 text-sm">{t('landing.jobmatch.item2.desc')}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-indigo-300 font-semibold mb-2">{t('landing.jobmatch.item3.title')}</h3>
                        <p className="text-slate-400 text-sm">{t('landing.jobmatch.item3.desc')}</p>
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section className="py-16 px-6 bg-slate-900/40 border-y border-slate-800 text-center">
                <h3 className="text-xl font-bold text-white mb-4">{t('landing.trust.title')}</h3>
                <p className="text-slate-400 max-w-xl mx-auto text-sm">
                    {t('landing.trust.desc')}
                </p>
            </section>
        </div>
    );
}
