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
        const sub = card.querySelector('.sub');
        const text = `${name ? name.textContent : ''} ${role ? role.textContent : ''} ${sub ? sub.textContent : ''}`.toLowerCase();
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

  const eventListPage = document.getElementById('eventListPage');
  if (eventListPage) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const allEventCards = Array.from(eventListPage.querySelectorAll('.event-card'));

    allEventCards.forEach((card) => {
      const isPast = card.dataset.date < todayStr;
      card.dataset.status = isPast ? 'past' : 'upcoming';
      const badge = card.querySelector('.event-badge');
      if (badge) {
        badge.textContent = isPast ? '開催終了' : '開催予定';
        badge.classList.toggle('event-badge-past', isPast);
      }
    });

    const eventFilterPills = document.querySelectorAll('.event-filter .tag-pill');
    const eventNoResultsEl = document.getElementById('eventNoResults');
    const eventSearchInput = document.getElementById('eventSearchInput');
    let activeEventStatus = 'all';
    let eventSearchQuery = '';

    const eventCardMatches = (card) => {
      if (activeEventStatus !== 'all' && card.dataset.status !== activeEventStatus) return false;
      if (!eventSearchQuery) return true;
      const title = card.querySelector('h3');
      const location = card.querySelector('.event-location');
      const type = card.querySelector('.event-type');
      const text = `${title ? title.textContent : ''} ${location ? location.textContent : ''} ${type ? type.textContent : ''}`.toLowerCase();
      return text.includes(eventSearchQuery);
    };

    const renderEventList = () => {
      let visibleCount = 0;
      allEventCards.forEach((card) => {
        const match = eventCardMatches(card);
        card.hidden = !match;
        if (match) visibleCount += 1;
      });
      if (eventNoResultsEl) eventNoResultsEl.hidden = visibleCount !== 0;
    };

    eventFilterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        activeEventStatus = pill.dataset.status;
        eventFilterPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        renderEventList();
      });
    });

    if (eventSearchInput) {
      eventSearchInput.addEventListener('input', () => {
        eventSearchQuery = eventSearchInput.value.trim().toLowerCase();
        renderEventList();
      });
    }

    renderEventList();

    // ---- view toggle (list / calendar) ----
    const viewTogglePills = document.querySelectorAll('.event-view-toggle .tag-pill');
    const eventListEl = document.getElementById('eventListPage');
    const eventCalendarEl = document.getElementById('eventCalendar');

    const switchEventView = (view) => {
      viewTogglePills.forEach((p) => p.classList.toggle('active', p.dataset.view === view));
      if (eventListEl) eventListEl.hidden = view !== 'list';
      if (eventCalendarEl) eventCalendarEl.hidden = view !== 'calendar';
      if (eventNoResultsEl) eventNoResultsEl.hidden = view !== 'list' || eventNoResultsEl.hidden;
    };

    viewTogglePills.forEach((pill) => {
      pill.addEventListener('click', () => switchEventView(pill.dataset.view));
    });

    // ---- calendar view ----
    const calGrid = document.getElementById('calGrid');
    const calMonthLabel = document.getElementById('calMonthLabel');
    const calPrevBtn = document.getElementById('calPrevMonth');
    const calNextBtn = document.getElementById('calNextMonth');

    if (calGrid && calMonthLabel) {
      const eventsByDate = new Map();
      allEventCards.forEach((card) => {
        const list = eventsByDate.get(card.dataset.date) || [];
        list.push(card);
        eventsByDate.set(card.dataset.date, list);
      });

      const today = new Date();
      let calYear = today.getFullYear();
      let calMonth = today.getMonth();

      const goToEvent = (dateStr) => {
        const cards = eventsByDate.get(dateStr);
        if (!cards || !cards.length) return;
        switchEventView('list');
        activeEventStatus = 'all';
        eventSearchQuery = '';
        if (eventSearchInput) eventSearchInput.value = '';
        eventFilterPills.forEach((p) => p.classList.toggle('active', p.dataset.status === 'all'));
        renderEventList();
        const target = cards[0];
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('event-card-highlight');
        setTimeout(() => target.classList.remove('event-card-highlight'), 1600);
      };

      const renderCalendar = () => {
        calMonthLabel.textContent = `${calYear}年${calMonth + 1}月`;
        calGrid.innerHTML = '';

        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i += 1) {
          const empty = document.createElement('div');
          empty.className = 'cal-day cal-day-empty';
          calGrid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const cell = document.createElement('div');
          cell.className = 'cal-day';
          const hasEvent = eventsByDate.has(dateStr);
          const numEl = document.createElement('span');
          numEl.className = 'cal-day-num';
          numEl.textContent = String(day);
          cell.appendChild(numEl);
          if (hasEvent) {
            cell.classList.add('has-event');
            const dot = document.createElement('span');
            dot.className = 'dot';
            cell.appendChild(dot);
            cell.addEventListener('click', () => goToEvent(dateStr));
          }
          calGrid.appendChild(cell);
        }
      };

      if (calPrevBtn) {
        calPrevBtn.addEventListener('click', () => {
          calMonth -= 1;
          if (calMonth < 0) { calMonth = 11; calYear -= 1; }
          renderCalendar();
        });
      }
      if (calNextBtn) {
        calNextBtn.addEventListener('click', () => {
          calMonth += 1;
          if (calMonth > 11) { calMonth = 0; calYear += 1; }
          renderCalendar();
        });
      }

      renderCalendar();
    }
  }
