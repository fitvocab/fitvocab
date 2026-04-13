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
    document.querySelector('.size-row').scrollIntoView({ behavior: 'smooth', block: 'center' });
    alert('Please select a size before proceeding.');
    return;
  }

  // Confirm Razorpay loaded
  if (typeof Razorpay === 'undefined') {
    alert('Payment system is loading. Please try again in a moment.');
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
  const couponRow = data.coupon
    ? `<tr><td class="sr-label">Coupon</td><td class="sr-value">${data.coupon} &minus; &#8377;${data.discount}</td></tr>`
    : '';

  document.getElementById('orderSummary').innerHTML = `
    <table class="sr-table">
      <tr><td class="sr-label">Order ID</td><td class="sr-value">${data.paymentId}</td></tr>
      <tr><td class="sr-label">Product</td><td class="sr-value">${data.product}</td></tr>
      <tr><td class="sr-label">Size</td><td class="sr-value">${data.size}</td></tr>
      <tr><td class="sr-label">Base Price</td><td class="sr-value">&#8377;${data.basePrice}</td></tr>
      ${couponRow}
      <tr class="sr-total"><td class="sr-label">Total Paid</td><td class="sr-value">&#8377;${data.finalPrice}</td></tr>
      <tr><td class="sr-label">Date</td><td class="sr-value">${data.date}</td></tr>
    </table>
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
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Tenor+Sans&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Cormorant Garamond', Georgia, serif;
          max-width: 640px;
          margin: 60px auto;
          color: #1a1a1a;
          padding: 0 32px;
          background: #fff;
        }
        .header {
          text-align: center;
          padding-bottom: 28px;
          margin-bottom: 40px;
          border-bottom: 1.5px solid #c9a96e;
        }
        .brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.4rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #1a1a1a;
        }
        .invoice-title {
          font-family: 'Tenor Sans', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #c9a96e;
          margin-top: 6px;
        }
        table { width: 100%; border-collapse: collapse; }
        tr { border-bottom: 1px solid #ede8de; }
        tr:last-child { border-bottom: none; }
        td {
          padding: 16px 0;
          font-size: 1rem;
          vertical-align: top;
        }
        .label {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1rem;
          color: #888;
          width: 40%;
        }
        .value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          color: #1a1a1a;
          text-align: right;
          font-weight: 600;
        }
        .total-row td { border-top: 1.5px solid #c9a96e; padding-top: 20px; }
        .total-row .label {
          color: #c9a96e;
          font-style: normal;
          font-weight: 600;
          font-size: 1.1rem;
        }
        .total-row .value {
          color: #c9a96e;
          font-size: 1.4rem;
        }
        .tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          font-style: italic;
          text-align: center;
          margin: 48px 0 32px;
          color: #555;
        }
        .footer {
          text-align: center;
          font-family: 'Tenor Sans', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #bbb;
          padding-top: 24px;
          border-top: 1px solid #ede8de;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">FitVocab</div>
        <div class="invoice-title">Tax Invoice</div>
      </div>
      <table>
        <tr><td class="label">Invoice / Order ID</td><td class="value">${d.paymentId}</td></tr>
        <tr><td class="label">Date</td><td class="value">${d.date}</td></tr>
        <tr><td class="label">Product</td><td class="value">${d.product}</td></tr>
        <tr><td class="label">Size</td><td class="value">${d.size}</td></tr>
        <tr><td class="label">Base Price</td><td class="value">&#8377;${d.basePrice}</td></tr>
        ${d.coupon ? `<tr><td class="label">Discount (${d.coupon})</td><td class="value">&#8722; &#8377;${d.discount}</td></tr>` : ''}
        <tr class="total-row"><td class="label">Total Paid</td><td class="value">&#8377;${d.finalPrice}</td></tr>
      </table>
      <p class="tagline">"Fit. The only vocab I know."</p>
      <div class="footer">
        FitVocab &nbsp;·&nbsp; fitvocab.in &nbsp;·&nbsp; hello@fitvocab.in<br/><br/>
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
