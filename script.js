const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (window.scrollY > 60) header.classList.add('solid');
    else header.classList.remove('solid');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
    setTimeout(() => revealEls.forEach(el => el.classList.add('in')), 1200);
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  const menuBtn = document.querySelector('.menu-btn');
  const mainNav = document.querySelector('.mainnav');
  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const memberSearchInput = document.getElementById('memberSearchInput');
  const officerCards = document.querySelectorAll('.officer-card');
  const memberNoResults = document.getElementById('memberNoResults');
  if (memberSearchInput && officerCards.length) {
    const filterMembers = (query) => {
      const q = query.trim().toLowerCase();
      let visibleCount = 0;
      officerCards.forEach((card) => {
        const name = card.querySelector('.name');
        const role = card.querySelector('.role');
        const text = `${name ? name.textContent : ''} ${role ? role.textContent : ''}`.toLowerCase();
        const match = !q || text.includes(q);
        card.hidden = !match;
        if (match) visibleCount += 1;
      });
      if (memberNoResults) memberNoResults.hidden = visibleCount !== 0;
    };

    const initialQuery = new URLSearchParams(window.location.search).get('q') || '';
    if (initialQuery) memberSearchInput.value = initialQuery;
    filterMembers(initialQuery);

    memberSearchInput.addEventListener('input', () => filterMembers(memberSearchInput.value));
  }

  const heroCarousel = document.querySelector('.hero-carousel');
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.carousel-dot');

  if (heroCarousel && slides.length > 0) {
    let currentSlide = 0;
    let autoplayInterval;

    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
        if (dots[i]) dots[i].classList.toggle('active', i === index);
      });
    };

    const nextSlide = () => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    };

    const prevSlide = () => {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(currentSlide);
    };

    const goToSlide = (index) => {
      currentSlide = index;
      showSlide(currentSlide);
      resetAutoplay();
    };

    const startAutoplay = () => {
      autoplayInterval = setInterval(nextSlide, 5000);
    };

    const resetAutoplay = () => {
      clearInterval(autoplayInterval);
      startAutoplay();
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => goToSlide(index));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });

    showSlide(0);
    startAutoplay();

    heroCarousel.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
    heroCarousel.addEventListener('mouseleave', () => startAutoplay());
  }
