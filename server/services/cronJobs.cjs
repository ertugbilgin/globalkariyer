const cron = require('node-cron');
const { sendDailySummary } = require('./emailService.cjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Aggregate daily stats
const aggregateDailyStats = async (date) => {
    const dateStr = date === 'yesterday'
        ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : date;

    // Get transactions for the day
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lt('created_at', `${dateStr}T23:59:59`)
        .eq('status', 'completed');

    // Get analytics events
    const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lt('created_at', `${dateStr}T23:59:59`);

    // Calculate metrics
    const totalRevenue = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
    const transactionCount = transactions?.length || 0;

    const cvAnalyses = events?.filter(e => e.event_type === 'cv_analysis_success' || e.event_type === 'cv_analysis_error').length || 0;
    const successfulAnalyses = events?.filter(e => e.event_type === 'cv_analysis_success') || [];
    const errorCount = events?.filter(e => e.event_type === 'cv_analysis_error').length || 0;

    const avgAnalysisTime = successfulAnalyses.length > 0
        ? successfulAnalyses.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) / successfulAnalyses.length
        : 0;

    const success Rate = cvAnalyses > 0 ? ((cvAnalyses - errorCount) / cvAnalyses) * 100 : 0;

    // Upsert daily stats
    const { data, error } = await supabase
        .from('daily_stats')
        .upsert({
            date: dateStr,
            total_revenue: totalRevenue,
            transaction_count: transactionCount,
            cv_analyses: cvAnalyses,
            avg_analysis_time: Math.round(avgAnalysisTime),
            success_rate: parseFloat(successRate.toFixed(2)),
            error_count: errorCount,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'date'
        });

    if (error) {
        console.error('Failed to aggregate daily stats:', error);
        throw error;
    }

    console.log(`✅ Daily stats aggregated for ${dateStr}`);
    return data;
};

// Initialize cron jobs
const initCronJobs = () => {
    // Morning summary at 09:00 Amsterdam time
    cron.schedule('0 9 * * *', async () => {
        console.log('📅 Running morning summary job...');
        try {
            await aggregateDailyStats('yesterday');
            await sendDailySummary('morning');
        } catch (error) {
            console.error('Morning summary failed:', error);
        }
    }, {
        timezone: 'Europe/Amsterdam'
    });

    // Evening summary at 21:00 Amsterdam time
    cron.schedule('0 21 * * *', async () => {
        console.log('📅 Running evening summary job...');
        try {
            await sendDailySummary('evening');
        } catch (error) {
            console.error('Evening summary failed:', error);
        }
    }, {
        timezone: 'Europe/Amsterdam'
    });

    // Cleanup expired tokens daily at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('🧹 Cleaning up expired sessions...');
        try {
            const { data } = await supabase
                .from('user_sessions')
                .delete()
                .lt('expires_at', new Date().toISOString());
            console.log(`✅ Deleted ${data?.length || 0} expired sessions`);
        } catch (error) {
            console.error('Session cleanup failed:', error);
        }
    });

    console.log('✅ Cron jobs initialized');
    console.log('🌅 Morning summary scheduled for 09:00 Amsterdam time');
    console.log('🌙 Evening summary scheduled for 21:00 Amsterdam time');
};

module.exports = {
    initCronJobs,
    aggregateDailyStats
};
