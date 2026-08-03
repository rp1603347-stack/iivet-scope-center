// IIVET SCROP FRANCE — site scripts (static, no backend)
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Active nav link ---------- */
  var page = document.body.getAttribute('data-page');
  document.querySelectorAll('.isf-navbar .nav-link').forEach(function (link) {
    if (link.getAttribute('data-page') === page) link.classList.add('active');
  });

  /* ---------- Animated counters (stats band) ---------- */
  var counters = document.querySelectorAll('.counter');
  if (counters.length) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !entry.target.dataset.done) {
          entry.target.dataset.done = "1";
          animateCounter(entry.target);
        }
      });
    }, { threshold: .4 });
    counters.forEach(function (c) { obs.observe(c); });
  }
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('en-IN') + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('en-IN') + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- Course filters (courses page) ---------- */
  var catTabs = document.querySelectorAll('.filter-tab');
  var durTabs = document.querySelectorAll('.dtab');
  var cards = document.querySelectorAll('.course-card-col');
  var activeCat = 'all';
  var activeDur = 'all';

  function applyFilters() {
    if (!cards.length) return;
    var visibleCount = 0;
    cards.forEach(function (card) {
      var cat = card.getAttribute('data-cat');
      var dur = card.getAttribute('data-dur');
      var show = (activeCat === 'all' || cat === activeCat) && (activeDur === 'all' || dur === activeDur);
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    var emptyMsg = document.getElementById('noResults');
    if (emptyMsg) emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  catTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      catTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      activeCat = tab.getAttribute('data-cat');
      applyFilters();
    });
  });

  durTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      durTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      activeDur = tab.getAttribute('data-dur');
      applyFilters();
    });
  });

  applyFilters();

  /* ---------- Contact form (static — no backend) ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      var toastEl = document.getElementById('formToast');
      var toast = new bootstrap.Toast(toastEl);
      toast.show();
      form.reset();
      form.classList.remove('was-validated');
    });
  }

  /* ---------- Franchise enquiry form (static) ---------- */
  var fForm = document.getElementById('franchiseForm');
  if (fForm) {
    fForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!fForm.checkValidity()) { fForm.classList.add('was-validated'); return; }
      var toastEl = document.getElementById('formToast');
      var toast = new bootstrap.Toast(toastEl);
      toast.show();
      fForm.reset();
      fForm.classList.remove('was-validated');
    });
  }

  /* ---------- Gallery filters + lightbox (gallery page) ---------- */
  var galTabs = document.querySelectorAll('.gal-tab');
  var galItems = document.querySelectorAll('.gallery-item');
  if (galItems.length) {
    galTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        galTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var cat = tab.getAttribute('data-cat');
        galItems.forEach(function (item) {
          var show = cat === 'all' || item.getAttribute('data-cat') === cat;
          item.style.display = show ? '' : 'none';
        });
      });
    });

    var lbImg = document.getElementById('lightboxImg');
    var lbCaption = document.getElementById('lightboxCaption');
    var lightboxEl = document.getElementById('lightboxModal');
    if (lightboxEl) {
      var lightbox = new bootstrap.Modal(lightboxEl);
      galItems.forEach(function (item) {
        item.addEventListener('click', function () {
          var img = item.querySelector('img');
          lbImg.src = img.getAttribute('data-full') || img.src;
          lbCaption.textContent = img.getAttribute('alt') || '';
          lightbox.show();
        });
      });
    }
  }

  /* ---------- Back-to-top ---------- */
  var topBtn = document.getElementById('toTop');
  if (topBtn) {
    window.addEventListener('scroll', function () {
      topBtn.style.display = window.scrollY > 500 ? 'flex' : 'none';
    });
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Set current year ---------- */
  document.querySelectorAll('.cur-year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
});
