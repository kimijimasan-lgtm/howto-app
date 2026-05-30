// ============================================
//  ハウツー解説 v2 – app.js
//  Firebase Realtime Database (CDN compat)
// ============================================

// ── Firebase 初期化 ──────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCWRY0dXtRqybI048q0btT-kW-rMnHfiW8",
  authDomain: "torisetu-234c3.firebaseapp.com",
  databaseURL: "https://torisetu-234c3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "torisetu-234c3",
  storageBucket: "torisetu-234c3.firebasestorage.app",
  messagingSenderId: "1036476479724",
  appId: "1:1036476479724:web:2996ecebe04f61bc448dc9",
  measurementId: "G-V24PQM9NYD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ── カラーパレット（24色・白テキストとのコントラスト保証） ──────────
const COLORS = [
  // ブルー系
  { label: 'インディゴ',   grad: 'linear-gradient(135deg,#4f46e5,#6366f1)' },
  { label: 'バイオレット', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' },
  { label: 'ブルー',       grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' },
  { label: 'スカイ',       grad: 'linear-gradient(135deg,#0284c7,#0ea5e9)' },
  { label: 'シアン',       grad: 'linear-gradient(135deg,#0891b2,#06b6d4)' },
  { label: 'ネイビー',     grad: 'linear-gradient(135deg,#1e3a5f,#1e40af)' },
  // グリーン系
  { label: 'ティール',     grad: 'linear-gradient(135deg,#0d9488,#14b8a6)' },
  { label: 'エメラルド',   grad: 'linear-gradient(135deg,#059669,#10b981)' },
  { label: 'グリーン',     grad: 'linear-gradient(135deg,#16a34a,#22c55e)' },
  { label: 'ライム',       grad: 'linear-gradient(135deg,#4d7c0f,#65a30d)' },
  { label: 'フォレスト',   grad: 'linear-gradient(135deg,#14532d,#166534)' },
  { label: 'オリーブ',     grad: 'linear-gradient(135deg,#713f12,#854d0e)' },
  // レッド・ピンク・オレンジ系
  { label: 'レッド',       grad: 'linear-gradient(135deg,#b91c1c,#ef4444)' },
  { label: 'ローズ',       grad: 'linear-gradient(135deg,#9d174d,#db2777)' },
  { label: 'ピンク',       grad: 'linear-gradient(135deg,#be185d,#ec4899)' },
  { label: 'オレンジ',     grad: 'linear-gradient(135deg,#c2410c,#f97316)' },
  { label: 'アンバー',     grad: 'linear-gradient(135deg,#b45309,#f59e0b)' },
  { label: 'イエロー',     grad: 'linear-gradient(135deg,#a16207,#ca8a04)' },
  // ダーク・ニュートラル系
  { label: 'バーガンディ', grad: 'linear-gradient(135deg,#7f1d1d,#991b1b)' },
  { label: 'ブラウン',     grad: 'linear-gradient(135deg,#431407,#7c2d12)' },
  { label: 'スレート',     grad: 'linear-gradient(135deg,#334155,#64748b)' },
  { label: 'グレー',       grad: 'linear-gradient(135deg,#374151,#6b7280)' },
  { label: 'チャコール',   grad: 'linear-gradient(135deg,#111827,#374151)' },
  { label: 'ブラック',     grad: 'linear-gradient(135deg,#030712,#1f2937)' },
];
const DEFAULT_GRAD = COLORS[0].grad;

// ── 状態管理 ─────────────────────────────────
let state = { screen: 'home', categoryId: null, articleId: null };
let listeners   = [];   // Firebase off() 用
let saveTimer   = null;
let catSortable = null;
let artSortable = null;
let navHistory  = [];   // 画面履歴スタック
let isDragging  = false; // ドラッグ並び替え中ガードフラグ

// ── エディター内容の即時強制保存 ─────────────────
function forceSaveEditorContent() {
  if (state.screen !== 'editor' || !state.articleId || !state.categoryId) return;
  const editor = document.getElementById('edContent');
  if (!editor) return;
  
  if (saveTimer) clearTimeout(saveTimer);
  
  const content = editor.innerHTML;
  db.ref(`articles/${state.categoryId}/${state.articleId}`).update({
    content: content,
    updatedAt: Date.now()
  }).catch(err => console.error("Force save error:", err));
}

// ── 画面遷移 ─────────────────────────────────
function goTo(screen, categoryId = null, articleId = null) {
  // エディターから遷移する場合は即座に強制保存
  if (state.screen === 'editor') forceSaveEditorContent();

  // 履歴管理
  if (screen === 'home') {
    navHistory = [];  // ホームへ戻ると履歴リセット
  } else {
    navHistory.push({ screen: state.screen, categoryId: state.categoryId, articleId: state.articleId });
  }

  // 前の画面のリスナーをすべて解除
  listeners.forEach(fn => fn());
  listeners = [];
  if (saveTimer) clearTimeout(saveTimer);

  state = { screen, categoryId, articleId };

  const app = document.getElementById('app');
  app.classList.remove('visible');

  setTimeout(() => {
    app.innerHTML = '';
    if (screen === 'home')     renderHome(app);
    if (screen === 'category') renderCategory(app);
    if (screen === 'editor')   renderEditor(app);
    app.classList.add('visible');
  }, 180);
}

// ── 1つ前の画面へ戻る ────────────────────────
function goBack() {
  if (navHistory.length === 0) return;

  // エディターから戻る場合は即座に強制保存
  if (state.screen === 'editor') forceSaveEditorContent();

  const prev = navHistory.pop();

  listeners.forEach(fn => fn());
  listeners = [];
  if (saveTimer) clearTimeout(saveTimer);

  state = { screen: prev.screen, categoryId: prev.categoryId, articleId: prev.articleId };

  const app = document.getElementById('app');
  app.classList.remove('visible');
  setTimeout(() => {
    app.innerHTML = '';
    if (state.screen === 'home')     renderHome(app);
    if (state.screen === 'category') renderCategory(app);
    if (state.screen === 'editor')   renderEditor(app);
    app.classList.add('visible');
  }, 180);
}

// ── 右スワイプで戻る ─────────────────────
function addSwipeBack(el, onSwipe) {
  let sx = 0, sy = 0;
  const onStart = e => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  };
  const onEnd = e => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = Math.abs(e.changedTouches[0].clientY - sy);
    // 横方向の移動が縦の移動の2倍以上の場合のみ実行（斜めスワイプを厳格に排除）
    if (dx > 80 && dy < dx * 0.5) onSwipe();
  };
  el.addEventListener('touchstart', onStart, { passive: true });
  el.addEventListener('touchend',   onEnd,   { passive: true });
  // 画面遷移時に必ず削除されるよう listeners に登録
  listeners.push(() => {
    el.removeEventListener('touchstart', onStart);
    el.removeEventListener('touchend',   onEnd);
  });
}

