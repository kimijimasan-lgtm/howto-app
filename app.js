// ============================================
//  ハウツー解説 v2 – app.js
//  Firebase Realtime Database (CDN compat)
// ============================================

// ── Firebase CDN 読み込みエラー検出 ──
if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined' || typeof firebase.auth === 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const errDiv = document.createElement('div');
    errDiv.style.position = 'fixed';
    errDiv.style.inset = '0';
    errDiv.style.background = '#1e293b';
    errDiv.style.color = '#f1f5f9';
    errDiv.style.padding = '2rem';
    errDiv.style.zIndex = '999999';
    errDiv.style.fontFamily = 'sans-serif';
    errDiv.style.lineHeight = '1.6';
    
    let reason = "インターネット環境がないか、セキュリティによりアプリが起動できません。";
    if (typeof firebase !== 'undefined' && typeof firebase.auth === 'undefined') {
      reason = "ブラウザの強力なキャッシュ機能により、古いHTMLと新しいプログラムが混ざって競合しています（認証ライブラリが未ロード）。";
    }

    errDiv.innerHTML = `
      <h1 style="font-size: 1.5rem; color: #f43f5e; margin-bottom: 1rem;">⚠️ アプリ起動エラー（キャッシュ不整合）</h1>
      <p style="font-weight: 700; margin-bottom: 1rem;">${reason}</p>
      <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.9rem; line-height: 1.6;">
        <strong>💡 超簡単な解決策：</strong><br>
        1. ブラウザで<strong>「ページを再読み込み（リロード）」</strong>を数回行ってください。<br>
        2. それでも解消しない場合は、Safariの<strong>「プライベートブラウズモード」</strong>（Chromeの場合はシークレットモード）で開いていただくか、ブラウザのキャッシュ（履歴とWebサイトデータ）をクリアしてください。これで最新版が読み込まれて完全に解決します！
      </div>
    `;
    document.body.appendChild(errDiv);
  });
  throw new Error("Firebase library is not loaded properly");
}

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
let state = { screen: 'home', categoryId: null, articleId: null, uid: null };
let listeners   = [];   // Firebase off() 用
let saveTimer   = null;
let catSortable = null;
let artSortable = null;
let navHistory  = [];   // 画面履歴スタック
let isDragging  = false; // ドラッグ並び替え中ガードフラグ
let paraSortable = null;
let paraSwipeListeners = [];
let justEditedArticleId = null;  // 直前に編集したカードのID（フラッシュ明滅用）
let lastDeletedContent = null;   // 削除直前のエディタHTML（Undo用）

// ── エディター内容の即時強制保存 ─────────────────
function forceSaveEditorContent() {
  if (state.screen !== 'editor' || !state.articleId || !state.categoryId || !state.uid) return;
  const editor = document.getElementById('edContent');
  if (!editor) return;
  
  if (saveTimer) clearTimeout(saveTimer);
  
  // 保存時は確実にスワイプなどの付帯タグを取り除いたクリーンなHTMLを保存する
  const cleanHTML = getCleanEditorHTML(editor);
  
  db.ref(`users/${state.uid}/articles/${state.categoryId}/${state.articleId}`).update({
    content: cleanHTML,
    updatedAt: Date.now()
  }).catch(err => console.error("Force save error:", err));

  // リスナー解放
  cleanupNativeParagraphListeners(editor);
}

// ── 画面遷移 ─────────────────────────────────
function goTo(screen, categoryId = null, articleId = null, skipSave = false) {
  // エディターから遷移する場合は即座に強制保存
  if (state.screen === 'editor' && !skipSave) {
    justEditedArticleId = state.articleId;
    forceSaveEditorContent();
  }

  // 履歴管理
  if (screen === 'home' || screen === 'login') {
    navHistory = [];  // ホームやログインへ戻ると履歴リセット
  } else {
    navHistory.push({ screen: state.screen, categoryId: state.categoryId, articleId: state.articleId });
  }

  // 前の画面のリスナーをすべて解除
  listeners.forEach(fn => fn());
  listeners = [];
  if (saveTimer) clearTimeout(saveTimer);

  state = { screen, categoryId, articleId, uid: state.uid };

  const app = document.getElementById('app');
  app.classList.remove('visible');

  setTimeout(() => {
    app.innerHTML = '';
    if (!state.uid) {
      renderLogin(app);
    } else {
      if (screen === 'home')     renderHome(app);
      if (screen === 'category') renderCategory(app);
      if (screen === 'editor')   renderEditor(app);
    }
    app.classList.add('visible');
  }, 180);
}

