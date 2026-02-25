export const DEMO_PAGE_HTML = String.raw`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MedQuiz - Prototype Entraînement</title>
  <style>
    :root {
      --ink: #0b1d2a;
      --ink-soft: #3f5a6d;
      --surface: #f6fbff;
      --surface-elevated: #ffffff;
      --line: #d8e5ef;
      --brand: #0f766e;
      --brand-strong: #115e59;
      --brand-soft: #d9f2ef;
      --warm: #f59e0b;
      --danger: #be123c;
      --ok: #15803d;
      --radius-lg: 20px;
      --radius-md: 14px;
      --shadow: 0 20px 42px rgba(3, 27, 45, 0.16);
      --ring: 0 0 0 3px rgba(15, 118, 110, 0.22);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Sora", "Avenir Next", "Segoe UI", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at 8% -12%, rgba(14, 165, 164, 0.32), transparent 34%),
        radial-gradient(circle at 95% 4%, rgba(249, 115, 22, 0.26), transparent 30%),
        linear-gradient(150deg, #062137 0%, #0b2f47 40%, #0f4c62 100%);
      padding: 18px;
    }

    .shell {
      max-width: 1220px;
      margin: 0 auto;
      display: grid;
      gap: 14px;
      animation: fade-in 360ms ease-out;
    }

    .hero {
      background:
        radial-gradient(circle at 82% 14%, rgba(255, 255, 255, 0.2), transparent 35%),
        linear-gradient(118deg, rgba(11, 35, 57, 0.94), rgba(9, 74, 88, 0.92));
      color: #f3fcff;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 22px;
      box-shadow: var(--shadow);
      padding: 22px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    .hero h1 {
      margin: 0;
      font-size: clamp(26px, 3vw, 36px);
      letter-spacing: 0.2px;
    }

    .hero p {
      margin: 10px 0 0;
      max-width: 62ch;
      font-size: 14px;
      color: rgba(231, 250, 255, 0.9);
    }

    .hero-meta {
      display: grid;
      justify-items: end;
      gap: 10px;
      min-width: 210px;
    }

    .pill {
      display: inline-flex;
      border: 1px solid rgba(255, 255, 255, 0.28);
      background: rgba(255, 255, 255, 0.12);
      color: #f1f9ff;
      padding: 7px 12px;
      border-radius: 999px;
      font-size: 12px;
      letter-spacing: 0.18px;
    }

    .user-badge {
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.22);
      color: #e9f9ff;
      font-size: 13px;
      padding: 10px 12px;
      text-align: right;
      width: 100%;
    }

    .grid {
      display: grid;
      grid-template-columns: minmax(330px, 390px) 1fr;
      gap: 14px;
    }

    .panel {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(245, 251, 255, 0.9));
      border: 1px solid rgba(255, 255, 255, 0.68);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      padding: 16px;
      backdrop-filter: blur(12px);
    }

    .panel h2 {
      margin: 0;
      font-size: 18px;
    }

    .panel h3 {
      margin: 0;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--ink-soft);
    }

    .section {
      border: 1px solid var(--line);
      background: var(--surface-elevated);
      border-radius: var(--radius-md);
      padding: 12px;
      margin-top: 12px;
    }

    .section + .section { margin-top: 10px; }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .section-note {
      color: var(--ink-soft);
      font-size: 12px;
    }

    .auth-grid { display: grid; gap: 8px; }

    .label {
      font-size: 12px;
      color: var(--ink-soft);
      margin-bottom: 4px;
      display: block;
    }

    input, select, textarea, button {
      width: 100%;
      border-radius: 11px;
      font: inherit;
    }

    input, select, textarea {
      border: 1px solid #c7d9e7;
      padding: 10px 12px;
      background: #ffffff;
      color: var(--ink);
      font-size: 14px;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--brand);
      box-shadow: var(--ring);
    }

    textarea { resize: vertical; min-height: 110px; }

    button {
      border: 0;
      padding: 10px 12px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 130ms ease, filter 130ms ease, box-shadow 130ms ease;
    }

    button:hover {
      transform: translateY(-1px);
      filter: brightness(1.02);
      box-shadow: 0 8px 18px rgba(15, 43, 62, 0.18);
    }

    button:disabled {
      opacity: 0.56;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-primary {
      background: linear-gradient(130deg, var(--brand), #0f9f8f);
      color: #fff;
    }

    .btn-secondary {
      background: #e9f2f9;
      color: #123247;
    }

    .btn-danger {
      background: #ffe4ea;
      color: #8e173f;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      margin-bottom: 8px;
    }

    .stat {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px;
      background: #fff;
    }

    .stat .k {
      color: var(--ink-soft);
      font-size: 11px;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .stat .v {
      margin-top: 6px;
      font-size: 22px;
      line-height: 1;
      font-weight: 800;
    }

    .subject-list, .chapter-list, .history-list {
      display: grid;
      gap: 8px;
      max-height: 250px;
      overflow: auto;
      padding-right: 2px;
    }

    .subject-item, .chapter-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 9px;
      align-items: center;
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 11px;
      padding: 9px 10px;
    }

    .subject-meta {
      color: var(--ink-soft);
      font-size: 12px;
      margin-top: 2px;
    }

    .q-card {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 10px;
      background: #fff;
      min-height: 190px;
    }

    .q-type {
      display: inline-flex;
      font-size: 10px;
      letter-spacing: 0.52px;
      text-transform: uppercase;
      border-radius: 999px;
      padding: 5px 8px;
      background: var(--brand-soft);
      color: var(--brand-strong);
      margin-bottom: 8px;
      font-weight: 700;
    }

    .choice-list { display: grid; gap: 7px; margin-top: 9px; }

    .choice {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 9px;
      display: flex;
      gap: 8px;
      align-items: flex-start;
      background: #fff;
    }

    .status {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 13px;
      border: 1px solid transparent;
    }

    .status.info {
      background: #e0f2fe;
      border-color: #b8e4fb;
      color: #0d4c68;
    }

    .status.ok {
      background: #dcfce7;
      border-color: #acefbe;
      color: #14532d;
    }

    .status.err {
      background: #ffe3e3;
      border-color: #f7baba;
      color: #8b102f;
    }

    .history-item {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 9px 10px;
      background: #fff;
      font-size: 13px;
    }

    .history-item b.ok { color: var(--ok); }
    .history-item b.err { color: var(--danger); }

    .muted {
      color: var(--ink-soft);
      font-size: 13px;
      line-height: 1.35;
    }

    .hidden { display: none !important; }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 980px) {
      body { padding: 12px; }
      .hero {
        padding: 16px;
        border-radius: 18px;
        flex-direction: column;
      }
      .hero-meta {
        justify-items: start;
        width: 100%;
      }
      .user-badge { text-align: left; }
      .grid { grid-template-columns: 1fr; }
      .panel { border-radius: 16px; }
    }

    @media (max-width: 640px) {
      .row { grid-template-columns: 1fr; }
      .stats { grid-template-columns: 1fr 1fr; }
      .stat .v { font-size: 19px; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="hero">
      <div>
        <h1>Espace Entraînement MedQuiz</h1>
        <p>
          Prototype produit branché sur l'API: connexion, filtres matière/chapitre, sessions d'entraînement et
          corrections immédiates.
        </p>
      </div>
      <div class="hero-meta">
        <span class="pill">Prototype V2</span>
        <span class="pill">Backend live</span>
        <div id="userBadge" class="user-badge">Non connecté</div>
      </div>
    </header>

    <main class="grid">
      <section class="panel" id="leftPanel">
        <h2>Contrôle Session</h2>

        <div class="section">
          <div class="section-head">
            <h3>Connexion</h3>
            <span class="section-note">Compte test ou réel</span>
          </div>
          <div class="auth-grid">
            <div>
              <label class="label" for="emailInput">Email</label>
              <input id="emailInput" type="email" placeholder="email" />
            </div>
            <div>
              <label class="label" for="passwordInput">Mot de passe</label>
              <input id="passwordInput" type="password" placeholder="mot de passe" />
            </div>
            <div>
              <label class="label" for="displayNameInput">Nom affiché (inscription)</label>
              <input id="displayNameInput" type="text" placeholder="nom affiché" />
            </div>
            <div class="row">
              <button class="btn-secondary" id="registerBtn">Créer compte</button>
              <button class="btn-primary" id="loginBtn">Se connecter</button>
            </div>
            <button class="btn-danger hidden" id="logoutBtn">Déconnexion</button>
          </div>
        </div>

        <div class="section">
          <div class="section-head">
            <h3>Configuration Session</h3>
            <span class="section-note">Modes selon ton besoin</span>
          </div>
          <div class="auth-grid">
            <div>
              <label class="label" for="modeSelect">Mode</label>
              <select id="modeSelect">
                <option value="learning">Apprentissage</option>
                <option value="discovery">Découverte</option>
                <option value="review">Révision</option>
                <option value="par_coeur">Par coeur</option>
                <option value="rattrapage">A revoir</option>
              </select>
            </div>
            <div>
              <label class="label" for="stopRuleSelect">Durée de session</label>
              <select id="stopRuleSelect">
                <option value="fixed_10">10 questions</option>
                <option value="fixed_custom">Choisir nombre</option>
                <option value="until_stop">Jusqu'à arrêt</option>
              </select>
            </div>
            <div>
              <label class="label" for="targetCountInput">Nombre de questions (mode personnalisé)</label>
              <input id="targetCountInput" type="number" min="1" max="200" value="20" placeholder="Nombre de questions" />
            </div>
            <button class="btn-primary" id="createSessionBtn" disabled>Démarrer entraînement</button>
            <button class="btn-secondary" id="refreshDashboardBtn" disabled>Rafraîchir dashboard</button>
          </div>
        </div>

        <div class="section">
          <div class="section-head">
            <h3>Matières</h3>
            <span class="section-note">Filtre global</span>
          </div>
          <div id="subjectsList" class="subject-list"></div>
        </div>

        <div class="section">
          <div class="section-head">
            <h3>Chapitres</h3>
            <span class="section-note">Filtre fin</span>
          </div>
          <div id="chaptersList" class="chapter-list"></div>
        </div>
      </section>

      <section class="panel">
        <h2>Entraînement En Cours</h2>

        <div class="section">
          <div class="section-head">
            <h3>Performance</h3>
            <span class="section-note">Vision immédiate</span>
          </div>
          <div class="stats" id="stats"></div>
          <div id="sessionSummary" class="muted">Aucune session active.</div>
        </div>

        <div class="section">
          <div class="section-head">
            <h3>Question Active</h3>
            <span class="section-note">Réponse + correction</span>
          </div>
          <div id="questionContainer" class="q-card hidden"></div>
          <div class="row" id="questionActions">
            <button class="btn-primary" id="submitAnswerBtn" disabled>Valider réponse</button>
            <button class="btn-secondary" id="nextQuestionBtn" disabled>Question suivante</button>
          </div>
          <div style="margin-top:8px">
            <button class="btn-danger" id="completeSessionBtn" disabled>Terminer session</button>
          </div>
        </div>

        <div class="section">
          <div class="section-head">
            <h3>État système</h3>
          </div>
          <div id="statusBox" class="status info">Connecte-toi pour commencer.</div>
        </div>

        <div class="section">
          <div class="section-head">
            <h3>Historique immédiat</h3>
            <span class="section-note">12 dernières réponses</span>
          </div>
          <div id="historyList" class="history-list"></div>
        </div>
      </section>
    </main>
  </div>

  <script>
    (function () {
      var baseUrl = window.location.origin + '/v1';
      var persistedToken = localStorage.getItem('medquiz_demo_token') || '';
      if (window.location.search.indexOf('reset=1') !== -1) {
        localStorage.removeItem('medquiz_demo_token');
        persistedToken = '';
      }

      var state = {
        token: persistedToken,
        me: null,
        dashboard: null,
        subjects: [],
        chaptersBySubject: {},
        selectedSubjects: {},
        selectedChapters: {},
        session: null,
        currentQuestion: null,
        questionShownAt: 0,
        history: []
      };

      var refs = {
        userBadge: document.getElementById('userBadge'),
        emailInput: document.getElementById('emailInput'),
        passwordInput: document.getElementById('passwordInput'),
        displayNameInput: document.getElementById('displayNameInput'),
        registerBtn: document.getElementById('registerBtn'),
        loginBtn: document.getElementById('loginBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        modeSelect: document.getElementById('modeSelect'),
        stopRuleSelect: document.getElementById('stopRuleSelect'),
        targetCountInput: document.getElementById('targetCountInput'),
        createSessionBtn: document.getElementById('createSessionBtn'),
        refreshDashboardBtn: document.getElementById('refreshDashboardBtn'),
        subjectsList: document.getElementById('subjectsList'),
        chaptersList: document.getElementById('chaptersList'),
        stats: document.getElementById('stats'),
        sessionSummary: document.getElementById('sessionSummary'),
        questionContainer: document.getElementById('questionContainer'),
        submitAnswerBtn: document.getElementById('submitAnswerBtn'),
        nextQuestionBtn: document.getElementById('nextQuestionBtn'),
        completeSessionBtn: document.getElementById('completeSessionBtn'),
        statusBox: document.getElementById('statusBox'),
        historyList: document.getElementById('historyList')
      };

      function setStatus(msg, tone) {
        refs.statusBox.className = 'status ' + (tone || 'info');
        refs.statusBox.textContent = msg;
      }

      async function api(path, options) {
        var opts = options || {};
        var headers = Object.assign({ 'content-type': 'application/json' }, opts.headers || {});
        if (state.token) {
          headers.Authorization = 'Bearer ' + state.token;
        }

        var res = await fetch(baseUrl + path, {
          method: opts.method || 'GET',
          headers: headers,
          body: opts.body ? JSON.stringify(opts.body) : undefined
        });

        var text = await res.text();
        var json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (e) {
          json = null;
        }

        if (!res.ok) {
          var msg = (json && json.error && json.error.message) || ('HTTP ' + res.status);
          if (
            msg === 'An unexpected error occurred' &&
            json &&
            json.error &&
            json.error.details &&
            typeof json.error.details.name === 'string'
          ) {
            msg = msg + ' (' + json.error.details.name + ')';
          }
          throw new Error(path + ' -> ' + msg);
        }

        return json ? json.data : null;
      }

      function saveToken(token) {
        state.token = token || '';
        if (state.token) {
          localStorage.setItem('medquiz_demo_token', state.token);
        } else {
          localStorage.removeItem('medquiz_demo_token');
        }
      }

      function ensureAuthUi() {
        var connected = !!state.token;
        refs.createSessionBtn.disabled = !connected;
        refs.refreshDashboardBtn.disabled = !connected;
        refs.logoutBtn.classList.toggle('hidden', !connected);
      }

      async function loadMe() {
        state.me = await api('/auth/me');
        refs.userBadge.textContent = state.me.email + ' · connecté';
      }

      async function loadDashboard() {
        state.dashboard = await api('/trainings/dashboard');
        renderStats();
      }

      async function loadSubjects() {
        var response = await api('/trainings/state/subjects');
        state.subjects = response.items || [];
        renderSubjects();
      }

      async function loadChapters(subjectId) {
        if (state.chaptersBySubject[subjectId]) {
          return;
        }
        var response = await api('/trainings/state/subjects/' + subjectId + '/chapters');
        state.chaptersBySubject[subjectId] = response.items || [];
        renderChapters();
      }

      function renderStats() {
        var d = state.dashboard;
        if (!d || !d.overview) {
          refs.stats.innerHTML = '';
          return;
        }
        var o = d.overview;
        refs.stats.innerHTML = [
          statHtml('Tentatives', String(o.attemptsCount)),
          statHtml('Taux réussite', (o.successRatePct == null ? '-' : o.successRatePct + '%')),
          statHtml('Sessions 7j', String(o.sessions7dCount)),
          statHtml('Couverture chapitres', String(o.chapterCoveragePct) + '%')
        ].join('');
      }

      function statHtml(label, value) {
        return '<div class="stat"><div class="k">' + escapeHtml(label) + '</div><div class="v">' + escapeHtml(value) + '</div></div>';
      }

      function renderSubjects() {
        if (!state.subjects.length) {
          refs.subjectsList.innerHTML = '<div class="muted">Aucune matière disponible.</div>';
          return;
        }

        refs.subjectsList.innerHTML = state.subjects.map(function (s) {
          var checked = !!state.selectedSubjects[s.id] ? 'checked' : '';
          var success = s.successRatePct == null ? '-' : s.successRatePct + '%';
          return '<label class="subject-item">'
            + '<input type="checkbox" data-subject-id="' + s.id + '" ' + checked + ' />'
            + '<div><b>' + escapeHtml(s.name) + '</b><div class="subject-meta">Progression ' + escapeHtml(String(s.declaredProgressPct)) + '% · Réussite ' + escapeHtml(String(success)) + '</div></div>'
            + '<div class="subject-meta">' + escapeHtml(String(s.publishedQuestionCount)) + ' q.</div>'
            + '</label>';
        }).join('');

        refs.subjectsList.querySelectorAll('input[data-subject-id]').forEach(function (el) {
          el.addEventListener('change', async function (ev) {
            var id = ev.target.getAttribute('data-subject-id');
            if (ev.target.checked) {
              state.selectedSubjects[id] = true;
              await loadChapters(id);
            } else {
              delete state.selectedSubjects[id];
              Object.keys(state.selectedChapters).forEach(function (cid) {
                var owner = findSubjectByChapter(cid);
                if (owner === id) {
                  delete state.selectedChapters[cid];
                }
              });
              renderChapters();
            }
          });
        });
      }

      function findSubjectByChapter(chapterId) {
        var ids = Object.keys(state.chaptersBySubject);
        for (var i = 0; i < ids.length; i += 1) {
          var sid = ids[i];
          var items = state.chaptersBySubject[sid] || [];
          for (var j = 0; j < items.length; j += 1) {
            if (items[j].id === chapterId) {
              return sid;
            }
          }
        }
        return null;
      }

      function renderChapters() {
        var selectedSubjectIds = Object.keys(state.selectedSubjects);
        if (!selectedSubjectIds.length) {
          refs.chaptersList.innerHTML = '<div class="muted">Sélectionne d\'abord une matière.</div>';
          return;
        }

        var html = '';
        selectedSubjectIds.forEach(function (sid) {
          var subject = state.subjects.find(function (s) { return s.id === sid; });
          var chapters = state.chaptersBySubject[sid] || [];
          html += '<div><div class="muted" style="margin:8px 0 6px"><b>' + escapeHtml(subject ? subject.name : sid) + '</b></div>';
          if (!chapters.length) {
            html += '<div class="muted">Chargement chapitres...</div>';
          } else {
            html += chapters.map(function (ch) {
              var checked = state.selectedChapters[ch.id] ? 'checked' : '';
              return '<label class="chapter-item">'
                + '<input type="checkbox" data-chapter-id="' + ch.id + '" ' + checked + ' />'
                + '<div>' + escapeHtml(ch.name) + '</div>'
                + '<div class="subject-meta">' + escapeHtml(String(ch.declaredProgressPct)) + '%</div>'
                + '</label>';
            }).join('');
          }
          html += '</div>';
        });

        refs.chaptersList.innerHTML = html;
        refs.chaptersList.querySelectorAll('input[data-chapter-id]').forEach(function (el) {
          el.addEventListener('change', function (ev) {
            var id = ev.target.getAttribute('data-chapter-id');
            if (ev.target.checked) {
              state.selectedChapters[id] = true;
            } else {
              delete state.selectedChapters[id];
            }
          });
        });
      }

      async function createSession() {
        var mode = refs.modeSelect.value;
        var stopRule = refs.stopRuleSelect.value;
        var body = {
          mode: mode,
          stopRule: stopRule
        };

        if (stopRule === 'fixed_custom') {
          var n = Number(refs.targetCountInput.value || '0');
          if (!Number.isFinite(n) || n < 1 || n > 200) {
            throw new Error('Nombre de questions invalide (1..200).');
          }
          body.targetQuestionCount = n;
        }

        var subjectIds = Object.keys(state.selectedSubjects);
        var chapterIds = Object.keys(state.selectedChapters);
        if (subjectIds.length) {
          body.subjectIds = subjectIds;
        }
        if (chapterIds.length) {
          body.chapterIds = chapterIds;
        }

        var session = await api('/trainings/sessions', { method: 'POST', body: body });
        state.session = session;
        state.history = [];
        renderHistory();
        refs.completeSessionBtn.disabled = false;
        refs.nextQuestionBtn.disabled = false;
        refs.submitAnswerBtn.disabled = false;
        await refreshSessionAndQuestion();
        setStatus('Session démarrée.', 'ok');
      }

      async function refreshSessionAndQuestion() {
        if (!state.session || !state.session.id) {
          return;
        }
        var sessionDetails = await api('/trainings/sessions/' + state.session.id);
        state.session = sessionDetails;
        refs.sessionSummary.textContent = 'Mode: ' + sessionDetails.mode + ' · Stop: ' + sessionDetails.stopRule + ' · Progression: '
          + sessionDetails.progress.correct + '/' + sessionDetails.progress.attempts;

        var next = await api('/trainings/sessions/' + state.session.id + '/next-question');
        state.currentQuestion = next.item;
        state.questionShownAt = Date.now();
        renderQuestion();
      }

      function renderQuestion() {
        var q = state.currentQuestion;
        if (!q) {
          refs.questionContainer.classList.remove('hidden');
          refs.questionContainer.innerHTML = '<div class="muted">Plus de question disponible avec les filtres actuels. Termine la session ou change de mode/filtres.</div>';
          refs.submitAnswerBtn.disabled = true;
          return;
        }

        var type = q.questionType;
        var choicesHtml = '';

        if (type === 'single_choice') {
          choicesHtml = '<div class="choice-list">' + q.choices.map(function (c) {
            return '<label class="choice"><input type="radio" name="singleChoice" value="' + c.id + '" /> <span>' + escapeHtml(c.label) + '</span></label>';
          }).join('') + '</div>';
        } else if (type === 'multi_choice') {
          choicesHtml = '<div class="choice-list">' + q.choices.map(function (c) {
            return '<label class="choice"><input type="checkbox" name="multiChoice" value="' + c.id + '" /> <span>' + escapeHtml(c.label) + '</span></label>';
          }).join('') + '</div>';
        } else {
          choicesHtml = '<textarea id="openAnswerInput" rows="4" placeholder="Écris ta réponse..."></textarea>';
        }

        refs.questionContainer.classList.remove('hidden');
        refs.questionContainer.innerHTML = '<div class="q-type">' + escapeHtml(type) + '</div>'
          + '<h3 style="margin:0 0 8px">' + escapeHtml(q.prompt) + '</h3>'
          + choicesHtml;

        refs.submitAnswerBtn.disabled = false;
      }

      async function submitAnswer() {
        if (!state.session || !state.currentQuestion) {
          return;
        }

        var q = state.currentQuestion;
        var payload = {
          questionId: q.id,
          responseTimeMs: Math.max(1, Math.round((Date.now() - state.questionShownAt) / 1))
        };

        if (q.questionType === 'single_choice') {
          var selected = refs.questionContainer.querySelector('input[name="singleChoice"]:checked');
          if (!selected) {
            throw new Error('Choisis une réponse.');
          }
          payload.selectedChoiceId = selected.value;
        } else if (q.questionType === 'multi_choice') {
          var selectedNodes = refs.questionContainer.querySelectorAll('input[name="multiChoice"]:checked');
          var ids = Array.prototype.map.call(selectedNodes, function (n) { return n.value; });
          if (!ids.length) {
            throw new Error('Choisis au moins une réponse.');
          }
          payload.selectedChoiceIds = ids;
        } else {
          var text = refs.questionContainer.querySelector('#openAnswerInput').value.trim();
          if (!text) {
            throw new Error('Saisis une réponse.');
          }
          payload.openTextAnswer = text;
        }

        var result = await api('/trainings/sessions/' + state.session.id + '/answers', {
          method: 'POST',
          body: payload
        });

        state.history.unshift({
          prompt: q.prompt,
          isCorrect: !!result.isCorrect,
          explanation: result.explanation,
          correction: result.correction || null
        });
        state.history = state.history.slice(0, 12);
        renderHistory();

        setStatus(result.isCorrect ? 'Bonne réponse.' : 'Réponse incorrecte.', result.isCorrect ? 'ok' : 'err');
        await refreshSessionAndQuestion();
      }

      function renderHistory() {
        if (!state.history.length) {
          refs.historyList.innerHTML = '<div class="muted">Aucun résultat pour le moment.</div>';
          return;
        }

        refs.historyList.innerHTML = state.history.map(function (item) {
          var correctionText = '';
          if (item.correction && item.correction.questionType === 'open_text') {
            correctionText = '<div class="muted">Attendu: ' + escapeHtml((item.correction.expectedAnswers || []).join(' · ')) + '</div>';
          }
          return '<div class="history-item">'
            + '<div><b class="' + (item.isCorrect ? 'ok' : 'err') + '">' + (item.isCorrect ? 'Correct' : 'Incorrect') + '</b> · ' + escapeHtml(item.prompt) + '</div>'
            + '<div class="muted">' + escapeHtml(item.explanation || '') + '</div>'
            + correctionText
            + '</div>';
        }).join('');
      }

      async function completeSession() {
        if (!state.session || !state.session.id) {
          return;
        }
        var result = await api('/trainings/sessions/' + state.session.id + '/complete', { method: 'POST' });
        setStatus('Session terminée: ' + result.correct + '/' + result.attempts + ' correctes.', 'ok');
        refs.completeSessionBtn.disabled = true;
        refs.nextQuestionBtn.disabled = true;
        refs.submitAnswerBtn.disabled = true;
        state.currentQuestion = null;
        renderQuestion();
        await loadDashboard();
      }

      function escapeHtml(v) {
        return String(v || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      async function bootstrapConnectedState() {
        ensureAuthUi();
        await loadMe();
        await loadDashboard();
        await loadSubjects();
        setStatus('Prêt. Lance une session d\'entraînement.', 'info');
      }

      refs.registerBtn.addEventListener('click', async function () {
        try {
          var email = refs.emailInput.value.trim();
          var password = refs.passwordInput.value;
          var displayName = (refs.displayNameInput.value || 'Etudiant MedQuiz').trim();
          var data = await api('/auth/register', {
            method: 'POST',
            body: { email: email, password: password, displayName: displayName }
          });
          saveToken(data.tokens.accessToken);
          await bootstrapConnectedState();
          setStatus('Compte créé et connecté.', 'ok');
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.loginBtn.addEventListener('click', async function () {
        try {
          var email = refs.emailInput.value.trim();
          var password = refs.passwordInput.value;
          var data = await api('/auth/login', {
            method: 'POST',
            body: { email: email, password: password }
          });
          saveToken(data.tokens.accessToken);
          await bootstrapConnectedState();
          setStatus('Connecté.', 'ok');
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.logoutBtn.addEventListener('click', function () {
        saveToken('');
        state.me = null;
        state.dashboard = null;
        state.session = null;
        state.currentQuestion = null;
        state.subjects = [];
        state.chaptersBySubject = {};
        state.selectedSubjects = {};
        state.selectedChapters = {};
        state.history = [];
        refs.userBadge.textContent = 'Non connecté';
        refs.subjectsList.innerHTML = '';
        refs.chaptersList.innerHTML = '';
        refs.stats.innerHTML = '';
        refs.sessionSummary.textContent = 'Aucune session active.';
        refs.questionContainer.innerHTML = '';
        refs.questionContainer.classList.add('hidden');
        renderHistory();
        ensureAuthUi();
        setStatus('Déconnecté.', 'info');
      });

      refs.createSessionBtn.addEventListener('click', async function () {
        try {
          await createSession();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.refreshDashboardBtn.addEventListener('click', async function () {
        try {
          await loadDashboard();
          await loadSubjects();
          setStatus('Dashboard rafraîchi.', 'info');
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.submitAnswerBtn.addEventListener('click', async function () {
        try {
          await submitAnswer();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.nextQuestionBtn.addEventListener('click', async function () {
        try {
          await refreshSessionAndQuestion();
          setStatus('Question suivante chargée.', 'info');
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.completeSessionBtn.addEventListener('click', async function () {
        try {
          await completeSession();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.stopRuleSelect.addEventListener('change', function () {
        var custom = refs.stopRuleSelect.value === 'fixed_custom';
        refs.targetCountInput.disabled = !custom;
      });

      (async function init() {
        try {
          ensureAuthUi();
          renderHistory();
          refs.targetCountInput.disabled = refs.stopRuleSelect.value !== 'fixed_custom';
          if (state.token) {
            await bootstrapConnectedState();
          }
        } catch (err) {
          saveToken('');
          ensureAuthUi();
          setStatus((err && err.message) ? err.message : 'Session invalide, reconnecte-toi.', 'err');
        }
      })();
    })();
  </script>
</body>
</html>`;