// ── プルダウンで新規メモ作成 ──────────────────────
function addPullToCreate(el) {
  const THRESHOLD = 80;
  let startX = -1;
  let startY = -1;
  let indicator = null;
  let isCancelled = false;

  const mkIndicator = () => {
    const d = document.createElement('div');
    d.className = 'pull-indicator';
    el.parentElement.insertBefore(d, el);
    return d;
  };

  const onStart = e => {
    // 並び替えドラッグ操作中の場合は新規作成を完全にガード
    if (isDragging) { startY = -1; return; }

    if (el.scrollTop === 0) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isCancelled = false;
    } else {
      startY = -1;
    }
  };
  const onMove = e => {
    if (startY < 0 || isCancelled || isDragging) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    // 横ブレを監視：横スワイプ等の動作（横移動が15pxを超え、かつ縦移動の60%以上）を検知したら即時キャンセル
    if (Math.abs(dx) > 15 && Math.abs(dx) > dy * 0.6) {
      isCancelled = true;
      if (indicator) { indicator.remove(); indicator = null; }
      return;
    }

    if (dy <= 0) { startY = -1; return; }
    if (!indicator) indicator = mkIndicator();
    const ratio = Math.min(dy / THRESHOLD, 1);
    indicator.style.height  = `${Math.min(dy * 0.6, 48)}px`;
    indicator.style.opacity = String(ratio);
    indicator.textContent   = ratio >= 1 ? '✚ 離して新規メモ' : '↓ 引いて新規メモ';
    indicator.classList.toggle('pull-ready', ratio >= 1);
  };
  const onEnd = e => {
    if (startY < 0 || isCancelled || isDragging) {
      if (indicator) { indicator.remove(); indicator = null; }
      startY = -1;
      return;
    }
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (indicator) { indicator.remove(); indicator = null; }
    
    // 最終判定：しっかり縦方向に引っ張られ、横ブレが半分以下の時だけ新規作成
    if (dy >= THRESHOLD && Math.abs(dx) < dy * 0.5) {
      createArticle(true);
    }
    startY = -1;
  };

  el.addEventListener('touchstart', onStart, { passive: true });
  el.addEventListener('touchmove',  onMove,  { passive: true });
  el.addEventListener('touchend',   onEnd,   { passive: true });
  listeners.push(() => {
    el.removeEventListener('touchstart', onStart);
    el.removeEventListener('touchmove',  onMove);
    el.removeEventListener('touchend',   onEnd);
  });
}

