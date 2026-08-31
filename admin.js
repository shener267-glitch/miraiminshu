const OWNER = 'shener267-glitch';
const REPO = 'miraiminshu';
const BRANCH = 'main';
const TOKEN_KEY = 'mm_admin_token';

const CATEGORY_LABELS = { policy: '政策', report: '活動報告', convention: '党大会', other: 'その他' };
const CHAMBER_LABELS = { lower: '衆議院議員', upper: '参議院議員', other: 'その他' };

// ---------- utils ----------

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function utf8ToB64(str) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}
function b64ToUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function formatDateDots(iso) { return iso.replace(/-/g, '.'); }
function formatDateJp(iso) {
  const [y, m, d] = iso.split('-');
  return `${parseInt(y, 10)}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}
function splitParagraphs(text) {
  return text.split(/\n+/).map(s => s.trim()).filter(Boolean);
}
function slugify(str) {
  return str.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}
function rolesLabel(roles) {
  return (roles || []).filter(Boolean).join('・');
}

function setStatus(message, kind) {
  const bar = document.getElementById('statusBar');
  bar.textContent = message;
  bar.className = kind || '';
  bar.hidden = false;
  if (kind === 'success') setTimeout(() => { bar.hidden = true; }, 4000);
}

// ---------- GitHub Contents API ----------

function apiUrl(path) {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`;
}
function authHeaders(extra) {
  return Object.assign({
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/vnd.github+json',
  }, extra || {});
}

