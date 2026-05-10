// Initial Mock Data
const MOCK_DATA = [
    {
        id: '1',
        title: '美味しいコーヒーの淹れ方',
        description: '自宅でカフェレベルのドリップコーヒーを楽しむための基本手順を解説します。',
        date: new Date().toISOString(),
        steps: [
            { title: 'お湯を沸かす', description: '90度〜93度が最適です。沸騰直後のお湯は少し冷ましましょう。' },
            { title: '豆を挽く', description: '中細挽きがおすすめです。淹れる直前に挽くことで香りが引き立ちます。' },
            { title: '蒸らし', description: '粉全体にお湯を含ませ、30秒ほど待ちます。この工程が味の決め手になります。' },
            { title: '抽出', description: '中心から「の」の字を描くようにお湯を注ぎます。3回ほどに分けて注ぎましょう。' }
        ]
    },
    {
        id: '2',
        title: 'Gitの基本的な使い方',
        description: 'バージョン管理システムGitの初期設定からコミットまでの流れ。',
        date: new Date().toISOString(),
        steps: [
            { title: 'リポジトリの初期化', description: 'プロジェクトフォルダで `git init` コマンドを実行します。' },
            { title: 'ファイルの追加', description: '`git add .` で変更されたファイルをステージングエリアに追加します。' },
            { title: 'コミット', description: '`git commit -m "メッセージ"` で変更を記録します。' }
        ]
    }
];

// State Management
class Store {
    static getHowTos() {
        const data = localStorage.getItem('howtos');
        if (!data) {
            localStorage.setItem('howtos', JSON.stringify(MOCK_DATA));
            return MOCK_DATA;
        }
        return JSON.parse(data);
    }

    static getHowTo(id) {
        const howtos = this.getHowTos();
        return howtos.find(h => h.id === id);
    }

    static saveHowTo(howto) {
        const howtos = this.getHowTos();
        howtos.unshift(howto);
        localStorage.setItem('howtos', JSON.stringify(howtos));
    }
}