// ── HTML → 行配列（安全な改行認識） ──────────────
function htmlToLines(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi,   '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi,  '\n');
  return (tmp.textContent || '').split('\n').map(l => l.trim()).filter(Boolean);
}

// ── Markdown 記号を除去 ────────────────────────
function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')           // # 見出し
    .replace(/\*\*(.*?)\*\*/g, '$1')        // **太字**
    .replace(/__(.*?)__/g, '$1')            // __太字__
    .replace(/\*(.*?)\*/g, '$1')            // *斜体*
    .replace(/_(.*?)_/g, '$1')              // _斜体_
    .replace(/~~(.*?)~~/g, '$1')            // ~~取り消し線~~
    .replace(/`{3}[\s\S]*?`{3}/g, '')       // ```コードブロック```
    .replace(/`([^`]+)`/g, '$1')            // `インライン`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [リンク](url)→テキスト
    .replace(/^>\s+/gm, '')                 // > 引用
    .replace(/^[-*+]\s+/gm, '')             // - 箇条書き
    .replace(/^\d+\.\s+/gm, '')             // 1. 番号リスト
    .replace(/^[-*]{3,}\s*$/gm, '')         // --- 水平線
    .trim();
}

// ── DOMのテキストノードからMarkdownを除去（画像などは保持） ─────
function stripMarkdownFromDOM(el) {
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = stripMarkdown(node.textContent);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'IMG') {
      stripMarkdownFromDOM(node);
    }
  });
}

// ============================================
//  SCREEN A: ホーム（カテゴリグリッド）
// ============================================
function renderHome(container) {
  container.innerHTML = `
    <div class="screen-home">
      <header class="app-header">
        <h1 class="app-title">📋 PCスマホ連動メモ</h1>
        <button class="btn-icon accent" id="btnAddCat" title="カテゴリを追加">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </header>
      <div class="category-grid" id="catGrid">
        <div class="loading-spinner">読み込み中…</div>
      </div>
    </div>`;

  document.getElementById('btnAddCat').onclick = () => showCategoryModal();

  const ref = db.ref('categories');
  const handler = ref.on('value', snap => {
    const grid = document.getElementById('catGrid');
    if (!grid) return;

    const data = snap.val();
    if (!data) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">📁</div>
          <p>カテゴリがまだありません</p>
          <button class="btn-primary" id="btnFirstCat">最初のカテゴリを作成</button>
        </div>`;
      document.getElementById('btnFirstCat').onclick = () => showCategoryModal();
      return;
    }

    const cats = Object.entries(data)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    grid.innerHTML = '';
    cats.forEach(cat => {
      const grad = cat.color || DEFAULT_GRAD;
      const card = document.createElement('div');
      card.className = 'category-card';
      card.dataset.id = cat.id;
      card.style.background = grad;
      card.innerHTML = `
        <button class="cat-edit-btn" title="編集">✏️</button>
        <span class="cat-name">${esc(cat.name)}</span>`;

      // 全角・半角の文字数をスマートに換算し、CSS変数としてセット（CSS側でレスポンシブ自動調整）
      const vLen = getVirtualLength(cat.name);
      card.style.setProperty('--char-len', vLen);

      card.querySelector('.cat-edit-btn').onclick = e => {
        e.stopPropagation();
        showCategoryModal(cat.id, cat.name, cat.color || DEFAULT_GRAD);
      };
      card.onclick = () => goTo('category', cat.id);
      grid.appendChild(card);
    });

    // ドラッグ並び替え初期化
    if (window.Sortable) {
      if (catSortable) catSortable.destroy();
      catSortable = Sortable.create(grid, {
        animation: 150,
        delay: 300,
        delayOnTouchOnly: true,
        forceFallback: true,            // タッチ操作の並び替え安定化
        fallbackOnBody: false,          // bodyに移設せず位置ズレを完全防止
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        fallbackClass: 'sortable-fallback-simple', // 拡大・ズレのない極めてシンプルな指追従スタイル
        onStart: () => { grid.style.overflow = 'visible'; },
        onEnd: async evt => {
          grid.style.overflow = '';
          const cards = grid.querySelectorAll('.category-card');
          const updates = {};
          cards.forEach((c, i) => { updates[`categories/${c.dataset.id}/order`] = i; });
          await db.ref().update(updates);
        }
      });
    }
  });
  listeners.push(() => {
    ref.off('value', handler);
    if (catSortable) { catSortable.destroy(); catSortable = null; }
  });
}

