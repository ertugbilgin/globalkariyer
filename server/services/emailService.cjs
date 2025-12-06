const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 587, // Changed from 465 to 587 (TLS)
  secure: false, // Changed from true - use TLS instead of SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  },
  connectionTimeout: 10000, // 10 seconds timeout
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Format product name for display
const formatProductName = (type) => {
  const names = {
    'cv_download': 'CV Download',
    'cover_letter': 'Cover Letter',
    'interview_prep': 'Interview Prep',
    'premium': 'Premium Subscription'
  };
  return names[type] || type;
};

// Send admin notification for new sales
const sendAdminNotification = async (type, data) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('⚠️ ADMIN_EMAIL not set, skipping notification');
    return;
  }

  let subject, html;

  if (type === 'new_sale') {
    const productName = formatProductName(data.product_type);
    subject = `💰 New Sale: ${productName} - $${data.amount}`;
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 30px; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
          .info { background: white; padding: 20px; border-radius: 6px; margin: 10px 0; }
          .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .value { color: #111827; font-size: 16px; font-weight: 600; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">💰 New Sale!</h2>
          </div>
          <div class="info">
            <div class="label">Customer</div>
            <div class="value">${data.email}</div>
          </div>
          <div class="info">
            <div class="label">Product</div>
            <div class="value">${productName}</div>
          </div>
          <div class="info">
            <div class="label">Amount</div>
            <div class="value">$${data.amount}</div>
          </div>
          <div class="info">
            <div class="label">Time</div>
            <div class="value">${new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' })}</div>
          </div>
          <div class="info">
            <div class="label">Session ID</div>
            <div class="value" style="font-size: 12px; color: #6b7280;">${data.stripe_session_id}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  try {
    const info = await transporter.sendMail({
      from: `"GoGlobalCV Admin" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: subject,
      html: html
    });
    console.log('✅ Admin notification sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    throw error;
  }
};

// Send welcome email to new premium users
const sendWelcomeEmail = async (email) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; background: #f9fafb; }
        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature { padding: 10px 0; display: flex; align-items: center; }
        .button { background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to Premium!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your subscription is now active</p>
        </div>
        <div class="content">
          <h2>Hi there! 👋</h2>
          <p>Thank you for upgrading to GoGlobalCV Premium! You now have full access to all our powerful features.</p>
          
          <div class="features">
            <h3 style="margin-top: 0;">What's included:</h3>
            <div class="feature">✅ Unlimited CV downloads</div>
            <div class="feature">✅ AI-powered cover letter generation</div>
            <div class="feature">✅ Interview preparation questions</div>
            <div class="feature">✅ Advanced job matching analysis</div>
            <div class="feature">✅ Priority support</div>
          </div>

          <p><strong>To get started:</strong></p>
          <p>Simply login to your account using this email address:</p>
          <p style="background: white; padding: 15px; border-radius: 6px; text-align: center; font-weight: 600;">${email}</p>
          <p>We'll send you a secure one-time code to verify your email.</p>

          <div style="text-align: center;">
            <a href="https://goglobalcv.com" class="button">Login Now →</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #6b7280;">
            <strong>Need help?</strong> Contact us at <a href="mailto:support@goglobalcv.com">support@goglobalcv.com</a>
          </p>
        </div>
        <div class="footer">
          © 2025 GoGlobalCV. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"GoGlobalCV" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to GoGlobalCV Premium! 🎉',
      html: html
    });
    console.log('✅ Welcome email sent to:', email);
    return info;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
};

// Send daily summary report
const sendDailySummary = async (period = 'morning') => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const isMorning = period === 'morning';
  const date = new Date();
  if (isMorning) {
    // Yesterday's data for morning report
    date.setDate(date.getDate() - 1);
  }

  const dateStr = date.toISOString().split('T')[0];

  // Fetch stats from Supabase
  const { data: stats } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('date', dateStr)
    .single();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('created_at', `${dateStr}T00:00:00`)
    .lt('created_at', `${dateStr}T23:59:59`);

  const revenue = ((stats?.total_revenue || 0) / 100).toFixed(2);
  const txCount = stats?.transaction_count || 0;
  const analyses = stats?.cv_analyses || 0;
  const avgTime = stats?.avg_analysis_time || 0;
  const successRate = stats?.success_rate || 0;
  const errorCount = stats?.error_count || 0;

  const subject = `${isMorning ? '🌅' : '🌙'} ${isMorning ? 'Morning' : 'Evening'} Report - ${dateStr}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 700px; margin: 0 auto; }
        .header { background: ${isMorning ? '#fbbf24' : '#6366f1'}; color: white; padding: 30px; border-radius: 8px; text-align: center; }
        .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .metric { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .metric-value { font-size: 28px; font-weight: bold; color: #111827; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 5px; }
        .performance { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${isMorning ? '🌅 Morning Report' : '🌙 Evening Report'}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${isMorning ? "Yesterday's" : "Today's (So Far)"} Performance</p>
        </div>

        <h2>${isMorning ? "Yesterday's" : "Today's"} Metrics</h2>
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">$${revenue}</div>
            <div class="metric-label">Revenue</div>
          </div>
          <div class="metric">
            <div class="metric-value">${txCount}</div>
            <div class="metric-label">Transactions</div>
          </div>
          <div class="metric">
            <div class="metric-value">${analyses}</div>
            <div class="metric-label">CV Analyses</div>
          </div>
          <div class="metric">
            <div class="metric-value">${transactions?.length || 0}</div>
            <div class="metric-label">Unique Customers</div>
          </div>
        </div>

        <div class="performance">
          <h3 style="margin-top: 0;">⚡ Analysis Performance</h3>
          <p><strong>Total Analyses:</strong> ${analyses}</p>
          <p><strong>Success Rate:</strong> ${successRate.toFixed(1)}% ${successRate >= 85 ? '✅' : '⚠️'}</p>
          <p><strong>Avg Response Time:</strong> ${(avgTime / 1000).toFixed(1)}s</p>
          <p><strong>Failed Analyses:</strong> ${errorCount} (${analyses > 0 ? ((errorCount / analyses) * 100).toFixed(1) : 0}%)</p>
        </div>

        ${transactions && transactions.length > 0 ? `
          <h3>Recent Transactions</h3>
          <ul>
            ${transactions.slice(0, 5).map(tx => `
              <li>${tx.email} - ${formatProductName(tx.product_type)} - $${(tx.amount / 100).toFixed(2)}</li>
            `).join('')}
          </ul>
        ` : '<p>No transactions today.</p>'}

        <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
          Report generated at ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' })}
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"GoGlobalCV Analytics" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: subject,
      html: html
    });
    console.log(`✅ ${period} summary sent:`, info.messageId);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send ${period} summary:`, error);
    throw error;
  }
};

module.exports = {
  sendAdminNotification,
  sendWelcomeEmail,
  sendDailySummary,
  transporter
};