// ── 1つ前の画面へ戻る ────────────────────────
function goBack(skipSave = false) {
  if (navHistory.length === 0) return;

  // エディターから戻る場合は即座に強制保存
  if (state.screen === 'editor' && !skipSave) {
    justEditedArticleId = state.articleId;
    forceSaveEditorContent();
  }

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
  let startTime = 0;
  const onStart = e => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    startTime = Date.now();
  };
  const onEnd = e => {
    // 文字選択（範囲選択）中である場合は絶対に無効化する
    if (window.getSelection().toString() !== '') return;

    // タッチ時間（フリックの素早さ）を判定（300ms以上かかるゆっくりしたドラッグ選択などは除外）
    const duration = Date.now() - startTime;
    if (duration > 300) return;

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
  if (!html) return [];
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  // スワイプチェックボックス ✔ など一時要素はパースから排除する
  const checkmarks = tmp.querySelectorAll('.para-checkbox');
  checkmarks.forEach(c => c.remove());

  // 子要素から行を抽出する（innerTextが未ロードDOMで改行を無視する問題を回避）
  const lines = [];
  Array.from(tmp.children).forEach(child => {
    const txt = child.textContent.trim();
    if (txt) {
      lines.push(txt);
    }
  });

  // 子要素が全くないフラットなテキストの場合のフォールバック
  if (lines.length === 0 && tmp.textContent.trim()) {
    return tmp.textContent.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
  }

  return lines;
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
        <button class="btn-icon btn-pc-only" id="btnShowQR" title="スマホ連動用QRコードを表示" style="margin-right: 0.25rem;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="3" height="3" rx="0.5"/>
            <rect x="18" y="18" width="3" height="3" rx="0.5"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
            <line x1="17" y1="7" x2="17.01" y2="7"/>
            <line x1="7" y1="17" x2="7.01" y2="17"/>
            <line x1="14" y1="18" x2="14.01" y2="18"/>
            <line x1="18" y1="14" x2="18.01" y2="14"/>
          </svg>
        </button>
        <h1 class="app-title">📋 PCスマホ連動メモ</h1>
        <button class="btn-icon accent" id="btnAddCat" title="カテゴリを追加">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button class="btn-icon danger btn-signout" id="btnSignOut" title="サインアウト">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </header>
      
      <div id="migrationBanner" style="background: rgba(249,115,22,0.1); border: 1.5px dashed var(--accent); border-radius: 14px; padding: 0.85rem 1rem; margin: 0.75rem 0.75rem 0 0.75rem; display: flex; flex-direction: column; align-items: flex-start; gap: 0.6rem; text-align: left; animation: popIn 0.3s ease;">
        <span style="font-size: 0.82rem; color: #fff; font-weight: 500; line-height: 1.5;">💡 過去にログインなし（QRコード方式）で書いていたメモを、このアカウントの安全な部屋に引っ越しさせますか？</span>
        <button class="btn-primary" id="btnMigrate" style="font-size: 0.78rem; padding: 0.4rem 0.9rem; border-radius: 8px; font-weight: 700; align-self: flex-end;">引っ越しを実行する</button>
      </div>

      <div class="category-grid" id="catGrid">
        <div class="loading-spinner">読み込み中…</div>
      </div>
    </div>`;

  document.getElementById('btnAddCat').onclick = () => showCategoryModal();
  const showQrBtn = document.getElementById('btnShowQR');
  if (showQrBtn) showQrBtn.onclick = () => showQRCodeModal();

  const migrateBtn = document.getElementById('btnMigrate');
  if (migrateBtn) {
    migrateBtn.onclick = async () => {
      if (confirm("過去にログインなしで書いていたメモを、このアカウントの安全な部屋に引っ越しさせます。よろしいですか？")) {
        migrateBtn.disabled = true;
        migrateBtn.textContent = "引っ越しを実行中…";
        await migrateOldDataToUserAccount();
      }
    };
  }
  
  const signoutBtn = document.getElementById('btnSignOut');
  if (signoutBtn) {
    signoutBtn.onclick = async () => {
      if (confirm("サインアウトしますか？")) {
        try {
          await firebase.auth().signOut();
        } catch (err) {
          console.error("SignOut error:", err);
        }
      }
    };
  }

  const ref = db.ref(`users/${state.uid}/categories`);
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
          cards.forEach((c, i) => { updates[`users/${state.uid}/categories/${c.dataset.id}/order`] = i; });
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
      await db.ref(`users/${state.uid}/categories/${catId}`).update({ name, color: selectedGrad });
    } else {
      await db.ref(`users/${state.uid}/categories`).push({
        name, color: selectedGrad, order: Date.now(), createdAt: Date.now()
      });
    }
    close();
  };

  if (catId) {
    document.getElementById('mDel').onclick = async () => {
      if (!confirm(`「${currentName}」を削除します。\n中のメモもすべて消えます。よろしいですか？`)) return;
      await db.ref(`users/${state.uid}/categories/${catId}`).remove();
      await db.ref(`users/${state.uid}/articles/${catId}`).remove();
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
        <div style="display: flex; gap: 0.25rem;">
          <button class="btn-icon" id="btnExportAll" title="このカテゴリの全メモを一括エクスポート">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button class="btn-icon accent" id="btnNewArt" title="新規メモ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </header>
      <ul class="article-list" id="artList">
        <div class="loading-spinner">読み込み中…</div>
      </ul>
    </div>`;

  document.getElementById('btnHome').onclick   = () => goTo('home');
  document.getElementById('btnExportAll').onclick = () => showExportAllModal(state.categoryId);
  document.getElementById('btnNewArt').onclick = () => createArticle();
  addSwipeBack(container, () => goBack());
  addPullToCreate(document.getElementById('artList'));

  // カテゴリ名・色
  let catColor = DEFAULT_GRAD;
  const cRef = db.ref(`users/${state.uid}/categories/${state.categoryId}`);
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
  const aRef = db.ref(`users/${state.uid}/articles/${state.categoryId}`);
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

      // 直前編集カードのフラッシュ効果（2秒間）
      if (art.id === justEditedArticleId) {
        li.classList.add('just-edited');
        setTimeout(() => {
          li.classList.remove('just-edited');
          justEditedArticleId = null; // アニメーション終了後にクリア
        }, 2000);
      }
      li.innerHTML = `
        <div class="article-inner">
          <div class="article-title">${esc(title)}</div>
          <div class="article-preview">${esc(preview)}</div>
        </div>
        <div class="swipe-actions">
          <button class="swipe-action-btn swipe-action-duplicate">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            複写
          </button>
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
      li.querySelector('.article-inner').onclick = () => {
        goTo('editor', state.categoryId, art.id);
      };

      // 複写ボタン
      li.querySelector('.swipe-action-duplicate').onclick = async e => {
        e.stopPropagation();
        li.classList.remove('swiped');
        await duplicateArticle(art.id, state.categoryId);
      };

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
            updates[`users/${state.uid}/articles/${state.categoryId}/${item.dataset.id}/order`] = total - i;
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
  const snap = await db.ref(`users/${state.uid}/categories`).once('value');
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
      const artSnap = await db.ref(`users/${state.uid}/articles/${currentCatId}/${artId}`).once('value');
      const artData = artSnap.val();
      if (!artData) { overlay.remove(); return; }
      await db.ref(`users/${state.uid}/articles/${destCatId}/${artId}`).set(artData);
      await db.ref(`users/${state.uid}/articles/${currentCatId}/${artId}`).remove();
      overlay.remove();
    };
  });
}

// カードを削除
async function deleteArticleById(artId, catId) {
  await db.ref(`users/${state.uid}/articles/${catId}/${artId}`).remove();
}

// ── 一括エクスポート選択モーダルの表示 ────────────────
function showExportAllModal(catId) {
  // そのカテゴリ内の全メモを順序順（画面の表示順と同じ降順ソート）で取得する
  db.ref(`users/${state.uid}/articles/${catId}`).once('value', snap => {
    const data = snap.val();
    if (!data) {
      alert('エクスポートするメモがありません。');
      return;
    }

    const articles = Object.entries(data)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return b.order - a.order; // 新しい（order大）順＝表示と同じ
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });

    if (articles.length === 0) {
      alert('エクスポートするメモがありません。');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'move-modal-overlay';
    overlay.innerHTML = `
      <div class="move-modal" style="padding: 1.5rem; max-height: 80vh;">
        <div class="move-modal-header" style="padding: 0 0 1rem 0; margin-bottom: 1rem; border-bottom: 1px solid var(--border);">
          <span style="font-size: 1.1rem; font-weight: 700;">全メモを一括エクスポート</span>
          <button class="move-modal-close" id="exportCloseBtn">キャンセル</button>
        </div>
        <ul class="move-cat-list" style="display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem 0;">
          <li class="btn-export-option" data-type="copy" style="padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.04); cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;">
            <span style="font-size: 1.5rem;">📋</span>
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">全データ連結コピー</div>
              <div style="font-size: 0.78rem; color: var(--text-sub); margin-top: 2px;">全メモを連結してクリップボードにコピーします</div>
            </div>
          </li>
          <li class="btn-export-option" data-type="text" style="padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.04); cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;">
            <span style="font-size: 1.5rem;">📝</span>
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">テキスト連結（.txt一括出力）</div>
              <div style="font-size: 0.78rem; color: var(--text-sub); margin-top: 2px;">全メモを連結したテキストファイルを保存します</div>
            </div>
          </li>
          <li class="btn-export-option" data-type="md" style="padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.04); cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;">
            <span style="font-size: 1.5rem;">✍️</span>
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Markdown連結（.md一括出力）</div>
              <div style="font-size: 0.78rem; color: var(--text-sub); margin-top: 2px;">全メモを統合したマークダウンファイルを保存します</div>
            </div>
          </li>
          <li class="btn-export-option" data-type="pdf" style="padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.04); cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;">
            <span style="font-size: 1.5rem;">📄</span>
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">PDF形式（一括保存）</div>
              <div style="font-size: 0.78rem; color: var(--text-sub); margin-top: 2px;">全メモを改ページ付きで美しくPDFファイルとして保存します</div>
            </div>
          </li>
          <li class="btn-export-option" data-type="html" style="padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.04); cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;">
            <span style="font-size: 1.5rem;">🌐</span>
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">HTML形式（画像・レイアウト維持一括保存）</div>
              <div style="font-size: 0.78rem; color: var(--text-sub); margin-top: 2px;">画像やスタイルを100%維持して、1つの美しいHTMLファイルとして保存します</div>
            </div>
          </li>
        </ul>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#exportCloseBtn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelectorAll('.btn-export-option').forEach(btn => {
      btn.onclick = () => {
        const type = btn.dataset.type;
        
        let typeName = '';
        if (type === 'copy') typeName = '全データ連結コピー';
        if (type === 'text') typeName = 'テキスト連結（.txt一括出力）';
        if (type === 'md') typeName = 'Markdown連結（.md一括出力）';
        if (type === 'pdf') typeName = 'PDF形式（一括保存）';
        if (type === 'html') typeName = 'HTML形式（画像・レイアウト維持一括保存）';

        if (confirm(`このカテゴリ内のすべてのメモを「${typeName}」でエクスポートします。よろしいですか？`)) {
          handleExportAllAction(type, articles);
          overlay.remove();
        }
      };
      btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.08)';
      btn.onmouseleave = () => btn.style.background = 'rgba(255,255,255,0.04)';
    });
  });
}

