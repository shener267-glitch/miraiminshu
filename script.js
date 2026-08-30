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

  const newsListPage = document.getElementById('newsListPage');
  if (newsListPage) {
    const allNewsRows = Array.from(newsListPage.querySelectorAll('.news-row'));
    const filterPills = document.querySelectorAll('.news-filter .tag-pill');
    const dateFromInput = document.getElementById('newsDateFrom');
    const dateToInput = document.getElementById('newsDateTo');
    const dateResetBtn = document.getElementById('newsDateReset');
    const paginationEl = document.getElementById('newsPagination');
    const noResultsEl = document.getElementById('newsNoResults');
    const NEWS_PER_PAGE = 5;

    let activeCategory = 'all';
    let currentPage = 1;

    const getFilteredRows = () => allNewsRows.filter((row) => {
      const category = row.dataset.category;
      const date = row.dataset.date;
      if (activeCategory !== 'all' && category !== activeCategory) return false;
      if (dateFromInput && dateFromInput.value && date < dateFromInput.value) return false;
      if (dateToInput && dateToInput.value && date > dateToInput.value) return false;
      return true;
    });

    const renderNewsList = () => {
      const filtered = getFilteredRows();
      const totalPages = Math.max(1, Math.ceil(filtered.length / NEWS_PER_PAGE));
      if (currentPage > totalPages) currentPage = totalPages;

      const start = (currentPage - 1) * NEWS_PER_PAGE;
      const pageRows = new Set(filtered.slice(start, start + NEWS_PER_PAGE));

      allNewsRows.forEach((row) => { row.hidden = !pageRows.has(row); });
      if (noResultsEl) noResultsEl.hidden = filtered.length !== 0;

      if (paginationEl) {
        paginationEl.innerHTML = '';
        if (filtered.length > 0) {
          for (let page = 1; page <= totalPages; page += 1) {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = String(page);
            if (page === currentPage) link.classList.add('current');
            link.addEventListener('click', (event) => {
              event.preventDefault();
              currentPage = page;
              renderNewsList();
            });
            paginationEl.appendChild(link);
          }
          if (currentPage < totalPages) {
            const next = document.createElement('a');
            next.href = '#';
            next.textContent = '→';
            next.addEventListener('click', (event) => {
              event.preventDefault();
              currentPage += 1;
              renderNewsList();
            });
            paginationEl.appendChild(next);
          }
        }
      }
    };

    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        activeCategory = pill.dataset.category;
        currentPage = 1;
        filterPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        renderNewsList();
      });
    });

    [dateFromInput, dateToInput].forEach((input) => {
      if (!input) return;
      input.addEventListener('change', () => {
        currentPage = 1;
        renderNewsList();
      });
    });

    if (dateResetBtn) {
      dateResetBtn.addEventListener('click', () => {
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
        currentPage = 1;
        renderNewsList();
      });
    }

    renderNewsList();
  }
