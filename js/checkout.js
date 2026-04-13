// ============================================
// FitVocab — Checkout & Payment
// Razorpay + Cloudflare Coupon Validation
// ============================================

const RAZORPAY_KEY    = 'rzp_test_Sce7JWB11ne9mQ';
const COUPON_WORKER   = 'https://fitvocab-coupons.fitvocab.workers.dev/';
const BASE_PRICE      = 599;
const PRODUCT_NAME    = 'FitVocab Signature Tee — Charcoal Grey';

let selectedSize      = null;
let finalPrice        = BASE_PRICE;
let discountAmount    = 0;
let appliedCoupon     = null;
let lastPaymentData   = null;

// ── Size selector ──────────────────────────
function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedSize = btn.textContent.trim();
  document.getElementById('sizeError').style.display = 'none';
}

// ── Coupon validation via Cloudflare ───────
async function applyCoupon() {
  const code    = document.getElementById('couponInput').value.trim();
  const msgEl   = document.getElementById('couponMsg');
  const applyBtn = document.getElementById('applyBtn');

  if (!code) {
    showCouponMsg('Please enter a coupon code.', 'error');
    return;
  }

  applyBtn.textContent = 'Checking...';
  applyBtn.disabled = true;

  try {
    const res = await fetch(COUPON_WORKER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, price: BASE_PRICE })
    });

    const data = await res.json();

    if (data.valid) {
      finalPrice    = data.finalPrice;
      discountAmount = data.discount;
      appliedCoupon  = code.toUpperCase();

      // Update price display
      document.getElementById('displayPrice').textContent  = `₹${finalPrice}`;
      document.getElementById('originalPrice').textContent = `₹${BASE_PRICE}`;
      document.getElementById('originalPrice').style.display = 'inline';
      document.getElementById('priceSaving').textContent   = `You save ₹${discountAmount}`;
      document.getElementById('priceSaving').style.display = 'inline';
      document.getElementById('btnPrice').textContent      = `₹${finalPrice}`;

      showCouponMsg(`✓ ${data.message} applied!`, 'success');
      applyBtn.textContent = 'Applied ✓';
    } else {
      showCouponMsg(data.message || 'Invalid coupon code.', 'error');
      applyBtn.textContent = 'Apply';
      applyBtn.disabled = false;
    }
  } catch (err) {
    showCouponMsg('Could not validate coupon. Try again.', 'error');
    applyBtn.textContent = 'Apply';
    applyBtn.disabled = false;
  }
}

function showCouponMsg(msg, type) {
  const el = document.getElementById('couponMsg');
  el.textContent = msg;
  el.className = 'coupon-msg ' + type;
}

// ── Razorpay checkout ──────────────────────
function initiatePayment() {
  if (!selectedSize) {
    document.getElementById('sizeError').style.display = 'inline';
    document.querySelector('.size-row').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const options = {
    key: RAZORPAY_KEY,
    amount: finalPrice * 100, // paise
    currency: 'INR',
    name: 'FitVocab',
    description: `${PRODUCT_NAME} — Size ${selectedSize}`,
    image: 'https://fitvocab.in/images/tshirt-grey.jpg',
    handler: function(response) {
      lastPaymentData = {
        paymentId:   response.razorpay_payment_id,
        product:     PRODUCT_NAME,
        size:        selectedSize,
        basePrice:   BASE_PRICE,
        discount:    discountAmount,
        coupon:      appliedCoupon,
        finalPrice:  finalPrice,
        date:        new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      };
      showSuccessModal(lastPaymentData);
    },
    prefill: {
      name: '',
      email: '',
      contact: ''
    },
    notes: {
      product: PRODUCT_NAME,
      size: selectedSize,
      coupon: appliedCoupon || 'None'
    },
    theme: {
      color: '#c9a96e'
    },
    modal: {
      ondismiss: function() {
        console.log('Payment dismissed');
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

// ── Success modal ──────────────────────────
function showSuccessModal(data) {
  document.getElementById('orderSummary').innerHTML = `
    <div class="order-row"><span>Order ID</span><span>${data.paymentId}</span></div>
    <div class="order-row"><span>Product</span><span>${data.product}</span></div>
    <div class="order-row"><span>Size</span><span>${data.size}</span></div>
    ${data.coupon ? `<div class="order-row"><span>Coupon</span><span>${data.coupon} (−₹${data.discount})</span></div>` : ''}
    <div class="order-row"><span>Amount Paid</span><span>₹${data.finalPrice}</span></div>
    <div class="order-row"><span>Date</span><span>${data.date}</span></div>
  `;
  document.getElementById('successModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSuccess() {
  document.getElementById('successModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Invoice PDF generation ─────────────────
function downloadInvoice() {
  if (!lastPaymentData) return;
  const d = lastPaymentData;

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: Georgia, serif; max-width: 600px; margin: 40px auto; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #c9a96e; padding-bottom: 20px; margin-bottom: 30px; }
        .brand { font-size: 2rem; font-weight: bold; letter-spacing: 0.1em; color: #111; }
        .invoice-title { font-size: 0.8rem; letter-spacing: 0.3em; text-transform: uppercase; color: #888; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td { padding: 12px 0; border-bottom: 1px solid #eee; font-size: 0.95rem; }
        td:last-child { text-align: right; font-weight: bold; }
        .total-row td { border-top: 2px solid #c9a96e; border-bottom: none; font-size: 1.1rem; color: #c9a96e; }
        .footer { margin-top: 40px; text-align: center; font-size: 0.8rem; color: #aaa; }
        .thank-you { font-size: 1.2rem; text-align: center; margin: 30px 0; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">FitVocab</div>
        <div class="invoice-title">Tax Invoice</div>
      </div>
      <table>
        <tr><td>Invoice / Order ID</td><td>${d.paymentId}</td></tr>
        <tr><td>Date</td><td>${d.date}</td></tr>
        <tr><td>Product</td><td>${d.product}</td></tr>
        <tr><td>Size</td><td>${d.size}</td></tr>
        <tr><td>Base Price</td><td>₹${d.basePrice}</td></tr>
        ${d.coupon ? `<tr><td>Discount (${d.coupon})</td><td>− ₹${d.discount}</td></tr>` : ''}
        <tr class="total-row"><td>Total Paid</td><td>₹${d.finalPrice}</td></tr>
      </table>
      <p class="thank-you">"Fit. The only vocab I know."</p>
      <div class="footer">
        FitVocab · fitvocab.in · hello@fitvocab.in<br/>
        Thank you for your order!
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([invoiceHTML], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (win) win.print();
}