// ── カテゴリ追加/編集モーダル（色選択統合版） ────────────
function showCategoryModal(catId = null, currentName = '', currentColor = null) {
  let selectedGrad = currentColor || COLORS[0].grad;

  document.getElementById('modal-root').innerHTML = `
    <div class="modal-overlay" id="modal">
      <div class="modal-box">
        <h3>${catId ? 'カテゴリを編集' : '新しいカテゴリ'}</h3>
        <input id="catInput" class="modal-input" type="text"
               placeholder="カテゴリ名（例: 料理、IT）"
               value="${esc(currentName)}" />
        <div class="color-grid" id="colorGrid"></div>
        <div class="modal-actions">
          ${catId ? `<button class="btn-danger" id="mDel">削除</button>` : ''}
          <button class="btn-secondary" id="mCancel">キャンセル</button>
          <button class="btn-primary"   id="mSave">${catId ? '保存' : '追加'}</button>
        </div>
      </div>
    </div>`;

  const input = document.getElementById('catInput');
  const grid  = document.getElementById('colorGrid');
  const close = () => { document.getElementById('modal-root').innerHTML = ''; };
  input.focus(); input.select();

  // 色スウォッチをグリッドに追加
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (c.grad === selectedGrad ? ' selected' : '');
    sw.style.background = c.grad;
    sw.title = c.label;
    sw.onclick = () => {
      grid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      selectedGrad = c.grad;
    };
    grid.appendChild(sw);
  });

  document.getElementById('mCancel').onclick = close;
  document.getElementById('modal').onclick = e => { if (e.target.id === 'modal') close(); };

  document.getElementById('mSave').onclick = async () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    if (catId) {
      await db.ref(`categories/${catId}`).update({ name, color: selectedGrad });
    } else {
      await db.ref('categories').push({
        name, color: selectedGrad, order: Date.now(), createdAt: Date.now()
      });
    }
    close();
  };

  if (catId) {
    document.getElementById('mDel').onclick = async () => {
      if (!confirm(`「${currentName}」を削除します。\n中のメモもすべて消えます。よろしいですか？`)) return;
      await db.ref(`categories/${catId}`).remove();
      await db.ref(`articles/${catId}`).remove();
      close();
    };
  }

  input.onkeydown = e => {
    if (e.key === 'Enter') document.getElementById('mSave').click();
    if (e.key === 'Escape') close();
  };
}