async function getFile(path) {
  const res = await fetch(apiUrl(path), { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`取得失敗 (${path}): ${res.status}`);
  const data = await res.json();
  return { text: b64ToUtf8(data.content), sha: data.sha };
}

async function putTextFile(path, text, message, sha) {
  const body = { message, content: utf8ToB64(text), branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`保存失敗 (${path}): ${res.status} ${await res.text()}`);
  return res.json();
}

async function putBinaryFile(path, base64, message, sha) {
  const body = { message, content: base64, branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`画像アップロード失敗 (${path}): ${res.status} ${await res.text()}`);
  return res.json();
}

async function deleteFile(path, message, sha) {
  const res = await fetch(apiUrl(path), {
    method: 'DELETE',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) throw new Error(`削除失敗 (${path}): ${res.status}`);
  return res.json();
}

function replaceMarkerBlock(fileText, startMarker, endMarker, newInnerHtml) {
  const startIdx = fileText.indexOf(startMarker);
  const endIdx = fileText.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) throw new Error('マーカーが見つかりません: ' + startMarker);
  const before = fileText.slice(0, startIdx + startMarker.length);
  const after = fileText.slice(endIdx);
  return `${before}\n${newInnerHtml}\n        ${after}`;
}

// ---------- shared page fragments ----------

const SITE_HEADER = `<header id="siteHeader">
  <div class="wrap">
    <a href="../index.html" class="brand">
      <img src="../images/logo.png" class="mark" alt="未来民主党ロゴ">
      未来民主党
    </a>
    <nav class="mainnav" id="mainNav">
      <a href="../news.html">ニュース</a>
      <a href="../policy.html">政策</a>
      <a href="../about.html">党について</a>
      <a href="../members.html">所属議員</a>
      <a href="../index.html#leader">代表メッセージ</a>
      <a href="../join.html" class="mobile-cta-link">参加する</a>
    </nav>
    <a href="../join.html" class="nav-cta">参加する</a>
    <button class="menu-btn" aria-label="メニュー" aria-expanded="false" aria-controls="mainNav">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="13" x2="21" y2="13"/><line x1="3" y1="19" x2="21" y2="19"/></svg>
    </button>
  </div>
</header>`;

const SITE_FOOTER = `<footer>
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          <img src="../images/logo-lockup.png" alt="未来民主党 ― 国民の作る未来を" class="footer-logo">
        </div>
        <p class="desc">国民が作る未来を。対話から始める政治で、次の世代のための社会をつくります。</p>
      </div>
      <div class="footer-col">
        <h4>党について</h4>
        <ul>
          <li><a href="../index.html#about">党の概要</a></li>
          <li><a href="../about.html#history">沿革</a></li>
          <li><a href="../index.html#leader">代表メッセージ</a></li>
          <li><a href="../members.html">所属議員</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>政策</h4>
        <ul>
          <li><a href="../policy.html#01">デジタル政府</a></li>
          <li><a href="../policy.html#02">教育・子育て</a></li>
          <li><a href="../policy.html#03">若者と政治</a></li>
          <li><a href="../policy.html#04">脱炭素成長</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>参加する</h4>
        <ul>
          <li><a href="../join.html#member">党員登録</a></li>
          <li><a href="../join.html#donate">寄付・カンパ</a></li>
          <li><a href="../join.html#volunteer">ボランティア</a></li>
          <li><a href="../contact.html">お問い合わせ</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 未来民主党</span>
      <span><a href="../privacy-policy.html">プライバシーポリシー</a> ／ <a href="../sitemap.html">サイトマップ</a> ／ <a href="../contact.html">お問い合わせ</a></span>
    </div>
    <p class="footer-note">本サイトはWebデザインのサンプルとして制作された、架空の政党「未来民主党」の公式サイトです。実在するいかなる政党・団体・人物とも関係ありません。掲載されている代表者名、議員数、党員数、政策、ニュース等はすべて架空の設定です。</p>
  </div>
</footer>`;

// ---------- templates: news ----------

function renderNewsArticleHtml(item, prevItem) {
  const description = escapeHtml((item.body[0] || item.title).slice(0, 80));
  const bodyHtml = item.body.map(p => `          <p>${escapeHtml(p)}</p>`).join('\n');
  const imageHtml = item.image
    ? `      <div class="article-image">\n        <img src="../${item.image}" alt="${escapeHtml(item.title)}">\n      </div>\n`
    : '';
  const prevLink = prevItem
    ? `\n          <a href="${prevItem.slug}.html" class="btn btn-dark">前の記事へ →</a>`
    : '';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<script>document.documentElement.classList.add('js');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${description}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23C4FF4E'/%3E%3Ccircle cx='16' cy='19' r='8' fill='%23111112' opacity='.9'/%3E%3Cpath d='M3 21c4-9 22-9 26 0' stroke='%23111112' stroke-width='2' fill='none' opacity='.55'/%3E%3C/svg%3E">
<title>${escapeHtml(item.title)} ― 未来民主党</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">
</head>
<body>

${SITE_HEADER}

<main class="page">

  <section class="page-section" style="padding-top:150px;">
    <div class="wrap">
      <div class="article-head">
        <div class="breadcrumb"><a href="../index.html">トップ</a> ／ <a href="../news.html">ニュース</a></div>
        <span class="news-date">${formatDateDots(item.date)} ・ ${escapeHtml(item.categoryLabel)}</span>
        <h1>${escapeHtml(item.title)}</h1>
      </div>
${imageHtml}      <div class="article-body">
${bodyHtml}
      </div>
      <div class="article-foot">
          <a href="../news.html" class="btn btn-outline">← ニュース一覧へ戻る</a>${prevLink}
      </div>
    </div>
  </section>

</main>

${SITE_FOOTER}

<script src="../script.js"></script>

</body>
</html>
`;
}

function newsRowHtml(item) {
  return `        <a href="news/${item.slug}.html" class="news-row" data-category="${item.category}" data-date="${item.date}">
          <span class="news-date">${formatDateDots(item.date)}</span>
          <span class="news-tag">${escapeHtml(item.categoryLabel)}</span>
          <span class="news-title">${escapeHtml(item.title)}</span>
          <span class="news-arrow">→</span>
        </a>`;
}

async function regenerateAllNewsPages(newsArr) {
  const sorted = [...newsArr].sort((a, b) => b.date.localeCompare(a.date));
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const prevItem = sorted[i + 1] || null;
    const html = renderNewsArticleHtml(item, prevItem);
    const path = `news/${item.slug}.html`;
    const existing = await getFile(path);
    await putTextFile(path, html, `記事ページ更新: ${item.slug}`, existing ? existing.sha : undefined);
  }
}

async function regenerateNewsListPage(newsArr) {
  const sorted = [...newsArr].sort((a, b) => b.date.localeCompare(a.date));
  const rowsHtml = sorted.map(newsRowHtml).join('\n\n');
  const file = await getFile('news.html');
  const updated = replaceMarkerBlock(file.text, '<!-- NEWS-ROWS-START -->', '<!-- NEWS-ROWS-END -->', rowsHtml);
  await putTextFile('news.html', updated, 'ニュース一覧ページ更新', file.sha);
}

async function regenerateIndexNewsPreview(newsArr) {
  const sorted = [...newsArr].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const rowsHtml = sorted.map(newsRowHtml).join('\n\n');
  const file = await getFile('index.html');
  const updated = replaceMarkerBlock(file.text, '<!-- NEWS-ROWS-START -->', '<!-- NEWS-ROWS-END -->', rowsHtml);
  await putTextFile('index.html', updated, 'トップページのお知らせ更新', file.sha);
}

// ---------- templates: members ----------

const SNS_ICONS = {
  x: ['images/sns-x.png', 'X'],
  instagram: ['images/sns-instagram.png', 'Instagram'],
  youtube: ['images/sns-youtube.png', 'YouTube'],
};

function renderParagraphsHtml(text, className) {
  return splitParagraphs(text)
    .map(p => `          <p class="${className}">${escapeHtml(p)}</p>`)
    .join('\n');
}

function renderMessageBlock(message) {
  if (!message || !message.trim()) return '';
  const paragraphs = splitParagraphs(message).map(p => `<p>${escapeHtml(p)}</p>`).join('\n            ');
  return `          <h3 class="member-profile-heading">メッセージ</h3>\n          <div class="member-profile-message">\n            ${paragraphs}\n          </div>\n`;
}

function renderMemberProfileHtml(item) {
  let snsHtml = '';
  for (const key of ['x', 'instagram', 'youtube']) {
    const url = item.sns && item.sns[key];
    if (url) {
      const [icon, label] = SNS_ICONS[key];
      snsHtml += `            <a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${label}"><img src="../${icon}" alt="${label}"></a>\n`;
    }
  }
  const chamberLabel = CHAMBER_LABELS[item.chamber] || '';
  const roleText = rolesLabel(item.roles);
  const description = roleText ? `${escapeHtml(roleText)} ${escapeHtml(item.name)}` : escapeHtml(item.name);
  const leadText = [roleText, item.district].filter(Boolean).map(escapeHtml).join(' ／ ');
  const roleRow = roleText ? `            <div><dt>役職</dt><dd>${escapeHtml(roleText)}</dd></div>\n` : '';
  const kanaHtml = item.nameKana ? `      <p class="member-profile-kana">${escapeHtml(item.nameKana)}</p>\n` : '';
  const messageHtml = renderMessageBlock(item.message);
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<script>document.documentElement.classList.add('js');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="未来民主党 ${description}のプロフィールページです。">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23C4FF4E'/%3E%3Ccircle cx='16' cy='19' r='8' fill='%23111112' opacity='.9'/%3E%3Cpath d='M3 21c4-9 22-9 26 0' stroke='%23111112' stroke-width='2' fill='none' opacity='.55'/%3E%3C/svg%3E">
<title>${escapeHtml(item.name)} ― 未来民主党</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">
</head>
<body>

