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

// ── カラーパレット ────────────────────────────────────
const COLORS = [
  { label: 'パープル', grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { label: 'オレンジ', grad: 'linear-gradient(135deg,#f97316,#fb923c)' },
  { label: 'グリーン', grad: 'linear-gradient(135deg,#10b981,#34d399)' },
  { label: 'ブルー',   grad: 'linear-gradient(135deg,#3b82f6,#60a5fa)' },
  { label: 'ピンク',   grad: 'linear-gradient(135deg,#ec4899,#f472b6)' },
  { label: 'イエロー', grad: 'linear-gradient(135deg,#eab308,#facc15)' },
  { label: 'レッド',   grad: 'linear-gradient(135deg,#ef4444,#f87171)' },
  { label: 'ティール', grad: 'linear-gradient(135deg,#14b8a6,#2dd4bf)' },
  { label: 'インディゴ', grad: 'linear-gradient(135deg,#4f46e5,#818cf8)' },
  { label: 'スレート', grad: 'linear-gradient(135deg,#64748b,#94a3b8)' },
];
const DEFAULT_GRAD = COLORS[0].grad;

// ── 状態管理 ─────────────────────────────────
let state = { screen: 'home', categoryId: null, articleId: null };
let listeners   = [];   // Firebase off() 用
let saveTimer   = null;
let catSortable = null;
let artSortable = null;
let navHistory  = [];   // 画面履歴スタック

// ── 画面遷移 ─────────────────────────────────
function goTo(screen, categoryId = null, articleId = null) {
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
    if (dx > 80 && dy < 80) onSwipe();
  };
  el.addEventListener('touchstart', onStart, { passive: true });
  el.addEventListener('touchend',   onEnd,   { passive: true });
  // 画面遷移時に必ず削除されるよう listeners に登録
  listeners.push(() => {
    el.removeEventListener('touchstart', onStart);
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
        <h1 class="app-title">📋 ハウツー解説</h1>
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
        animation: 200,
        delay: 400,
        delayOnTouchOnly: true,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: async () => {
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

// ── カテゴリ追加/編集モーダル ────────────────
function showCategoryModal(catId = null, currentName = '', currentColor = null) {
  document.getElementById('modal-root').innerHTML = `
    <div class="modal-overlay" id="modal">
      <div class="modal-box">
        <h3>${catId ? 'カテゴリを編集' : '新しいカテゴリ'}</h3>
        <input id="catInput" class="modal-input" type="text"
               placeholder="カテゴリ名（例: 料理、IT）"
               value="${esc(currentName)}" maxlength="8" />
        <div class="modal-actions">
          ${catId ? `<button class="btn-danger"    id="mDel">削除</button>` : ''}
          ${catId ? `<button class="btn-secondary" id="mColor">🎨 色</button>` : ''}
          <button class="btn-secondary" id="mCancel">キャンセル</button>
          <button class="btn-primary"   id="mSave">${catId ? '保存' : '追加'}</button>
        </div>
      </div>
    </div>`;

  const input  = document.getElementById('catInput');
  const close  = () => { document.getElementById('modal-root').innerHTML = ''; };
  input.focus(); input.select();

  document.getElementById('mCancel').onclick = close;
  document.getElementById('modal').onclick = e => { if (e.target.id === 'modal') close(); };

  document.getElementById('mSave').onclick = async () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    if (catId) {
      await db.ref(`categories/${catId}`).update({ name });
    } else {
      await db.ref('categories').push({ name, order: Date.now(), createdAt: Date.now() });
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
    document.getElementById('mColor').onclick = () => {
      close();
      showColorPicker(catId, currentColor || DEFAULT_GRAD);
    };
  }

  input.onkeydown = e => {
    if (e.key === 'Enter') document.getElementById('mSave').click();
    if (e.key === 'Escape') close();
  };
}

// ── カラーピッカーモーダル ────────────────────────────────
function showColorPicker(catId, currentGrad) {
  document.getElementById('modal-root').innerHTML = `
    <div class="modal-overlay" id="modal">
      <div class="modal-box">
        <h3>🎨 カラーを選択</h3>
        <div class="color-grid" id="colorGrid"></div>
        <div class="modal-actions">
          <button class="btn-secondary" id="mCancel">キャンセル</button>
        </div>
      </div>
    </div>`;

  const grid = document.getElementById('colorGrid');
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (c.grad === currentGrad ? ' selected' : '');
    sw.style.background = c.grad;
    sw.title = c.label;
    sw.onclick = async () => {
      await db.ref(`categories/${catId}`).update({ color: c.grad });
      document.getElementById('modal-root').innerHTML = '';
    };
    grid.appendChild(sw);
  });

  const close = () => { document.getElementById('modal-root').innerHTML = ''; };
  document.getElementById('mCancel').onclick = close;
  document.getElementById('modal').onclick = e => { if (e.target.id === 'modal') close(); };
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

  // カテゴリ名
  const cRef = db.ref(`categories/${state.categoryId}`);
  const cHandler = cRef.on('value', snap => {
    const el = document.getElementById('catTitle');
    if (el && snap.val()) el.textContent = snap.val().name;
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
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
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
        animation: 200,
        delay: 400,
        delayOnTouchOnly: true,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: async () => {
          const items = list.querySelectorAll('.article-item');
          const updates = {};
          items.forEach((item, i) => {
            updates[`articles/${state.categoryId}/${item.dataset.id}/order`] = i;
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

async function createArticle() {
  const ref = await db.ref(`articles/${state.categoryId}`).push({
    content: '', createdAt: Date.now(), updatedAt: Date.now()
  });
  goTo('editor', state.categoryId, ref.key);
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
      <div class="editor-toolbar">
        <button class="toolbar-btn" id="btnImg">📷 画像を追加</button>
        <input type="file" id="imgFile" accept="image/*" style="display:none" />
      </div>
      <div id="edContent" class="editor-content" contenteditable="true"
        data-placeholder="1行目がタイトルになります

2行目から本文を書いてください…"></div>
    </div>`;

  document.getElementById('btnBack').onclick   = () => goBack();
  document.getElementById('btnEdHome').onclick = () => goTo('home');
  document.getElementById('btnDel').onclick    = deleteArticle;
  addSwipeBack(container, () => goBack());

  // ── 画像圧縮（Canvas経由、最大800px・JPEG 75%） ────────────
  function compressImage(src, maxW = 800, quality = 0.75) {
    return new Promise(resolve => {
      const imgEl = new Image();
      imgEl.onload = () => {
        let w = imgEl.width, h = imgEl.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(imgEl, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      imgEl.src = src;
    });
  }

  // ── エディタに画像を挿入 ───────────────────────
  function insertImageToEditor(src) {
    const editor = document.getElementById('edContent');
    if (!editor) return;
    editor.focus();
    const img = document.createElement('img');
    img.src = src;
    img.className = 'inserted-img';
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const br = document.createElement('br');
      range.insertNode(br);
      range.insertNode(img);
      range.setStartAfter(br);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editor.appendChild(img);
    }
    editor.dispatchEvent(new Event('input'));
  }

  // 📷 画像挿入（ファイル選択）
  document.getElementById('btnImg').onclick = () => document.getElementById('imgFile').click();
  document.getElementById('imgFile').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const compressed = await compressImage(ev.target.result);
      insertImageToEditor(compressed);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 📋 クリップボードから貼り付け（PC: Ctrl+V）
  document.getElementById('edContent').addEventListener('paste', e => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 画像があれば優先処理（圧縮して挿入）
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = async ev => {
          const compressed = await compressImage(ev.target.result);
          insertImageToEditor(compressed);
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // テキストの場合：Markdown記号を除去して挿入
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      e.preventDefault();
      const clean = stripMarkdown(text);
      document.execCommand('insertText', false, clean);
    }
  });

  // \u521d\u671f\u30b3\u30f3\u30c6\u30f3\u30c4\u8aad\u307f\u8fbc\u307f
  db.ref(`articles/${state.categoryId}/${state.articleId}`).once('value', snap => {
    const editor = document.getElementById('edContent');
    const status = document.getElementById('saveStatus');
    if (!editor) return;

    const raw = snap.val()?.content || '';
    // 旧データ（プレーンテキスト）との互換
    if (raw && !raw.startsWith('<')) {
      editor.innerHTML = raw.split('\n').map(l =>
        `<p>${esc(l) || '<br>'}</p>`
      ).join('');
    } else {
      editor.innerHTML = raw;
    }
    // ロード時にMarkdownを除去（テキストノードのみ・画像は保持）
    stripMarkdownFromDOM(editor);
    const cleaned = editor.innerHTML;
    // 変化があればFirebaseに上書き保存
    if (cleaned !== raw) {
      db.ref(`articles/${state.categoryId}/${state.articleId}`).update({
        content: cleaned, updatedAt: Date.now()
      });
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
  const editor = document.getElementById('edContent');
  const tmp = document.createElement('div');
  tmp.innerHTML = editor?.innerHTML || '';
  const title = (tmp.innerText || tmp.textContent || '').split('\n')[0].trim() || '（タイトルなし）';
  if (!confirm(`「${title}」を削除しますか？`)) return;
  await db.ref(`articles/${state.categoryId}/${state.articleId}`).remove();
  goTo('category', state.categoryId);
}

// ── ユーティリティ ───────────────────────────
function esc(str) {
  return String(str || '').replace(/[&<>'"]/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])
  );
}

// ── 起動 ────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => goTo('home'));