// ============================================
//  SCREEN B: カテゴリ内記事一覧
// ============================================
function renderCategory(container) {
  container.innerHTML = `
    <div class="screen-category">
      <header class="app-header">
        <button class="btn-icon" id="btnHome" title="ホームへ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/>
          </svg>
        </button>
        <h2 class="screen-title" id="catTitle">…</h2>
        <button class="btn-icon accent" id="btnNewArt" title="新規メモ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </header>
      <ul class="article-list" id="artList">
        <div class="loading-spinner">読み込み中…</div>
      </ul>
    </div>`;

  document.getElementById('btnHome').onclick   = () => goTo('home');
  document.getElementById('btnNewArt').onclick = () => createArticle();
  addSwipeBack(container, () => goBack());
  addPullToCreate(document.getElementById('artList'));

  // カテゴリ名・色
  let catColor = DEFAULT_GRAD;
  const cRef = db.ref(`categories/${state.categoryId}`);
  const cHandler = cRef.on('value', snap => {
    const val = snap.val();
    if (!val) return;
    const titleEl = document.getElementById('catTitle');
    if (titleEl) titleEl.textContent = val.name;
    catColor = val.color || DEFAULT_GRAD;
    // article-listにCSS変数としてセット → CSSで自動継承
    const artList = document.getElementById('artList');
    if (artList) artList.style.setProperty('--cat-color', catColor);
  });
  listeners.push(() => cRef.off('value', cHandler));

  // 記事一覧
  const aRef = db.ref(`articles/${state.categoryId}`);
  const aHandler = aRef.on('value', snap => {
    const list = document.getElementById('artList');
    if (!list) return;
    const data = snap.val();

    if (!data) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>メモがまだありません</p>
          <button class="btn-primary" id="btnFirstArt">最初のメモを作成</button>
        </div>`;
      document.getElementById('btnFirstArt').onclick = () => createArticle();
      return;
    }

    const arts = Object.entries(data)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return b.order - a.order; // 新規（order大）が上に来るよう降順ソート
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });

    list.innerHTML = '';
    arts.forEach((art, i) => {
      // HTML → 行分割（<p>や<br>を改行として扱う）
      const textLines = htmlToLines(art.content);
      const title   = textLines[0] || '（タイトルなし）';
      const preview = textLines.slice(1).join(' ').slice(0, 60) || '内容がありません';

      const li = document.createElement('li');
      li.className = 'article-item';
      li.dataset.id = art.id;
      li.style.animationDelay = `${i * 40}ms`;
      li.innerHTML = `
        <div class="article-inner">
          <div class="article-title">${esc(title)}</div>
          <div class="article-preview">${esc(preview)}</div>
        </div>
        <div class="swipe-actions">
          <button class="swipe-action-btn swipe-action-move">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            移動
          </button>
          <button class="swipe-action-btn swipe-action-delete">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            削除
          </button>
        </div>`;

      // カード本体タップ→エディター
      li.querySelector('.article-inner').onclick = () => goTo('editor', state.categoryId, art.id);

      // 移動ボタン
      li.querySelector('.swipe-action-move').onclick = e => {
        e.stopPropagation();
        showMoveModal(art.id, state.categoryId);
      };

      // 削除ボタン
      li.querySelector('.swipe-action-delete').onclick = e => {
        e.stopPropagation();
        deleteArticleById(art.id, state.categoryId);
      };

      // 左スワイプ検出
      let txStart = 0, tyStart = 0;
      li.addEventListener('touchstart', e => {
        txStart = e.touches[0].clientX;
        tyStart = e.touches[0].clientY;
      }, { passive: true });
      li.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - txStart;
        const dy = Math.abs(e.changedTouches[0].clientY - tyStart);
        if (Math.abs(dx) > 50 && dy < 80) {
          if (dx < 0) {
            // 他を閉じてこれを開く
            document.querySelectorAll('.article-item.swiped').forEach(el => {
              if (el !== li) el.classList.remove('swiped');
            });
            li.classList.add('swiped');
          } else {
            li.classList.remove('swiped');
          }
        }
      }, { passive: true });

      list.appendChild(li);
    });

    // ドラッグ並び替え初期化
    if (window.Sortable) {
      if (artSortable) artSortable.destroy();
      artSortable = Sortable.create(list, {
        animation: 150,
        delay: 300,
        delayOnTouchOnly: true,
        forceFallback: true,            // タッチ操作の並び替え安定化
        fallbackOnBody: false,          // bodyに移設せず位置ズレを完全防止
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        fallbackClass: 'sortable-fallback-simple', // 拡大・ズレのない極めてシンプルな指追従スタイル
        onStart: () => {
          isDragging = true; // 並び替えドラッグ中フラグをON
          list.style.overflow = 'visible';
        },
        onEnd: async evt => {
          isDragging = false; // 並び替えドラッグ中フラグをOFF
          list.style.overflow = '';
          const items = list.querySelectorAll('.article-item');
          const updates = {};
          const total = items.length;
          items.forEach((item, i) => {
            // 降順ソートに合わせて、上にあるものほど order を大きくする（total - i）
            updates[`articles/${state.categoryId}/${item.dataset.id}/order`] = total - i;
          });
          await db.ref().update(updates);
        }
      });
    }
  });
  listeners.push(() => {
    aRef.off('value', aHandler);
    if (artSortable) { artSortable.destroy(); artSortable = null; }
  });
}

// カードを別カテゴリへ移動するモーダル
async function showMoveModal(artId, currentCatId) {
  const snap = await db.ref('categories').once('value');
  const cats = snap.val();
  if (!cats) return;
  const others = Object.entries(cats)
    .filter(([id]) => id !== currentCatId)
    .map(([id, v]) => ({ id, name: v.name, color: v.color }));
  if (others.length === 0) { alert('移動先のカテゴリがありません'); return; }

  const overlay = document.createElement('div');
  overlay.className = 'move-modal-overlay';
  overlay.innerHTML = `
    <div class="move-modal">
      <div class="move-modal-header">
        <span>移動先を選択</span>
        <button class="move-modal-close" id="moveCancelBtn">キャンセル</button>
      </div>
      <ul class="move-cat-list">
        ${others.map(c => `
          <li class="move-cat-item" data-cat-id="${c.id}"
            style="border-left:4px solid ${c.color || '#6366f1'}">
            ${esc(c.name || '（名前なし）')}
          </li>`).join('')}
      </ul>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#moveCancelBtn').onclick = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelectorAll('.move-cat-item').forEach(item => {
    item.onclick = async () => {
      const destCatId = item.dataset.catId;
      const artSnap = await db.ref(`articles/${currentCatId}/${artId}`).once('value');
      const artData = artSnap.val();
      if (!artData) { overlay.remove(); return; }
      await db.ref(`articles/${destCatId}/${artId}`).set(artData);
      await db.ref(`articles/${currentCatId}/${artId}`).remove();
      overlay.remove();
    };
  });
}