${SITE_HEADER}

<main class="page">

  <section class="page-header">
    <div class="wrap">
      <div class="breadcrumb"><a href="../index.html">トップ</a> ／ <a href="../members.html">所属議員</a></div>
      <div class="eyebrow">MEMBERS ／ 所属議員紹介</div>
${kanaHtml}      <h1>${escapeHtml(item.name)}</h1>
      <p class="lead-text">${leadText}</p>
    </div>
  </section>

  <section class="page-section">
    <div class="wrap">
      <div class="member-profile">
        <div class="member-profile-photo">
          <div class="member-profile-chamber">${escapeHtml(chamberLabel)}</div>
          <img src="../${item.image}" alt="${escapeHtml(item.name)}">
        </div>
        <div class="member-profile-body">
          <dl class="member-profile-meta">
${roleRow}            <div><dt>選挙区</dt><dd>${escapeHtml(item.district)}</dd></div>
            <div><dt>生年月日</dt><dd>${formatDateJp(item.birthdate)}</dd></div>
          </dl>
          <h3 class="member-profile-heading">経歴</h3>
${renderParagraphsHtml(item.bio, 'member-profile-bio')}
${messageHtml}          <div class="member-profile-sns">
${snsHtml}          </div>
        </div>
      </div>
      <div class="article-foot">
          <a href="../members.html" class="btn btn-outline">← 所属議員一覧へ戻る</a>
      </div>
    </div>
  </section>

</main>

${SITE_FOOTER}

<script src="../script.js"></script>