// ── 実際の一括エクスポート処理の実行 ──────────────────
function handleExportAllAction(type, articles) {
  const catTitleEl = document.getElementById('catTitle');
  const catName = catTitleEl ? catTitleEl.textContent : 'カテゴリ';

  if (type === 'copy') {
    let textData = `【${catName}】\n【1ページ目】\n\n`;
    textData += articles.map((art, idx) => {
      const lines = htmlToLines(art.content);
      const title = lines[0] || '（タイトルなし）';
      const body = lines.slice(1).join('\n');
      const articleText = `■ ${title}\n${body}`;
      if (idx === 0) {
        return articleText;
      } else {
        const pageNum = idx + 1;
        return `\n\n---- 【ここから${pageNum}ページ目】 ----\n\n${articleText}`;
      }
    }).join('');

    navigator.clipboard.writeText(textData)
      .then(() => alert('全メモをクリップボードに一括コピーしました！'))
      .catch(() => alert('コピーに失敗しました。'));
  }
  else if (type === 'text') {
    let textData = `【${catName}】\n【1ページ目】\n\n`;
    textData += articles.map((art, idx) => {
      const lines = htmlToLines(art.content);
      const title = lines[0] || '（タイトルなし）';
      const body = lines.slice(1).join('\n');
      const articleText = `■ ${title}\n${body}`;
      if (idx === 0) {
        return articleText;
      } else {
        const pageNum = idx + 1;
        return `\n\n---- 【ここから${pageNum}ページ目】 ----\n\n${articleText}`;
      }
    }).join('');

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${catName}_一括エクスポート.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  else if (type === 'md') {
    let mdData = `# 【${catName}】\n【1ページ目】\n\n`;
    mdData += articles.map((art, idx) => {
      const lines = htmlToLines(art.content);
      const title = lines[0] || '（タイトルなし）';
      const body = lines.slice(1).join('\n\n');
      const articleText = `## ${title}\n\n${body}`;
      if (idx === 0) {
        return articleText;
      } else {
        const pageNum = idx + 1;
        return `\n\n### 【ここから${pageNum}ページ目】\n\n${articleText}`;
      }
    }).join('');

    const blob = new Blob([mdData], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${catName}_一括エクスポート.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
  else if (type === 'pdf') {
    const cleanHTML = articles.map((art, idx) => {
      const lines = htmlToLines(art.content);
      const title = lines[0] || '（タイトルなし）';
      const cleanBody = lines.slice(1).map(l => `<p>${esc(l)}</p>`).join('');
      const pageBreak = idx < articles.length - 1 ? 'style="page-break-after: always;"' : '';
      
      let headerHTML = '';
      if (idx === 0) {
        headerHTML = `
          <div style="font-size: 1.2rem; font-weight: 700; color: #4f46e5; margin-bottom: 2rem;">【${esc(catName)}】</div>
          <div style="text-align: center; margin: 1rem 0 2rem 0; color: #9ca3af; font-size: 0.9rem; font-weight: 500;">
            ---- 【1ページ目】 ----
          </div>`;
      } else {
        const pageNum = idx + 1;
        headerHTML = `
          <div style="text-align: center; margin: 2rem 0; color: #9ca3af; font-size: 0.9rem; font-weight: 500;">
            ---- 【ここから${pageNum}ページ目】 ----
          </div>`;
      }

      return `
        <div class="article-pdf-section" ${pageBreak} style="margin-bottom: 3rem;">
          ${headerHTML}
          <h1 style="border-bottom: 2px solid #374151; padding-bottom: 0.75rem; font-size: 1.8rem; font-weight: 700; margin-bottom: 2rem; color: #111827;">${esc(title)}</h1>
          <div class="content" style="font-size: 1.05rem; line-height: 1.85; color: #1f2937; word-break: break-all; white-space: pre-wrap;">${cleanBody}</div>
        </div>`;
    }).join('');

    const element = document.createElement('div');
    element.style.fontFamily = "'Noto Sans JP', sans-serif";
    element.style.padding = "1cm";
    element.innerHTML = cleanHTML;

    const opt = {
      margin:       1.5,
      filename:     `${catName}_一括エクスポート.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  }
  else if (type === 'html') {
    const articlesHTML = articles.map((art, idx) => {
      const temp = document.createElement('div');
      temp.innerHTML = art.content || '';
      
      const paragraphs = Array.from(temp.children);
      let title = '（タイトルなし）';
      let bodyHTML = '';
      
      if (paragraphs.length > 0) {
        title = paragraphs[0].textContent || paragraphs[0].innerText || '（タイトルなし）';
        bodyHTML = paragraphs.slice(1).map(p => {
          // para-checkbox は除外してエクスポート
          const pClone = p.cloneNode(true);
          const chk = pClone.querySelector('.para-checkbox');
          if (chk) chk.remove();
          pClone.classList.remove('para-selected');
          pClone.removeAttribute('class');
          return pClone.outerHTML;
        }).join('');
      } else {
        bodyHTML = '<p><br></p>';
      }

      let separatorHTML = '';
      if (idx > 0) {
        const pageNum = idx + 1;
        separatorHTML = `<div class="page-separator">---- 【ここから${pageNum}ページ目】 ----</div>`;
      } else {
        separatorHTML = `<div class="page-separator" style="margin-top: 0.5rem; margin-bottom: 1.5rem;">---- 【1ページ目】 ----</div>`;
      }

      return `
        ${separatorHTML}
        <div class="article-section">
          <h2 class="article-title">${esc(title)}</h2>
          <div class="article-body">
            ${bodyHTML}
          </div>
        </div>`;
    }).join('');

    const fullHTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(catName)} - 一括エクスポート</title>
  <style>
    body {
      background-color: #0b0f19;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", sans-serif;
      line-height: 1.7;
      padding: 2rem 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .category-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #818cf8;
      border-bottom: 2px solid #312e81;
      padding-bottom: 0.5rem;
      margin-bottom: 2rem;
      text-align: center;
    }
    .article-section {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .article-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 1rem;
      border-bottom: 1px solid #374151;
      padding-bottom: 0.5rem;
    }
    .article-body {
      color: #d1d5db;
    }
    .article-body p {
      margin: 0.5rem 0;
      min-height: 1em;
    }
    .article-body img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 0.75rem 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .page-separator {
      text-align: center;
      margin: 2.5rem 0;
      color: #6b7280;
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="category-title">【${esc(catName)}】</div>
  ${articlesHTML}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${catName}_一括エクスポート.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}


function createArticle(noTransition = false) {
  // 通信を待たずにクライアント側で即座に一意なID（キー）を生成（遅延ゼロ）
  const newRef = db.ref(`users/${state.uid}/articles/${state.categoryId}`).push();
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
          <button class="btn-icon danger" id="btnBulkDelete" title="選択した段落を一括削除" style="display: none; background: rgba(239, 68, 68, 0.25); border: 1px solid var(--danger); width: 42px; height: 42px; margin-right: 0.5rem; border-radius: 12px; color: var(--danger); transition: transform 0.2s; align-items: center; justify-content: center;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
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

  const bulkDelBtn = document.getElementById('btnBulkDelete');
  if (bulkDelBtn) {
    bulkDelBtn.onclick = () => {
      const editor = document.getElementById('edContent');
      
      // 削除前のHTMLを退避
      lastDeletedContent = getCleanEditorHTML(editor);

      const selectedParas = editor.querySelectorAll('p.para-selected');
      if (selectedParas.length === 0) return;

      selectedParas.forEach(p => p.remove());

      // 完全に空なら自動カード削除
      if (isEditorEmpty(editor)) {
        deleteArticleSilently();
        return;
      }

      saveEditorContentDirectly(editor);
      updateBulkDeleteButtonState(editor);

      // 元に戻すトーストを表示
      showUndoToast(editor);
    };
  }
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
    try {
      // クリップボードのアイテムを確認（画像貼り付けの復元）
      const clipboardData = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData);
      if (!clipboardData) return;
      const items = clipboardData.items;
      let hasImage = false;

      // 非同期の画像読み込み時にカーソル位置が失われないよう、同期コンテキストで Range を保存
      const sel = window.getSelection();
      let savedRange = null;
      if (sel && sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault(); // デフォルト処理を阻止
          hasImage = true;
          
          const file = items[i].getAsFile();
          const reader = new FileReader();
          
          reader.onload = function(evt) {
            try {
              const base64Src = evt.target.result;
              
              // ── 画像自動圧縮・リサイズ処理（フリーズ＆Firebase容量オーバー根絶） ──
              const tempImg = new Image();
              tempImg.onload = function() {
                try {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  
                  // 最大寸法（横幅または高さを 800px に制限）
                  const MAX_SIZE = 800;
                  let width = tempImg.width;
                  let height = tempImg.height;
                  
                  if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                      height = Math.round((height * MAX_SIZE) / width);
                      width = MAX_SIZE;
                    } else {
                      width = Math.round((width * MAX_SIZE) / height);
                      height = MAX_SIZE;
                    }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  
                  // キャンバスに描画
                  ctx.drawImage(tempImg, 0, 0, width, height);
                  
                  // 軽量なJPEGに圧縮 (品質0.75)
                  const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
                  
                  // 貼り付け用画像タグの生成（美しくレスポンシブなスタイル）
                  const img = document.createElement('img');
                  img.src = compressedBase64;
                  img.style.maxWidth = '100%';
                  img.style.height = 'auto';
                  img.style.borderRadius = '12px';
                  img.style.margin = '0.75rem 0';
                  img.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                  img.style.display = 'block';

                  // 画像を段落要素 <p> で囲って「段落扱い」にする
                  const pImg = document.createElement('p');
                  pImg.appendChild(img);

                  // コピペ後のカーソル追従用改行
                  const pNext = document.createElement('p');
                  pNext.appendChild(document.createElement('br'));

                  let inserted = false;
                  const editor = document.getElementById('edContent');

                  // 保存された Range を使って、ペーストした瞬間のカーソル位置に段落を分割して挿入
                  if (savedRange && editor) {
                    try {
                      // カーソル位置の親のPタグ（またはエディタ直下の子要素）を特定
                      let parentP = savedRange.commonAncestorContainer;
                      if (parentP.nodeType === Node.TEXT_NODE) {
                        parentP = parentP.parentNode;
                      }
                      // エディタ直下の子要素まで親を遡る
                      while (parentP && parentP.parentNode !== editor) {
                        parentP = parentP.parentNode;
                      }

                      if (parentP && parentP.tagName === 'P') {
                        // 現在の Range を利用して、カーソルの前後のコンテンツを分割する
                        const range = savedRange.cloneRange();
                        range.setEndAfter(parentP.lastChild || parentP);
                        const afterContent = range.extractContents(); // カーソルより後ろを切り出す
                        
                        // 切り出された後ろのコンテンツを入れる新しい段落を作成
                        const pNextNew = document.createElement('p');
                        if (afterContent.textContent.trim() === '' && !afterContent.querySelector('img')) {
                          pNextNew.appendChild(document.createElement('br'));
                        } else {
                          pNextNew.appendChild(afterContent);
                        }
                        
                        // DOMに順番に挿入
                        parentP.parentNode.insertBefore(pImg, parentP.nextSibling);
                        pImg.parentNode.insertBefore(pNextNew, pImg.nextSibling);
                        
                        // 新しい Range を作成してカーソルを画像直後の改行に合わせる
                        const newRange = document.createRange();
                        newRange.setStart(pNextNew, 0);
                        newRange.collapse(true);
                        
                        const currentSel = window.getSelection();
                        currentSel.removeAllRanges();
                        currentSel.addRange(newRange);
                        inserted = true;
                      }
                    } catch (domErr) {
                      console.warn("DOM Range insertion / split failed, fallback to appendChild:", domErr);
                    }
                  }
                  
                  if (!inserted && editor) {
                    editor.appendChild(pImg);
                    editor.appendChild(pNext);
                  }
                  
                  // 正規化処理を呼んでHTML構造をクリーンアップし、Firebaseに保存
                  if (editor) {
                    normalizeEditorHTML(editor);
                    editor.dispatchEvent(new Event('input'));
                  }
                } catch (canvasErr) {
                  console.error("Canvas compression failed:", canvasErr);
                }
              };
              
              tempImg.onerror = function() {
                console.error("Failed to load image element for canvas compression.");
              };
              
              tempImg.src = base64Src;
            } catch (loadErr) {
              console.error("Image loading processing failed:", loadErr);
            }
          };
          
          reader.readAsDataURL(file);
          break; // 1枚のみ処理
        }
      }

      if (hasImage) return; // 画像処理を行った場合はここで終了

      e.preventDefault(); // デフォルトの貼り付けを阻止（テキスト処理へ移行）

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
        // 1. 純粋なテーブル罫線記号（|, │ 等）が複数（3つ以上）含まれ、かつ改行が存在する場合のみテーブル整形を実行する
        const borderMatches = text.match(/[\|│┃┼├┤┌┐└┘｜┆┇┊┋┬┴]/g);
        const hasTableBorders = borderMatches && borderMatches.length >= 3 && text.includes('\n');
        const cleanedText = hasTableBorders ? cleanAndFormatBorderLines(text) : text;

        // execCommand を使用してプレーンテキストをカーソル位置に綺麗に流し込む
        // これにより、余計な HTML ネストや不要なインデントが一切入らなくなります
        const inserted = document.execCommand('insertText', false, cleanedText);
        
        // 万が一 execCommand が失敗した場合のフォールバック
        if (!inserted) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            sel.deleteFromDocument();
            const range = sel.getRangeAt(0);
            const textNode = document.createTextNode(cleanedText);
            range.insertNode(textNode);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }

        // 正規化処理を実行してHTML構造を整える
        const editor = document.getElementById('edContent');
        if (editor) {
          normalizeEditorHTML(editor);
          editor.dispatchEvent(new Event('input'));
        }
      }
    } catch (pasteErr) {
      console.error("Paste event listener error:", pasteErr);
    }
  });

  // 初期コンテンツ読み込み
  db.ref(`users/${state.uid}/articles/${state.categoryId}/${state.articleId}`).once('value', snap => {
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
      db.ref(`users/${state.uid}/articles/${state.categoryId}/${state.articleId}`)
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
        db.ref(`users/${state.uid}/articles/${state.categoryId}/${state.articleId}`)
          .update({ content: after, updatedAt: Date.now() })
          .catch(() => {});
      }
    }

    if (status) { status.textContent = '保存済み ✓'; status.className = 'save-status saved'; }
    editor.focus();
    initializeNativeParagraphActions(editor);

    // 自動保存（1秒デバウンス）
    editor.oninput = () => {
      if (status) { status.textContent = '編集中…'; status.className = 'save-status editing'; }
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          const cleanHTML = getCleanEditorHTML(editor);
          await db.ref(`users/${state.uid}/articles/${state.categoryId}/${state.articleId}`).update({
            content: cleanHTML, updatedAt: Date.now()
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
  if (!confirm("このメモを完全に削除します。よろしいですか？")) return;
  await db.ref(`users/${state.uid}/articles/${state.categoryId}/${state.articleId}`).remove();
  goTo('category', state.categoryId, null, true);
}

// 直接Firebaseから無音でカードを完全削除する（最後の段落削除時）
async function deleteArticleSilently() {
  if (!state.articleId || !state.categoryId || !state.uid) return;
  await db.ref(`users/${state.uid}/articles/${state.categoryId}/${state.articleId}`).remove();
  goTo('category', state.categoryId, null, true);
}

// 既存のメモを複製してコピー元のすぐ上に挿入する
async function duplicateArticle(artId, categoryId) {
  try {
    // 1. 対象カードのデータを取得
    const snap = await db.ref(`users/${state.uid}/articles/${categoryId}/${artId}`).once('value');
    const original = snap.val();
    if (!original) return;

    // 2. 現在の全カードリストを取得してソート（表示時と同じロジック）
    const allSnap = await db.ref(`users/${state.uid}/articles/${categoryId}`).once('value');
    const allData = allSnap.val() || {};
    const arts = Object.entries(allData)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return b.order - a.order;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });

    // 3. コピー元カードのインデックスを特定
    const targetIndex = arts.findIndex(a => a.id === artId);
    if (targetIndex === -1) return;

    // 4. 新しいカードをプッシュしてキーを生成
    const newRef = db.ref(`users/${state.uid}/articles/${categoryId}`).push();
    const newKey = newRef.key;

    // 5. 複製するデータを作成
    const duplicateData = {
      content: original.content || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 6. 新しい配列を作成し、コピー元の上に挿入
    const newArts = [...arts];
    newArts.splice(targetIndex, 0, { id: newKey, ...duplicateData });

    // 7. 先に複製データを Firebase に新規保存 (update 時の重複パスエラーを防止)
    await db.ref(`users/${state.uid}/articles/${categoryId}/${newKey}`).set(duplicateData);

    // 8. 全カードの order を新しい順序に合わせて一括更新
    const updates = {};
    const total = newArts.length;
    newArts.forEach((art, i) => {
      updates[`users/${state.uid}/articles/${categoryId}/${art.id}/order`] = total - i;
    });
    
    // 複写されたカードにフラッシュ効果を入れるため、justEditedArticleId を新しいカード of IDにセットする！
    justEditedArticleId = newKey;

    await db.ref().update(updates);
  } catch (err) {
    console.error("Duplicate article failed:", err);
  }
}

// 古いルート直下のデータを、現在ログインしているユーザーの個室へ移行（引っ越し）する
async function migrateOldDataToUserAccount() {
  try {
    if (!state.uid) {
      alert("ログインしていません。");
      return;
    }

    // 1. ルート直下のカテゴリデータを取得
    const catSnap = await db.ref('categories').once('value');
    const categories = catSnap.val();

    // 2. ルート直下のメモデータを取得
    const artSnap = await db.ref('articles').once('value');
    const articles = artSnap.val();

    if (!categories && !articles) {
      alert("移行する過去のデータが見つかりませんでした。");
      const banner = document.getElementById('migrationBanner');
      if (banner) banner.remove();
      return;
    }

    const updates = {};
    
    // 3. カテゴリデータをユーザー個室用にコピー
    if (categories) {
      Object.entries(categories).forEach(([catId, catData]) => {
        updates[`users/${state.uid}/categories/${catId}`] = catData;
      });
    }

    // 4. メモデータをユーザー個室用にコピー
    if (articles) {
      Object.entries(articles).forEach(([catId, artMap]) => {
        if (artMap) {
          Object.entries(artMap).forEach(([artId, artData]) => {
            updates[`users/${state.uid}/articles/${catId}/${artId}`] = artData;
          });
        }
      });
    }

    // 5. Firebaseに一括書き込み
    await db.ref().update(updates);
    
    alert("🎉 過去のメモの引っ越しが完全に成功しました！\n自動的に画面がリロードされます。");
    window.location.reload();
  } catch (err) {
    console.error("Migration failed:", err);
    alert("データの引っ越し中にエラーが発生しました: " + err.message);
    const migrateBtn = document.getElementById('btnMigrate');
    if (migrateBtn) {
      migrateBtn.disabled = false;
      migrateBtn.textContent = "引っ越しを実行する";
    }
  }
}

// エディタのプレーンなコンテンツが完全に空であるかを判定
function isEditorEmpty(editor) {
  const cleanHTML = getCleanEditorHTML(editor).trim();
  const temp = document.createElement('div');
  temp.innerHTML = cleanHTML;
  const text = temp.textContent || temp.innerText || '';
  const hasImage = temp.querySelector('img') !== null;
  return text.trim() === '' && !hasImage;
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

// ── 段落の常時スワイプ一括削除制御 ─────────────────
let activeGlobalEditorClickCleanup = null;

// エディタロード時にスワイプ選択を自動バインド
// エディタ内のHTML構造を常にPタグ（画像も含む）に平坦化・正規化する
function normalizeEditorHTML(editor) {
  if (!editor) return;

  let needNormalize = false;
  // 直接の子要素をチェック
  for (let child of editor.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== '') {
      needNormalize = true;
      break;
    }
    if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'P') {
      needNormalize = true;
      break;
    }
  }

  if (!needNormalize) return;

  const tempDiv = document.createElement('div');
  let currentP = null;

  // 子ノードを走査し、すべてPタグで囲う
  Array.from(editor.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text.replace(/\s+/g, '') === '') {
        return;
      }
      if (!currentP) {
        currentP = document.createElement('p');
        tempDiv.appendChild(currentP);
      }
      currentP.appendChild(document.createTextNode(text));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName;
      if (tagName === 'P') {
        currentP = node.cloneNode(true);
        tempDiv.appendChild(currentP);
      } else if (tagName === 'BR') {
        currentP = document.createElement('p');
        currentP.appendChild(document.createElement('br'));
        tempDiv.appendChild(currentP);
        currentP = null;
      } else if (tagName === 'IMG') {
        currentP = document.createElement('p');
        currentP.appendChild(node.cloneNode(true));
        tempDiv.appendChild(currentP);
        currentP = null;
      } else {
        // P以外の要素の中身を取り出してPにする
        const p = document.createElement('p');
        while (node.firstChild) {
          p.appendChild(node.firstChild);
        }
        if (node.className) p.className = node.className;
        tempDiv.appendChild(p);
        currentP = null;
      }
    }
  });

  const newHTML = tempDiv.innerHTML || '<p><br></p>';
  if (editor.innerHTML !== newHTML) {
    editor.innerHTML = newHTML;
  }
}

function initializeNativeParagraphActions(editor) {
  if (!editor) return;

  // 0. 読み込み直後にエディタの段落構造を正規化する
  normalizeEditorHTML(editor);

  // 1. 各段落（<p>）にスワイプイベントをバインド
  bindParagraphSwipeEvents(editor);

  // 2. 入力や他箇所のタップによる自動解除を登録（副作用防止）
  // タイピング開始時に選択状態を一瞬で自動クリーンアップ解除
  editor.onkeydown = (e) => {
    cleanupAllSwipedParagraphs(editor);
  };

  // フォーカスイン時にも解除
  editor.addEventListener('focusin', () => {
    cleanupAllSwipedParagraphs(editor);
  });

  // フォーカスアウト（blur）時にも正規化を走らせて保存をトリガーする
  editor.addEventListener('blur', () => {
    normalizeEditorHTML(editor);
    editor.dispatchEvent(new Event('input'));
  });

  // エディタ外のクリックで解除
  const outsideClickListener = (e) => {
    if (!editor.contains(e.target) && !e.target.closest('#btnBulkDelete') && !e.target.closest('#undo-toast')) {
      cleanupAllSwipedParagraphs(editor);
    }
  };
  document.addEventListener('click', outsideClickListener);
  activeGlobalEditorClickCleanup = outsideClickListener;
}

// 特定の段落を選択（チェック）状態にする/解除する（☑️のトグル）
function toggleParagraphSelect(p, editor) {
  if (!p) return;

  const hasSelected = p.classList.contains('para-selected');

  if (hasSelected) {
    // 選択解除
    p.classList.remove('para-selected');
    const chk = p.querySelector('.para-checkbox');
    if (chk) chk.remove();
  } else {
    // 選択（チェックON）
    p.classList.add('para-selected');
    
    // チェックボックススパンを左端に生成（鮮烈に目立つ赤レ点 ✔）
    const chk = document.createElement('span');
    chk.className = 'para-checkbox';
    chk.contentEditable = 'false'; // 編集不可にして誤入力を防ぐ
    chk.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    
    p.insertBefore(chk, p.firstChild);

    // チェックマーク自体をタップしても解除できるようにイベントを紐付け
    chk.onclick = (e) => {
      e.stopPropagation();
      toggleParagraphSelect(p, editor);
    };
  }

  // 一括削除ボタンの表示状態を更新
  updateBulkDeleteButtonState(editor);
}

// 一括削除ボタンの表示/非表示とアニメーションクラスのトグル
function updateBulkDeleteButtonState(editor) {
  const bulkDelBtn = document.getElementById('btnBulkDelete');
  if (!bulkDelBtn || !editor) return;

  const selectedCount = editor.querySelectorAll('p.para-selected').length;
  if (selectedCount > 0) {
    bulkDelBtn.style.display = 'flex';
    bulkDelBtn.style.transform = 'scale(1.15)';
    bulkDelBtn.classList.add('pulse-delete-active');
  } else {
    bulkDelBtn.style.display = 'none';
    bulkDelBtn.style.transform = 'scale(1)';
    bulkDelBtn.classList.remove('pulse-delete-active');
  }
}

// 単一の段落の選択状態を解除してプレーンに戻す
function cleanupSingleParagraph(p) {
  if (!p || !p.classList.contains('para-selected')) return;
  const chk = p.querySelector('.para-checkbox');
  if (chk) chk.remove();
  p.classList.remove('para-selected');
  p.removeAttribute('class');
}

// すべての段落の選択状態をクリーンアップ
function cleanupAllSwipedParagraphs(editor) {
  if (!editor) return;
  const selectedParas = Array.from(editor.querySelectorAll('.para-selected'));
  selectedParas.forEach(p => cleanupSingleParagraph(p));
  updateBulkDeleteButtonState(editor);
}

// エディタ全体のクリーンなHTMLを抽出（チェック用スパンを完全に排除してプレーンなHTMLを返す）
function getCleanEditorHTML(editor) {
  if (!editor) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = editor.innerHTML;
  
  const paragraphs = Array.from(tempDiv.children);
  paragraphs.forEach(p => {
    const chk = p.querySelector('.para-checkbox');
    if (chk) chk.remove();
    p.classList.remove('para-selected');
    p.removeAttribute('class');
  });
  return tempDiv.innerHTML;
}

// 直接FirebaseにクリーンHTMLを同期保存
function saveEditorContentDirectly(editor) {
  if (!editor || !state.articleId || !state.categoryId || !state.uid) return;
  const cleanHTML = getCleanEditorHTML(editor);
  db.ref(`users/${state.uid}/articles/${state.categoryId}/${state.articleId}`).update({
    content: cleanHTML,
    updatedAt: Date.now()
  }).catch(err => console.error("Native select delete save error:", err));
}

// スワイプイベントのバインド (イベントデリゲーション方式)
function bindParagraphSwipeEvents(editor) {
  cleanupNativeParagraphListeners(editor);

  let txStart = 0, tyStart = 0;
  const touchStartHandler = e => {
    txStart = e.touches[0].clientX;
    tyStart = e.touches[0].clientY;
  };
  const touchEndHandler = e => {
    // 文字選択（範囲選択）中はフリップ動作をキャンセル
    if (window.getSelection().toString() !== '') return;

    const dx = e.changedTouches[0].clientX - txStart;
    const dy = Math.abs(e.changedTouches[0].clientY - tyStart);

    if (Math.abs(dx) > 50 && dy < 40) {
      // タップされた位置からエディタ直下のブロック要素（段落）を特定
      let p = e.target;
      while (p && p.parentNode !== editor) {
        p = p.parentNode;
      }
      if (!p || p === editor) return;

      // もし p が P タグでなかった場合、安全のために P タグでラップする（画像やむき出しテキストの安全対策）
      if (p.tagName !== 'P') {
        const wrapper = document.createElement('p');
        p.parentNode.insertBefore(wrapper, p);
        wrapper.appendChild(p);
        p = wrapper;
      }

      if (dx < 0) {
        toggleParagraphSelect(p, editor);
      } else {
        if (p.classList.contains('para-selected')) {
          toggleParagraphSelect(p, editor);
        }
      }
    }
  };

  editor.addEventListener('touchstart', touchStartHandler, { passive: true });
  editor.addEventListener('touchend',   touchEndHandler,   { passive: true });

  paraSwipeListeners.push({
    element: editor,
    start: touchStartHandler,
    end: touchEndHandler
  });
}

// 登録されたイベントやグローバルリスナーの解放
function cleanupNativeParagraphListeners(editor) {
  paraSwipeListeners.forEach(item => {
    if (item.element) {
      item.element.removeEventListener('touchstart', item.start);
      item.element.removeEventListener('touchend', item.end);
    }
  });
  paraSwipeListeners = [];

  if (activeGlobalEditorClickCleanup) {
    document.removeEventListener('click', activeGlobalEditorClickCleanup);
    activeGlobalEditorClickCleanup = null;
  }
}

// Undo（元に戻す）トーストの表示
function showUndoToast(editor) {
  const existing = document.getElementById('undo-toast');
  if (existing) {
    const oldCleanup = existing.cleanupEvents;
    if (oldCleanup) oldCleanup();
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'undo-toast';
  toast.className = 'undo-toast-wrapper';
  toast.innerHTML = `
    <div class="undo-toast-box">
      <span>段落を削除しました</span>
      <button class="undo-btn" id="btnUndoAction">元に戻す</button>
    </div>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  const hideToast = () => {
    toast.classList.remove('visible');
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 400);
    if (cleanupListeners) cleanupListeners();
  };

  // ユーザーの次の操作を監視して消去するイベントリスナー
  const onNextAction = () => {
    hideToast();
  };

  const cleanupListeners = () => {
    editor.removeEventListener('keydown', onNextAction);
    editor.removeEventListener('scroll', onNextAction);
    document.removeEventListener('scroll', onNextAction);
  };

  // リスナー登録
  editor.addEventListener('keydown', onNextAction, { passive: true });
  editor.addEventListener('scroll', onNextAction, { passive: true });
  document.addEventListener('scroll', onNextAction, { passive: true });

  // 既存のトースト削除時にイベントを解除できるように参照を埋め込む
  toast.cleanupEvents = cleanupListeners;

  // 画面遷移時に必ず消えるよう listeners にも登録
  listeners.push(() => {
    cleanupListeners();
    if (toast.parentNode) toast.remove();
  });

  document.getElementById('btnUndoAction').onclick = async (e) => {
    e.stopPropagation();
    if (lastDeletedContent !== null) {
      editor.innerHTML = lastDeletedContent;
      await saveEditorContentDirectly(editor);
      initializeNativeParagraphActions(editor);
      updateBulkDeleteButtonState(editor);
      lastDeletedContent = null;
    }
    hideToast();
  };
}

// ── PCからスマホへの同期用QRコードモーダル ──────────
function showQRCodeModal() {
  const url = window.location.href;
  const isLocalFile = url.startsWith('file:');
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');

  let localWarningHTML = '';
  if (isLocalFile) {
    localWarningHTML = `
      <div style="background: rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 0.75rem; border: 1.5px dashed #ef4444; margin-top: 0.5rem; text-align: left; margin-bottom: 1.25rem;">
        <span style="font-size: 0.85rem; font-weight: 800; color: #f87171; display: block; margin-bottom: 0.25rem;">💡 スマホで表示されない原因：</span>
        <span style="font-size: 0.75rem; color: #e5e7eb; line-height: 1.55; display: block;">
          PCでHTMLファイルを直接ダブルクリックして開いているため（file:/// 形式）、スマホからPCのファイルを読み取ることができません。<br>
          <strong style="color: #f97316; display: block; margin-top: 0.35rem; margin-bottom: 0.15rem;">【解決策】</strong>
          このメモアプリを Netlify や GitHub Pages などのサーバーにアップロード（デプロイ）し、その「公開されたURL（https://...）」でPCとスマホの両方からアクセスしてください。
        </span>
      </div>
    `;
  } else if (isLocalhost) {
    localWarningHTML = `
      <div style="background: rgba(245, 158, 11, 0.15); border-radius: 12px; padding: 0.75rem; border: 1.5px dashed #f59e0b; margin-top: 0.5rem; text-align: left; margin-bottom: 1.25rem;">
        <span style="font-size: 0.85rem; font-weight: 800; color: #fbbf24; display: block; margin-bottom: 0.25rem;">💡 スマホで表示されない原因：</span>
        <span style="font-size: 0.75rem; color: #e5e7eb; line-height: 1.55; display: block;">
          PCでローカル開発サーバー（localhost）を起動しているため、スマホがPCの場所を特定できません。<br>
          <strong style="color: #fbbf24; display: block; margin-top: 0.35rem; margin-bottom: 0.15rem;">【解決策】</strong>
          1. PCとスマホを<strong>「同じWi-Fi」</strong>に接続します。<br>
          2. PCのIPアドレス（例: 192.168.X.X）を調べ、ブラウザで <code>http://[PCのIPアドレス]:[ポート番号]</code> で開いた状態でQRコードを表示させてください。
        </span>
      </div>
    `;
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'qrModalOverlay';
  overlay.innerHTML = `
    <div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 10000;">
      <div class="modal-box" style="border: 2px solid #ef4444; max-width: 360px; text-align: center; background: #1c2230; padding: 1.5rem; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
        <div style="background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 0.75rem; border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 1.25rem;">
          <span style="font-size: 1.25rem; display: block; margin-bottom: 0.35rem; font-weight: 800; color: #f87171;">⚠️【厳重注意】</span>
          <span style="font-size: 0.8rem; font-weight: 700; color: #fca5a5; line-height: 1.55; display: block;">
            このQRコードはあなた専用のFirebase同期URLです。<br>
            他人に読み取られないよう十分に注意してください！
          </span>
        </div>
        <div style="background: #fff; padding: 1rem; border-radius: 16px; display: inline-block; box-shadow: 0 4px 16px rgba(0,0,0,0.3); margin-bottom: 1.25rem;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}" alt="スマホ連動用QRコード" style="display: block; width: 200px; height: 200px; image-rendering: pixelated;"/>
        </div>
        ${localWarningHTML}
        <button class="btn-secondary" id="qrCloseBtn" style="width: 100%; border-radius: 12px; padding: 0.75rem; font-weight: 700;">閉じる</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#qrCloseBtn').onclick = close;
  overlay.onclick = e => { if (e.target === overlay || e.target.id === 'qrModalOverlay') close(); };
}

// ── SCREEN: ログイン画面（ガラスモーフィズム） ──────────
function renderLogin(container) {
  container.innerHTML = `
    <div class="screen-login">
      <div class="login-glass-bg"></div>
      <div class="login-card">
        <div class="login-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        </div>
        <h1 class="login-title">PCスマホ連動メモ</h1>
        <p class="login-desc">
          カテゴリ別にメモを美しく管理。<br>
          ログインすれば、PCとスマホで瞬時に完全同期されます。
        </p>
        
        <button class="login-btn btn-google" id="btnGoogleLogin">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="display: block;">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Google でログイン
        </button>
        
        <button class="login-btn btn-guest" id="btnGuestLogin">
          ゲストとして一時的に開始
        </button>
      </div>
    </div>
  `;

  // Googleログインイベント
  document.getElementById('btnGoogleLogin').onclick = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      // サードパーティCookieのブラウザ規制による無限ループを回避するため、まずはポップアップ方式を優先します
      await firebase.auth().signInWithPopup(provider);
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      // ポップアップがブラウザにブロックされた場合は、自動的にリダイレクト方式へ切り替えます
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await firebase.auth().signInWithRedirect(provider);
        } catch (redirErr) {
          alert("ログイン画面の起動に失敗しました: " + redirErr.message);
        }
      } else {
        let friendlyMsg = err.message;
        if (err.code === 'auth/operation-not-allowed') {
          friendlyMsg = "\n\n💡 Firebaseコンソールで「Googleログイン」が有効になっていません。\n\n【解決方法】\nFirebaseコンソール ➔ Authentication ➔ Sign-in method ➔「Google」を追加して有効（オン）に設定してください。";
        } else if (err.code === 'auth/unauthorized-domain') {
          friendlyMsg = "\n\n💡 このドメインがFirebaseに承認されていません。\n\n【解決方法】\nFirebaseコンソール ➔ Authentication ➔ 設定 ➔「承認済みドメイン」に「kimijimasan-lgtm.github.io」を追加してください。";
        }
        alert("Googleログインに失敗しました: " + friendlyMsg);
      }
    }
  };

  // ゲストログインイベント
  document.getElementById('btnGuestLogin').onclick = async () => {
    try {
      await firebase.auth().signInAnonymously();
    } catch (err) {
      console.error("Guest Sign-In Error:", err);
      let friendlyMsg = err.message;
      if (err.code === 'auth/operation-not-allowed') {
        friendlyMsg = "\n\n💡 Firebaseコンソールで「匿名ログイン（Anonymous）」が有効になっていません。\n\n【解決方法】\nFirebaseコンソール ➔ Authentication ➔ Sign-in method ➔「匿名」を追加して有効（オン）に設定してください。";
      }
      alert("ゲストログインに失敗しました: " + friendlyMsg);
    }
  };
}

// ── 起動と認証の監視 ────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="screen-login"><div class="loading-spinner">認証状態を確認中…</div></div>';
  app.classList.add('visible');

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // ログイン済み
      state.uid = user.uid;
      goTo('home');
    } else {
      // 未ログイン
      state.uid = null;
      goTo('login');
    }
  });
});