// カードを削除
async function deleteArticleById(artId, catId) {
  await db.ref(`articles/${catId}/${artId}`).remove();
}


function createArticle(noTransition = false) {
  // 通信を待たずにクライアント側で即座に一意なID（キー）を生成（遅延ゼロ）
  const newRef = db.ref(`articles/${state.categoryId}`).push();
  const newKey = newRef.key;

  // バックグラウンドで初期データを保存（画面遷移を待たせない）
  newRef.set({
    content: '', createdAt: Date.now(), updatedAt: Date.now(), order: Date.now()
  }).catch(err => console.error(err));

  if (noTransition) {
    // 一覧を経由せず、トランジションのディレイも完全にバイパスして即座にエディターを表示
    listeners.forEach(fn => fn());
    listeners = [];
    if (saveTimer) clearTimeout(saveTimer);
    navHistory.push({ screen: state.screen, categoryId: state.categoryId, articleId: state.articleId });
    state = { screen: 'editor', categoryId: state.categoryId, articleId: newKey };
    
    const appEl = document.getElementById('app');
    appEl.classList.remove('visible');
    appEl.innerHTML = '';
    renderEditor(appEl);
    appEl.classList.add('visible'); // setTimeoutによる180ms遅延を完全に排除
  } else {
    goTo('editor', state.categoryId, newKey);
  }
}