</body>
</html>
`;
}

function officerCardHtml(m) {
  const chamberLabel = CHAMBER_LABELS[m.chamber] || '';
  const roleText = rolesLabel(m.roles);
  const roleHtml = roleText ? `<div class="role">${escapeHtml(roleText)}</div>\n          ` : '';
  return `        <a class="officer-card" href="members/${m.slug}.html">
          <img class="officer-avatar" src="${m.image}" alt="${escapeHtml(m.name)}">
          ${roleHtml}<div class="name">${escapeHtml(m.name)}</div>
          <div class="sub">${[m.district, chamberLabel].filter(Boolean).map(escapeHtml).join(' ／ ')}</div>
        </a>`;
}

async function regenerateMembersGrid(arr) {
  const officers = arr.filter(m => m.roles && m.roles.length);
  const generalMembers = arr.filter(m => !(m.roles && m.roles.length));
  const officersHtml = officers.map(officerCardHtml).join('\n');
  const generalHtml = generalMembers.map(officerCardHtml).join('\n');
  const file = await getFile('members.html');
  let updated = replaceMarkerBlock(file.text, '<!-- OFFICER-GRID-START -->', '<!-- OFFICER-GRID-END -->', officersHtml);
  updated = replaceMarkerBlock(updated, '<!-- MEMBER-GRID-START -->', '<!-- MEMBER-GRID-END -->', generalHtml);
  await putTextFile('members.html', updated, '議員一覧ページ更新', file.sha);
}

// ---------- save / delete: news ----------

async function saveNews(formData, isNew, imageFile) {
  setStatus('保存中…');
  try {
    const newsFile = await getFile('data/news.json');
    let arr = newsFile ? JSON.parse(newsFile.text) : [];

    let slug = formData.slug;
    if (isNew) {
      let candidate = formData.date;
      let n = 2;
      while (arr.some(x => x.slug === candidate)) { candidate = `${formData.date}-${n}`; n++; }
      slug = candidate;
    }

    let imagePath = formData.existingImage || '';

    if ((formData.removeImage || imageFile) && imagePath) {
      const oldImg = await getFile(imagePath);
      if (oldImg) await deleteFile(imagePath, `画像削除: ${slug}`, oldImg.sha);
      imagePath = '';
    }

    if (imageFile) {
      const b64 = await fileToBase64(imageFile);
      const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
      imagePath = `images/news/${slug}.${ext}`;
      const existing = await getFile(imagePath);
      await putBinaryFile(imagePath, b64, `画像アップロード: ${slug}`, existing ? existing.sha : undefined);
    }

    const item = {
      slug,
      date: formData.date,
      category: formData.category,
      categoryLabel: CATEGORY_LABELS[formData.category],
      title: formData.title,
      image: imagePath,
      body: splitParagraphs(formData.body),
    };

    const idx = arr.findIndex(x => x.slug === slug);
    if (idx >= 0) arr[idx] = item; else arr.push(item);
    arr.sort((a, b) => b.date.localeCompare(a.date));

    await putTextFile('data/news.json', JSON.stringify(arr, null, 2) + '\n', `ニュース更新: ${item.title}`, newsFile ? newsFile.sha : undefined);
    await regenerateAllNewsPages(arr);
    await regenerateNewsListPage(arr);
    await regenerateIndexNewsPreview(arr);

    setStatus('保存しました。サイトへの反映まで少し時間がかかることがあります。', 'success');
    closeForm();
    await loadAndRenderNews();
  } catch (err) {
    console.error(err);
    setStatus('エラー: ' + err.message, 'error');
  }
}

async function deleteNews(slug) {
  if (!confirm('このお知らせを削除しますか？')) return;
  setStatus('削除中…');
  try {
    const newsFile = await getFile('data/news.json');
    let arr = JSON.parse(newsFile.text);
    const item = arr.find(x => x.slug === slug);
    arr = arr.filter(x => x.slug !== slug);
    await putTextFile('data/news.json', JSON.stringify(arr, null, 2) + '\n', `ニュース削除: ${slug}`, newsFile.sha);

    const pageFile = await getFile(`news/${slug}.html`);
    if (pageFile) await deleteFile(`news/${slug}.html`, `記事ページ削除: ${slug}`, pageFile.sha);

    if (item && item.image) {
      const imgFile = await getFile(item.image);
      if (imgFile) await deleteFile(item.image, `画像削除: ${slug}`, imgFile.sha);
    }

    await regenerateAllNewsPages(arr);
    await regenerateNewsListPage(arr);
    await regenerateIndexNewsPreview(arr);

    setStatus('削除しました。', 'success');
    await loadAndRenderNews();
  } catch (err) {
    console.error(err);
    setStatus('エラー: ' + err.message, 'error');
  }
}

// ---------- save / delete: members ----------

async function saveMember(formData, isNew, imageFile) {
  setStatus('保存中…');
  try {
    const memberFile = await getFile('data/members.json');
    let arr = memberFile ? JSON.parse(memberFile.text) : [];

    const slug = slugify(formData.slug);
    if (!slug) throw new Error('URLスラッグを入力してください（半角英数字とハイフン）');
    if (isNew && arr.some(x => x.slug === slug)) throw new Error('このスラッグは既に使われています: ' + slug);

    let imagePath = formData.existingImage || 'images/officer-placeholder.png';

    if ((formData.removeImage || imageFile) && imagePath.startsWith('images/members/')) {
      const oldImg = await getFile(imagePath);
      if (oldImg) await deleteFile(imagePath, `画像削除: ${slug}`, oldImg.sha);
      imagePath = 'images/officer-placeholder.png';
    }

    if (imageFile) {
      const b64 = await fileToBase64(imageFile);
      const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
      imagePath = `images/members/${slug}.${ext}`;
      const existing = await getFile(imagePath);
      await putBinaryFile(imagePath, b64, `画像アップロード: ${slug}`, existing ? existing.sha : undefined);
    }

    const item = {
      slug,
      name: formData.name,
      nameKana: formData.nameKana,
      roles: formData.roles,
      chamber: formData.chamber,
      district: formData.district,
      birthdate: formData.birthdate,
      bio: formData.bio,
      message: formData.message,
      image: imagePath,
      sns: { x: formData.snsX, instagram: formData.snsInstagram, youtube: formData.snsYoutube },
    };

    const idx = arr.findIndex(x => x.slug === slug);
    if (idx >= 0) arr[idx] = item; else arr.push(item);

    await putTextFile('data/members.json', JSON.stringify(arr, null, 2) + '\n', `議員情報更新: ${item.name}`, memberFile ? memberFile.sha : undefined);

    const profilePath = `members/${slug}.html`;
    const existingProfile = await getFile(profilePath);
    await putTextFile(profilePath, renderMemberProfileHtml(item), `プロフィール更新: ${item.name}`, existingProfile ? existingProfile.sha : undefined);

    await regenerateMembersGrid(arr);

    setStatus('保存しました。サイトへの反映まで少し時間がかかることがあります。', 'success');
    closeForm();
    await loadAndRenderMembers();
  } catch (err) {
    console.error(err);
    setStatus('エラー: ' + err.message, 'error');
  }
}

async function moveOfficer(slug, direction) {
  setStatus('並び替え中…');
  try {
    const memberFile = await getFile('data/members.json');
    const arr = memberFile ? JSON.parse(memberFile.text) : [];
    const officerIndices = arr.reduce((acc, m, i) => { if (m.roles && m.roles.length) acc.push(i); return acc; }, []);
    const pos = officerIndices.findIndex(i => arr[i].slug === slug);
    const targetPos = pos + direction;
    if (pos === -1 || targetPos < 0 || targetPos >= officerIndices.length) return;
    const i = officerIndices[pos];
    const j = officerIndices[targetPos];
    [arr[i], arr[j]] = [arr[j], arr[i]];

    await putTextFile('data/members.json', JSON.stringify(arr, null, 2) + '\n', `役員の表示順を変更: ${slug}`, memberFile.sha);
    await regenerateMembersGrid(arr);

    setStatus('並び替えました。サイトへの反映まで少し時間がかかることがあります。', 'success');
    await loadAndRenderMembers();
  } catch (err) {
    console.error(err);
    setStatus('エラー: ' + err.message, 'error');
  }
}

async function deleteMember(slug) {
  if (!confirm('この議員情報を削除しますか？')) return;
  setStatus('削除中…');
  try {
    const memberFile = await getFile('data/members.json');
    let arr = JSON.parse(memberFile.text);
    const item = arr.find(x => x.slug === slug);
    arr = arr.filter(x => x.slug !== slug);
    await putTextFile('data/members.json', JSON.stringify(arr, null, 2) + '\n', `議員削除: ${slug}`, memberFile.sha);

    const profileFile = await getFile(`members/${slug}.html`);
    if (profileFile) await deleteFile(`members/${slug}.html`, `プロフィール削除: ${slug}`, profileFile.sha);

    if (item && item.image && item.image.startsWith('images/members/')) {
      const imgFile = await getFile(item.image);
      if (imgFile) await deleteFile(item.image, `画像削除: ${slug}`, imgFile.sha);
    }

    await regenerateMembersGrid(arr);
    setStatus('削除しました。', 'success');
    await loadAndRenderMembers();
  } catch (err) {
    console.error(err);
    setStatus('エラー: ' + err.message, 'error');
  }
}

// ---------- UI: lists ----------

async function loadAndRenderNews() {
  const listEl = document.getElementById('newsList');
  listEl.textContent = '読み込み中…';
  try {
    const file = await getFile('data/news.json');
    const arr = (file ? JSON.parse(file.text) : []).sort((a, b) => b.date.localeCompare(a.date));
    listEl.innerHTML = '';
    if (arr.length === 0) { listEl.textContent = 'お知らせはまだありません。'; return; }
    arr.forEach(item => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-row-main">
          <div class="item-row-text">
            <div class="title">${escapeHtml(item.title)}</div>
            <div class="meta">${formatDateDots(item.date)} ・ ${escapeHtml(item.categoryLabel)}</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn-outline btn-small" data-action="edit">編集</button>
          <button class="btn-danger" data-action="delete">削除</button>
        </div>`;
      row.querySelector('[data-action="edit"]').addEventListener('click', () => openNewsForm(item));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteNews(item.slug));
      listEl.appendChild(row);
    });
  } catch (err) {
    listEl.textContent = 'エラー: ' + err.message;
  }
}

