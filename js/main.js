// ============================================
// FitVocab — Main JS
// ============================================

// NAV SCROLL EFFECT
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// MOBILE MENU TOGGLE
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const spans = navToggle.querySelectorAll('span');
    if (mobileMenu.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      const spans = navToggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });
}

// NEWSLETTER FORM
function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const btn = e.target.querySelector('button');
  btn.textContent = 'Subscribed ✓';
  btn.style.background = '#a07840';
  input.value = '';
  setTimeout(() => {
    btn.textContent = 'Subscribe';
    btn.style.background = '';
  }, 3000);
}

// CONTACT FORM
function handleContact(e) {
  e.preventDefault();
  const success = document.getElementById('formSuccess');
  const btn = e.target.querySelector('.form-submit');
  btn.textContent = 'Sending...';
  setTimeout(() => {
    btn.textContent = 'Send Message';
    success.classList.add('show');
    e.target.reset();
    setTimeout(() => success.classList.remove('show'), 5000);
  }, 1000);
}

// PRODUCT MODAL
function openModal(name, cat, price, imgClass) {
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalName').textContent = name;
  document.getElementById('modalCat').textContent = cat;
  document.getElementById('modalPrice').textContent = price;

  const modalImg = document.getElementById('modalImg');
  modalImg.className = 'modal-img ' + imgClass;

  // Show/hide size selector based on category
  const sizesEl = document.getElementById('modalSizes');
  if (cat === 'Equipment') {
    sizesEl.style.display = 'none';
  } else {
    sizesEl.style.display = 'block';
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// SIZE SELECTOR
function selectSize(btn) {
  const options = btn.closest('.size-options').querySelectorAll('.size-btn');
  options.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// SHOP PAGE — FILTER & SORT
const filterBtns = document.querySelectorAll('.filter-btn');
const productsGrid = document.getElementById('productsGrid');

if (filterBtns.length && productsGrid) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const cards = productsGrid.querySelectorAll('.product-card');

      cards.forEach(card => {
        if (filter === 'all' || card.dataset.cat === filter) {
          card.style.display = '';
          card.style.animation = 'revealUp 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// URL param filter on load
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat && filterBtns.length) {
    filterBtns.forEach(btn => {
      if (btn.dataset.filter === cat) {
        btn.click();
      }
    });
  }
});

// SORT
const sortSelect = document.getElementById('sortSelect');
if (sortSelect && productsGrid) {
  sortSelect.addEventListener('change', () => {
    const val = sortSelect.value;
    const cards = Array.from(productsGrid.querySelectorAll('.product-card'));

    cards.sort((a, b) => {
      const pa = parseInt(a.dataset.price);
      const pb = parseInt(b.dataset.price);
      if (val === 'price-asc') return pa - pb;
      if (val === 'price-desc') return pb - pa;
      return 0;
    });

    cards.forEach(card => productsGrid.appendChild(card));
  });
}

// SCROLL REVEAL (Intersection Observer)
const revealEls = document.querySelectorAll('.why-card, .cat-card, .value-item, .faq-item, .footer-links, .about-img-block');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`;
  observer.observe(el);
});