// ============================================
//  SCREEN C: 記事エディター（リッチ対応）
// ============================================
function renderEditor(container) {
  container.innerHTML = `
    <div class="screen-editor">
      <header class="app-header editor-header">
        <button class="btn-icon" id="btnBack" title="一覧へ戻る">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="save-status editing" id="saveStatus">読み込み中…</span>
        <div class="editor-header-actions">
          <button class="btn-icon" id="btnEdHome" title="ホームへ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/>
            </svg>
          </button>
          <button class="btn-icon danger" id="btnDel" title="削除">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </header>
      <div id="edContent" class="editor-content" contenteditable="true"
        data-placeholder="1行目がタイトルになります

2行目から本文を書いてください…"></div>
    </div>`;

  document.getElementById('btnBack').onclick   = () => goBack();
  document.getElementById('btnEdHome').onclick = () => goTo('home');
  document.getElementById('btnDel').onclick    = deleteArticle;
  addSwipeBack(container, () => goBack());

  // 罫線・特殊区切り文字を自動クリーンアップ＆スペース整形する関数
  function cleanAndFormatBorderLines(txt) {
    let t = txt || '';
    
    // 1. 横方向の罫線もどき（3つ以上連続する横線記号）の行を完全に削除
    const horizontalBorderRegex = /^[ \t]*([-_=\*~\+\.─━┄┅┈┉＝＊◆■★☆┌┐└┘├┤┬┴┼])\1{2,}[ \t]*$/gm;
    t = t.replace(horizontalBorderRegex, '');

    // 2. 縦方向の罫線・区切り記号（│, ┃, ├, ┤, ┼, ｜, |, │ 等）を適度な複数の半角スペースに置換
    const verticalBorderRegex = /[ \t　]*([│┃├┤┼｜\|┆┇┊┋┬┴])[ \t　]*/g;
    t = t.replace(verticalBorderRegex, '     '); // 5個の半角スペースに置き換えて美しく整形

    return t;
  }

  document.getElementById('edContent').addEventListener('paste', e => {
    e.preventDefault(); // デフォルトの貼り付けを阻止

    // テキスト：プレーンテキストとしてデータを取得（スタイルを完全除去）
    let text = e.clipboardData.getData('text/plain');
    if (!text) {
      const html = e.clipboardData.getData('text/html');
      if (html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        text = tmp.textContent || tmp.innerText || '';
      }
    }

    if (text) {
      // 1. 罫線もどきの除去とスペース整形
      const cleanedText = cleanAndFormatBorderLines(text);

      // 2. 改行・段落・インデント（空白）を完全に再現するためのHTMLフラグメント化
      const lines = cleanedText.split('\n');
      const fragment = document.createDocumentFragment();

      lines.forEach((line) => {
        // 空行（改行のみ）は段落間の改行（空行）として再現
        if (line.trim() === '') {
          const p = document.createElement('p');
          p.appendChild(document.createElement('br'));
          fragment.appendChild(p);
        } else {
          const p = document.createElement('p');
          // textContentを使うことで行頭の半角・全角スペース（インデント）を100%忠実に保持
          p.textContent = line;
          fragment.appendChild(p);
        }
      });

      // 3. カーソル位置に安全に流し込む（100%スタイル混入をシャットアウト）
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        sel.deleteFromDocument();
        const range = sel.getRangeAt(0);
        
        // フラグメントを挿入
        range.insertNode(fragment);
        
        // カーソルを挿入したコンテンツの末尾に移動
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        document.getElementById('edContent').appendChild(fragment);
      }
      // 自動保存を動かすためにinputイベントを発火
      document.getElementById('edContent').dispatchEvent(new Event('input'));
    }
  });

  // \u521d\u671f\u30b3\u30f3\u30c6\u30f3\u30c4\u8aad\u307f\u8fbc\u307f
  db.ref(`articles/${state.categoryId}/${state.articleId}`).once('value', snap => {
    const editor = document.getElementById('edContent');
    const status = document.getElementById('saveStatus');
    if (!editor) return;

    const raw = snap.val()?.content || '';

    // ── コンテンツをクリーンなHTMLに変換 ──────────────────
    let displayHTML;
    const isHTML = raw.trimStart().startsWith('<');

    if (!isHTML) {
      // プレーンテキスト or 破損（HTMLタグが文字として混入）
      const decoded = raw
        .replace(/<br\s*\/?>/gi,          '\n')   // <br>→改行
        .replace(/<\/?(div|p|h\d|li)[^>]*>/gi, '\n') // ブロックタグ→改行
        .replace(/<[^>]*>/g,              '')     // 残タグ除去
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); // エンティティ復元

      const lines = decoded.split('\n')
        .map(l => stripMarkdown(l.trim()))
        .filter(l => l.length > 0);

      displayHTML = lines.map(l => `<p>${esc(l)}</p>`).join('') || '<p><br></p>';
      editor.innerHTML = displayHTML;

      // 変換内容をFirebaseに保存（次回からHTMLとして正常ロード）
      db.ref(`articles/${state.categoryId}/${state.articleId}`)
        .update({ content: displayHTML, updatedAt: Date.now() })
        .catch(() => {});

    } else {
      // 正常なHTML：テキストノードのMarkdownだけ除去
      editor.innerHTML = raw;
      const before = editor.innerHTML;
      stripMarkdownFromDOM(editor);
      const after = editor.innerHTML;
      displayHTML = after;

      if (after !== before) {
        db.ref(`articles/${state.categoryId}/${state.articleId}`)
          .update({ content: after, updatedAt: Date.now() })
          .catch(() => {});
      }
    }

    if (status) { status.textContent = '保存済み ✓'; status.className = 'save-status saved'; }
    editor.focus();

    // 自動保存（1秒デバウンス）
    editor.oninput = () => {
      if (status) { status.textContent = '編集中…'; status.className = 'save-status editing'; }
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          await db.ref(`articles/${state.categoryId}/${state.articleId}`).update({
            content: editor.innerHTML, updatedAt: Date.now()
          });
          const s = document.getElementById('saveStatus');
          if (s) { s.textContent = '保存済み ✓'; s.className = 'save-status saved'; }
        } catch {
          const s = document.getElementById('saveStatus');
          if (s) { s.textContent = '保存失敗 ✗'; s.className = 'save-status error'; }
        }
      }, 1000);
    };
  });
}

async function deleteArticle() {
  await db.ref(`articles/${state.categoryId}/${state.articleId}`).remove();
  goTo('category', state.categoryId);
}

// ── ユーティリティ ───────────────────────────
function getVirtualLength(str) {
  let len = 0;
  for (let i = 0; i < (str || '').length; i++) {
    if (str.charCodeAt(i) <= 127) {
      len += 0.5;
    } else {
      len += 1.0;
    }
  }
  return len;
}

function esc(str) {
  return String(str || '').replace(/[&<>'"]/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])
  );
}

// ── 起動 ────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => goTo('home'));