let lastMembersArr = [];
let memberSearchQuery = '';

function memberMatchesQuery(item, q) {
  if (!q) return true;
  const text = [item.name, item.nameKana, rolesLabel(item.roles), item.district].filter(Boolean).join(' ').toLowerCase();
  return text.includes(q);
}

function buildMemberRow(item, reorder) {
  const row = document.createElement('div');
  row.className = 'item-row';
  const reorderHtml = reorder
    ? `<div class="reorder">
        <button class="btn-reorder" data-action="up"${reorder.disableUp ? ' disabled' : ''} title="上へ移動" aria-label="上へ移動">▲</button>
        <button class="btn-reorder" data-action="down"${reorder.disableDown ? ' disabled' : ''} title="下へ移動" aria-label="下へ移動">▼</button>
      </div>`
    : '';
  row.innerHTML = `
    <div class="item-row-main">
      ${reorderHtml}
      <img src="${item.image}" alt="">
      <div class="item-row-text">
        <div class="title">${escapeHtml(item.name)}</div>
        <div class="meta">${[rolesLabel(item.roles), CHAMBER_LABELS[item.chamber], item.district].filter(Boolean).map(escapeHtml).join(' ・ ')}</div>
      </div>
    </div>
    <div class="actions">
      <button class="btn-outline btn-small" data-action="edit">編集</button>
      <button class="btn-danger" data-action="delete">削除</button>
    </div>`;
  row.querySelector('[data-action="edit"]').addEventListener('click', () => openMemberForm(item));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteMember(item.slug));
  if (reorder) {
    row.querySelector('[data-action="up"]').addEventListener('click', () => moveOfficer(item.slug, -1));
    row.querySelector('[data-action="down"]').addEventListener('click', () => moveOfficer(item.slug, 1));
  }
  return row;
}

