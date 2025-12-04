# 🍋 Lemon Squeezy Integration Roadmap for GoGlobalCV

This guide outlines the step-by-step process to integrate Lemon Squeezy as your payment provider, replacing or working alongside Stripe. Since you have already applied, here is what you need to do next.

## 📋 Phase 1: Dashboard Configuration

Before writing code, you need to set up your store and products in the Lemon Squeezy Dashboard.

### 1. Get Your API Credentials
1.  Go to **Settings** > **API**.
2.  Click **"Generate API Key"**.
    *   Name it `GoGlobalCV Server`.
    *   **Copy this key immediately**; you won't see it again.
3.  Go to **Settings** > **General**.
    *   Copy your **Store ID** (it's usually a number next to your store name).

### 2. Create Your Products
You need to create 4 distinct products (or variants) in Lemon Squeezy.

| Product Name | Type | Price | Notes |
| :--- | :--- | :--- | :--- |
| **Optimized CV Download** | Standard (One-time) | $4.99 | Enable "Generate License Keys" if you want to use keys, but usually not needed for simple downloads. |
| **Single Cover Letter** | Standard (One-time) | $3.99 | |
| **Interview Prep Kit** | Standard (One-time) | $6.99 | |
| **GoGlobalCV Premium** | Subscription | $9.99/mo | Add a **Variant** for Yearly billing ($39.99/yr). |

**Important:** After creating each product, copy the **Variant ID** for each price point. You will need these in your code.

---

## 💻 Phase 2: Backend Integration (Node.js)

### 1. Install the SDK
Lemon Squeezy has an official Node.js SDK which makes things easier.

```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

### 2. Update Environment Variables (`server/.env`)
Add these new variables:

```env
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=create_a_random_string_here

# Product Variant IDs (Get these from your dashboard)
VARIANT_ID_CV=12345
VARIANT_ID_COVER_LETTER=67890
VARIANT_ID_INTERVIEW=11223
VARIANT_ID_PREMIUM_MONTHLY=44556
VARIANT_ID_PREMIUM_YEARLY=77889
```

### 3. Create the Controller (`lemonController.cjs`)
You will create a new controller to handle checkout creation.

```javascript
const { lemonSqueezySetup, createCheckout } = require('@lemonsqueezy/lemonsqueezy.js');

// Initialize
lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
    onError: (error) => console.error("Lemon Squeezy Error:", error),
});

const createLemonCheckout = async (req, res) => {
    const { variantId, redirectUrl } = req.body;

    try {
        const checkout = await createCheckout(
            process.env.LEMONSQUEEZY_STORE_ID,
            variantId,
            {
                checkoutOptions: {
                    embed: true, // Use false for full page redirect
                    media: false,
                    logo: true,
                },
                checkoutData: {
                    // Pass custom data to identify the user/product in webhooks
                    custom: {
                        user_id: "guest_123", // Replace with real user ID if you have auth
                    },
                },
                productOptions: {
                    redirectUrl: redirectUrl || process.env.FRONTEND_URL + '/success',
                }
            }
        );

        res.json({ url: checkout.data.data.attributes.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Checkout creation failed" });
    }
};

module.exports = { createLemonCheckout };
```

### 4. Setup Webhooks (Crucial)
Unlike Stripe where we just redirected, Lemon Squeezy processes payments asynchronously. You **must** set up a webhook to know when a payment is successful so you can unlock the feature.

1.  Create a route `/api/webhook` in your server.
2.  Verify the signature using `LEMONSQUEEZY_WEBHOOK_SECRET`.
3.  Listen for `order_created` or `subscription_created` events.

---

## 🎨 Phase 3: Frontend Integration

### 1. Lemon.js Script
Add this to your `index.html` to enable the overlay checkout (optional but recommended for better UX).

```html
<script src="https://app.lemonsqueezy.com/js/lemon.js" defer></script>
```

### 2. Update `PaywallModal.jsx`
Modify the `handlePurchase` function to point to your new Lemon Squeezy endpoint.

```javascript
const handlePurchase = async (variantId) => {
    // ...
    const res = await fetch('/api/create-lemon-checkout', {
        method: 'POST',
        body: JSON.stringify({ variantId })
    });
    const data = await res.json();
    
    // If using Overlay
    window.createLemonSqueezy(); // Initialize
    LemonSqueezy.Url.Open(data.url);
};
```

---

## 🚀 Phase 4: Go Live Checklist

1.  [ ] **Test Mode:** In Lemon Squeezy Settings, keep "Test Mode" ON. Use the test card numbers provided in their docs to simulate payments.
2.  [ ] **Webhook Testing:** Use a tool like Ngrok to expose your local server (`ngrok http 5001`) and add that URL to Lemon Squeezy Webhooks settings to test if your server receives the "Success" signal.
3.  [ ] **Payout Settings:** In Lemon Squeezy, set up your bank account (Payouts) so you can get paid.
4.  [ ] **Go Live:** Once tested, switch the toggle to "Live" in the dashboard.

## 💡 Why Lemon Squeezy?
*   **Merchant of Record:** They handle global taxes (VAT/GST) for you. This is huge for a global product like GoGlobalCV.
*   **No Invoice Headache:** They generate compliant invoices for your customers.
*   **Simpler API:** Easier to set up than Stripe for digital products.
