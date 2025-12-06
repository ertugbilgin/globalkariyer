const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Get analytics overview
const getAnalyticsOverview = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get today's stats
        const { data: todayStats } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('date', today)
            .single();

        // Get total revenue
        const { data: allTransactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('status', 'completed');

        const totalRevenue = allTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

        // Get user counts
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        const { count: premiumUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_premium', true);

        res.json({
            revenue: {
                total: totalRevenue,
                today: todayStats?.total_revenue || 0,
                formatted: `$${(totalRevenue / 100).toFixed(2)}`
            },
            users: {
                total: totalUsers || 0,
                premium: premiumUsers || 0,
                conversion: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0
            },
            transactions: {
                count: todayStats?.transaction_count || 0,
                avg_value: todayStats?.transaction_count > 0
                    ? Math.round(todayStats.total_revenue / todayStats.transaction_count)
                    : 0
            },
            analyses: {
                count: todayStats?.cv_analyses || 0,
                success_rate: todayStats?.success_rate || 0,
                avg_time: todayStats?.avg_analysis_time || 0,
                errors: todayStats?.error_count || 0
            }
        });
    } catch (error) {
        console.error('Analytics overview error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

// Get revenue breakdown
const getRevenueBreakdown = async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        const days = parseInt(period) || 7;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .eq('status', 'completed');

        const byProduct = transactions?.reduce((acc, tx) => {
            if (!acc[tx.product_type]) {
                acc[tx.product_type] = { count: 0, total: 0 };
            }
            acc[tx.product_type].count++;
            acc[tx.product_type].total += tx.amount;
            return acc;
        }, {}) || {};

        res.json({
            period: `${days} days`,
            by_product: byProduct,
            total: Object.values(byProduct).reduce((sum, p) => sum + p.total, 0)
        });
    } catch (error) {
        console.error('Revenue breakdown error:', error);
        res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
};

// Get transaction list
const getTransactions = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const { data, error, count } = await supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            transactions: data,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Transaction list error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};

// Get user stats
const getUserStats = async (req, res) => {
    try {
        const { data: users } = await supabase
            .from('users')
            .select('created_at, is_premium');

        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const newUsers = users?.filter(u => new Date(u.created_at) >= last30Days).length || 0;
        const premiumUsers = users?.filter(u => u.is_premium).length || 0;

        res.json({
            total: users?.length || 0,
            new_last_30d: newUsers,
            premium: premiumUsers,
            free: (users?.length || 0) - premiumUsers,
            conversion_rate: users?.length > 0 ? ((premiumUsers / users.length) * 100).toFixed(1) : 0
        });
    } catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
};

// Get performance metrics
const getPerformanceMetrics = async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        const days = parseInt(period) || 7;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: events } = await supabase
            .from('analytics_events')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .in('event_type', ['cv_analysis_success', 'cv_analysis_error']);

        const successEvents = events?.filter(e => e.event_type === 'cv_analysis_success') || [];
        const errorEvents = events?.filter(e => e.event_type === 'cv_analysis_error') || [];

        const totalAnalyses = events?.length || 0;
        const avgDuration = successEvents.length > 0
            ? successEvents.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) / successEvents.length
            : 0;

        res.json({
            period: `${days} days`,
            total_analyses: totalAnalyses,
            successful: successEvents.length,
            failed: errorEvents.length,
            success_rate: totalAnalyses > 0 ? ((successEvents.length / totalAnalyses) * 100).toFixed(1) : 0,
            avg_duration_ms: Math.round(avgDuration),
            errors_by_type: errorEvents.reduce((acc, e) => {
                const type = e.metadata?.error_type || 'unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Performance metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
};

module.exports = {
    getAnalyticsOverview,
    getRevenueBreakdown,
    getTransactions,
    getUserStats,
    getPerformanceMetrics
};