// Router
function router() {
    const app = document.getElementById('app');
    const hash = window.location.hash || '#home';
    
    // Smooth fade transition
    app.style.opacity = 0;
    setTimeout(() => {
        app.innerHTML = '';
        
        if (hash === '#home') {
            renderHome(app);
        } else if (hash === '#create') {
            renderCreate(app);
        } else if (hash.startsWith('#detail/')) {
            const id = hash.split('/')[1];
            renderDetail(app, id);
        } else {
            renderHome(app);
        }
        
        app.style.transition = 'opacity 0.3s ease';
        app.style.opacity = 1;
    }, 150);
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// Views
function renderHome(container) {
    const howtos = Store.getHowTos();
    
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
        <h1>共有されたハウツー</h1>
        <p>みんなが投稿した役立つ手順や方法を見つけよう</p>
    `;
    
    const grid = document.createElement('div');
    grid.className = 'grid';
    
    if (howtos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1">
                <h2>まだ投稿がありません</h2>
                <p>最初のハウツーを投稿してみましょう！</p>
            </div>
        `;
    } else {
        howtos.forEach(howto => {
            const card = document.createElement('div');
            card.className = 'card';
            const date = new Date(howto.date).toLocaleDateString('ja-JP');
            card.innerHTML = `
                <div class="card-title">${escapeHTML(howto.title)}</div>
                <div class="card-desc">${escapeHTML(howto.description)}</div>
                <div class="card-footer">
                    <span>${howto.steps.length} ステップ</span>
                    <span>${date}</span>
                </div>
            `;
            card.onclick = () => window.location.hash = \`#detail/\${howto.id}\`;
            grid.appendChild(card);
        });
    }
    
    container.appendChild(header);
    container.appendChild(grid);
}

function renderDetail(container, id) {
    const howto = Store.getHowTo(id);
    
    if (!howto) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>見つかりません</h2>
                <p>お探しのハウツーは存在しないか、削除されました。</p>
                <br>
                <a href="#home" class="btn btn-secondary">一覧へ戻る</a>
            </div>
        `;
        return;
    }

    const header = document.createElement('div');
    header.className = 'detail-header';
    header.innerHTML = `
        <h1 class="detail-title">${escapeHTML(howto.title)}</h1>
        <p class="detail-desc">${escapeHTML(howto.description)}</p>
    `;
    
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'steps-container';
    
    howto.steps.forEach((step, index) => {
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item';
        stepItem.innerHTML = `
            <div class="step-number">${index + 1}</div>
            <div class="step-content">
                <h3 class="step-title">${escapeHTML(step.title)}</h3>
                <p class="step-desc">${escapeHTML(step.description)}</p>
            </div>
        `;
        stepsContainer.appendChild(stepItem);
    });

    const backBtnContainer = document.createElement('div');
    backBtnContainer.style.textAlign = 'center';
    backBtnContainer.style.marginTop = '4rem';
    backBtnContainer.innerHTML = '<a href="#home" class="btn btn-secondary">一覧へ戻る</a>';
    
    container.appendChild(header);
    container.appendChild(stepsContainer);
    container.appendChild(backBtnContainer);
}

function renderCreate(container) {
    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';
    
    let stepsData = [{ title: '', description: '' }];
    
    const renderForm = () => {
        formContainer.innerHTML = `
            <h2 style="margin-bottom: 2rem; color: var(--primary-color);">新しいハウツーを投稿</h2>
            <form id="createForm">
                <div class="form-group">
                    <label class="form-label">タイトル</label>
                    <input type="text" id="howtoTitle" class="form-control" placeholder="例: 美味しいコーヒーの淹れ方" required>
                </div>
                <div class="form-group">
                    <label class="form-label">概要</label>
                    <textarea id="howtoDesc" class="form-control" placeholder="このハウツーについて簡単に説明してください" required></textarea>
                </div>
                
                <div class="steps-list" id="stepsList">
                    <label class="form-label">手順 (ステップ)</label>
                    <!-- Steps will be injected here -->
                </div>
                
                <button type="button" id="addStepBtn" class="add-step-btn">+ 新しいステップを追加</button>
                
                <div class="form-actions">
                    <a href="#home" class="btn btn-secondary">キャンセル</a>
                    <button type="submit" class="btn btn-primary">投稿する</button>
                </div>
            </form>
        `;
        
        const stepsList = formContainer.querySelector('#stepsList');
        
        // Render Steps
        stepsData.forEach((step, index) => {
            const stepEl = document.createElement('div');
            stepEl.className = 'step-item-form';
            stepEl.innerHTML = `
                <div class="step-header-form">
                    <strong>Step ${index + 1}</strong>
                    ${stepsData.length > 1 ? `<button type="button" class="btn-icon remove-step" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>` : ''}
                </div>
                <div class="form-group">
                    <input type="text" class="form-control step-title-input" placeholder="見出し" value="${escapeHTML(step.title)}" required data-index="${index}">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <textarea class="form-control step-desc-input" placeholder="詳しい説明" required data-index="${index}">${escapeHTML(step.description)}</textarea>
                </div>
            `;
            stepsList.appendChild(stepEl);
        });
        
        // Bind Add Step
        formContainer.querySelector('#addStepBtn').onclick = () => {
            // Save current input values before re-rendering
            saveCurrentInputs();
            stepsData.push({ title: '', description: '' });
            renderForm(); // Re-render to update UI
        };
        
        // Bind Remove Step
        formContainer.querySelectorAll('.remove-step').forEach(btn => {
            btn.onclick = (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                saveCurrentInputs();
                stepsData.splice(index, 1);
                renderForm();
            };
        });
        
        // Bind Form Submit
        formContainer.querySelector('#createForm').onsubmit = (e) => {
            e.preventDefault();
            saveCurrentInputs();
            
            const newHowTo = {
                id: Date.now().toString(),
                title: formContainer.querySelector('#howtoTitle').value,
                description: formContainer.querySelector('#howtoDesc').value,
                date: new Date().toISOString(),
                steps: stepsData
            };
            
            Store.saveHowTo(newHowTo);
            window.location.hash = '#home';
        };

        function saveCurrentInputs() {
            // Persist Title/Desc
            const titleInput = formContainer.querySelector('#howtoTitle');
            const descInput = formContainer.querySelector('#howtoDesc');
            if(titleInput) titleInput.setAttribute('value', titleInput.value);
            if(descInput) descInput.textContent = descInput.value;

            // Persist Steps
            const titleInputs = formContainer.querySelectorAll('.step-title-input');
            const descInputs = formContainer.querySelectorAll('.step-desc-input');
            
            titleInputs.forEach(input => {
                const idx = parseInt(input.getAttribute('data-index'));
                if(stepsData[idx]) stepsData[idx].title = input.value;
            });
            descInputs.forEach(input => {
                const idx = parseInt(input.getAttribute('data-index'));
                if(stepsData[idx]) stepsData[idx].description = input.value;
            });
        }
    };
    
    container.appendChild(formContainer);
    renderForm();
}

// Utility for XSS prevention
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}
