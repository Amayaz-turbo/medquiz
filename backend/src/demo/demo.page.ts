export const DEMO_PAGE_HTML = String.raw`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MedQuiz - Prototype Entraînement</title>
  <style>
    :root {
      --bg-1: #071c2c;
      --bg-2: #0f3550;
      --surface: rgba(255, 255, 255, 0.9);
      --surface-strong: #ffffff;
      --text: #0f1d2a;
      --muted: #4a6277;
      --accent: #0ea5a4;
      --accent-strong: #0b7f7e;
      --warn: #d97706;
      --danger: #be123c;
      --ok: #15803d;
      --ring: 0 0 0 3px rgba(14, 165, 164, 0.22);
      --radius: 16px;
      --shadow: 0 24px 50px rgba(2, 19, 33, 0.28);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at 15% -10%, rgba(14, 165, 164, 0.45), transparent 40%),
        radial-gradient(circle at 95% 5%, rgba(249, 115, 22, 0.4), transparent 35%),
        linear-gradient(145deg, var(--bg-1) 0%, var(--bg-2) 70%, #0f4b61 100%);
      padding: 20px;
    }

    .shell {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      gap: 16px;
      animation: appear 450ms ease-out;
    }

    .hero {
      color: #e6fbff;
      background: linear-gradient(130deg, rgba(8, 67, 83, 0.85), rgba(14, 40, 70, 0.85));
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      box-shadow: var(--shadow);
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .hero h1 {
      margin: 0;
      font-size: clamp(24px, 3vw, 34px);
      letter-spacing: 0.2px;
    }

    .hero p {
      margin: 6px 0 0;
      opacity: 0.9;
    }

    .grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 16px;
    }

    .panel {
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid rgba(255, 255, 255, 0.6);
      padding: 16px;
      backdrop-filter: blur(8px);
    }

    .panel h2 {
      margin: 0 0 10px;
      font-size: 18px;
    }

    .panel h3 {
      margin: 14px 0 8px;
      font-size: 14px;
      letter-spacing: 0.2px;
      color: var(--muted);
    }

    .auth-grid {
      display: grid;
      gap: 10px;
    }

    input, select, textarea, button {
      width: 100%;
      border-radius: 10px;
      font: inherit;
    }

    input, select, textarea {
      border: 1px solid #c8d7e2;
      padding: 10px 12px;
      background: #fff;
      color: var(--text);
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      box-shadow: var(--ring);
      border-color: var(--accent);
    }

    button {
      border: 0;
      padding: 10px 12px;
      font-weight: 650;
      cursor: pointer;
      transition: transform 120ms ease, filter 120ms ease;
    }

    button:hover { transform: translateY(-1px); filter: brightness(1.03); }
    button:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

    .btn-primary { background: linear-gradient(120deg, var(--accent), #22c55e); color: #fff; }
    .btn-secondary { background: #e8f1f8; color: #153046; }
    .btn-danger { background: #fee2e2; color: #7f1d1d; }

    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      margin-bottom: 10px;
    }

    .stat {
      background: var(--surface-strong);
      border: 1px solid #dce8ef;
      border-radius: 12px;
      padding: 10px;
    }

    .stat .k { font-size: 12px; color: var(--muted); }
    .stat .v { margin-top: 4px; font-size: 22px; font-weight: 700; }

    .subject-list, .chapter-list, .history-list {
      display: grid;
      gap: 8px;
      max-height: 240px;
      overflow: auto;
      padding-right: 4px;
    }

    .subject-item, .chapter-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 8px;
      align-items: center;
      border: 1px solid #d6e4ee;
      background: #fff;
      border-radius: 10px;
      padding: 8px 10px;
    }

    .subject-meta {
      font-size: 12px;
      color: var(--muted);
    }

    .q-card {
      background: #fff;
      border: 1px solid #d9e4ee;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 10px;
    }

    .q-type {
      display: inline-block;
      font-size: 11px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1e3a8a;
      padding: 4px 8px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.45px;
    }

    .choice-list {
      display: grid;
      gap: 8px;
      margin-top: 8px;
    }

    .choice {
      border: 1px solid #d6e4ee;
      border-radius: 10px;
      padding: 8px;
      display: flex;
      gap: 8px;
      align-items: flex-start;
      background: #fff;
    }

    .status {
      margin-top: 8px;
      padding: 10px;
      border-radius: 10px;
      font-size: 14px;
    }

    .status.info { background: #e0f2fe; color: #0c4a6e; }
    .status.ok { background: #dcfce7; color: #14532d; }
    .status.err { background: #fee2e2; color: #7f1d1d; }

    .history-item {
      border: 1px solid #d6e4ee;
      border-radius: 10px;
      padding: 8px 10px;
      background: #fff;
      font-size: 13px;
    }

    .history-item b.ok { color: var(--ok); }
    .history-item b.err { color: var(--danger); }

    .muted { color: var(--muted); font-size: 13px; }
    .hidden { display: none !important; }

    @keyframes appear {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 980px) {
      body { padding: 12px; }
      .grid { grid-template-columns: 1fr; }
      .hero { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="hero">
      <div>
        <h1>Prototype Visuel - Entraînement MedQuiz</h1>
        <p>Objectif: te montrer une vraie expérience produit immédiatement, branchée sur ton API.</p>
      </div>
      <div id="userBadge" class="muted">Non connecté</div>
    </header>

    <main class="grid">
      <section class="panel" id="leftPanel">
        <h2>Connexion</h2>
        <div class="auth-grid">
          <input id="emailInput" type="email" placeholder="email" />
          <input id="passwordInput" type="password" placeholder="mot de passe" />
          <input id="displayNameInput" type="text" placeholder="nom affiché (inscription)" />
          <div class="row">
            <button class="btn-secondary" id="registerBtn">Créer compte</button>
            <button class="btn-primary" id="loginBtn">Se connecter</button>
          </div>
          <button class="btn-danger hidden" id="logoutBtn">Déconnexion</button>
        </div>

        <h3>Configuration Session</h3>
        <div class="auth-grid">
          <select id="modeSelect">
            <option value="learning">Apprentissage</option>
            <option value="discovery">Découverte</option>
            <option value="review">Révision</option>
            <option value="par_coeur">Par coeur</option>
            <option value="rattrapage">A revoir</option>
          </select>
          <select id="stopRuleSelect">
            <option value="fixed_10">10 questions</option>
            <option value="fixed_custom">Choisir nombre</option>
            <option value="until_stop">Jusqu'à arrêt</option>
          </select>
          <input id="targetCountInput" type="number" min="1" max="200" value="20" placeholder="Nombre de questions" />
          <button class="btn-primary" id="createSessionBtn" disabled>Démarrer entraînement</button>
          <button class="btn-secondary" id="refreshDashboardBtn" disabled>Rafraîchir dashboard</button>
        </div>

        <h3>Matières</h3>
        <div id="subjectsList" class="subject-list"></div>

        <h3>Chapitres (filtres)</h3>
        <div id="chaptersList" class="chapter-list"></div>
      </section>

      <section class="panel">
        <h2>Session En Cours</h2>
        <div class="stats" id="stats"></div>
        <div id="sessionSummary" class="muted">Aucune session active.</div>

        <div id="questionContainer" class="q-card hidden"></div>

        <div class="row" id="questionActions">
          <button class="btn-primary" id="submitAnswerBtn" disabled>Valider réponse</button>
          <button class="btn-secondary" id="nextQuestionBtn" disabled>Question suivante</button>
        </div>
        <div style="margin-top:8px">
          <button class="btn-danger" id="completeSessionBtn" disabled>Terminer session</button>
        </div>

        <div id="statusBox" class="status info">Connecte-toi pour commencer.</div>

        <h3>Historique immédiat</h3>
        <div id="historyList" class="history-list"></div>
      </section>
    </main>
  </div>

  <script>
    (function () {
      var baseUrl = window.location.origin + '/v1';
      var state = {
        token: localStorage.getItem('medquiz_demo_token') || '',
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
          throw new Error(msg);
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
          setStatus('Session invalide, reconnecte-toi.', 'err');
        }
      })();
    })();
  </script>
</body>
</html>`;