function renderMemberList() {
  const listEl = document.getElementById('memberList');
  listEl.innerHTML = '';
  const arr = lastMembersArr;
  if (arr.length === 0) { listEl.textContent = '議員情報はまだありません。'; return; }

  const q = memberSearchQuery.trim().toLowerCase();
  const officers = arr.filter(m => m.roles && m.roles.length);
  const generalMembers = arr.filter(m => !(m.roles && m.roles.length));
  const officersFiltered = officers.filter(m => memberMatchesQuery(m, q));
  const generalFiltered = generalMembers.filter(m => memberMatchesQuery(m, q));

  if (officersFiltered.length === 0 && generalFiltered.length === 0) {
    listEl.textContent = '該当する議員が見つかりませんでした。';
    return;
  }

  if (officersFiltered.length) {
    const heading = document.createElement('div');
    heading.className = 'member-group-heading';
    heading.textContent = '執行部（役員）／ ▲▼で表示順を変更できます';
    listEl.appendChild(heading);
    officersFiltered.forEach(item => {
      const pos = officers.findIndex(m => m.slug === item.slug);
      listEl.appendChild(buildMemberRow(item, { disableUp: pos === 0, disableDown: pos === officers.length - 1 }));
    });
  }

  if (generalFiltered.length) {
    const heading = document.createElement('div');
    heading.className = 'member-group-heading';
    heading.textContent = '一般議員';
    listEl.appendChild(heading);
    generalFiltered.forEach(item => listEl.appendChild(buildMemberRow(item, null)));
  }
}

async function loadAndRenderMembers() {
  const listEl = document.getElementById('memberList');
  listEl.textContent = '読み込み中…';
  try {
    const file = await getFile('data/members.json');
    lastMembersArr = file ? JSON.parse(file.text) : [];
    renderMemberList();
  } catch (err) {
    listEl.textContent = 'エラー: ' + err.message;
  }
}

// ---------- UI: forms ----------

function closeForm() {
  document.getElementById('formArea').innerHTML = '';
}

function openNewsForm(item) {
  const isNew = !item;
  const formArea = document.getElementById('formArea');
  const today = new Date().toISOString().slice(0, 10);
  formArea.innerHTML = `
    <div class="card">
      <h2>${isNew ? '新規お知らせ' : 'お知らせを編集'}</h2>
      <label>日付</label>
      <input type="date" id="f_date" value="${item ? item.date : today}">
      <label>カテゴリ</label>
      <select id="f_category">
        <option value="policy">政策</option>
        <option value="report">活動報告</option>
        <option value="convention">党大会</option>
        <option value="other">その他</option>
      </select>
      <label>題名</label>
      <input type="text" id="f_title" value="${item ? escapeHtml(item.title) : ''}">
      <label>本文（改行で段落を分けます）</label>
      <textarea id="f_body">${item ? escapeHtml(item.body.join('\n\n')) : ''}</textarea>
      <label>画像（任意）</label>
      ${item && item.image ? `<div class="current-image">
        <img src="${item.image}" alt="">
        <label class="checkbox-label"><input type="checkbox" id="f_remove_image"> この画像を削除する</label>
      </div>` : ''}
      <input type="file" id="f_image" accept="image/*">
      <div class="form-actions">
        <button class="btn-primary" id="f_save">保存する</button>
        <button class="btn-outline" id="f_cancel">キャンセル</button>
      </div>
    </div>`;
  document.getElementById('f_category').value = item ? item.category : 'policy';
  document.getElementById('f_cancel').addEventListener('click', closeForm);
  document.getElementById('f_save').addEventListener('click', () => {
    const removeImageEl = document.getElementById('f_remove_image');
    const formData = {
      slug: item ? item.slug : null,
      date: document.getElementById('f_date').value,
      category: document.getElementById('f_category').value,
      title: document.getElementById('f_title').value.trim(),
      body: document.getElementById('f_body').value,
      existingImage: item ? item.image : '',
      removeImage: removeImageEl ? removeImageEl.checked : false,
    };
    if (!formData.date || !formData.title || !formData.body.trim()) {
      setStatus('日付・題名・本文は必須です。', 'error');
      return;
    }
    const imageFile = document.getElementById('f_image').files[0] || null;
    saveNews(formData, isNew, imageFile);
  });
  formArea.scrollIntoView({ behavior: 'smooth' });
}

function openMemberForm(item) {
  const isNew = !item;
  const formArea = document.getElementById('formArea');
  formArea.innerHTML = `
    <div class="card">
      <h2>${isNew ? '新規議員' : '議員情報を編集'}</h2>
      <label>URLスラッグ（半角英数字とハイフン。例: yamada-taro）${isNew ? '' : '（変更不可）'}</label>
      <input type="text" id="f_slug" value="${item ? item.slug : ''}" ${isNew ? '' : 'disabled'}>
      <label>名前（例: 民主 未来太郎 ／ 姓と名の間に半角スペース）</label>
      <input type="text" id="f_name" placeholder="例: 民主 未来太郎" value="${item ? escapeHtml(item.name) : ''}">
      <label>ふりがな（任意。例: みんしゅ みらいたろう）</label>
      <input type="text" id="f_kana" placeholder="例: みんしゅ みらいたろう" value="${item ? escapeHtml(item.nameKana || '') : ''}">
      <label>区分</label>
      <select id="f_chamber">
        <option value="lower">衆議院議員</option>
        <option value="upper">参議院議員</option>
        <option value="other">その他</option>
      </select>
      <label>役職（任意・複数可。1行に1つずつ入力してください。執行部の役職がない一般議員は空欄でOK）</label>
      <textarea id="f_role" placeholder="例:&#10;幹事長&#10;青年局長">${item ? escapeHtml((item.roles || []).join('\n')) : ''}</textarea>
      <label>選挙区</label>
      <input type="text" id="f_district" value="${item ? escapeHtml(item.district) : ''}">
      <label>生年月日</label>
      <input type="date" id="f_birthdate" value="${item ? item.birthdate : ''}">
      <label>経歴（改行で段落を分けます）</label>
      <textarea id="f_bio" placeholder="例: ○○大学卒業後、△△に勤務。20XX年、地方議会議員に当選。以降、教育政策を中心に活動。">${item ? escapeHtml(item.bio) : ''}</textarea>
      <label>メッセージ（任意。経歴とは別に自由に記述できます）</label>
      <textarea id="f_message" placeholder="例: 一人ひとりの声に向き合う政治を、地元から実現していきます。">${item ? escapeHtml(item.message || '') : ''}</textarea>
      <label>SNSリンク（任意）</label>
      <div class="sns-row">
        <input type="url" id="f_sns_x" placeholder="X (Twitter)" value="${item && item.sns ? item.sns.x || '' : ''}">
        <input type="url" id="f_sns_ig" placeholder="Instagram" value="${item && item.sns ? item.sns.instagram || '' : ''}">
        <input type="url" id="f_sns_yt" placeholder="YouTube" value="${item && item.sns ? item.sns.youtube || '' : ''}">
      </div>
      <label>画像（任意）</label>
      ${item && item.image && item.image.startsWith('images/members/') ? `<div class="current-image">
        <img src="${item.image}" alt="">
        <label class="checkbox-label"><input type="checkbox" id="f_remove_image"> この画像を削除する（既定の画像に戻します）</label>
      </div>` : ''}
      <input type="file" id="f_image" accept="image/*">
      <div class="form-actions">
        <button class="btn-primary" id="f_save">保存する</button>
        <button class="btn-outline" id="f_cancel">キャンセル</button>
      </div>
    </div>`;
  document.getElementById('f_chamber').value = item && item.chamber ? item.chamber : 'lower';
  document.getElementById('f_cancel').addEventListener('click', closeForm);
  document.getElementById('f_save').addEventListener('click', () => {
    const removeImageEl = document.getElementById('f_remove_image');
    const formData = {
      slug: document.getElementById('f_slug').value,
      name: document.getElementById('f_name').value.trim(),
      nameKana: document.getElementById('f_kana').value.trim(),
      chamber: document.getElementById('f_chamber').value,
      roles: splitParagraphs(document.getElementById('f_role').value),
      district: document.getElementById('f_district').value.trim(),
      birthdate: document.getElementById('f_birthdate').value,
      bio: document.getElementById('f_bio').value,
      message: document.getElementById('f_message').value,
      snsX: document.getElementById('f_sns_x').value.trim(),
      snsInstagram: document.getElementById('f_sns_ig').value.trim(),
      snsYoutube: document.getElementById('f_sns_yt').value.trim(),
      existingImage: item ? item.image : '',
      removeImage: removeImageEl ? removeImageEl.checked : false,
    };
    if (!formData.slug || !formData.name || !formData.district || !formData.birthdate) {
      setStatus('スラッグ・名前・選挙区・生年月日は必須です。', 'error');
      return;
    }
    const imageFile = document.getElementById('f_image').files[0] || null;
    saveMember(formData, isNew, imageFile);
  });
  formArea.scrollIntoView({ behavior: 'smooth' });
}

// ---------- app bootstrap ----------

function showApp() {
  document.getElementById('tokenScreen').hidden = true;
  document.getElementById('adminApp').hidden = false;
  loadAndRenderNews();
  loadAndRenderMembers();
}

document.getElementById('tokenSaveBtn').addEventListener('click', () => {
  const val = document.getElementById('tokenInput').value.trim();
  if (!val) return;
  setToken(val);
  showApp();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  if (!confirm('ログアウトしますか？（保存したトークンを削除します）')) return;
  clearToken();
  location.reload();
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = true; });
    document.getElementById(`tab-${btn.dataset.tab}`).hidden = false;
    closeForm();
  });
});

document.getElementById('newsAddBtn').addEventListener('click', () => openNewsForm(null));
document.getElementById('memberAddBtn').addEventListener('click', () => openMemberForm(null));
document.getElementById('memberAdminSearch').addEventListener('input', (e) => {
  memberSearchQuery = e.target.value;
  renderMemberList();
});

if (getToken()) showApp();
