export const DEMO_PAGE_HTML = String.raw`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MedQuiz - Prototype Entraînement</title>
  <style>
    :root {
      --ink: #10334a;
      --ink-soft: #56788e;
      --surface: #dff5ff;
      --surface-elevated: #ffffff;
      --line: rgba(255, 255, 255, 0.28);
      --brand: #44c8f5;
      --brand-strong: #1380af;
      --brand-soft: rgba(218, 245, 255, 0.82);
      --warm: #5ce748;
      --danger: #be123c;
      --ok: #15803d;
      --page-glow-a: rgba(121, 220, 255, 0.24);
      --page-glow-b: rgba(147, 255, 198, 0.12);
      --page-base-a: #0d4f79;
      --page-base-b: #1579ab;
      --page-base-c: #4cc7f2;
      --panel-a: rgba(147, 220, 247, 0.34);
      --panel-b: rgba(94, 182, 222, 0.28);
      --section-a: rgba(241, 251, 255, 0.92);
      --section-b: rgba(214, 240, 251, 0.86);
      --frame-a: rgba(116, 215, 255, 0.96);
      --frame-b: rgba(52, 176, 227, 0.96);
      --frame-c: rgba(21, 126, 179, 0.96);
      --frame-rays-opacity: 0.32;
      --toolbar-a: rgba(35, 153, 210, 0.5);
      --toolbar-b: rgba(17, 112, 164, 0.34);
      --toolbar-title: #ffffff;
      --toolbar-subtitle: rgba(239, 251, 255, 0.9);
      --top-chip-bg: rgba(255, 255, 255, 0.8);
      --top-chip-border: #d8e5ef;
      --top-chip-ink: #1d475d;
      --bottom-nav-a: rgba(255, 255, 255, 0.86);
      --bottom-nav-b: rgba(244, 248, 252, 0.84);
      --bottom-nav-border: rgba(255, 255, 255, 0.88);
      --bottom-nav-ink: #496475;
      --bottom-nav-active-a: #eaf8f5;
      --bottom-nav-active-b: #f7fbff;
      --bottom-nav-active-ink: #0f6e64;
      --module-a: rgba(97, 205, 250, 0.36);
      --module-b: rgba(28, 145, 197, 0.34);
      --module-copy: rgba(236, 251, 255, 0.9);
      --module-selected-a: rgba(112, 243, 98, 0.82);
      --module-selected-b: rgba(51, 196, 42, 0.8);
      --surface-card-a: #ffffff;
      --surface-card-b: #f7fbff;
      --question-a: #ffffff;
      --question-b: #fffaf7;
      --question-border: rgba(255, 255, 255, 0.92);
      --question-text: #ffffff;
      --question-support-a: #f8fcff;
      --question-support-b: #edf7fc;
      --question-support-border: #d5e7f3;
      --question-support-text: rgba(248, 252, 255, 0.96);
      --choice-a: #3d4047;
      --choice-b: #191c21;
      --choice-border: rgba(255, 255, 255, 0.14);
      --choice-text: #f5fbff;
      --choice-active-a: #64ef42;
      --choice-active-b: #2ebd22;
      --choice-active-border: rgba(169, 255, 148, 0.55);
      --ambient-scene-image: none;
      --ambient-scene-opacity: 0.94;
      --ambient-scene-overlay: linear-gradient(180deg, rgba(214, 235, 245, 0.08), rgba(156, 198, 219, 0.16));
      --radius-lg: 20px;
      --radius-md: 14px;
      --shadow: 0 24px 60px rgba(4, 29, 46, 0.18);
      --ring: 0 0 0 3px rgba(68, 200, 245, 0.24);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Sora", "Avenir Next", "Segoe UI", sans-serif;
      color: var(--ink);
      position: relative;
      overflow-x: hidden;
      background: linear-gradient(180deg, #cae6f2 0%, #b7d8e8 100%);
      padding: 22px 18px 28px;
    }

    body::before,
    body::after {
      content: "";
      position: fixed;
      pointer-events: none;
      inset: 0;
    }

    body::before {
      z-index: -2;
      background-image: var(--ambient-scene-image);
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      opacity: var(--ambient-scene-opacity);
      transform: scale(1.02);
      transform-origin: center center;
    }

    body::after {
      z-index: -1;
      background: var(--ambient-scene-overlay);
    }

    .shell {
      max-width: 1220px;
      margin: 0 auto;
      display: grid;
      gap: 16px;
      position: relative;
      z-index: 1;
      animation: fade-in 360ms ease-out;
    }

    .hero {
      background:
        radial-gradient(circle at 14% 16%, rgba(255, 198, 211, 0.22), transparent 30%),
        radial-gradient(circle at 88% 6%, rgba(255, 223, 181, 0.18), transparent 24%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 249, 246, 0.92));
      color: var(--ink);
      border: 1px solid rgba(255, 255, 255, 0.9);
      border-radius: 22px;
      box-shadow: 0 20px 48px rgba(12, 47, 72, 0.08);
      padding: 24px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      backdrop-filter: blur(16px);
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
      color: #50697a;
    }

    .hero-meta {
      display: grid;
      justify-items: end;
      gap: 10px;
      min-width: 210px;
    }

    .pill {
      display: inline-flex;
      border: 1px solid rgba(214, 226, 236, 0.92);
      background: rgba(255, 255, 255, 0.72);
      color: #27475b;
      padding: 7px 12px;
      border-radius: 999px;
      font-size: 12px;
      letter-spacing: 0.18px;
      box-shadow: 0 8px 20px rgba(12, 47, 72, 0.06);
    }

    .user-badge {
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.76);
      border: 1px solid rgba(217, 228, 238, 0.96);
      color: #325061;
      font-size: 13px;
      padding: 10px 12px;
      text-align: right;
      width: 100%;
      box-shadow: 0 10px 22px rgba(12, 47, 72, 0.05);
    }

    .grid {
      display: grid;
      grid-template-columns: minmax(330px, 390px) 1fr;
      gap: 14px;
    }

    .panel {
      background:
        radial-gradient(circle at top right, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0) 40%),
        linear-gradient(180deg, rgba(214, 236, 247, 0.72), rgba(175, 210, 228, 0.5));
      border: 1px solid rgba(234, 246, 252, 0.34);
      border-radius: var(--radius-lg);
      box-shadow: 0 18px 40px rgba(4, 30, 48, 0.12);
      padding: 16px;
      backdrop-filter: blur(20px);
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
      background: linear-gradient(180deg, rgba(226, 243, 251, 0.82), rgba(190, 223, 238, 0.58));
      border-radius: var(--radius-md);
      padding: 12px;
      margin-top: 12px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
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

    .screen-root,
    .screen-pane,
    .screen-view {
      display: grid;
      gap: 14px;
    }

    .welcome-grid {
      grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.92fr);
      align-items: start;
    }

    .auth-landing-panel {
      align-content: start;
      min-height: 100%;
    }

    .app-frame {
      border-radius: 34px;
      overflow: hidden;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.28);
      background: linear-gradient(180deg, rgba(205, 230, 243, 0.36), rgba(168, 205, 225, 0.24));
      box-shadow: 0 30px 80px rgba(4, 28, 44, 0.22);
      display: grid;
      gap: 0;
      backdrop-filter: blur(12px);
    }

    .app-frame::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05));
      opacity: 1;
      pointer-events: none;
    }

    .app-toolbar,
    .app-scroll-area,
    .app-bottom-nav {
      position: relative;
      z-index: 1;
    }

    .app-scroll-area {
      display: grid;
      gap: 14px;
      padding: 16px 16px 18px;
      position: relative;
      overflow: hidden;
      background: transparent;
    }

    .app-scroll-area::before,
    .app-scroll-area::after {
      display: none;
    }

    .app-scroll-area > * {
      position: relative;
      z-index: 1;
    }

    .welcome-story-panel {
      border: 1px solid rgba(255, 255, 255, 0.18);
      background:
        radial-gradient(circle at 88% 10%, rgba(255, 255, 255, 0.16), transparent 28%),
        radial-gradient(circle at 12% 86%, rgba(245, 158, 11, 0.18), transparent 28%),
        linear-gradient(135deg, rgba(8, 40, 59, 0.95), rgba(11, 93, 97, 0.92));
      color: #f5fcff;
      display: grid;
      gap: 16px;
    }

    .welcome-story-top {
      display: grid;
      gap: 10px;
    }

    .welcome-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.34px;
      font-weight: 800;
      color: rgba(233, 250, 255, 0.78);
    }

    .welcome-title {
      font-size: clamp(32px, 4.8vw, 54px);
      font-weight: 800;
      line-height: 0.96;
      letter-spacing: -0.03em;
      max-width: 10ch;
    }

    .welcome-text {
      max-width: 62ch;
      font-size: 14px;
      line-height: 1.62;
      color: rgba(234, 250, 255, 0.9);
    }

    .welcome-story-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .welcome-story-chips .pill {
      background: rgba(255, 255, 255, 0.14);
    }

    .welcome-story-minimal {
      display: grid;
      gap: 14px;
    }

    .welcome-mini-line {
      max-width: 44ch;
      font-size: 13px;
      line-height: 1.55;
      color: rgba(233, 250, 255, 0.86);
    }

    .welcome-preview-phone {
      width: min(100%, 420px);
      justify-self: start;
      border-radius: 30px;
      padding: 10px;
      background: linear-gradient(180deg, #218fc4, #0f5f8d);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 28px 44px rgba(3, 36, 56, 0.3);
    }

    .welcome-phone-chrome {
      width: 42%;
      height: 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.22);
      margin: 0 auto 10px;
    }

    .welcome-phone-screen {
      border-radius: 22px;
      padding: 14px;
      background:
        radial-gradient(circle at top right, rgba(255, 191, 204, 0.18), transparent 32%),
        linear-gradient(180deg, #fffdfd, #fff6f5);
      color: var(--ink);
      display: grid;
      gap: 12px;
    }

    .welcome-phone-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .welcome-phone-brand {
      display: grid;
      gap: 2px;
    }

    .welcome-phone-brand b {
      font-size: 15px;
      line-height: 1.1;
      color: var(--ink);
    }

    .welcome-phone-brand span {
      font-size: 11px;
      line-height: 1.35;
      color: var(--ink-soft);
    }

    .welcome-phone-avatar {
      width: 38px;
      height: 38px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #cf7f95, #f1b9a0);
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      box-shadow: 0 10px 18px rgba(201, 117, 138, 0.18);
    }

    .welcome-phone-highlight {
      border-radius: 18px;
      padding: 13px;
      background: linear-gradient(135deg, #d88696, #efbe83);
      color: #f4fcff;
      display: grid;
      gap: 5px;
    }

    .welcome-phone-highlight .k {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.28px;
      color: rgba(230, 249, 255, 0.72);
      font-weight: 800;
    }

    .welcome-phone-highlight .v {
      font-size: 24px;
      font-weight: 800;
      line-height: 1.02;
    }

    .welcome-phone-highlight .n {
      font-size: 12px;
      line-height: 1.42;
      color: rgba(237, 251, 255, 0.88);
    }

    .welcome-phone-stack {
      display: grid;
      gap: 8px;
    }

    .welcome-preview-card {
      border: 1px solid #d9e6ee;
      border-radius: 16px;
      padding: 11px;
      background: linear-gradient(180deg, #ffffff, #f7fbfe);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .welcome-preview-copy {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .welcome-preview-copy b {
      font-size: 14px;
      line-height: 1.15;
      color: var(--ink);
    }

    .welcome-preview-copy span {
      font-size: 11px;
      line-height: 1.4;
      color: var(--ink-soft);
    }

    .welcome-preview-badge {
      border-radius: 999px;
      padding: 5px 9px;
      background: #e8f6f3;
      color: #0c6e64;
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
    }

    .welcome-phone-nav {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding-top: 4px;
    }

    .welcome-phone-nav-item {
      border-radius: 14px;
      border: 1px solid #dce8ef;
      padding: 9px 6px;
      background: #ffffff;
      display: grid;
      gap: 5px;
      justify-items: center;
      text-align: center;
      font-size: 10px;
      color: var(--ink-soft);
    }

    .welcome-phone-nav-item.active {
      border-color: rgba(201, 117, 138, 0.22);
      background: linear-gradient(180deg, #fff5f8, #fffaf8);
      color: var(--brand-strong);
      font-weight: 700;
    }

    .welcome-phone-dot {
      width: 20px;
      height: 20px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--brand), var(--warm));
      opacity: 0.3;
    }

    .welcome-phone-nav-item.active .welcome-phone-dot {
      opacity: 1;
    }

    .welcome-light-list {
      display: grid;
      gap: 8px;
    }

    .welcome-light-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      line-height: 1.45;
      color: rgba(233, 250, 255, 0.84);
    }

    .welcome-light-bullet {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #f59e0b;
      flex: none;
    }

    .welcome-feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
    }

    .welcome-feature-card {
      border-radius: 18px;
      padding: 14px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.16);
      display: grid;
      gap: 6px;
      backdrop-filter: blur(10px);
    }

    .welcome-feature-kicker {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.26px;
      text-transform: uppercase;
      color: rgba(231, 250, 255, 0.72);
    }

    .welcome-feature-value {
      font-size: 22px;
      font-weight: 800;
      line-height: 1.02;
      color: #ffffff;
    }

    .welcome-feature-copy {
      font-size: 12px;
      line-height: 1.45;
      color: rgba(233, 250, 255, 0.86);
    }

    .welcome-lane {
      border-radius: 20px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      display: grid;
      gap: 12px;
    }

    .welcome-lane-head {
      display: grid;
      gap: 10px;
    }

    .welcome-lane-head b {
      font-size: 18px;
      line-height: 1.08;
      color: #ffffff;
    }

    .welcome-lane-head span {
      font-size: 12px;
      line-height: 1.45;
      color: rgba(233, 250, 255, 0.82);
    }

    .welcome-lane-list {
      display: grid;
      gap: 9px;
    }

    .welcome-lane-item {
      display: grid;
      grid-template-columns: 44px 1fr;
      gap: 10px;
      align-items: start;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      padding-top: 9px;
    }

    .welcome-lane-item:first-child {
      border-top: 0;
      padding-top: 0;
    }

    .welcome-step {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.18);
      font-weight: 800;
      color: #ffffff;
    }

    .welcome-lane-copy {
      display: grid;
      gap: 3px;
    }

    .welcome-lane-copy b {
      font-size: 15px;
      line-height: 1.2;
      color: #ffffff;
    }

    .welcome-lane-copy span {
      font-size: 12px;
      line-height: 1.45;
      color: rgba(233, 250, 255, 0.86);
    }

    .welcome-auth-panel {
      display: grid;
      gap: 12px;
      background: linear-gradient(180deg, rgba(216, 244, 255, 0.82), rgba(178, 227, 247, 0.74));
    }

    .welcome-auth-head {
      display: grid;
      gap: 6px;
    }

    .welcome-auth-head h2 {
      margin: 0;
      font-size: 28px;
      line-height: 1.02;
    }

    .welcome-auth-text {
      font-size: 14px;
      line-height: 1.52;
      color: var(--ink-soft);
    }

    .welcome-auth-card {
      margin-top: 0;
      display: grid;
      gap: 10px;
    }

    .welcome-status {
      margin-top: 4px;
    }

    .welcome-auth-note {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .welcome-note-grid {
      display: grid;
      gap: 10px;
    }

    .welcome-note-card {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 13px;
      background: linear-gradient(180deg, #ffffff, #f7fbff);
      display: grid;
      gap: 8px;
    }

    .welcome-note-card b {
      font-size: 15px;
      line-height: 1.15;
      color: var(--ink);
    }

    .welcome-note-card span {
      font-size: 12px;
      line-height: 1.5;
      color: var(--ink-soft);
    }

    .app-toolbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin: 0;
      border-radius: 0;
      border: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: none;
      background: linear-gradient(180deg, rgba(214, 237, 248, 0.42), rgba(176, 211, 230, 0.24));
      padding: 16px 18px 14px;
      backdrop-filter: blur(18px);
    }

    .screen-title-block {
      display: grid;
      gap: 6px;
      min-width: 0;
    }

    .screen-title {
      font-size: clamp(24px, 3vw, 34px);
      font-weight: 800;
      line-height: 1.05;
      color: var(--toolbar-title);
    }

    .screen-subtitle {
      font-size: 14px;
      color: var(--toolbar-subtitle);
      line-height: 1.4;
      max-width: 62ch;
    }

    .app-toolbar-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .app-toolbar-actions .btn-inline.is-active {
      background: linear-gradient(130deg, var(--brand), #0f9f8f);
      color: #ffffff;
      box-shadow: 0 10px 22px rgba(15, 118, 110, 0.22);
    }

    .app-top-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .app-top-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.22px;
      background: var(--top-chip-bg);
      color: var(--top-chip-ink);
      border: 1px solid var(--top-chip-border);
      box-shadow: 0 10px 18px rgba(12, 47, 72, 0.05);
    }

    .app-top-chip-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--brand);
      flex: none;
    }

    .app-top-action {
      width: auto;
      min-width: 0;
      padding-inline: 12px;
    }

    .app-notification-btn {
      position: relative;
      width: 42px;
      min-width: 42px;
      height: 42px;
      min-height: 42px;
      padding: 0;
      border-radius: 16px;
      background: linear-gradient(180deg, rgba(230, 245, 252, 0.86), rgba(193, 221, 235, 0.68));
      border: 1px solid rgba(255, 255, 255, 0.44);
      color: var(--ink);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 24px rgba(12, 47, 72, 0.08);
    }

    .app-notification-btn.is-active {
      background: linear-gradient(180deg, #eaf8f5, #f7fbff);
      border-color: rgba(15, 118, 110, 0.24);
      color: #0f6e64;
    }

    .app-notification-glyph {
      font-size: 16px;
      font-weight: 800;
      line-height: 1;
    }

    .app-notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 999px;
      background: #dc2626;
      color: #ffffff;
      border: 2px solid #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 800;
      line-height: 1;
      box-shadow: 0 8px 16px rgba(220, 38, 38, 0.24);
    }

    .app-bottom-nav {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding: 10px;
      margin: 0 12px 14px;
      border: 1px solid var(--bottom-nav-border);
      border-radius: 24px;
      background: linear-gradient(180deg, rgba(216, 239, 250, 0.64), rgba(182, 217, 235, 0.46));
      box-shadow: 0 18px 36px rgba(12, 47, 72, 0.08);
      backdrop-filter: blur(16px);
    }

    .app-tab {
      border: 0;
      border-radius: 18px;
      min-height: 62px;
      padding: 10px 8px;
      background: transparent;
      color: var(--bottom-nav-ink);
      display: grid;
      justify-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: none;
    }

    .app-tab:hover {
      transform: none;
      filter: none;
      box-shadow: none;
    }

    .app-tab-dot {
      width: 22px;
      height: 22px;
      border-radius: 10px;
      background: linear-gradient(135deg, #dfeaf2, #cbdde8);
      transition: transform 130ms ease, opacity 130ms ease, background 130ms ease;
      opacity: 0.9;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
    }

    .app-tab.is-active {
      background: linear-gradient(180deg, var(--bottom-nav-active-a), var(--bottom-nav-active-b));
      color: var(--bottom-nav-active-ink);
      box-shadow: inset 0 0 0 1px rgba(15, 118, 110, 0.16);
    }

    .app-tab.is-active .app-tab-dot {
      background: linear-gradient(135deg, var(--brand), var(--warm));
      transform: translateY(-1px);
      opacity: 1;
    }

    .app-collapsible {
      margin-top: 12px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(229, 244, 251, 0.88), rgba(196, 226, 241, 0.68));
      overflow: hidden;
    }

    .app-collapsible:first-child {
      margin-top: 0;
    }

    .app-collapsible > summary {
      list-style: none;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 14px;
    }

    .app-collapsible > summary::-webkit-details-marker {
      display: none;
    }

    .app-collapsible-head {
      display: grid;
      gap: 3px;
      min-width: 0;
    }

    .app-collapsible-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.24px;
      color: var(--ink-soft);
      font-weight: 800;
    }

    .app-collapsible-title {
      font-size: 16px;
      line-height: 1.15;
      font-weight: 800;
      color: var(--ink);
    }

    .app-collapsible-note {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .app-collapsible-meta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .app-collapsible-arrow {
      width: 26px;
      height: 26px;
      border-radius: 10px;
      background: #eef5fb;
      border: 1px solid #d8e5ef;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #315164;
      font-size: 12px;
      transition: transform 130ms ease;
      flex: none;
    }

    .app-collapsible[open] .app-collapsible-arrow {
      transform: rotate(180deg);
    }

    .app-collapsible-content {
      padding: 0 14px 14px;
      display: grid;
      gap: 10px;
    }

    .app-collapsible[open] > summary {
      border-bottom: 1px solid var(--line);
      background: linear-gradient(180deg, #fbfeff, #f3f9fd);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
    }

    .dashboard-shell {
      display: grid;
      gap: 12px;
    }

    .dashboard-hero {
      border: 1px solid rgba(255, 255, 255, 0.82);
      border-radius: 22px;
      padding: 18px;
      background:
        radial-gradient(circle at 86% 10%, rgba(255, 255, 255, 0.18), transparent 28%),
        radial-gradient(circle at 14% 85%, rgba(245, 158, 11, 0.2), transparent 28%),
        linear-gradient(135deg, rgba(13, 98, 101, 0.94), rgba(84, 181, 168, 0.86));
      color: #f5fcff;
      display: grid;
      grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
      gap: 14px;
      box-shadow: 0 22px 44px rgba(12, 47, 72, 0.12);
    }

    .dashboard-hero-copy {
      display: grid;
      gap: 10px;
      align-content: start;
    }

    .dashboard-hero-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.34px;
      font-weight: 800;
      color: rgba(231, 250, 255, 0.75);
    }

    .dashboard-hero-title {
      font-size: clamp(28px, 4vw, 42px);
      font-weight: 800;
      line-height: 0.98;
      letter-spacing: -0.02em;
    }

    .dashboard-hero-text {
      font-size: 14px;
      line-height: 1.55;
      color: rgba(233, 250, 255, 0.88);
      max-width: 64ch;
    }

    .dashboard-hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .dashboard-hero-actions .btn-inline {
      min-width: 0;
    }

    .dashboard-hero-actions .btn-primary {
      box-shadow: 0 10px 24px rgba(7, 29, 48, 0.28);
    }

    .dashboard-hero-panel {
      border-radius: 18px;
      padding: 14px;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.24);
      display: grid;
      gap: 12px;
      align-content: start;
      backdrop-filter: blur(10px);
    }

    .dashboard-hero-panel-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .dashboard-hero-panel-title {
      display: grid;
      gap: 3px;
    }

    .dashboard-hero-panel-title b {
      font-size: 15px;
      line-height: 1.2;
    }

    .dashboard-hero-panel-title span {
      font-size: 12px;
      line-height: 1.4;
      color: rgba(232, 250, 255, 0.82);
    }

    .dashboard-hero-score {
      text-align: right;
      display: grid;
      gap: 2px;
      min-width: 84px;
    }

    .dashboard-hero-score .v {
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
      color: #ffffff;
    }

    .dashboard-hero-score .k {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.26px;
      color: rgba(231, 250, 255, 0.7);
    }

    .dashboard-hero-list {
      display: grid;
      gap: 8px;
    }

    .dashboard-hero-list-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      padding-top: 8px;
      font-size: 13px;
      color: rgba(240, 251, 255, 0.92);
    }

    .dashboard-hero-list-item:first-child {
      border-top: 0;
      padding-top: 0;
    }

    .dashboard-hero-list-item b {
      color: #ffffff;
      font-size: 14px;
      line-height: 1.2;
      text-align: right;
    }

    .dashboard-subgrid {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      gap: 12px;
    }

    .dashboard-pulse-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
    }

    .dashboard-pulse-card {
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 14px;
      background:
        radial-gradient(circle at top right, rgba(255, 191, 204, 0.16), transparent 34%),
        linear-gradient(180deg, #ffffff, #fff8f5);
      display: grid;
      gap: 6px;
      box-shadow: 0 12px 22px rgba(12, 47, 72, 0.04);
    }

    .dashboard-pulse-card .k {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.26px;
      color: var(--ink-soft);
      font-weight: 800;
    }

    .dashboard-pulse-card .v {
      font-size: 26px;
      font-weight: 800;
      line-height: 1;
      color: var(--ink);
    }

    .dashboard-pulse-card .n {
      font-size: 12px;
      line-height: 1.42;
      color: var(--ink-soft);
    }

    .dashboard-lane {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 14px;
      background: linear-gradient(180deg, #ffffff, #f8fbfe);
      display: grid;
      gap: 12px;
    }

    .dashboard-lane-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }

    .dashboard-lane-copy {
      display: grid;
      gap: 3px;
    }

    .dashboard-lane-copy b {
      font-size: 18px;
      line-height: 1.08;
      color: var(--ink);
    }

    .dashboard-lane-copy span {
      font-size: 12px;
      line-height: 1.42;
      color: var(--ink-soft);
    }

    .dashboard-lane-list {
      display: grid;
      gap: 8px;
    }

    .dashboard-lane-item {
      border: 1px solid #dce7ef;
      border-radius: 15px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff, #f7fbff);
      display: grid;
      gap: 7px;
    }

    .dashboard-lane-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }

    .dashboard-lane-title {
      font-size: 15px;
      font-weight: 800;
      line-height: 1.15;
      color: var(--ink);
    }

    .dashboard-lane-note {
      font-size: 12px;
      line-height: 1.4;
      color: var(--ink-soft);
    }

    .dashboard-card {
      border: 1px solid rgba(255, 255, 255, 0.9);
      border-radius: 20px;
      padding: 16px;
      background:
        radial-gradient(circle at top right, rgba(15, 118, 110, 0.1), transparent 34%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 250, 255, 0.95));
      display: grid;
      gap: 12px;
      min-height: 228px;
      box-shadow: 0 16px 28px rgba(12, 47, 72, 0.05);
    }

    .dashboard-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }

    .dashboard-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.26px;
      color: var(--ink-soft);
      font-weight: 800;
    }

    .dashboard-card-title {
      margin-top: 4px;
      font-size: 20px;
      font-weight: 800;
      line-height: 1.08;
      color: var(--ink);
    }

    .dashboard-value {
      font-size: clamp(24px, 3vw, 32px);
      font-weight: 800;
      line-height: 1.02;
      color: var(--ink);
      word-break: break-word;
    }

    .dashboard-copy {
      font-size: 13px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .dashboard-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .dashboard-card-actions {
      margin-top: auto;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .summary-stack {
      display: grid;
      gap: 12px;
    }

    .summary-head {
      display: grid;
      gap: 8px;
    }

    .summary-title {
      font-size: 24px;
      font-weight: 800;
      line-height: 1.08;
      color: var(--ink);
    }

    .summary-text {
      font-size: 13px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .summary-inline-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
    }

    .summary-card {
      border: 1px solid var(--line);
      border-radius: 15px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff, #f7fbff);
      display: grid;
      gap: 5px;
    }

    .summary-card-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.24px;
      color: var(--ink-soft);
      font-weight: 800;
    }

    .summary-card-value {
      font-size: 16px;
      font-weight: 800;
      color: var(--ink);
      line-height: 1.2;
      word-break: break-word;
    }

    .summary-card-note {
      font-size: 12px;
      line-height: 1.4;
      color: var(--ink-soft);
    }

    .settings-stack {
      display: grid;
      gap: 12px;
    }

    .settings-hero {
      border: 1px solid rgba(201, 117, 138, 0.14);
      border-radius: 18px;
      padding: 14px;
      background:
        radial-gradient(circle at top right, rgba(255, 191, 204, 0.18), transparent 30%),
        linear-gradient(180deg, #ffffff, #fff7f4);
      display: grid;
      gap: 10px;
    }

    .settings-hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .settings-hero-title {
      display: grid;
      gap: 4px;
    }

    .settings-hero-title b {
      font-size: 17px;
      line-height: 1.15;
      color: var(--ink);
    }

    .settings-hero-title span {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .settings-avatar-mark {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--brand), var(--warm));
      color: #ffffff;
      font-size: 14px;
      font-weight: 800;
      box-shadow: 0 12px 22px rgba(201, 117, 138, 0.18);
      flex: none;
    }

    .settings-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 10px;
    }

    .settings-option-card {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff, #f7fbfe);
      display: grid;
      gap: 8px;
    }

    .settings-option-head {
      display: grid;
      gap: 3px;
    }

    .settings-option-head b {
      font-size: 14px;
      line-height: 1.18;
      color: var(--ink);
    }

    .settings-option-head span {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .settings-select {
      min-width: 0;
    }

    .theme-color-input {
      width: 100%;
      min-height: 52px;
      border-radius: 14px;
      border: 1px solid rgba(200, 219, 230, 0.9);
      background: linear-gradient(180deg, #ffffff, #f6fbfe);
      padding: 6px;
      cursor: pointer;
    }

    .theme-color-meta {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
      font-size: 11px;
      line-height: 1.4;
      color: var(--ink-soft);
    }

    .theme-picker {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
    }

    .theme-chip {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 12px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 248, 252, 0.92));
      display: grid;
      gap: 10px;
      text-align: left;
      color: var(--ink);
      min-height: 164px;
    }

    .theme-chip.is-active {
      border-color: rgba(15, 118, 110, 0.28);
      box-shadow: inset 0 0 0 2px rgba(15, 118, 110, 0.08);
      background: linear-gradient(180deg, #f6fffc, #eef8ff);
    }

    .theme-preview {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      min-height: 72px;
      padding: 10px;
      border: 1px solid rgba(255, 255, 255, 0.42);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
      display: grid;
      align-content: start;
      gap: 8px;
    }

    .theme-preview::after {
      content: "";
      position: absolute;
      inset: auto -22px -28px auto;
      width: 90px;
      height: 90px;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0));
      pointer-events: none;
    }

    .theme-preview-sign {
      width: 48%;
      height: 12px;
      border-radius: 999px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
    }

    .theme-preview-question {
      width: 100%;
      height: 18px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.42);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
    }

    .theme-preview-answer-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }

    .theme-preview-answer {
      height: 14px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.26);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }

    .theme-chip-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .theme-chip-title {
      display: grid;
      gap: 3px;
    }

    .theme-chip-title b {
      font-size: 14px;
      line-height: 1.15;
    }

    .theme-chip-title span {
      font-size: 11px;
      line-height: 1.4;
      color: var(--ink-soft);
    }

    .theme-swatch-row {
      display: flex;
      gap: 6px;
    }

    .theme-swatch {
      width: 26px;
      height: 26px;
      border-radius: 10px;
      border: 1px solid rgba(11, 29, 42, 0.08);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
      flex: none;
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
      border-radius: 14px;
      font: inherit;
    }

    input, select, textarea {
      border: 1px solid rgba(255, 255, 255, 0.58);
      padding: 11px 13px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(237, 249, 255, 0.94));
      color: #14384d;
      font-size: 14px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 8px 18px rgba(4, 29, 46, 0.08);
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--brand);
      box-shadow: var(--ring);
    }

    textarea { resize: vertical; min-height: 110px; }

    button {
      border: 0;
      padding: 11px 14px;
      font-weight: 700;
      min-height: 46px;
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
      background: linear-gradient(180deg, #7fd6a1, #57be88);
      color: #fff;
      border: 1px solid rgba(231, 252, 239, 0.58);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 14px 26px rgba(54, 122, 88, 0.24);
    }

    .btn-secondary {
      background: linear-gradient(180deg, #86cbe4, #5ca9c8);
      color: #ffffff;
      border: 1px solid rgba(235, 247, 252, 0.54);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 14px 22px rgba(69, 123, 149, 0.24);
    }

    .btn-danger {
      background: linear-gradient(180deg, #ff6b6b, #c61f2f);
      color: #ffffff;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 14px 22px rgba(110, 16, 31, 0.22);
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
      background: linear-gradient(180deg, var(--surface-card-a), var(--surface-card-b));
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

    .goal-block {
      margin-top: 10px;
      border: 1px dashed var(--line);
      border-radius: 12px;
      padding: 10px;
      background: #fbfeff;
    }

    .goal-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2px;
      border-radius: 999px;
      padding: 5px 9px;
      background: #e8f5f4;
      color: #0b5f58;
      border: 1px solid #bfe7e2;
      white-space: nowrap;
    }

    .chip.warn {
      background: #fff4d6;
      color: #8a4b00;
      border-color: #ffd48a;
    }

    .progress-track {
      height: 9px;
      border-radius: 999px;
      background: #dfedf7;
      overflow: hidden;
      border: 1px solid #ccdfed;
    }

    .progress-fill {
      height: 100%;
      width: 0%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--brand), var(--warm));
      transition: width 220ms ease;
    }

    .completion-card {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: linear-gradient(180deg, var(--surface-card-a), var(--surface-card-b));
      padding: 12px;
      display: grid;
      gap: 10px;
    }

    .completion-card-rich {
      background:
        radial-gradient(circle at top right, rgba(255, 191, 204, 0.2), transparent 34%),
        radial-gradient(circle at bottom left, rgba(255, 223, 181, 0.12), transparent 24%),
        linear-gradient(180deg, #ffffff, #fff8f5);
      border-color: rgba(255, 255, 255, 0.92);
      padding: 16px;
      box-shadow: 0 18px 34px rgba(12, 47, 72, 0.06);
    }

    .completion-hero {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.6fr);
      gap: 12px;
      align-items: stretch;
    }

    .completion-hero-copy {
      display: grid;
      gap: 8px;
      align-content: start;
    }

    .completion-hero-title {
      font-size: clamp(24px, 3vw, 36px);
      font-weight: 800;
      line-height: 1.02;
      letter-spacing: -0.02em;
      color: var(--ink);
    }

    .completion-hero-note {
      font-size: 14px;
      line-height: 1.55;
      color: var(--ink-soft);
      max-width: 54ch;
    }

    .completion-hero-score {
      border: 1px solid #cfe3f1;
      border-radius: 20px;
      padding: 16px;
      background:
        radial-gradient(circle at top right, rgba(15, 118, 110, 0.08), transparent 34%),
        linear-gradient(180deg, #fbfeff, #f2f9fd);
      display: grid;
      gap: 6px;
      align-content: center;
      text-align: center;
    }

    .completion-hero-score .k {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.28px;
      font-weight: 800;
      color: var(--ink-soft);
    }

    .completion-hero-score .v {
      font-size: clamp(36px, 5vw, 56px);
      line-height: 1;
      font-weight: 800;
      color: var(--ink);
    }

    .completion-hero-score .n {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .completion-title {
      margin: 0;
      font-size: 15px;
      color: var(--ink);
    }

    .completion-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: fit-content;
      border-radius: 999px;
      border: 1px solid #bfe7e2;
      background: #edf9f7;
      color: #0b5f58;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.25px;
    }

    .completion-badge.warn {
      border-color: #ffd48a;
      background: #fff6df;
      color: #8a4b00;
    }

    .completion-summary {
      display: grid;
      gap: 5px;
    }

    .completion-summary .lead {
      font-size: 18px;
      font-weight: 800;
      color: var(--ink);
      line-height: 1.15;
    }

    .completion-summary .muted {
      font-size: 13px;
    }

    .completion-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .completion-kpi {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      background: #f9fdff;
    }

    .completion-kpi .k {
      font-size: 11px;
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.25px;
    }

    .completion-kpi .v {
      margin-top: 5px;
      font-size: 20px;
      font-weight: 800;
      color: var(--ink);
      line-height: 1;
    }

    .completion-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 8px;
      margin-top: 2px;
    }

    .completion-action-btn {
      width: 100%;
      min-height: 40px;
      text-align: center;
    }

    .completion-insight-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 10px;
    }

    .completion-insight-card {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
      background: linear-gradient(180deg, #ffffff, #f8fbfe);
      display: grid;
      gap: 10px;
    }

    .completion-insight-card.priority {
      border-color: #f2d7b0;
      background: linear-gradient(180deg, #fffdf8, #fff8ee);
    }

    .completion-insight-head {
      display: grid;
      gap: 4px;
    }

    .completion-insight-head b {
      font-size: 17px;
      line-height: 1.1;
      color: var(--ink);
    }

    .completion-insight-head span {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .completion-insight-list {
      display: grid;
      gap: 8px;
    }

    .completion-insight-item {
      border: 1px solid #dce7ef;
      border-radius: 14px;
      padding: 11px;
      background: linear-gradient(180deg, #ffffff, #f9fcff);
      display: grid;
      gap: 5px;
    }

    .completion-insight-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .completion-insight-title {
      font-size: 14px;
      font-weight: 800;
      line-height: 1.2;
      color: var(--ink);
    }

    .completion-insight-meta {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .completion-empty {
      border: 1px dashed #d5e3ec;
      border-radius: 14px;
      padding: 12px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--ink-soft);
      background: #fcfeff;
    }

    .notification-list {
      display: grid;
      gap: 8px;
      max-height: 260px;
      overflow: auto;
      padding-right: 2px;
    }

    .notification-item {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff, #f9fcff);
      display: grid;
      gap: 7px;
      box-shadow: 0 10px 22px rgba(12, 47, 72, 0.04);
    }

    .notification-item.unread {
      border-color: #f5d3a3;
      background: #fffaf1;
    }

    .notification-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .notification-body {
      font-size: 13px;
      color: var(--ink);
      line-height: 1.45;
    }

    .notification-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      color: var(--ink-soft);
      font-size: 11px;
      line-height: 1.35;
    }

    .notification-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .toast-stack {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 50;
      display: grid;
      gap: 10px;
      width: min(360px, calc(100vw - 36px));
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      border: 1px solid rgba(255, 255, 255, 0.65);
      border-left: 5px solid #f59e0b;
      border-radius: 18px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 20px 38px rgba(12, 47, 72, 0.12);
      display: grid;
      gap: 8px;
      animation: fade-in 220ms ease-out;
      backdrop-filter: blur(16px);
    }

    .toast-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .toast-body {
      font-size: 13px;
      color: var(--ink);
      line-height: 1.45;
    }

    .toast-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .toast-close {
      width: auto;
      min-width: 0;
      min-height: 0;
      padding: 4px 8px;
      border-radius: 999px;
      background: #edf4f9;
      color: var(--ink-soft);
      font-weight: 700;
    }

    .focus-list {
      display: grid;
      gap: 8px;
    }

    .focus-item {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 12px;
      background:
        radial-gradient(circle at top right, rgba(15, 118, 110, 0.06), transparent 34%),
        linear-gradient(180deg, #ffffff, #f8fbfe);
      display: grid;
      gap: 8px;
      box-shadow: 0 12px 22px rgba(12, 47, 72, 0.04);
    }

    .focus-rank {
      width: 34px;
      height: 34px;
      border-radius: 11px;
      background: linear-gradient(145deg, var(--brand), #4ad7bd);
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 13px;
      font-weight: 800;
      box-shadow: 0 12px 22px rgba(15, 118, 110, 0.16);
    }

    .focus-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .focus-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .focus-title-copy {
      display: grid;
      gap: 2px;
    }

    .focus-title-copy b {
      font-size: 15px;
      line-height: 1.1;
    }

    .focus-meter {
      height: 8px;
      border-radius: 999px;
      background: #e6eff6;
      overflow: hidden;
      border: 1px solid #d5e3ee;
    }

    .focus-meter-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #f59e0b, #ef4444);
    }

    .btn-inline {
      width: auto;
      min-width: 110px;
    }

    .setup-list {
      display: grid;
      gap: 7px;
      margin-bottom: 10px;
    }

    .setup-step {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff, #f8fbfe);
      font-size: 13px;
      color: var(--ink);
      display: grid;
      gap: 8px;
    }

    .setup-step-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .setup-step-index {
      width: 30px;
      height: 30px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: #eef4f8;
      color: #254557;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }

    .setup-step-status {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.22px;
      text-transform: uppercase;
      color: var(--ink-soft);
    }

    .setup-step-copy {
      display: grid;
      gap: 4px;
    }

    .setup-step-label {
      font-size: 14px;
      font-weight: 800;
      color: var(--ink);
    }

    .setup-step-detail {
      color: var(--ink-soft);
      font-size: 12px;
      line-height: 1.35;
    }

    .setup-step.done {
      border-color: #b6e8c7;
      background: #f3fcf7;
    }

    .setup-step.todo {
      border-color: #f5d3a3;
      background: #fffaf1;
    }

    .setup-step.done .setup-step-index {
      background: #dff6e8;
      color: #16723a;
    }

    .setup-step.todo .setup-step-index {
      background: #fff0cc;
      color: #8a4b00;
    }

    .preset-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .preset-grid .wide {
      grid-column: 1 / -1;
    }

    .duel-list {
      display: grid;
      gap: 8px;
      max-height: 230px;
      overflow: auto;
      padding-right: 2px;
    }

    .duel-item {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff, #f8fbfe);
      display: grid;
      gap: 5px;
      box-shadow: 0 10px 22px rgba(12, 47, 72, 0.04);
    }

    .duel-filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }

    .duel-filter-chip {
      border: 1px solid rgba(164, 209, 231, 0.78);
      border-radius: 999px;
      min-height: 40px;
      padding: 8px 14px;
      background: linear-gradient(180deg, rgba(236, 248, 255, 0.96), rgba(206, 237, 249, 0.94));
      color: var(--ink);
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 8px 16px rgba(48, 102, 130, 0.08);
    }

    .duel-filter-chip.is-active {
      border-color: rgba(140, 198, 225, 0.94);
      background: linear-gradient(180deg, rgba(224, 243, 252, 0.98), rgba(185, 226, 243, 0.96));
      box-shadow: 0 10px 18px rgba(69, 132, 167, 0.12), inset 0 0 0 1px rgba(232, 247, 255, 0.5);
    }

    .duel-item-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .duel-detail-card {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff, #f8fbfe);
      display: grid;
      gap: 8px;
      box-shadow: 0 12px 26px rgba(12, 47, 72, 0.05);
    }

    .duel-hero {
      border: 1px solid rgba(171, 216, 236, 0.88);
      border-radius: 18px;
      padding: 14px;
      background:
        radial-gradient(circle at top center, rgba(255, 255, 255, 0.5), transparent 34%),
        linear-gradient(180deg, rgba(218, 240, 250, 0.96), rgba(186, 223, 239, 0.9));
      box-shadow: 0 12px 26px rgba(87, 145, 177, 0.12);
      display: grid;
      gap: 12px;
    }

    .duel-hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }

    .duel-hero-copy {
      display: grid;
      gap: 5px;
    }

    .duel-hero-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.28px;
      color: var(--ink-soft);
      font-weight: 800;
    }

    .duel-hero-name {
      font-size: 30px;
      line-height: 1;
      font-weight: 900;
      color: #17425b;
      letter-spacing: -0.02em;
    }

    .duel-hero-copy .mini {
      font-size: 13px;
    }

    .duel-scoreboard {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 10px;
      border-radius: 16px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.44);
      border: 1px solid rgba(255, 255, 255, 0.46);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
    }

    .duel-score-col {
      display: grid;
      gap: 3px;
      justify-items: center;
      text-align: center;
    }

    .duel-score-col span {
      font-size: 12px;
      color: var(--ink-soft);
      font-weight: 700;
    }

    .duel-score-col b {
      font-size: 42px;
      line-height: 1;
      color: #17425b;
      text-shadow: 0 2px 0 rgba(255, 255, 255, 0.32);
    }

    .duel-score-vs {
      font-size: 15px;
      font-weight: 900;
      color: #4d7387;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .duel-guide {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px;
      background: linear-gradient(180deg, #fbfeff, #f4fbff);
      display: grid;
      gap: 10px;
    }

    .duel-overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .duel-overview-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(171, 216, 236, 0.88);
      border-radius: 14px;
      padding: 10px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(236, 249, 255, 0.92));
      box-shadow: 0 8px 18px rgba(84, 141, 173, 0.08);
    }

    .duel-overview-card::after {
      content: "";
      position: absolute;
      inset: 0 auto auto 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, rgba(134, 198, 228, 0.86), rgba(244, 194, 124, 0.8));
      opacity: 0.9;
    }

    .duel-overview-card.tour::after {
      background: linear-gradient(90deg, rgba(109, 201, 162, 0.92), rgba(138, 214, 185, 0.88));
    }

    .duel-overview-card.manches::after {
      background: linear-gradient(90deg, rgba(134, 198, 228, 0.9), rgba(178, 225, 244, 0.9));
    }

    .duel-overview-card.status::after {
      background: linear-gradient(90deg, rgba(243, 186, 116, 0.92), rgba(249, 217, 167, 0.9));
    }

    .duel-overview-card .k {
      font-size: 11px;
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }

    .duel-overview-card .v {
      margin-top: 4px;
      font-size: 19px;
      font-weight: 800;
      color: var(--ink);
      line-height: 1.2;
    }

    .duel-overview-card .s {
      margin-top: 3px;
      font-size: 11px;
      color: var(--ink-soft);
      line-height: 1.3;
    }

    .duel-player-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 8px;
    }

    .duel-player-card {
      --player-accent: var(--brand);
      position: relative;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff, #f7fbff);
      display: grid;
      gap: 10px;
    }

    .duel-player-card::after {
      content: "";
      position: absolute;
      inset: 0 auto auto 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, var(--player-accent), rgba(255, 255, 255, 0));
      opacity: 0.9;
    }

    .duel-player-card.me {
      border-color: #bfe7e2;
      box-shadow: inset 0 0 0 1px rgba(201, 117, 138, 0.08);
    }

    .duel-player-card.opponent {
      border-color: #d7e4ee;
      background: linear-gradient(180deg, #ffffff, #f5f9fd);
    }

    .duel-player-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .duel-player-main {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .duel-player-avatar {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(145deg, var(--player-accent), var(--warm));
      color: #ffffff;
      display: grid;
      place-items: center;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.4px;
      box-shadow: 0 12px 24px rgba(8, 31, 49, 0.18);
      flex: 0 0 auto;
    }

    .duel-player-identity {
      min-width: 0;
      display: grid;
      gap: 2px;
    }

    .duel-player-role {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.35px;
      color: var(--ink-soft);
    }

    .duel-player-scene {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(201, 117, 138, 0.08);
      border-radius: 18px;
      padding: 12px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), #fff7f4);
      display: grid;
      gap: 10px;
      isolation: isolate;
    }

    .duel-player-scene::before {
      content: "";
      position: absolute;
      top: -24px;
      right: -18px;
      width: 136px;
      height: 136px;
      background: radial-gradient(circle, var(--player-accent) 0%, transparent 68%);
      opacity: 0.16;
      filter: blur(10px);
      z-index: 0;
    }

    .duel-player-scene::after {
      content: "";
      position: absolute;
      left: 18px;
      right: 18px;
      bottom: 12px;
      height: 20px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(11, 47, 71, 0), rgba(11, 47, 71, 0.09), rgba(11, 47, 71, 0));
      z-index: 0;
    }

    .duel-player-scene-top,
    .duel-player-scene-body,
    .duel-player-scene-copy {
      position: relative;
      z-index: 1;
    }

    .duel-player-scene-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      flex-wrap: wrap;
    }

    .duel-player-stage-badge,
    .duel-player-specialty-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: auto;
      min-height: 0;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.28px;
      white-space: nowrap;
    }

    .duel-player-stage-badge {
      background: linear-gradient(135deg, var(--player-accent), #0b2f47);
      color: #ffffff;
      box-shadow: 0 10px 18px rgba(11, 47, 71, 0.16);
    }

    .duel-player-specialty-badge {
      border: 1px solid rgba(11, 47, 71, 0.1);
      background: rgba(255, 255, 255, 0.86);
      color: var(--ink);
    }

    .duel-player-scene-body {
      min-height: 132px;
      display: grid;
      place-items: center;
    }

    .duel-player-portrait-shell {
      position: relative;
      width: 136px;
      height: 136px;
      border-radius: 32px;
      display: grid;
      place-items: center;
      background: linear-gradient(160deg, rgba(255, 255, 255, 0.9), rgba(228, 241, 248, 0.96));
      box-shadow:
        inset 0 0 0 2px rgba(255, 255, 255, 0.75),
        0 18px 28px rgba(11, 47, 71, 0.12);
    }

    .duel-player-portrait-shell::before {
      content: "";
      position: absolute;
      inset: 10px;
      border-radius: 24px;
      border: 1px dashed rgba(11, 47, 71, 0.14);
    }

    .duel-player-avatar.large {
      width: 88px;
      height: 88px;
      border-radius: 24px;
      font-size: 30px;
      box-shadow: 0 16px 28px rgba(8, 31, 49, 0.2);
    }

    .duel-player-orbit {
      position: absolute;
      max-width: 92px;
      padding: 5px 8px;
      border-radius: 999px;
      border: 1px solid rgba(11, 47, 71, 0.08);
      background: rgba(255, 255, 255, 0.95);
      color: var(--ink);
      font-size: 10px;
      font-weight: 700;
      line-height: 1.15;
      text-align: center;
      box-shadow: 0 12px 22px rgba(11, 47, 71, 0.1);
    }

    .duel-player-orbit.pos-0 {
      top: 8px;
      right: -8px;
    }

    .duel-player-orbit.pos-1 {
      left: -10px;
      top: 54px;
    }

    .duel-player-orbit.pos-2 {
      right: -4px;
      bottom: 10px;
    }

    .duel-player-scene-copy {
      display: grid;
      gap: 2px;
    }

    .duel-player-scene-copy b {
      font-size: 13px;
      color: var(--ink);
    }

    .duel-player-scene-copy span {
      font-size: 12px;
      line-height: 1.35;
      color: var(--ink-soft);
    }

    .duel-player-name {
      font-size: 16px;
      font-weight: 800;
      color: var(--ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .duel-player-subtitle {
      font-size: 12px;
      color: var(--ink-soft);
      line-height: 1.3;
    }

    .duel-player-score {
      min-width: 68px;
      border-radius: 12px;
      padding: 8px 10px;
      background: rgba(15, 118, 110, 0.08);
      color: #0c4f54;
      display: grid;
      justify-items: center;
      line-height: 1;
    }

    .duel-player-score b {
      font-size: 22px;
    }

    .duel-player-score span {
      margin-top: 3px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.28px;
    }

    .duel-player-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .duel-player-tags .chip {
      max-width: 100%;
    }

    .chip.neutral {
      background: #eef4f8;
      color: #315061;
      border-color: #d6e4ee;
    }

    .duel-player-facts {
      display: grid;
      gap: 6px;
    }

    .duel-player-fact {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--ink-soft);
    }

    .duel-player-fact b {
      color: var(--ink);
      font-size: 13px;
      font-weight: 700;
      text-align: right;
    }

    .duel-stage-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 8px;
    }

    .duel-stage {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      background: #fff;
      display: grid;
      gap: 4px;
    }

    .duel-stage.done {
      border-color: #b6e8c7;
      background: #f3fcf7;
    }

    .duel-stage.active {
      border-color: #f5d3a3;
      background: #fffaf1;
      box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.12);
    }

    .duel-stage .step {
      font-size: 11px;
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.25px;
    }

    .duel-stage .title {
      font-size: 13px;
      font-weight: 700;
      color: var(--ink);
    }

    .duel-callout {
      border: 1px solid #bfd8eb;
      border-radius: 12px;
      padding: 10px;
      background: #edf8ff;
      display: grid;
      gap: 4px;
    }

    .duel-callout b {
      font-size: 14px;
      color: #123247;
    }

    .duel-guide-focus {
      border: 1px solid rgba(167, 207, 227, 0.74);
      border-radius: 18px;
      padding: 14px;
      background: linear-gradient(180deg, rgba(241, 251, 255, 0.96), rgba(219, 241, 250, 0.92));
      display: grid;
      gap: 10px;
      box-shadow: 0 12px 24px rgba(57, 120, 155, 0.08);
    }

    .duel-guide-focus-top {
      display: grid;
      gap: 4px;
    }

    .duel-guide-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.24px;
      color: var(--ink-soft);
      font-weight: 800;
    }

    .duel-guide-title {
      font-size: 20px;
      font-weight: 800;
      line-height: 1.08;
      color: var(--ink);
    }

    .duel-guide-copy {
      font-size: 13px;
      line-height: 1.5;
      color: var(--ink-soft);
    }

    .duel-guide-primary,
    .duel-guide-secondary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .duel-guide-hint {
      font-size: 12px;
      line-height: 1.4;
      color: var(--ink-soft);
    }

    .duel-round-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 8px;
    }

    .duel-round-pill {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px;
      background: #fff;
      display: grid;
      gap: 4px;
    }

    .duel-round-pill.active {
      border-color: #bfe7e2;
      background: #effaf8;
    }

    .duel-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
    }

    .duel-question {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 9px;
      background: #fff;
      display: grid;
      gap: 6px;
    }

    .duel-question.is-current {
      border-color: #f0c38a;
      background: rgba(255, 247, 235, 0.96);
      box-shadow: 0 12px 30px rgba(240, 195, 138, 0.18);
    }

    .duel-question.is-passive {
      background: rgba(255, 255, 255, 0.82);
    }

    .duel-section-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.24px;
      color: var(--ink-soft);
      font-weight: 800;
      margin-bottom: 4px;
    }

    .mini {
      font-size: 11px;
      color: var(--ink-soft);
      line-height: 1.3;
    }

    .duel-detail-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .duel-detail-utility {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
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
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: linear-gradient(180deg, rgba(230, 247, 255, 0.92), rgba(198, 235, 250, 0.88));
      border-radius: 16px;
      padding: 9px 10px;
      box-shadow: 0 10px 18px rgba(4, 33, 50, 0.08);
    }

    .subject-meta {
      color: var(--ink-soft);
      font-size: 12px;
      margin-top: 2px;
    }

    .q-card {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--question-border);
      border-radius: 24px;
      padding: 18px;
      margin-bottom: 10px;
      background:
        radial-gradient(circle at top right, rgba(255, 191, 204, 0.2), transparent 32%),
        radial-gradient(circle at bottom left, rgba(255, 223, 181, 0.12), transparent 26%),
        linear-gradient(180deg, var(--question-a), var(--question-b));
      min-height: 240px;
      box-shadow: 0 18px 40px rgba(12, 47, 72, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.55);
    }

    .q-stage-head {
      display: grid;
      justify-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .q-stage-marquee {
      position: relative;
      min-width: min(100%, 300px);
      padding: 18px 28px;
      border-radius: 28px;
      border: 3px solid rgba(218, 243, 255, 0.9);
      background:
        radial-gradient(circle at top center, rgba(255, 255, 255, 0.22), transparent 32%),
        linear-gradient(180deg, rgba(84, 146, 255, 0.98), rgba(43, 94, 220, 0.98));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        inset 0 2px 0 rgba(255, 255, 255, 0.38),
        0 16px 36px rgba(15, 61, 131, 0.24);
    }

    .q-stage-marquee::before {
      content: "";
      position: absolute;
      inset: 6px;
      border-radius: 22px;
      border: 2px solid rgba(191, 233, 255, 0.76);
      pointer-events: none;
    }

    .q-stage-marquee::after {
      content: "";
      position: absolute;
      inset: -10px;
      border-radius: 34px;
      background:
        radial-gradient(circle at 6% 50%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 20% 16%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 36% 10%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 52% 8%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 68% 10%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 84% 16%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 94% 50%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 84% 84%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 68% 90%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 52% 92%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 36% 90%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px),
        radial-gradient(circle at 20% 84%, rgba(255, 255, 255, 0.96) 0 4px, transparent 5px);
      pointer-events: none;
      opacity: 0.92;
    }

    .q-stage-logo {
      position: relative;
      z-index: 1;
      font-size: clamp(38px, 7vw, 62px);
      line-height: 0.95;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: #ffffff;
      text-shadow: 0 4px 0 rgba(38, 81, 173, 0.38), 0 12px 22px rgba(16, 53, 117, 0.28);
    }

    .q-stage-prize {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 210px;
      padding: 10px 22px;
      border-radius: 999px;
      background: linear-gradient(180deg, #ffe980, #ffc83d);
      border: 2px solid rgba(255, 245, 187, 0.9);
      color: #21416a;
      font-size: 18px;
      font-weight: 800;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.44), 0 16px 28px rgba(146, 102, 15, 0.18);
    }

    .q-focus-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }

    .q-progress-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 9px 16px;
      border-radius: 999px;
      background: linear-gradient(180deg, #ffe980, #ffc83d);
      border: 2px solid rgba(255, 245, 187, 0.9);
      color: #21416a;
      font-size: 14px;
      font-weight: 800;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.44), 0 10px 18px rgba(146, 102, 15, 0.14);
    }

    .q-scope-chip {
      background: rgba(255, 255, 255, 0.12) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.22) !important;
      box-shadow: none;
    }

    .q-type {
      display: inline-flex;
      font-size: 11px;
      letter-spacing: 0.52px;
      text-transform: uppercase;
      border-radius: 999px;
      padding: 7px 12px;
      background: rgba(255, 255, 255, 0.14);
      color: rgba(245, 252, 255, 0.96);
      margin-bottom: 2px;
      font-weight: 800;
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: none;
    }

    .question-stage {
      display: grid;
      gap: 14px;
    }

    .question-stage.empty {
      place-items: center;
      text-align: center;
    }

    .q-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    .q-header-main {
      display: grid;
      gap: 7px;
      min-width: 0;
    }

    .q-meta-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .q-prompt {
      margin: 0;
      font-size: clamp(26px, 3vw, 34px);
      line-height: 1.18;
      letter-spacing: -0.01em;
      color: #ffffff !important;
      font-weight: 800;
      text-shadow: 0 2px 10px rgba(66, 121, 153, 0.22);
    }

    .q-question-card {
      display: grid;
      gap: 12px;
      border-radius: 24px;
      padding: 18px 18px 20px;
      border: 1px solid rgba(214, 237, 255, 0.4);
      background:
        radial-gradient(circle at top center, rgba(255, 255, 255, 0.18), transparent 34%),
        linear-gradient(180deg, rgba(156, 212, 239, 0.96), rgba(112, 182, 219, 0.94));
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.24),
        0 16px 30px rgba(73, 134, 170, 0.16);
    }

    .q-topic-line {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12px;
      font-weight: 700;
      color: rgba(235, 247, 255, 0.88);
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .q-guidance {
      font-size: 14px;
      line-height: 1.45;
      color: rgba(240, 249, 255, 0.9);
      font-weight: 600;
    }

    .q-answer-shell {
      display: grid;
      gap: 12px;
    }

    .q-feedback {
      display: grid;
      gap: 10px;
      border-radius: 20px;
      padding: 14px 16px;
      border: 1px solid rgba(223, 239, 249, 0.92);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 251, 255, 0.94));
      box-shadow: 0 12px 24px rgba(7, 33, 78, 0.08);
    }

    .q-feedback.ok {
      border-color: #bfe6ca;
      background: linear-gradient(180deg, #f2fbf5, #ecf8f0);
    }

    .q-feedback.err {
      border-color: rgba(255, 211, 128, 0.92);
      background: linear-gradient(180deg, rgba(255, 248, 228, 0.98), rgba(255, 238, 196, 0.96));
      animation: review-warn-pulse 1s ease-in-out 2;
    }

    .q-auto-advance {
      display: grid;
      gap: 8px;
      border-radius: 14px;
      padding: 10px 12px;
      border: 1px solid rgba(191, 231, 255, 0.42);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08));
    }

    .q-auto-advance-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 12px;
      color: rgba(245, 252, 255, 0.96);
    }

    .q-auto-advance-top b {
      font-size: 13px;
      color: #ffffff;
    }

    .q-auto-advance-track {
      width: 100%;
      height: 8px;
      border-radius: 999px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.16);
    }

    .q-auto-advance-bar {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #9ef56c, #3fd45b);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
      transition: width 100ms linear;
    }

    .q-feedback-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .q-feedback-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--ink);
    }

    .q-feedback-copy {
      font-size: 13px;
      line-height: 1.5;
      color: var(--ink-soft);
    }

    .q-empty-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--ink);
      line-height: 1.15;
    }

    .q-empty-copy {
      max-width: 54ch;
      color: var(--ink-soft);
      font-size: 14px;
      line-height: 1.45;
    }

    body[data-screen="training"][data-training-flow="play"] {
      --ambient-scene-opacity: 1;
      --ambient-scene-overlay: linear-gradient(180deg, rgba(12, 38, 86, 0.08), rgba(17, 86, 160, 0.08));
      padding: 8px;
    }

    body[data-screen="training"][data-training-flow="play"] .shell {
      max-width: 720px;
    }

    body[data-screen="training"][data-training-flow="play"] .app-toolbar,
    body[data-screen="training"][data-training-flow="play"] .app-bottom-nav {
      display: none;
    }

    body[data-screen="training"][data-training-flow="play"] .app-scroll-area {
      padding: 12px;
      gap: 10px;
      background: transparent;
    }

    body[data-screen="training"][data-training-flow="play"] .training-play-panel {
      background: transparent;
      border: 0;
      box-shadow: none;
      padding: 0;
    }

    body[data-screen="training"][data-training-flow="play"] .play-stage-note,
    body[data-screen="training"][data-training-flow="play"] #statusBox {
      display: none;
    }

    body[data-screen="training"][data-training-flow="play"] .goal-block,
    body[data-screen="training"][data-training-flow="play"] .session-brief {
      display: none;
    }

    body[data-screen="training"][data-training-flow="play"] .q-card {
      background: linear-gradient(180deg, rgba(195, 228, 245, 0.42), rgba(150, 198, 226, 0.24));
      border: 1px solid rgba(223, 242, 255, 0.22);
      box-shadow: 0 14px 30px rgba(83, 141, 175, 0.14);
      padding: 0;
      margin-bottom: 12px;
      min-height: 0;
      backdrop-filter: blur(8px);
    }

    body[data-screen="training"][data-training-flow="play"] .q-question-card {
      background:
        radial-gradient(circle at top center, rgba(255, 255, 255, 0.18), transparent 34%),
        linear-gradient(180deg, rgba(168, 217, 240, 0.86), rgba(120, 188, 221, 0.78));
      backdrop-filter: blur(8px);
    }

    body[data-screen="training"][data-training-flow="play"] .choice {
      background: linear-gradient(180deg, rgba(177, 221, 243, 0.82), rgba(129, 194, 226, 0.74));
      backdrop-filter: blur(8px);
    }

    body[data-screen="training"][data-training-flow="play"] .choice:has(input:checked) {
      background: linear-gradient(180deg, rgba(117, 230, 181, 0.82), rgba(50, 187, 133, 0.76));
    }

    body[data-screen="training"][data-training-flow="play"] .question-actions-row {
      grid-template-columns: 1fr;
      max-width: 360px;
      margin: 0 auto;
    }

    body[data-screen="training"][data-training-flow="play"] .question-exit-row {
      justify-content: flex-start;
    }

    body[data-screen="training"][data-training-flow="play"] .question-exit-row button {
      min-width: 0;
      min-height: 38px;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.24);
      color: #ffffff;
      box-shadow: none;
    }

    body[data-screen="duel"][data-duel-flow="play"] {
      --ambient-scene-opacity: 1;
      --ambient-scene-overlay: linear-gradient(180deg, rgba(12, 38, 86, 0.08), rgba(17, 86, 160, 0.08));
      padding: 8px;
    }

    body[data-screen="duel"][data-duel-flow="play"] .shell {
      max-width: 720px;
    }

    body[data-screen="duel"][data-duel-flow="play"] .app-bottom-nav {
      display: none;
    }

    body[data-screen="duel"][data-duel-flow="play"] .app-scroll-area {
      padding: 12px;
      gap: 10px;
      background: transparent;
    }

    body[data-screen="duel"][data-duel-flow="play"] .duel-play-panel {
      background: transparent;
      border: 0;
      box-shadow: none;
      padding: 0;
    }

    body[data-screen="duel"][data-duel-flow="play"] .duel-play-panel .q-card {
      background: linear-gradient(180deg, rgba(195, 228, 245, 0.42), rgba(150, 198, 226, 0.24));
      border: 1px solid rgba(223, 242, 255, 0.22);
      box-shadow: 0 14px 30px rgba(83, 141, 175, 0.14);
      padding: 0;
      margin-bottom: 12px;
      min-height: 0;
      backdrop-filter: blur(8px);
    }

    body[data-screen="duel"][data-duel-flow="play"] .duel-play-panel .q-question-card {
      background:
        radial-gradient(circle at top center, rgba(255, 255, 255, 0.18), transparent 34%),
        linear-gradient(180deg, rgba(168, 217, 240, 0.86), rgba(120, 188, 221, 0.78));
      backdrop-filter: blur(8px);
    }

    body[data-screen="duel"][data-duel-flow="play"] .duel-play-panel .choice {
      background: linear-gradient(180deg, rgba(177, 221, 243, 0.82), rgba(129, 194, 226, 0.74));
      backdrop-filter: blur(8px);
    }

    body[data-screen="duel"][data-duel-flow="play"] .duel-play-panel .choice:has(input:checked) {
      background: linear-gradient(180deg, rgba(117, 230, 181, 0.82), rgba(50, 187, 133, 0.76));
    }

    body[data-screen="duel"][data-duel-flow="play"] .duel-play-panel .question-actions-row {
      grid-template-columns: 1fr;
      max-width: 360px;
      margin: 0 auto;
    }

    body[data-screen="duel"][data-duel-flow="play"] .duel-play-panel .question-exit-row {
      justify-content: flex-start;
      margin-bottom: 10px;
    }

    body[data-screen="duel"][data-duel-flow="play"] .duel-play-panel .question-exit-row button {
      min-width: 0;
      min-height: 38px;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.24);
      color: #ffffff;
      box-shadow: none;
    }

    .duel-play-top {
      display: grid;
      gap: 10px;
      margin-bottom: 12px;
    }

    .duel-play-hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      border: 1px solid rgba(186, 227, 245, 0.32);
      border-radius: 18px;
      padding: 12px 14px;
      background: linear-gradient(180deg, rgba(205, 234, 248, 0.3), rgba(162, 207, 229, 0.2));
      box-shadow: 0 16px 28px rgba(60, 116, 150, 0.12);
      backdrop-filter: blur(10px);
    }

    .duel-play-copy {
      display: grid;
      gap: 4px;
    }

    .duel-play-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.24px;
      color: rgba(255, 255, 255, 0.78);
      font-weight: 800;
    }

    .duel-play-name {
      font-size: 28px;
      line-height: 1;
      font-weight: 900;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(17, 52, 88, 0.18);
    }

    .duel-play-copy .mini {
      color: rgba(255, 255, 255, 0.86);
      font-size: 12px;
    }

    .duel-play-score {
      display: grid;
      grid-template-columns: auto auto auto;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.28);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.34);
    }

    .duel-play-score b {
      font-size: 34px;
      line-height: 1;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(17, 52, 88, 0.18);
    }

    .duel-play-score span {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.12em;
      color: rgba(255, 255, 255, 0.78);
      text-transform: uppercase;
    }

    .duel-play-track {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .duel-play-pill {
      border-radius: 14px;
      padding: 10px 10px 9px;
      border: 1px solid rgba(210, 236, 249, 0.28);
      background: rgba(255, 255, 255, 0.14);
      display: grid;
      gap: 3px;
      justify-items: center;
      text-align: center;
      backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .duel-play-pill .slot {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.22px;
      color: rgba(255, 255, 255, 0.78);
      font-weight: 800;
    }

    .duel-play-pill .state {
      font-size: 13px;
      color: #ffffff;
      font-weight: 800;
      line-height: 1.2;
    }

    .duel-play-pill.is-current {
      background: rgba(255, 255, 255, 0.24);
      border-color: rgba(255, 255, 255, 0.34);
      transform: translateY(-1px);
    }

    .duel-play-pill.is-correct {
      background: rgba(118, 215, 175, 0.28);
      border-color: rgba(149, 240, 201, 0.36);
    }

    .duel-play-pill.is-wrong {
      background: rgba(244, 192, 126, 0.28);
      border-color: rgba(255, 216, 168, 0.36);
    }

    body[data-screen="duel"] {
      --ambient-scene-opacity: 0.96;
      --ambient-scene-overlay: linear-gradient(180deg, rgba(241, 251, 255, 0.05), rgba(166, 217, 245, 0.1));
    }

    body[data-screen="duel"] .app-scroll-area {
      background: transparent;
    }

    body[data-screen="duel"] .panel,
    body[data-screen="duel"] .duel-item,
    body[data-screen="duel"] .duel-detail-card,
    body[data-screen="duel"] .duel-guide,
    body[data-screen="duel"] .duel-question,
    body[data-screen="duel"] .duel-player-card,
    body[data-screen="duel"] .duel-overview-card,
    body[data-screen="duel"] .notification-item {
      backdrop-filter: blur(12px);
      background: linear-gradient(180deg, rgba(238, 249, 255, 0.78), rgba(204, 232, 247, 0.54));
      border-color: rgba(255, 255, 255, 0.42);
    }

    .choice-list {
      display: grid;
      gap: 12px;
      margin-top: 0;
    }

    .choice {
      width: 100%;
      min-height: 82px;
      border: 2px solid rgba(213, 240, 255, 0.74);
      border-radius: 999px;
      padding: 10px 18px 10px 12px;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 14px;
      align-items: center;
      background: linear-gradient(180deg, rgba(154, 208, 235, 0.98), rgba(106, 178, 215, 0.98));
      cursor: pointer;
      transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease, background 120ms ease;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.22), 0 12px 24px rgba(70, 128, 160, 0.2);
    }

    .choice:hover {
      border-color: rgba(255, 255, 255, 0.48);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 14px 22px rgba(4, 29, 46, 0.22);
      transform: translateY(-2px);
    }

    .choice:focus-within {
      border-color: rgba(201, 117, 138, 0.45);
      box-shadow: var(--ring);
    }

    .choice:has(input:checked) {
      border-color: var(--choice-active-border);
      background: linear-gradient(180deg, rgba(117, 230, 181, 0.98), rgba(50, 187, 133, 0.98));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 16px 28px rgba(27, 94, 20, 0.24);
    }

    .choice input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
      width: 0;
      height: 0;
      margin: 0;
    }

    .choice-badge {
      width: 56px;
      height: 56px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      line-height: 1;
      font-weight: 800;
      color: #2f6f8f;
      background: linear-gradient(180deg, rgba(236, 249, 255, 0.98), rgba(145, 201, 232, 0.96));
      border: 2px solid rgba(255, 255, 255, 0.72);
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.42), 0 10px 20px rgba(94, 149, 181, 0.2);
      flex: none;
    }

    .choice-copy {
      min-width: 0;
      display: block;
      width: 100%;
      font-size: clamp(20px, 2.5vw, 24px);
      line-height: 1.24;
      font-weight: 800;
      color: #ffffff;
      overflow-wrap: break-word;
      text-shadow: 0 1px 4px rgba(58, 109, 136, 0.16);
    }

    .choice-copy-wrap {
      min-width: 0;
      display: grid;
      gap: 6px;
    }

    .choice-state {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      width: fit-content;
      max-width: 100%;
      min-height: 24px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      line-height: 1.2;
      font-weight: 800;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    .choice-state.ok {
      background: rgba(229, 255, 236, 0.18);
      border: 1px solid rgba(219, 255, 229, 0.46);
      color: #f2fff6;
    }

    .choice-state.err {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.24);
      color: rgba(255, 255, 255, 0.92);
    }

    .choice-state.solution {
      background: rgba(255, 228, 176, 0.28);
      border: 1px solid rgba(255, 230, 194, 0.62);
      color: #7c4a03;
    }

    .choice:has(input:checked) .choice-copy {
      font-weight: 700;
      color: #ffffff;
    }

    .choice:has(input:checked) .choice-badge {
      background: linear-gradient(180deg, rgba(224, 255, 230, 0.98), rgba(127, 223, 149, 0.96));
      border-color: rgba(255, 255, 255, 0.86);
      color: #227548;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.44), 0 10px 20px rgba(28, 116, 58, 0.24);
    }

    .choice.is-review-dim {
      opacity: 0.72;
    }

    .choice.is-review-correct,
    .choice.is-review-correct-picked,
    .choice.is-review-correct:has(input:checked),
    .choice.is-review-correct-picked:has(input:checked) {
      border-color: rgba(218, 255, 226, 0.82);
      background: linear-gradient(180deg, rgba(120, 230, 184, 0.98), rgba(47, 185, 128, 0.98));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 16px 28px rgba(27, 94, 20, 0.24);
      opacity: 1;
    }

    .choice.is-review-wrong,
    .choice.is-review-wrong:has(input:checked) {
      border-color: rgba(230, 243, 250, 0.56);
      background: linear-gradient(180deg, rgba(219, 237, 247, 0.34), rgba(181, 215, 232, 0.26));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
      opacity: 0.62;
    }

    .choice.is-review-miss,
    .choice.is-review-miss-picked,
    .choice.is-review-miss:has(input:checked),
    .choice.is-review-miss-picked:has(input:checked) {
      border-color: rgba(240, 195, 120, 0.92);
      background: linear-gradient(180deg, rgba(244, 201, 120, 0.92), rgba(228, 164, 78, 0.88));
      box-shadow: inset 0 1px 0 rgba(255, 236, 204, 0.26), 0 14px 24px rgba(174, 117, 36, 0.18);
      opacity: 1;
      animation: review-warn-pulse 1s ease-in-out 2;
    }

    body[data-screen="training"][data-training-flow="play"] .choice.is-review-wrong,
    body[data-screen="training"][data-training-flow="play"] .choice.is-review-wrong:has(input:checked) {
      background: linear-gradient(180deg, rgba(219, 237, 247, 0.34), rgba(181, 215, 232, 0.26));
      border-color: rgba(230, 243, 250, 0.56);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
    }

    body[data-screen="training"][data-training-flow="play"] .choice.is-review-miss,
    body[data-screen="training"][data-training-flow="play"] .choice.is-review-miss-picked,
    body[data-screen="training"][data-training-flow="play"] .choice.is-review-miss:has(input:checked),
    body[data-screen="training"][data-training-flow="play"] .choice.is-review-miss-picked:has(input:checked) {
      background: linear-gradient(180deg, rgba(244, 201, 120, 0.92), rgba(228, 164, 78, 0.88));
      border-color: rgba(240, 195, 120, 0.92);
      box-shadow: inset 0 1px 0 rgba(255, 236, 204, 0.26), 0 14px 24px rgba(174, 117, 36, 0.18);
    }

    .choice.is-review-correct .choice-badge,
    .choice.is-review-correct-picked .choice-badge {
      background: linear-gradient(180deg, rgba(237, 255, 242, 0.98), rgba(165, 244, 190, 0.96));
      border-color: rgba(255, 255, 255, 0.88);
      color: #227548;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.44), 0 10px 20px rgba(28, 116, 58, 0.22);
    }

    .choice.is-review-wrong .choice-badge {
      background: linear-gradient(180deg, rgba(240, 248, 252, 0.9), rgba(203, 226, 238, 0.82));
      border-color: rgba(255, 255, 255, 0.72);
      color: #5b7f92;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.34), 0 8px 16px rgba(101, 145, 169, 0.12);
    }

    .choice.is-review-miss .choice-badge,
    .choice.is-review-miss-picked .choice-badge {
      background: linear-gradient(180deg, rgba(255, 225, 171, 0.96), rgba(241, 185, 97, 0.94));
      border-color: rgba(255, 239, 214, 0.84);
      color: #7c4a03;
      box-shadow: inset 0 2px 0 rgba(255, 239, 214, 0.32), 0 10px 20px rgba(174, 117, 36, 0.18);
    }

    @keyframes review-warn-pulse {
      0%, 100% {
        transform: scale(1);
        filter: saturate(1);
      }

      50% {
        transform: scale(1.01);
        filter: saturate(1.08);
      }
    }

    .open-answer-box {
      min-height: 130px;
      border-radius: 14px;
      padding: 12px 14px;
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
      border-radius: 16px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff, #f8fbfe);
      font-size: 13px;
      display: grid;
      gap: 7px;
    }

    .history-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .history-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 5px 9px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.22px;
      white-space: nowrap;
    }

    .history-pill.ok {
      background: #e8f8ee;
      color: #16723a;
      border: 1px solid #bfe6ca;
    }

    .history-pill.err {
      background: #fff0f3;
      color: #a0113d;
      border: 1px solid #f3c7d4;
    }

    .history-prompt {
      font-size: 14px;
      font-weight: 700;
      color: var(--ink);
      line-height: 1.35;
    }

    .question-actions-row {
      margin-top: 2px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .question-actions-row button {
      width: auto;
      min-width: 220px;
    }

    .question-exit-row {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
    }

    .question-exit-row button {
      width: auto;
      min-width: 180px;
    }

    .session-brief {
      position: relative;
      overflow: hidden;
      margin-top: 10px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      border-radius: 22px;
      padding: 14px;
      background:
        radial-gradient(circle at top right, rgba(255, 191, 204, 0.2), transparent 34%),
        radial-gradient(circle at bottom left, rgba(255, 223, 181, 0.12), transparent 24%),
        linear-gradient(180deg, #ffffff, #fff9f5);
      display: grid;
      gap: 12px;
      box-shadow: 0 16px 28px rgba(12, 47, 72, 0.06);
    }

    .session-brief.empty {
      border-style: dashed;
      background: linear-gradient(180deg, #fffdfd, #fff6f4);
    }

    .session-brief-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .session-brief-copy {
      display: grid;
      gap: 5px;
      min-width: 0;
    }

    .session-brief-eyebrow {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.28px;
      text-transform: uppercase;
      color: var(--ink-soft);
    }

    .session-brief-title {
      font-size: 20px;
      font-weight: 800;
      line-height: 1.15;
      color: var(--ink);
    }

    .session-brief-text {
      font-size: 13px;
      color: var(--ink-soft);
      line-height: 1.45;
    }

    .session-brief-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .session-brief-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .session-brief-kpi {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.84);
      display: grid;
      gap: 4px;
    }

    .session-brief-kpi .k {
      font-size: 11px;
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.24px;
    }

    .session-brief-kpi .v {
      font-size: 18px;
      font-weight: 800;
      color: var(--ink);
      line-height: 1.1;
    }

    .duel-home-summary {
      margin-top: 4px;
      display: grid;
      gap: 8px;
    }

    .duel-home-summary .session-brief {
      margin-top: 0;
      padding: 12px;
      gap: 10px;
    }

    .history-item b.ok { color: var(--ok); }
    .history-item b.err { color: var(--danger); }

    .welcome-minimal-grid {
      max-width: 430px;
      margin: 0 auto;
    }

    .welcome-mobile-shell {
      position: relative;
      width: 100%;
      min-height: calc(100vh - 18px);
      height: calc(100vh - 18px);
      border-radius: 34px;
      padding: 16px 14px 16px;
      background: linear-gradient(180deg, rgba(213, 236, 247, 0.5), rgba(175, 210, 228, 0.26));
      border: 1px solid rgba(224, 244, 255, 0.6);
      box-shadow: 0 26px 54px rgba(12, 47, 72, 0.2);
      backdrop-filter: blur(12px);
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 2px;
      overflow: hidden;
    }

    .welcome-mobile-topbar {
      display: none;
    }

    .welcome-mobile-branding {
      display: grid;
      gap: 0;
      justify-items: center;
      text-align: center;
      margin-top: 0;
      flex: 0 0 auto;
    }

    .welcome-title-shell {
      width: 100%;
      height: 234px;
      overflow: visible;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 0 -10px;
      flex: 0 0 auto;
    }

    .welcome-title-image {
      display: block;
      width: 100%;
      max-width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center center;
      transform: none;
      filter: drop-shadow(0 8px 14px rgba(53, 96, 177, 0.2));
    }

    .welcome-minimal-copy {
      display: none;
    }

    .welcome-hero-art {
      width: 100%;
      min-height: 260px;
      height: auto;
      border-radius: 0;
      position: relative;
      overflow: hidden;
      background: transparent;
      border: 0;
      box-shadow: none;
      margin: 0;
      flex: 1 1 auto;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .welcome-hero-image {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
      object-position: center bottom;
      transform: scale(1.08);
      transform-origin: center bottom;
    }

    .welcome-register-art {
      width: 100%;
      min-height: 360px;
      height: auto;
      position: relative;
      overflow: hidden;
      background: transparent;
      margin: 0;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .welcome-register-image {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
      object-position: center center;
      transform: scale(1.3);
      transform-origin: center center;
    }

    .welcome-landing-actions,
    .welcome-form-panel {
      display: grid;
      gap: 12px;
      margin-top: 0;
      flex: 0 0 auto;
    }

    .welcome-form-head {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 10px;
    }

    .welcome-form-title {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.04;
      color: #ffffff;
      text-shadow: 0 2px 10px rgba(31, 86, 145, 0.22);
    }

    .welcome-back-btn {
      width: 38px;
      height: 38px;
      min-width: 38px;
      min-height: 38px;
      padding: 0;
      border-radius: 999px;
      border: 2px solid rgba(233, 246, 255, 0.74);
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      line-height: 1;
      box-shadow: none;
    }

    .welcome-main-btn {
      min-height: 52px;
      font-size: 17px;
      font-weight: 800;
    }

    .btn-ghost {
      background: rgba(214, 236, 247, 0.16);
      color: #ffffff;
      border: 3px solid rgba(233, 246, 255, 0.9);
      box-shadow: none;
    }

    .welcome-auth-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .welcome-auth-actions button {
      min-height: 54px;
    }

    .toolbar-main {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .menu-back-btn {
      width: auto;
      min-width: 0;
      padding-inline: 12px;
      white-space: nowrap;
    }

    .menu-home-panel {
      display: grid;
      gap: 14px;
    }

    .menu-home-hero {
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 28px;
      padding: 18px;
      background:
        radial-gradient(circle at 16% 16%, rgba(255, 255, 255, 0.22) 0 1.4px, transparent 2.4px),
        radial-gradient(circle at 82% 14%, rgba(255, 255, 255, 0.18) 0 1.4px, transparent 2.4px),
        linear-gradient(180deg, rgba(193, 226, 242, 0.76), rgba(142, 189, 214, 0.56));
      display: grid;
      gap: 12px;
      box-shadow: 0 16px 30px rgba(5, 42, 66, 0.14);
    }

    .menu-home-stage {
      display: grid;
      justify-items: center;
      gap: 10px;
    }

    .menu-home-marquee {
      position: relative;
      width: min(100%, 260px);
      padding: 16px 16px 18px;
      border-radius: 28px;
      border: 3px solid rgba(223, 244, 255, 0.94);
      background:
        radial-gradient(circle at top center, rgba(255, 255, 255, 0.32), transparent 32%),
        linear-gradient(180deg, rgba(130, 194, 226, 0.98), rgba(92, 160, 197, 0.98));
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.42), 0 16px 30px rgba(88, 145, 181, 0.18);
    }

    .menu-home-marquee::before {
      content: "";
      position: absolute;
      inset: 7px;
      border-radius: 22px;
      border: 2px solid rgba(205, 235, 255, 0.76);
      pointer-events: none;
    }

    .menu-home-marquee-label {
      position: relative;
      z-index: 1;
      text-align: center;
      font-size: clamp(28px, 8vw, 46px);
      line-height: 0.96;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: #ffffff;
      text-shadow: 0 4px 0 rgba(74, 127, 155, 0.3), 0 12px 22px rgba(94, 149, 181, 0.18);
    }

    .menu-home-stage-strip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 190px;
      padding: 9px 18px;
      border-radius: 999px;
      background: linear-gradient(180deg, #ffe980, #ffc83d);
      border: 2px solid rgba(255, 245, 187, 0.9);
      color: #21416a;
      font-size: 16px;
      font-weight: 800;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.44), 0 14px 24px rgba(146, 102, 15, 0.16);
    }

    .menu-home-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      text-align: left;
    }

    .menu-home-copy {
      display: grid;
      gap: 5px;
      min-width: 0;
      flex: 1;
    }

    .menu-home-kicker {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.28px;
      color: var(--ink-soft);
      font-weight: 800;
    }

    .menu-home-title {
      font-size: clamp(24px, 5vw, 32px);
      font-weight: 800;
      line-height: 1.02;
      color: #ffffff;
    }

    .menu-home-text {
      font-size: 13px;
      line-height: 1.5;
      color: rgba(238, 251, 255, 0.92);
      max-width: 34ch;
    }

    .menu-home-avatar {
      width: 74px;
      height: 74px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, rgba(229, 247, 255, 0.98), rgba(146, 201, 230, 0.96));
      border: 2px solid rgba(255, 255, 255, 0.82);
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.44), 0 18px 28px rgba(94, 149, 181, 0.16);
      flex: none;
    }

    .menu-home-note {
      border-radius: 999px;
      padding: 11px 14px;
      background: linear-gradient(180deg, rgba(240, 251, 255, 0.32), rgba(216, 240, 252, 0.18));
      border: 1px solid rgba(255, 255, 255, 0.22);
      font-size: 12px;
      line-height: 1.4;
      color: rgba(240, 251, 255, 0.96);
      text-align: center;
    }

    .menu-module-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .menu-module-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 999px;
      padding: 14px 18px;
      background:
        radial-gradient(circle at top right, rgba(255, 255, 255, 0.22), transparent 32%),
        linear-gradient(180deg, rgba(230, 247, 255, 0.96), rgba(198, 235, 250, 0.92));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      text-align: left;
      color: var(--ink);
      box-shadow: 0 12px 22px rgba(48, 102, 130, 0.12);
      min-height: 90px;
    }

    .menu-module-card:hover {
      transform: translateY(-2px);
    }

    .menu-module-card::before,
    .training-mode-card::before,
    .q-card::before,
    .session-brief::before {
      content: "";
      position: absolute;
      width: 140px;
      height: 140px;
      right: -52px;
      top: -56px;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
      pointer-events: none;
    }

    .menu-module-top {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
      flex: 1;
    }

    .menu-module-icon {
      width: 52px;
      height: 52px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, rgba(242, 251, 255, 0.98), rgba(180, 221, 242, 0.96));
      border: 2px solid rgba(255, 255, 255, 0.72);
      color: #2f6f8f;
      font-weight: 800;
      font-size: 16px;
      flex: none;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.44), 0 10px 18px rgba(94, 149, 181, 0.16);
    }

    .menu-module-label {
      font-size: 23px;
      font-weight: 800;
      line-height: 1.08;
      color: var(--ink);
    }

    .menu-module-copy-wrap {
      display: grid;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }

    .menu-module-copy {
      font-size: 13px;
      line-height: 1.35;
      color: var(--ink-soft);
    }

    .module-stack,
    .training-flow,
    .stats-stack {
      display: grid;
      gap: 12px;
    }

    .flow-view {
      display: grid;
      gap: 12px;
    }

    .module-head {
      display: grid;
      gap: 4px;
      margin-bottom: 8px;
    }

    .module-head b {
      font-size: 22px;
      line-height: 1.08;
      color: var(--ink);
    }

    .module-head span {
      font-size: 13px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .training-mode-grid {
      display: grid;
      gap: 10px;
    }

    .training-mode-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 16px;
      background:
        radial-gradient(circle at top right, rgba(255, 255, 255, 0.2), transparent 30%),
        linear-gradient(180deg, rgba(230, 247, 255, 0.96), rgba(198, 235, 250, 0.92));
      display: grid;
      gap: 9px;
      text-align: left;
      color: var(--ink);
      box-shadow: 0 12px 22px rgba(48, 102, 130, 0.1);
    }

    .training-mode-card.is-selected {
      border-color: rgba(162, 214, 236, 0.9);
      box-shadow: 0 14px 24px rgba(69, 132, 167, 0.14), inset 0 0 0 1px rgba(214, 239, 250, 0.4);
      background:
        radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 34%),
        linear-gradient(180deg, rgba(236, 248, 255, 0.98), rgba(206, 237, 249, 0.94));
    }

    .training-mode-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }

    .training-mode-title {
      font-size: 17px;
      font-weight: 800;
      line-height: 1.1;
      color: var(--ink);
    }

    .training-mode-copy {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .training-back-row,
    .training-setup-actions,
    .training-result-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .training-back-row button,
    .training-setup-actions button,
    .training-result-actions button {
      width: auto;
      min-width: 0;
    }

    .training-flow-note {
      border-radius: 16px;
      padding: 12px 14px;
      background: linear-gradient(180deg, #fffafc, #fff5f1);
      border: 1px solid #f0dde3;
      font-size: 13px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .selected-mode-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      border-radius: 18px;
      padding: 12px 14px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      background:
        radial-gradient(circle at top right, rgba(15, 118, 110, 0.1), transparent 30%),
        linear-gradient(180deg, #ffffff, #f7fbff);
      box-shadow: 0 14px 26px rgba(12, 47, 72, 0.05);
    }

    .selected-mode-banner b {
      font-size: 16px;
      line-height: 1.15;
      color: var(--ink);
    }

    .selected-mode-banner span {
      font-size: 12px;
      line-height: 1.4;
      color: var(--ink-soft);
    }

    .training-setup-stack {
      display: grid;
      gap: 12px;
    }

    .training-play-panel,
    .training-result-panel {
      display: grid;
      gap: 12px;
    }

    .play-stage-note {
      border-radius: 16px;
      padding: 12px 14px;
      background: linear-gradient(180deg, #fffafc, #fff5f1);
      border: 1px solid #f0dde3;
      font-size: 12px;
      line-height: 1.45;
      color: var(--ink-soft);
    }

    .muted {
      color: var(--ink-soft);
      font-size: 13px;
      line-height: 1.35;
    }

    body[data-screen="welcome"] .hero {
      display: none;
    }

    body[data-screen="welcome"] .shell {
      max-width: 430px;
    }

    body[data-auth="connected"] {
      padding: 12px;
    }

    body[data-auth="connected"] .shell {
      max-width: 560px;
      gap: 10px;
    }

    body[data-auth="connected"] .hero {
      display: none;
    }

    body[data-auth="connected"] #appShell .grid,
    body[data-auth="connected"] #appShell .dashboard-subgrid,
    body[data-auth="connected"] #appShell .dashboard-hero {
      grid-template-columns: 1fr;
    }

    body[data-auth="connected"] #appShell .panel {
      border-radius: 20px;
      padding: 14px;
    }

    body[data-auth="connected"] .app-toolbar {
      display: none;
    }

    body[data-auth="connected"] .app-scroll-area {
      padding-top: 18px;
    }

    #logoutBtn {
      display: none !important;
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
      .welcome-grid { grid-template-columns: 1fr; }
      .panel { border-radius: 16px; }
      .app-frame {
        border-radius: 26px;
      }
      .welcome-title {
        max-width: none;
      }
      .welcome-preview-phone {
        width: 100%;
      }
      .welcome-feature-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .app-toolbar {
        flex-direction: column;
      }
      .dashboard-hero,
      .dashboard-subgrid {
        grid-template-columns: 1fr;
      }
      .app-bottom-nav {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .app-toolbar-actions {
        width: 100%;
        justify-content: flex-start;
      }
      .notification-list,
      .duel-list,
      .subject-list,
      .chapter-list,
      .history-list {
        max-height: none;
        overflow: visible;
        padding-right: 0;
      }
      .completion-actions,
      .duel-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .duel-player-grid {
        grid-template-columns: 1fr;
      }
      .duel-stage-list,
      .duel-round-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .notification-top,
      .notification-meta,
      .duel-item-top,
      .focus-top,
      .session-brief-top,
      .history-top,
      .dashboard-card-top,
      .q-header,
      .q-focus-top {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    @media (max-width: 640px) {
      body[data-screen="welcome"] {
        padding: 10px;
      }
      .row { grid-template-columns: 1fr; }
      .stats { grid-template-columns: 1fr 1fr; }
      .stat .v { font-size: 19px; }
      .goal-row,
      .duel-player-fact {
        flex-direction: column;
        align-items: flex-start;
      }
      .notification-actions,
      .toast-actions {
        display: grid;
        grid-template-columns: 1fr;
      }
      .dashboard-pulse-grid,
      .dashboard-grid,
      .menu-module-grid,
      .welcome-feature-grid,
      .welcome-phone-nav,
      .completion-actions,
      .duel-actions,
      .duel-stage-list,
      .duel-round-strip,
      .completion-kpis,
      .preset-grid,
      .summary-grid,
      .session-brief-kpis {
        grid-template-columns: 1fr;
      }
      .duel-detail-card,
      .duel-guide,
      .duel-question,
      .notification-item,
      .toast-card,
      .history-item,
      .focus-item {
        padding: 12px;
      }
      .duel-player-tags .chip {
        white-space: normal;
        justify-content: flex-start;
      }
      .dashboard-hero-panel-top,
      .dashboard-lane-head,
      .dashboard-lane-top {
        flex-direction: column;
        align-items: flex-start;
      }
      .app-bottom-nav {
        gap: 6px;
        padding: 9px 8px 10px;
      }
      .app-tab {
        min-height: 62px;
        padding: 9px 6px;
      }
      .dashboard-hero-score {
        text-align: left;
      }
      .welcome-mobile-shell {
        min-height: calc(100vh - 12px);
        height: calc(100vh - 12px);
        padding: 14px 12px 14px;
        gap: 2px;
        border-radius: 28px;
      }
      .welcome-title-shell {
        height: 195px;
        margin-bottom: -10px;
      }
      .welcome-title-image {
        max-width: 100%;
        transform: none;
      }
      .welcome-hero-art {
        min-height: 236px;
        height: auto;
        margin: 0;
      }
      .welcome-hero-image {
        object-position: center bottom;
        transform: scale(1.08);
      }
      .welcome-register-art {
        min-height: 300px;
      }
      .welcome-register-image {
        transform: scale(1.3);
      }
      .welcome-landing-actions,
      .welcome-form-panel {
        gap: 10px;
        margin-top: 0;
      }
      .welcome-main-btn {
        min-height: 50px;
        font-size: 16px;
      }
      .welcome-form-head,
      .welcome-preview-card,
      .welcome-phone-head {
        grid-template-columns: auto 1fr;
        align-items: center;
      }
      .menu-home-head,
      .selected-mode-banner,
      .training-back-row,
      .training-setup-actions,
      .training-result-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .welcome-lane-item {
        grid-template-columns: 1fr;
      }
      .q-question-card {
        padding: 16px 16px 18px;
      }
      .q-prompt {
        font-size: 25px;
      }
      .q-guidance {
        font-size: 13px;
      }
      .choice {
        min-height: 76px;
      }
      .choice-badge {
        width: 52px;
        height: 52px;
        font-size: 22px;
      }
      .choice-copy {
        font-size: 19px;
      }
      .question-exit-row {
        justify-content: stretch;
      }
      .question-exit-row button {
        width: 100%;
        min-width: 0;
      }
      .duel-player-head {
        align-items: flex-start;
        flex-direction: column;
      }
      .duel-player-stage-badge,
      .duel-player-specialty-badge {
        white-space: normal;
      }
      .duel-player-portrait-shell {
        width: 124px;
        height: 124px;
      }
      .duel-player-avatar.large {
        width: 82px;
        height: 82px;
        font-size: 28px;
      }
      .duel-player-orbit {
        max-width: 82px;
      }
      .duel-player-orbit.pos-0 {
        top: 2px;
        right: -6px;
      }
      .duel-player-orbit.pos-1 {
        left: -4px;
        top: 46px;
      }
      .duel-player-orbit.pos-2 {
        right: 0;
        bottom: 6px;
      }
      .duel-player-score {
        width: 100%;
        justify-items: start;
      }
      .toast-stack {
        top: auto;
        bottom: 12px;
        right: 12px;
        left: 12px;
        width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="hero">
      <div>
        <h1>MedQuiz</h1>
        <p>Une version de travail pensée comme une petite bulle de révision: claire, légère, et plus douce quand l’énergie baisse.</p>
      </div>
      <div class="hero-meta">
        <span class="pill">Version de travail</span>
        <span class="pill">Révision douce</span>
        <div id="userBadge" class="user-badge">Non connecté</div>
      </div>
    </header>

    <main class="screen-root">
      <section id="welcomeScreen" class="screen-pane">
        <section class="welcome-mobile-shell">
          <div class="welcome-mobile-topbar">
            <span>20:55</span>
            <span>LTE 55%</span>
          </div>
          <div id="welcomeBranding" class="welcome-mobile-branding">
            <div class="welcome-title-shell">
              <img id="welcomeTitleImage" class="welcome-title-image" src="/v1/demo/assets/medquiz-accueil.png?v=2" alt="MedQuiz" />
            </div>
            <div class="welcome-minimal-copy">Réviser un peu, respirer, puis repartir.</div>
          </div>
          <div id="welcomeHeroArt" class="welcome-hero-art">
              <img id="welcomeHeroImage" class="welcome-hero-image" src="/v1/demo/assets/accueil-medquiz.png" alt="Illustration d'accueil MedQuiz" />
          </div>
          <div id="welcomeRegisterArt" class="welcome-register-art hidden">
            <img id="welcomeRegisterImage" class="welcome-register-image" src="/v1/demo/assets/creer-un-comte.png?v=3" alt="Illustration créer un compte MedQuiz" />
          </div>
          <div id="welcomeLandingActions" class="welcome-landing-actions">
            <button type="button" class="btn-primary welcome-main-btn" id="showLoginBtn">Se connecter</button>
            <button type="button" class="btn-ghost welcome-main-btn" id="showRegisterBtn">Créer un compte</button>
          </div>
          <div id="welcomeFormPanel" class="welcome-form-panel hidden">
            <div class="welcome-form-head">
              <button type="button" class="welcome-back-btn" id="welcomeBackBtn" aria-label="Retour">←</button>
              <div id="welcomeFormTitle" class="welcome-form-title">Se connecter</div>
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
              <div id="displayNameField">
                <label class="label" for="displayNameInput">Nom affiché</label>
                <input id="displayNameInput" type="text" placeholder="nom affiché" />
              </div>
              <div class="welcome-auth-actions">
                <button type="button" class="btn-primary" id="loginBtn">Se connecter</button>
                <button type="button" class="btn-secondary" id="registerBtn">Créer un compte</button>
              </div>
              <div id="welcomeStatusBox" class="status info welcome-status">Connecte-toi pour entrer dans MedQuiz.</div>
            </div>
          </div>
        </section>
      </section>

      <section id="appShell" class="screen-pane hidden">
        <div class="app-frame">
          <div class="app-toolbar panel">
            <div class="toolbar-main">
              <button class="btn-secondary btn-inline menu-back-btn hidden" id="menuBackBtn">Menu</button>
              <div class="screen-title-block">
                <div class="session-brief-eyebrow">Pause révision</div>
                <div id="screenTitle" class="screen-title">Menu</div>
                <div id="screenSubtitle" class="screen-subtitle">Choisis simplement le module que tu veux ouvrir.</div>
              </div>
            </div>
            <div class="app-toolbar-actions">
              <div class="app-top-meta">
                <span class="app-top-chip"><span class="app-top-chip-dot"></span>À ton rythme</span>
                <button class="app-notification-btn" id="notificationsShortcutBtn" title="Notifications">
                  <span class="app-notification-glyph">!</span>
                  <span id="notificationsShortcutBadge" class="app-notification-badge hidden">0</span>
                </button>
                <button class="btn-danger hidden btn-inline app-top-action" id="logoutBtn">Déconnexion</button>
              </div>
            </div>
          </div>
          <div class="app-scroll-area">
            <section id="dashboardScreen" class="screen-view">
              <section class="panel menu-home-panel">
                <div id="dashboardHero" class="menu-home-hero"></div>
                <div id="dashboardCards" class="menu-module-grid"></div>
              </section>
            </section>

            <section id="trainingScreen" class="screen-view hidden">
              <div class="training-flow">
                <section id="trainingHomeView" class="flow-view">
                  <section class="panel">
                    <div class="module-head">
                      <b>Choisir un entraînement</b>
                      <span>Choisis d’abord le type. On prendra ensuite les matières, puis le nombre de questions.</span>
                    </div>
                    <div id="trainingModeCards" class="training-mode-grid"></div>
                  </section>
                </section>

                <section id="trainingSetupView" class="flow-view hidden">
                  <section class="panel">
                    <div class="training-back-row">
                      <button class="btn-secondary btn-inline" id="trainingSetupBackBtn">Retour aux matières</button>
                    </div>
                    <div class="module-head">
                      <b>Combien de questions ?</b>
                      <span>Dernière étape avant de lancer la session: ici tu choisis seulement la longueur de ta révision.</span>
                    </div>
                    <div class="training-setup-stack">
                      <div id="selectedTrainingModeBanner" class="selected-mode-banner"></div>
                      <div class="training-flow-note">Le type et les matières sont déjà choisis. Il ne reste plus qu’à fixer le nombre de questions.</div>
                      <div class="section">
                        <div class="section-head">
                          <h3>Nombre de questions</h3>
                          <span id="setupStateChip" class="chip">À configurer</span>
                        </div>
                        <div class="auth-grid">
                          <div class="hidden">
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
                            <label class="label" for="stopRuleSelect">Format de session</label>
                            <select id="stopRuleSelect">
                              <option value="fixed_10">10 questions</option>
                              <option value="fixed_custom">Nombre personnalisé</option>
                              <option value="until_stop">Session libre</option>
                            </select>
                          </div>
                          <div>
                            <label class="label" for="targetCountInput">Nombre de questions</label>
                            <input id="targetCountInput" type="number" min="1" max="200" value="20" placeholder="Nombre de questions" />
                          </div>
                        </div>
                        <div id="setupChecklist" class="setup-list hidden"></div>
                        <div class="preset-grid hidden">
                          <button class="btn-secondary wide" id="presetRecommendedBtn" disabled>Preset conseillé</button>
                          <button class="btn-secondary" id="presetDiscoveryBtn" disabled>Découverte 10</button>
                          <button class="btn-secondary" id="presetReviewBtn" disabled>Révision libre</button>
                        </div>
                      </div>

                      <div class="training-setup-actions">
                        <button class="btn-primary" id="trainingSetupNextBtn" disabled>Lancer la session</button>
                      </div>
                    </div>
                  </section>
                </section>

                <section id="trainingScopeView" class="flow-view hidden">
                  <section class="panel">
                    <div class="training-back-row">
                      <button class="btn-secondary btn-inline" id="trainingScopeBackBtn">Retour aux types</button>
                    </div>
                    <div class="module-head">
                      <b>Sur quoi porte la révision ?</b>
                      <span>D’abord les matières et chapitres. Le nombre de questions viendra juste après.</span>
                    </div>
                    <div class="training-setup-stack">
                      <div id="trainingScopeSummary" class="training-flow-note"></div>
                      <div class="section">
                        <div class="section-head">
                          <h3>Matières</h3>
                          <span class="section-note">Choisis où tu veux t’entraîner</span>
                        </div>
                        <div id="subjectsList" class="subject-list"></div>
                      </div>

                      <div class="section">
                        <div class="section-head">
                          <h3>Chapitres</h3>
                          <span class="section-note">Optionnel si tu veux cibler plus précisément</span>
                        </div>
                        <div id="chaptersList" class="chapter-list"></div>
                      </div>

                      <div class="training-setup-actions">
                        <button class="btn-primary" id="createSessionBtn" disabled>Continuer</button>
                        <button class="btn-secondary" id="refreshDashboardBtn" disabled>Rafraîchir les données</button>
                      </div>
                    </div>
                  </section>
                </section>

                <section id="trainingPlayView" class="flow-view hidden">
                  <section class="panel training-play-panel">
                    <div id="sessionSummary" class="session-brief empty"></div>
                    <div class="goal-block">
                      <div class="goal-row">
                        <div id="sessionGoalLabel" class="muted">Objectif: session libre</div>
                        <div id="sessionGoalChip" class="chip">Libre</div>
                      </div>
                      <div class="progress-track">
                        <div id="sessionGoalProgressBar" class="progress-fill"></div>
                      </div>
                    </div>
                    <div class="play-stage-note">Ici on ne garde que l’essentiel: progression, question, réponse, puis suite.</div>
                    <div id="questionContainer" class="q-card question-stage hidden"></div>
                    <div class="row question-actions-row" id="questionActions">
                      <button class="btn-primary" id="submitAnswerBtn" disabled>Valider réponse</button>
                      <button class="btn-secondary" id="nextQuestionBtn" disabled>Question suivante</button>
                    </div>
                    <div class="question-exit-row" id="questionExitRow">
                      <button class="btn-danger" id="completeSessionBtn" disabled>Terminer session</button>
                    </div>
                    <div id="statusBox" class="status info">Connecte-toi pour commencer.</div>
                  </section>
                </section>

                <section id="trainingResultView" class="flow-view hidden">
                  <section class="panel training-result-panel">
                    <div class="training-result-actions">
                      <button class="btn-secondary btn-inline" id="trainingResultBackBtn">Nouvelle session</button>
                    </div>
                    <div id="completionSection" class="section hidden">
                      <div class="section-head">
                        <h3>Débrief de session</h3>
                        <span class="section-note">Bilan puis relance</span>
                      </div>
                      <div id="completionContent" class="completion-card completion-card-rich"></div>
                    </div>
                    <div class="section">
                      <div class="section-head">
                        <h3>Historique immédiat</h3>
                        <span class="section-note">Tes dernières réponses commentées</span>
                      </div>
                      <div id="historyList" class="history-list"></div>
                    </div>
                  </section>
                </section>
              </div>
            </section>

            <section id="duelScreen" class="screen-view hidden">
              <div class="module-stack">
                <section id="duelHomeView" class="flow-view">
                  <section class="panel">
                    <div class="module-head">
                      <b>Qui vas-tu défier ?</b>
                      <span>Choisis ton prochain adversaire.</span>
                    </div>
                    <div id="duelHomeSummary" class="duel-home-summary"></div>
                    <div id="duelHomeCards" class="training-mode-grid"></div>
                  </section>
                </section>

                <section id="duelNotificationsView" class="flow-view hidden">
                  <section class="panel">
                    <div class="training-back-row">
                      <button class="btn-secondary btn-inline" id="duelNotificationsBackBtn">Retour au menu duel</button>
                    </div>
                    <div class="module-head">
                      <b>Notifications duel</b>
                      <span>Ici tu lis simplement les alertes liées aux tours, sursis et fins de partie.</span>
                    </div>
                    <div class="goal-row">
                      <div id="notificationsUnreadChip" class="chip">0 non lues</div>
                      <button class="btn-secondary btn-inline" id="refreshNotificationsBtn" disabled>Rafraîchir</button>
                    </div>
                    <div id="notificationsList" class="notification-list"></div>
                  </section>
                </section>

                <section id="duelCreateView" class="flow-view hidden">
                  <section class="panel">
                    <div class="training-back-row">
                      <button class="btn-secondary btn-inline" id="duelCreateBackBtn">Retour au menu duel</button>
                    </div>
                    <div class="module-head">
                      <b>Créer un duel</b>
                      <span>Choisis le type de défi. Si c’est un ami, on te demandera seulement son identifiant.</span>
                    </div>
                    <div class="auth-grid">
                      <div>
                        <div id="duelModeCards" class="training-mode-grid"></div>
                      </div>
                      <div class="hidden">
                        <label class="label" for="duelModeSelect">Type de duel</label>
                        <select id="duelModeSelect">
                          <option value="friend_invite">Ami (invitation)</option>
                          <option value="random_free">Aléatoire</option>
                          <option value="random_level">Niveau proche</option>
                        </select>
                      </div>
                      <div id="duelOpponentField">
                        <label class="label" for="duelOpponentInput">Identifiant adversaire</label>
                        <input id="duelOpponentInput" type="text" placeholder="UUID adversaire" />
                      </div>
                      <div class="row">
                        <button class="btn-primary" id="createDuelBtn" disabled>Créer duel</button>
                        <button class="btn-secondary" id="refreshDuelsBtn" disabled>Rafraîchir duels</button>
                      </div>
                    </div>
                  </section>
                </section>

                <section id="duelInboxView" class="flow-view hidden">
                  <section class="panel">
                    <div class="training-back-row">
                      <button class="btn-secondary btn-inline" id="duelInboxBackBtn">Retour au menu duel</button>
                    </div>
                    <div class="module-head">
                      <b>Mes duels</b>
                      <span>Choisis un filtre, parcours la liste, puis reprends un duel.</span>
                    </div>
                    <div id="duelStatusFilterButtons" class="duel-filter-row"></div>
                    <div class="auth-grid hidden">
                      <div class="hidden">
                        <label class="label" for="duelStatusFilterSelect">Filtre liste</label>
                        <select id="duelStatusFilterSelect">
                          <option value="all">Tous</option>
                          <option value="pending_opener">pending_opener</option>
                          <option value="in_progress">in_progress</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                          <option value="expired">expired</option>
                        </select>
                      </div>
                    </div>
                    <div id="duelsList" class="duel-list" style="margin-top:8px"></div>
                  </section>
                </section>

                <section id="duelDetailView" class="flow-view hidden">
                  <section class="panel">
                    <div class="training-back-row">
                      <button class="btn-secondary btn-inline" id="duelDetailBackBtn">Retour à mes duels</button>
                      <button class="btn-secondary btn-inline" id="duelDetailCloseBtn">Fermer ce duel</button>
                    </div>
                    <div class="module-head">
                      <b>Duel en cours</b>
                      <span>On garde ici un seul duel à la fois: son état, ton tour et les actions utiles.</span>
                    </div>
                    <div id="duelDetail" class="duel-detail-card hidden" style="margin-top:8px"></div>
                  </section>
                </section>

                <section id="duelSubjectView" class="flow-view hidden">
                  <section class="panel">
                    <div class="training-back-row">
                      <button class="btn-secondary btn-inline" id="duelSubjectBackBtn">Retour au duel</button>
                      <button class="btn-secondary btn-inline" id="duelSubjectCloseBtn">Fermer ce duel</button>
                    </div>
                    <div class="module-head">
                      <b>Choix de la matière</b>
                      <span>On ne garde ici que les 3 matières proposées pour la manche.</span>
                    </div>
                    <div id="duelSubjectContent" class="duel-detail-card hidden" style="margin-top:8px"></div>
                  </section>
                </section>

                <section id="duelPlayView" class="flow-view hidden">
                  <section class="panel duel-play-panel">
                    <div class="question-exit-row">
                      <button class="btn-secondary" id="duelPlayBackBtn">Retour au duel</button>
                      <button class="btn-secondary btn-inline" id="duelPlayCloseBtn">Fermer ce duel</button>
                    </div>
                    <div id="duelPlayContent" class="q-card question-stage hidden"></div>
                    <div class="row question-actions-row" id="duelPlayActions">
                      <button class="btn-primary" id="duelSubmitAnswerBtn" disabled>Valider la réponse</button>
                      <button class="btn-secondary hidden" id="duelNextAnswerBtn" disabled>Question suivante</button>
                    </div>
                  </section>
                </section>
              </div>
            </section>

            <section id="statsScreen" class="screen-view hidden">
              <div class="stats-stack">
                <section class="panel">
                  <div class="module-head">
                    <b>Vue rapide</b>
                    <span>Les quelques chiffres qui te disent tout de suite où tu en es.</span>
                  </div>
                  <div id="stats" class="stats"></div>
                </section>
                <section class="panel">
                  <div class="module-head">
                    <b>À retravailler maintenant</b>
                    <span>On te montre seulement ce qui mérite vraiment ton attention.</span>
                  </div>
                  <div id="focusList" class="focus-list"></div>
                  <div class="goal-row" style="margin-top:8px">
                    <div id="suggestedModeLabel" class="muted">Mode conseillé: -</div>
                    <button class="btn-secondary btn-inline" id="applySuggestedModeBtn" disabled>Préparer ce mode</button>
                  </div>
                </section>
                <section class="panel">
                  <div class="module-head">
                    <b>Progression joueur</b>
                    <span>Ton identité visible et l’évolution de ton avatar au même endroit.</span>
                  </div>
                  <div id="profileSummary" class="section"></div>
                  <div id="profileAvatarSummary" class="section"></div>
                </section>
              </div>
            </section>

            <section id="settingsScreen" class="screen-view hidden">
              <section class="panel">
                <h2>Paramètres</h2>
                <div id="settingsSummary" class="section"></div>
              </section>
            </section>
          </div>

          <nav class="app-bottom-nav">
            <button class="app-tab" id="quickTrainingNavBtn"><span class="app-tab-dot"></span><span>Train</span></button>
            <button class="app-tab" id="quickDuelNavBtn"><span class="app-tab-dot"></span><span>Duel</span></button>
            <button class="app-tab" id="statsNavBtn"><span class="app-tab-dot"></span><span>Stats</span></button>
            <button class="app-tab" id="settingsNavBtn"><span class="app-tab-dot"></span><span>Réglages</span></button>
          </nav>
        </div>
      </section>
    </main>
  </div>
  <div id="notificationToastStack" class="toast-stack"></div>

  <script>
    (function () {
      var baseUrl = window.location.origin + '/v1';
      var persistedToken = localStorage.getItem('medquiz_demo_token') || '';
      var persistedThemeOverrides = {};
      try {
        persistedThemeOverrides = JSON.parse(localStorage.getItem('medquiz_demo_theme_overrides') || '{}') || {};
      } catch (err) {
        persistedThemeOverrides = {};
      }
      if (window.location.search.indexOf('reset=1') !== -1) {
        localStorage.removeItem('medquiz_demo_token');
        localStorage.removeItem('medquiz_demo_theme_overrides');
        persistedToken = '';
        persistedThemeOverrides = {};
      }

      var state = {
        token: persistedToken,
        visualTheme: localStorage.getItem('medquiz_demo_theme') || 'lagon',
        themeOverrides: persistedThemeOverrides,
        activeScreen: persistedToken ? 'dashboard' : 'welcome',
        trainingFlow: 'home',
        welcomeAuthMode: 'home',
        duelFlow: 'home',
        me: null,
        myAvatar: null,
        avatarSpecialties: [],
        avatarInventoryByType: {
          outfit: [],
          pose: [],
          object: [],
          background: []
        },
        dashboard: null,
        subjects: [],
        chaptersBySubject: {},
        selectedSubjects: {},
        selectedChapters: {},
        session: null,
        currentQuestion: null,
        currentAnswerReview: null,
        questionShownAt: 0,
        history: [],
        lastCompletedSession: null,
        lastSessionSetup: null,
        ambientScenes: {
          app: null,
          trainingPlay: null,
          duel: null
        },
        notificationSeeded: false,
        notificationToasts: [],
        notifications: [],
        duels: [],
        selectedDuelId: null,
        selectedDuel: null,
        duelPlayKind: '',
        duelPlayCursor: 0,
        duelPlayReview: null,
        duelRoundAnsweredSlots: {},
        openerQuestion: null,
        openerShownAt: 0,
        currentRound: null,
        roundQuestions: [],
        roundQuestionShownAtBySlot: {}
      };

      var refs = {
        userBadge: document.getElementById('userBadge'),
        welcomeScreen: document.getElementById('welcomeScreen'),
        appShell: document.getElementById('appShell'),
        dashboardScreen: document.getElementById('dashboardScreen'),
        trainingScreen: document.getElementById('trainingScreen'),
        duelScreen: document.getElementById('duelScreen'),
        statsScreen: document.getElementById('statsScreen'),
        settingsScreen: document.getElementById('settingsScreen'),
        menuBackBtn: document.getElementById('menuBackBtn'),
        screenTitle: document.getElementById('screenTitle'),
        screenSubtitle: document.getElementById('screenSubtitle'),
        notificationsShortcutBtn: document.getElementById('notificationsShortcutBtn'),
        notificationsShortcutBadge: document.getElementById('notificationsShortcutBadge'),
        quickTrainingNavBtn: document.getElementById('quickTrainingNavBtn'),
        quickDuelNavBtn: document.getElementById('quickDuelNavBtn'),
        statsNavBtn: document.getElementById('statsNavBtn'),
        settingsNavBtn: document.getElementById('settingsNavBtn'),
        dashboardHero: document.getElementById('dashboardHero'),
        dashboardPulse: document.getElementById('dashboardPulse'),
        dashboardJourney: document.getElementById('dashboardJourney'),
        dashboardCards: document.getElementById('dashboardCards'),
        welcomeStatusBox: document.getElementById('welcomeStatusBox'),
        welcomeLandingActions: document.getElementById('welcomeLandingActions'),
        welcomeFormPanel: document.getElementById('welcomeFormPanel'),
        welcomeFormTitle: document.getElementById('welcomeFormTitle'),
        welcomeBranding: document.getElementById('welcomeBranding'),
        welcomeTitleImage: document.getElementById('welcomeTitleImage'),
        welcomeHeroArt: document.getElementById('welcomeHeroArt'),
        welcomeHeroImage: document.getElementById('welcomeHeroImage'),
        welcomeRegisterArt: document.getElementById('welcomeRegisterArt'),
        welcomeRegisterImage: document.getElementById('welcomeRegisterImage'),
        welcomeBackBtn: document.getElementById('welcomeBackBtn'),
        showLoginBtn: document.getElementById('showLoginBtn'),
        showRegisterBtn: document.getElementById('showRegisterBtn'),
        displayNameField: document.getElementById('displayNameField'),
        profileSummary: document.getElementById('profileSummary'),
        profileAvatarSummary: document.getElementById('profileAvatarSummary'),
        settingsSummary: document.getElementById('settingsSummary'),
        emailInput: document.getElementById('emailInput'),
        passwordInput: document.getElementById('passwordInput'),
        displayNameInput: document.getElementById('displayNameInput'),
        registerBtn: document.getElementById('registerBtn'),
        loginBtn: document.getElementById('loginBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        trainingHomeView: document.getElementById('trainingHomeView'),
        trainingSetupView: document.getElementById('trainingSetupView'),
        trainingScopeView: document.getElementById('trainingScopeView'),
        trainingPlayView: document.getElementById('trainingPlayView'),
        trainingResultView: document.getElementById('trainingResultView'),
        duelHomeView: document.getElementById('duelHomeView'),
        duelNotificationsView: document.getElementById('duelNotificationsView'),
        duelCreateView: document.getElementById('duelCreateView'),
        duelInboxView: document.getElementById('duelInboxView'),
        duelDetailView: document.getElementById('duelDetailView'),
        duelSubjectView: document.getElementById('duelSubjectView'),
        duelPlayView: document.getElementById('duelPlayView'),
        trainingModeCards: document.getElementById('trainingModeCards'),
        duelModeCards: document.getElementById('duelModeCards'),
        duelHomeSummary: document.getElementById('duelHomeSummary'),
        duelHomeCards: document.getElementById('duelHomeCards'),
        selectedTrainingModeBanner: document.getElementById('selectedTrainingModeBanner'),
        trainingSetupBackBtn: document.getElementById('trainingSetupBackBtn'),
        trainingSetupNextBtn: document.getElementById('trainingSetupNextBtn'),
        trainingScopeBackBtn: document.getElementById('trainingScopeBackBtn'),
        trainingScopeSummary: document.getElementById('trainingScopeSummary'),
        trainingResultBackBtn: document.getElementById('trainingResultBackBtn'),
        duelNotificationsBackBtn: document.getElementById('duelNotificationsBackBtn'),
        duelCreateBackBtn: document.getElementById('duelCreateBackBtn'),
        duelInboxBackBtn: document.getElementById('duelInboxBackBtn'),
        duelDetailBackBtn: document.getElementById('duelDetailBackBtn'),
        duelDetailCloseBtn: document.getElementById('duelDetailCloseBtn'),
        duelSubjectBackBtn: document.getElementById('duelSubjectBackBtn'),
        duelSubjectCloseBtn: document.getElementById('duelSubjectCloseBtn'),
        modeSelect: document.getElementById('modeSelect'),
        stopRuleSelect: document.getElementById('stopRuleSelect'),
        targetCountInput: document.getElementById('targetCountInput'),
        createSessionBtn: document.getElementById('createSessionBtn'),
        refreshDashboardBtn: document.getElementById('refreshDashboardBtn'),
        setupStateChip: document.getElementById('setupStateChip'),
        setupChecklist: document.getElementById('setupChecklist'),
        presetRecommendedBtn: document.getElementById('presetRecommendedBtn'),
        presetDiscoveryBtn: document.getElementById('presetDiscoveryBtn'),
        presetReviewBtn: document.getElementById('presetReviewBtn'),
        subjectsList: document.getElementById('subjectsList'),
        chaptersList: document.getElementById('chaptersList'),
        stats: document.getElementById('stats'),
        sessionSummary: document.getElementById('sessionSummary'),
        focusList: document.getElementById('focusList'),
        suggestedModeLabel: document.getElementById('suggestedModeLabel'),
        applySuggestedModeBtn: document.getElementById('applySuggestedModeBtn'),
        sessionGoalLabel: document.getElementById('sessionGoalLabel'),
        sessionGoalChip: document.getElementById('sessionGoalChip'),
        sessionGoalProgressBar: document.getElementById('sessionGoalProgressBar'),
        questionContainer: document.getElementById('questionContainer'),
        questionActions: document.getElementById('questionActions'),
        questionExitRow: document.getElementById('questionExitRow'),
        submitAnswerBtn: document.getElementById('submitAnswerBtn'),
        nextQuestionBtn: document.getElementById('nextQuestionBtn'),
        completeSessionBtn: document.getElementById('completeSessionBtn'),
        statusBox: document.getElementById('statusBox'),
        completionSection: document.getElementById('completionSection'),
        completionContent: document.getElementById('completionContent'),
        historyList: document.getElementById('historyList'),
        notificationsUnreadChip: document.getElementById('notificationsUnreadChip'),
        refreshNotificationsBtn: document.getElementById('refreshNotificationsBtn'),
        notificationsList: document.getElementById('notificationsList'),
        notificationToastStack: document.getElementById('notificationToastStack'),
        duelModeSelect: document.getElementById('duelModeSelect'),
        duelOpponentField: document.getElementById('duelOpponentField'),
        duelOpponentInput: document.getElementById('duelOpponentInput'),
        duelStatusFilterSelect: document.getElementById('duelStatusFilterSelect'),
        duelStatusFilterButtons: document.getElementById('duelStatusFilterButtons'),
        createDuelBtn: document.getElementById('createDuelBtn'),
        refreshDuelsBtn: document.getElementById('refreshDuelsBtn'),
        duelsList: document.getElementById('duelsList'),
        duelDetail: document.getElementById('duelDetail'),
        duelSubjectContent: document.getElementById('duelSubjectContent'),
        duelPlayBackBtn: document.getElementById('duelPlayBackBtn'),
        duelPlayCloseBtn: document.getElementById('duelPlayCloseBtn'),
        duelPlayContent: document.getElementById('duelPlayContent'),
        duelPlayActions: document.getElementById('duelPlayActions'),
        duelSubmitAnswerBtn: document.getElementById('duelSubmitAnswerBtn'),
        duelNextAnswerBtn: document.getElementById('duelNextAnswerBtn')
      };

      var themeDefinitions = {
        lagon: {
          label: 'Quiz bleu',
          note: 'Le plus proche d’un jeu quiz mobile',
          brand: '#74cfe8',
          brandStrong: '#3f9fc3',
          brandSoft: 'rgba(236, 249, 255, 0.92)',
          warm: '#8fe3b2',
          ring: '0 0 0 3px rgba(116, 207, 232, 0.24)',
          pageGlowA: 'rgba(255, 255, 255, 0.34)',
          pageGlowB: 'rgba(214, 242, 255, 0.22)',
          pageBaseA: '#d7f2ff',
          pageBaseB: '#b8e7ff',
          pageBaseC: '#effaff',
          panelA: 'rgba(217, 241, 255, 0.44)',
          panelB: 'rgba(170, 216, 243, 0.26)',
          sectionA: 'rgba(246, 252, 255, 0.98)',
          sectionB: 'rgba(229, 245, 255, 0.92)',
          frameA: 'rgba(214, 242, 255, 0.94)',
          frameB: 'rgba(172, 219, 245, 0.9)',
          frameC: 'rgba(140, 199, 232, 0.82)',
          frameRaysOpacity: '0.12',
          toolbarA: 'rgba(225, 246, 255, 0.34)',
          toolbarB: 'rgba(187, 226, 247, 0.18)',
          topChipBg: 'rgba(248, 253, 255, 0.9)',
          topChipBorder: 'rgba(201, 232, 247, 0.96)',
          topChipInk: '#35667c',
          bottomNavA: 'rgba(246, 252, 255, 0.9)',
          bottomNavB: 'rgba(228, 245, 255, 0.84)',
          bottomNavBorder: 'rgba(246, 252, 255, 0.94)',
          bottomNavInk: '#4b6f82',
          bottomNavActiveA: '#f4fdff',
          bottomNavActiveB: '#dff4fb',
          bottomNavActiveInk: '#3b8dae',
          moduleA: 'rgba(186, 229, 250, 0.42)',
          moduleB: 'rgba(102, 177, 214, 0.34)',
          moduleCopy: 'rgba(244, 252, 255, 0.96)',
          moduleSelectedA: 'rgba(189, 241, 212, 0.88)',
          moduleSelectedB: 'rgba(126, 210, 164, 0.84)',
          surfaceCardA: '#fbfeff',
          surfaceCardB: '#eef8fd',
          questionA: '#79bfe3',
          questionB: '#5aa8d1',
          questionBorder: 'rgba(220, 243, 255, 0.74)',
          questionText: '#ffffff',
          questionSupportA: 'rgba(255, 255, 255, 0.18)',
          questionSupportB: 'rgba(255, 255, 255, 0.08)',
          questionSupportBorder: 'rgba(221, 242, 255, 0.34)',
          questionSupportText: 'rgba(248, 252, 255, 0.96)',
          choiceA: '#6aaed1',
          choiceB: '#4c98c3',
          choiceBorder: 'rgba(224, 244, 255, 0.38)',
          choiceText: '#f5fcff',
          choiceActiveA: '#a7e4bf',
          choiceActiveB: '#7ecaa1',
          choiceActiveBorder: 'rgba(222, 252, 231, 0.74)',
          previewBgA: '#a9def5',
          previewBgB: '#e7f8ff',
          previewSignA: '#f5fdff',
          previewSignB: '#8dcce8',
          previewQuestionA: '#ffffff',
          previewQuestionB: '#e7f6ff',
          previewChoiceA: '#7ab9d9',
          previewChoiceB: '#5aa1c8',
          previewChoiceActiveA: '#b6e7c8',
          previewChoiceActiveB: '#84d1a6',
          swatches: ['#74cfe8', '#a7e4bf', '#3f9fc3']
        },
        corail: {
          label: 'Sunset pop',
          note: 'Plus chaud, plus fun, plus arcade',
          brand: '#ff94b9',
          brandStrong: '#dd5b8d',
          brandSoft: 'rgba(255, 232, 241, 0.9)',
          warm: '#ffd55f',
          ring: '0 0 0 3px rgba(255, 148, 185, 0.24)',
          pageGlowA: 'rgba(255, 176, 202, 0.3)',
          pageGlowB: 'rgba(255, 220, 118, 0.2)',
          pageBaseA: '#4a1747',
          pageBaseB: '#a3477a',
          pageBaseC: '#ffb45c',
          panelA: 'rgba(255, 188, 216, 0.34)',
          panelB: 'rgba(186, 78, 132, 0.3)',
          sectionA: 'rgba(255, 246, 250, 0.96)',
          sectionB: 'rgba(255, 231, 240, 0.92)',
          frameA: 'rgba(255, 169, 205, 0.96)',
          frameB: 'rgba(214, 88, 150, 0.96)',
          frameC: 'rgba(101, 31, 95, 0.98)',
          frameRaysOpacity: '0.24',
          toolbarA: 'rgba(228, 112, 169, 0.58)',
          toolbarB: 'rgba(115, 34, 98, 0.34)',
          topChipBg: 'rgba(255, 248, 251, 0.88)',
          topChipBorder: 'rgba(255, 214, 229, 0.92)',
          topChipInk: '#7d3659',
          bottomNavA: 'rgba(255, 246, 250, 0.9)',
          bottomNavB: 'rgba(255, 234, 242, 0.86)',
          bottomNavBorder: 'rgba(255, 243, 247, 0.96)',
          bottomNavInk: '#7f4e63',
          bottomNavActiveA: '#fff4f6',
          bottomNavActiveB: '#ffe5eb',
          bottomNavActiveInk: '#c65679',
          moduleA: 'rgba(255, 168, 207, 0.34)',
          moduleB: 'rgba(162, 49, 111, 0.58)',
          moduleCopy: 'rgba(255, 241, 247, 0.94)',
          moduleSelectedA: 'rgba(255, 198, 92, 0.88)',
          moduleSelectedB: 'rgba(255, 128, 64, 0.84)',
          surfaceCardA: '#fff8fb',
          surfaceCardB: '#fff0f5',
          questionA: '#8458d8',
          questionB: '#5c329d',
          questionBorder: 'rgba(255, 209, 226, 0.72)',
          questionText: '#ffffff',
          questionSupportA: 'rgba(255, 255, 255, 0.14)',
          questionSupportB: 'rgba(255, 255, 255, 0.06)',
          questionSupportBorder: 'rgba(255, 221, 236, 0.3)',
          questionSupportText: 'rgba(255, 246, 251, 0.94)',
          choiceA: '#5a1c3d',
          choiceB: '#2a1027',
          choiceBorder: 'rgba(255, 183, 211, 0.34)',
          choiceText: '#fff1f7',
          choiceActiveA: '#ffcb68',
          choiceActiveB: '#ff864a',
          choiceActiveBorder: 'rgba(255, 226, 153, 0.74)',
          previewBgA: '#742970',
          previewBgB: '#ffb35c',
          previewSignA: '#ffc7d9',
          previewSignB: '#ef6fa5',
          previewQuestionA: '#fffdfd',
          previewQuestionB: '#ffeef7',
          previewChoiceA: '#612048',
          previewChoiceB: '#2b1027',
          previewChoiceActiveA: '#ffd36a',
          previewChoiceActiveB: '#ff7a4b',
          swatches: ['#ff94b9', '#ffd55f', '#dd5b8d']
        },
        sauge: {
          label: 'Menthe chill',
          note: 'Très doux pour réviser sans se crisper',
          brand: '#5cd4b5',
          brandStrong: '#2e947f',
          brandSoft: 'rgba(228, 255, 247, 0.9)',
          warm: '#ffd46a',
          ring: '0 0 0 3px rgba(92, 212, 181, 0.24)',
          pageGlowA: 'rgba(164, 255, 228, 0.3)',
          pageGlowB: 'rgba(255, 230, 160, 0.16)',
          pageBaseA: '#154048',
          pageBaseB: '#2d8878',
          pageBaseC: '#92e4b8',
          panelA: 'rgba(194, 255, 232, 0.26)',
          panelB: 'rgba(70, 176, 151, 0.28)',
          sectionA: 'rgba(248, 255, 252, 0.96)',
          sectionB: 'rgba(233, 247, 240, 0.92)',
          frameA: 'rgba(109, 232, 196, 0.94)',
          frameB: 'rgba(62, 176, 151, 0.96)',
          frameC: 'rgba(27, 102, 103, 0.98)',
          frameRaysOpacity: '0.2',
          toolbarA: 'rgba(88, 196, 173, 0.46)',
          toolbarB: 'rgba(22, 114, 110, 0.3)',
          topChipBg: 'rgba(248, 255, 252, 0.88)',
          topChipBorder: 'rgba(211, 243, 232, 0.96)',
          topChipInk: '#265f54',
          bottomNavA: 'rgba(248, 255, 252, 0.88)',
          bottomNavB: 'rgba(235, 249, 242, 0.84)',
          bottomNavBorder: 'rgba(244, 255, 249, 0.94)',
          bottomNavInk: '#42645b',
          bottomNavActiveA: '#f4fff8',
          bottomNavActiveB: '#e3f9ef',
          bottomNavActiveInk: '#2c8f79',
          moduleA: 'rgba(134, 237, 210, 0.32)',
          moduleB: 'rgba(39, 126, 114, 0.48)',
          moduleCopy: 'rgba(241, 255, 250, 0.92)',
          moduleSelectedA: 'rgba(255, 216, 111, 0.84)',
          moduleSelectedB: 'rgba(255, 160, 71, 0.8)',
          surfaceCardA: '#fbfffd',
          surfaceCardB: '#effaf5',
          questionA: '#3f9c88',
          questionB: '#2d7465',
          questionBorder: 'rgba(196, 238, 225, 0.8)',
          questionText: '#ffffff',
          questionSupportA: 'rgba(255, 255, 255, 0.14)',
          questionSupportB: 'rgba(255, 255, 255, 0.06)',
          questionSupportBorder: 'rgba(214, 241, 233, 0.32)',
          questionSupportText: 'rgba(246, 255, 252, 0.94)',
          choiceA: '#244f4a',
          choiceB: '#142c2d',
          choiceBorder: 'rgba(186, 240, 225, 0.28)',
          choiceText: '#f2fff9',
          choiceActiveA: '#9af271',
          choiceActiveB: '#39c164',
          choiceActiveBorder: 'rgba(196, 255, 165, 0.7)',
          previewBgA: '#2b6b67',
          previewBgB: '#9be6b7',
          previewSignA: '#d7fff0',
          previewSignB: '#55d3b0',
          previewQuestionA: '#fafffd',
          previewQuestionB: '#effaf5',
          previewChoiceA: '#24524e',
          previewChoiceB: '#122b2b',
          previewChoiceActiveA: '#9af06d',
          previewChoiceActiveB: '#34c362',
          swatches: ['#5cd4b5', '#ffd46a', '#2e947f']
        },
        nuit: {
          label: 'Nuit néon',
          note: 'Plus intense, plus duel, plus arcade',
          brand: '#8a8fff',
          brandStrong: '#585ef0',
          brandSoft: 'rgba(231, 233, 255, 0.88)',
          warm: '#54e7f5',
          ring: '0 0 0 3px rgba(138, 143, 255, 0.26)',
          pageGlowA: 'rgba(152, 167, 255, 0.26)',
          pageGlowB: 'rgba(84, 231, 245, 0.18)',
          pageBaseA: '#130f39',
          pageBaseB: '#2f2b7b',
          pageBaseC: '#1ab4e5',
          panelA: 'rgba(132, 135, 243, 0.28)',
          panelB: 'rgba(28, 44, 143, 0.3)',
          sectionA: 'rgba(246, 247, 255, 0.96)',
          sectionB: 'rgba(231, 236, 255, 0.92)',
          frameA: 'rgba(85, 106, 237, 0.96)',
          frameB: 'rgba(42, 51, 141, 0.98)',
          frameC: 'rgba(16, 23, 84, 0.99)',
          frameRaysOpacity: '0.24',
          toolbarA: 'rgba(70, 84, 203, 0.5)',
          toolbarB: 'rgba(18, 26, 102, 0.38)',
          topChipBg: 'rgba(250, 251, 255, 0.9)',
          topChipBorder: 'rgba(215, 220, 255, 0.94)',
          topChipInk: '#40478e',
          bottomNavA: 'rgba(250, 251, 255, 0.9)',
          bottomNavB: 'rgba(235, 239, 255, 0.84)',
          bottomNavBorder: 'rgba(244, 246, 255, 0.96)',
          bottomNavInk: '#545a8f',
          bottomNavActiveA: '#f3f6ff',
          bottomNavActiveB: '#e6ecff',
          bottomNavActiveInk: '#4b52d4',
          moduleA: 'rgba(129, 140, 255, 0.28)',
          moduleB: 'rgba(22, 30, 120, 0.56)',
          moduleCopy: 'rgba(240, 244, 255, 0.94)',
          moduleSelectedA: 'rgba(95, 234, 245, 0.84)',
          moduleSelectedB: 'rgba(36, 194, 226, 0.8)',
          surfaceCardA: '#fafbff',
          surfaceCardB: '#eef2ff',
          questionA: '#4454b7',
          questionB: '#26357d',
          questionBorder: 'rgba(203, 213, 255, 0.76)',
          questionText: '#ffffff',
          questionSupportA: 'rgba(255, 255, 255, 0.14)',
          questionSupportB: 'rgba(255, 255, 255, 0.06)',
          questionSupportBorder: 'rgba(219, 226, 255, 0.3)',
          questionSupportText: 'rgba(247, 249, 255, 0.94)',
          choiceA: '#2f3265',
          choiceB: '#121634',
          choiceBorder: 'rgba(174, 187, 255, 0.34)',
          choiceText: '#f4f6ff',
          choiceActiveA: '#76eff9',
          choiceActiveB: '#24bddc',
          choiceActiveBorder: 'rgba(160, 247, 255, 0.72)',
          previewBgA: '#292b72',
          previewBgB: '#1ab5e5',
          previewSignA: '#b9c0ff',
          previewSignB: '#666eff',
          previewQuestionA: '#fafcff',
          previewQuestionB: '#eef3ff',
          previewChoiceA: '#30346d',
          previewChoiceB: '#121735',
          previewChoiceActiveA: '#7cf0fa',
          previewChoiceActiveB: '#24bbda',
          swatches: ['#8a8fff', '#54e7f5', '#585ef0']
        },
        aurore: {
          label: 'Aurore pop',
          note: 'Plus pastel, plus playful, très détendu',
          brand: '#8fd6ff',
          brandStrong: '#4b88d8',
          brandSoft: 'rgba(239, 249, 255, 0.9)',
          warm: '#ffb7df',
          ring: '0 0 0 3px rgba(143, 214, 255, 0.24)',
          pageGlowA: 'rgba(209, 189, 255, 0.28)',
          pageGlowB: 'rgba(255, 193, 233, 0.18)',
          pageBaseA: '#3f2f72',
          pageBaseB: '#6fa5ff',
          pageBaseC: '#ffb5dc',
          panelA: 'rgba(214, 228, 255, 0.28)',
          panelB: 'rgba(135, 159, 255, 0.28)',
          sectionA: 'rgba(252, 249, 255, 0.96)',
          sectionB: 'rgba(243, 237, 255, 0.92)',
          frameA: 'rgba(157, 198, 255, 0.96)',
          frameB: 'rgba(111, 165, 255, 0.96)',
          frameC: 'rgba(107, 72, 166, 0.98)',
          frameRaysOpacity: '0.2',
          toolbarA: 'rgba(134, 163, 255, 0.48)',
          toolbarB: 'rgba(93, 72, 173, 0.3)',
          topChipBg: 'rgba(252, 249, 255, 0.9)',
          topChipBorder: 'rgba(229, 221, 255, 0.94)',
          topChipInk: '#62549d',
          bottomNavA: 'rgba(252, 249, 255, 0.9)',
          bottomNavB: 'rgba(243, 237, 255, 0.84)',
          bottomNavBorder: 'rgba(251, 247, 255, 0.96)',
          bottomNavInk: '#6d6795',
          bottomNavActiveA: '#fff7fc',
          bottomNavActiveB: '#f1ebff',
          bottomNavActiveInk: '#7b58d4',
          moduleA: 'rgba(172, 193, 255, 0.28)',
          moduleB: 'rgba(112, 88, 188, 0.52)',
          moduleCopy: 'rgba(249, 242, 255, 0.94)',
          moduleSelectedA: 'rgba(255, 193, 232, 0.86)',
          moduleSelectedB: 'rgba(255, 139, 199, 0.82)',
          surfaceCardA: '#fffbff',
          surfaceCardB: '#f5f0ff',
          questionA: '#6e7ef0',
          questionB: '#4e4fd0',
          questionBorder: 'rgba(226, 217, 255, 0.78)',
          questionText: '#ffffff',
          questionSupportA: 'rgba(255, 255, 255, 0.14)',
          questionSupportB: 'rgba(255, 255, 255, 0.06)',
          questionSupportBorder: 'rgba(233, 227, 255, 0.3)',
          questionSupportText: 'rgba(251, 247, 255, 0.94)',
          choiceA: '#4d3f7b',
          choiceB: '#24193d',
          choiceBorder: 'rgba(212, 202, 255, 0.34)',
          choiceText: '#f9f5ff',
          choiceActiveA: '#ffbce5',
          choiceActiveB: '#ff81c8',
          choiceActiveBorder: 'rgba(255, 213, 239, 0.74)',
          previewBgA: '#6d65cf',
          previewBgB: '#ffb3de',
          previewSignA: '#dde4ff',
          previewSignB: '#8a8fff',
          previewQuestionA: '#fffaff',
          previewQuestionB: '#f2edff',
          previewChoiceA: '#4f417f',
          previewChoiceB: '#24193d',
          previewChoiceActiveA: '#ffc2e8',
          previewChoiceActiveB: '#ff83c9',
          swatches: ['#8fd6ff', '#ffb7df', '#4b88d8']
        }
      };

      var notificationPollHandle = null;
      var notificationToastTimers = {};
      var reviewAutoAdvanceTimeout = null;
      var reviewAutoAdvanceTick = null;
      var duelPlayAutoAdvanceTimeout = null;
      var duelPlayAutoAdvanceTick = null;
      var REVIEW_AUTO_ADVANCE_OK_MS = 3000;
      var REVIEW_AUTO_ADVANCE_ERR_MS = 5000;
      var ambientSceneAssets = [
        '/v1/demo/assets/fond1.png',
        '/v1/demo/assets/fond2.png',
        '/v1/demo/assets/fond3.png',
        '/v1/demo/assets/fond4.png',
        '/v1/demo/assets/fond5.png',
        '/v1/demo/assets/fond6.png',
        '/v1/demo/assets/fond7.png',
        '/v1/demo/assets/fond8.png'
      ];
      var screenMeta = {
        welcome: {
          title: 'Accueil',
          subtitle: 'Connecte-toi pour entrer dans MedQuiz.'
        },
        dashboard: {
          title: 'Menu',
          subtitle: 'Choisis juste l’espace qui te fait du bien maintenant.'
        },
        training: {
          title: 'Entraînement',
          subtitle: 'Prépare une petite session simple, puis concentre-toi sur une question à la fois.'
        },
        duel: {
          title: 'Duel',
          subtitle: 'Retrouve tes défis sans surcharge, juste ce qu’il faut pour reprendre quand tu veux.'
        },
        stats: {
          title: 'Statistiques',
          subtitle: 'Regarde l’essentiel: où tu avances, et quoi revoir la prochaine fois.'
        },
        settings: {
          title: 'Paramètres',
          subtitle: 'Fais de l’app un endroit plus doux et plus à ton goût.'
        }
      };

      function setStatus(msg, tone) {
        var className = 'status ' + (tone || 'info');
        refs.statusBox.className = className;
        refs.statusBox.textContent = msg;
        if (refs.welcomeStatusBox) {
          refs.welcomeStatusBox.className = className + ' welcome-status';
          refs.welcomeStatusBox.textContent = msg;
        }
      }

      function setWelcomeAuthMode(mode) {
        var nextMode = mode || 'home';
        state.welcomeAuthMode = nextMode;
        if (!refs.welcomeLandingActions || !refs.welcomeFormPanel) {
          return;
        }

        var showForm = nextMode !== 'home';
        refs.welcomeLandingActions.classList.toggle('hidden', showForm);
        refs.welcomeFormPanel.classList.toggle('hidden', !showForm);
        if (refs.welcomeBranding) {
          refs.welcomeBranding.classList.toggle('hidden', nextMode === 'register');
        }
        if (refs.welcomeHeroArt) {
          refs.welcomeHeroArt.classList.toggle('hidden', nextMode === 'register');
        }
        if (refs.welcomeRegisterArt) {
          refs.welcomeRegisterArt.classList.toggle('hidden', nextMode !== 'register');
        }

        if (refs.displayNameField) {
          refs.displayNameField.classList.toggle('hidden', nextMode !== 'register');
        }
        if (refs.loginBtn) {
          refs.loginBtn.classList.toggle('hidden', nextMode === 'register');
        }
        if (refs.registerBtn) {
          refs.registerBtn.classList.toggle('hidden', nextMode === 'login');
        }
        if (refs.welcomeFormTitle) {
          refs.welcomeFormTitle.textContent = nextMode === 'register' ? 'Créer un compte' : 'Se connecter';
        }
      }

      function setAuthPending(actionLabel) {
        if (refs.showLoginBtn) {
          refs.showLoginBtn.disabled = true;
        }
        if (refs.showRegisterBtn) {
          refs.showRegisterBtn.disabled = true;
        }
        if (refs.welcomeBackBtn) {
          refs.welcomeBackBtn.disabled = true;
        }
        if (refs.registerBtn) {
          refs.registerBtn.disabled = true;
        }
        if (refs.loginBtn) {
          refs.loginBtn.disabled = true;
        }
        setStatus(actionLabel + ' en cours...', 'info');
      }

      function clearAuthPending() {
        if (refs.showLoginBtn) {
          refs.showLoginBtn.disabled = false;
        }
        if (refs.showRegisterBtn) {
          refs.showRegisterBtn.disabled = false;
        }
        if (refs.welcomeBackBtn) {
          refs.welcomeBackBtn.disabled = false;
        }
        if (refs.registerBtn) {
          refs.registerBtn.disabled = false;
        }
        if (refs.loginBtn) {
          refs.loginBtn.disabled = false;
        }
      }

      function prepareWelcomeImage(image, options) {
        if (!image || image.dataset.cleaned === '1') {
          return;
        }

        var config = options || {};

        function runCleanup() {
          try {
            var canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            if (!canvas.width || !canvas.height) {
              return;
            }
            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            var pixels = imageData.data;

            if (config.clearNeutralBackground) {
              var saturationThreshold = typeof config.neutralSaturationThreshold === 'number'
                ? config.neutralSaturationThreshold
                : 0.16;
              var brightnessThreshold = typeof config.neutralBrightnessThreshold === 'number'
                ? config.neutralBrightnessThreshold
                : 150;
              var channelDeltaThreshold = typeof config.neutralChannelDelta === 'number'
                ? config.neutralChannelDelta
                : 22;

              function isNeutralBackgroundPixel(pixelIndex) {
                var alpha = pixels[pixelIndex + 3];
                if (alpha <= 12) {
                  return true;
                }
                var red = pixels[pixelIndex];
                var green = pixels[pixelIndex + 1];
                var blue = pixels[pixelIndex + 2];
                var maxChannel = Math.max(red, green, blue);
                var minChannel = Math.min(red, green, blue);
                var saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;
                var brightness = (red + green + blue) / 3;

                return saturation < saturationThreshold
                  && brightness > brightnessThreshold
                  && Math.abs(red - green) < channelDeltaThreshold
                  && Math.abs(green - blue) < channelDeltaThreshold
                  && Math.abs(red - blue) < channelDeltaThreshold;
              }

              var width = canvas.width;
              var height = canvas.height;
              var visited = new Uint8Array(width * height);
              var queue = [];

              function enqueueBackgroundPixel(x, y) {
                if (x < 0 || y < 0 || x >= width || y >= height) {
                  return;
                }
                var position = y * width + x;
                if (visited[position]) {
                  return;
                }
                var pixelIndex = position * 4;
                if (!isNeutralBackgroundPixel(pixelIndex)) {
                  return;
                }
                visited[position] = 1;
                queue.push(position);
              }

              for (var edgeX = 0; edgeX < width; edgeX += 1) {
                enqueueBackgroundPixel(edgeX, 0);
                enqueueBackgroundPixel(edgeX, height - 1);
              }

              for (var edgeY = 0; edgeY < height; edgeY += 1) {
                enqueueBackgroundPixel(0, edgeY);
                enqueueBackgroundPixel(width - 1, edgeY);
              }

              while (queue.length) {
                var position = queue.pop();
                var pixelIndex = position * 4;
                pixels[pixelIndex + 3] = 0;
                var px = position % width;
                var py = Math.floor(position / width);
                enqueueBackgroundPixel(px - 1, py);
                enqueueBackgroundPixel(px + 1, py);
                enqueueBackgroundPixel(px, py - 1);
                enqueueBackgroundPixel(px, py + 1);
              }
            }

            context.putImageData(imageData, 0, 0);
            var minX = canvas.width;
            var minY = canvas.height;
            var maxX = -1;
            var maxY = -1;

            for (var scanIndex = 0; scanIndex < pixels.length; scanIndex += 4) {
              var alpha = pixels[scanIndex + 3];
              if (alpha <= 12) {
                continue;
              }
              var pixelNo = scanIndex / 4;
              var x = pixelNo % canvas.width;
              var y = Math.floor(pixelNo / canvas.width);
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }

            if (maxX >= minX && maxY >= minY) {
              var padding = typeof config.padding === 'number' ? config.padding : 0;
              minX = Math.max(0, minX - padding);
              minY = Math.max(0, minY - padding);
              maxX = Math.min(canvas.width - 1, maxX + padding);
              maxY = Math.min(canvas.height - 1, maxY + padding);

              var cropWidth = maxX - minX + 1;
              var cropHeight = maxY - minY + 1;
              var trimmedCanvas = document.createElement('canvas');
              trimmedCanvas.width = cropWidth;
              trimmedCanvas.height = cropHeight;
              var trimmedContext = trimmedCanvas.getContext('2d');
              trimmedContext.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
              image.src = trimmedCanvas.toDataURL('image/png');
            } else {
              image.src = canvas.toDataURL('image/png');
            }
            image.dataset.cleaned = '1';
          } catch (error) {
            console.warn('welcome image cleanup skipped', error);
          }
        }

        if (image.complete) {
          runCleanup();
          return;
        }

        image.addEventListener('load', runCleanup, { once: true });
      }

      function getThemeDefinition(themeKey) {
        return themeDefinitions[themeKey] || themeDefinitions.lagon;
      }

      function normalizeHexColor(value, fallback) {
        if (typeof value !== 'string') {
          return fallback;
        }
        var hex = value.trim();
        if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
          return fallback;
        }
        if (hex.length === 4) {
          hex = '#' + hex.slice(1).split('').map(function (part) {
            return part + part;
          }).join('');
        }
        return hex.toLowerCase();
      }

      function hexToRgb(hex) {
        var normalized = normalizeHexColor(hex, '#000000');
        return {
          r: parseInt(normalized.slice(1, 3), 16),
          g: parseInt(normalized.slice(3, 5), 16),
          b: parseInt(normalized.slice(5, 7), 16)
        };
      }

      function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(function (value) {
          return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
        }).join('');
      }

      function shiftHexColor(hex, amount) {
        var rgb = hexToRgb(hex);
        return rgbToHex(rgb.r + amount, rgb.g + amount, rgb.b + amount);
      }

      function mixHexColors(a, b, ratio) {
        var first = hexToRgb(a);
        var second = hexToRgb(b);
        var mix = typeof ratio === 'number' ? ratio : 0.5;
        return rgbToHex(
          Math.round(first.r + (second.r - first.r) * mix),
          Math.round(first.g + (second.g - first.g) * mix),
          Math.round(first.b + (second.b - first.b) * mix)
        );
      }

      function hexToRgba(hex, alpha) {
        var rgb = hexToRgb(hex);
        return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
      }

      function getReadableTextColor(hex, darkColor, lightColor) {
        var rgb = hexToRgb(hex);
        var luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return luminance > 0.62 ? darkColor : lightColor;
      }

      function saveThemeOverrides() {
        if (!state.themeOverrides || !Object.keys(state.themeOverrides).length) {
          localStorage.removeItem('medquiz_demo_theme_overrides');
          return;
        }
        localStorage.setItem('medquiz_demo_theme_overrides', JSON.stringify(state.themeOverrides));
      }

      function applyThemeOverrides(baseTheme) {
        var overrides = state.themeOverrides || {};
        if (!Object.keys(overrides).length) {
          return;
        }

        if (overrides.brand) {
          var brand = normalizeHexColor(overrides.brand, baseTheme.brand);
          document.documentElement.style.setProperty('--brand', brand);
          document.documentElement.style.setProperty('--brand-strong', shiftHexColor(brand, -42));
          document.documentElement.style.setProperty('--ring', '0 0 0 3px ' + hexToRgba(brand, 0.24));
        }

        if (overrides.pageBaseA || overrides.pageBaseC) {
          var pageBaseA = normalizeHexColor(overrides.pageBaseA || baseTheme.pageBaseA, baseTheme.pageBaseA);
          var pageBaseC = normalizeHexColor(overrides.pageBaseC || baseTheme.pageBaseC, baseTheme.pageBaseC);
          document.documentElement.style.setProperty('--page-base-a', pageBaseA);
          document.documentElement.style.setProperty('--page-base-b', mixHexColors(pageBaseA, pageBaseC, 0.48));
          document.documentElement.style.setProperty('--page-base-c', pageBaseC);
        }

        if (overrides.questionA) {
          var questionA = normalizeHexColor(overrides.questionA, baseTheme.questionA);
          document.documentElement.style.setProperty('--question-a', questionA);
          document.documentElement.style.setProperty('--question-b', shiftHexColor(questionA, -28));
          document.documentElement.style.setProperty('--question-border', hexToRgba(questionA, 0.46));
          document.documentElement.style.setProperty('--question-text', '#ffffff');
          document.documentElement.style.setProperty('--question-support-a', hexToRgba(questionA, 0.18));
          document.documentElement.style.setProperty('--question-support-b', hexToRgba(questionA, 0.08));
          document.documentElement.style.setProperty('--question-support-border', hexToRgba(questionA, 0.32));
          document.documentElement.style.setProperty('--question-support-text', 'rgba(248, 252, 255, 0.96)');
        }

        if (overrides.choiceActiveA) {
          var active = normalizeHexColor(overrides.choiceActiveA, baseTheme.choiceActiveA);
          document.documentElement.style.setProperty('--warm', active);
          document.documentElement.style.setProperty('--choice-active-a', active);
          document.documentElement.style.setProperty('--choice-active-b', shiftHexColor(active, -32));
          document.documentElement.style.setProperty('--choice-active-border', hexToRgba(active, 0.72));
        }
      }

      function applyVisualTheme(themeKey) {
        var resolvedKey = themeDefinitions[themeKey] ? themeKey : 'lagon';
        var theme = getThemeDefinition(resolvedKey);
        state.visualTheme = resolvedKey;
        localStorage.setItem('medquiz_demo_theme', resolvedKey);
        document.documentElement.style.setProperty('--brand', theme.brand);
        document.documentElement.style.setProperty('--brand-strong', theme.brandStrong);
        document.documentElement.style.setProperty('--brand-soft', theme.brandSoft);
        document.documentElement.style.setProperty('--warm', theme.warm);
        document.documentElement.style.setProperty('--ring', theme.ring);
        document.documentElement.style.setProperty('--page-glow-a', theme.pageGlowA);
        document.documentElement.style.setProperty('--page-glow-b', theme.pageGlowB);
        document.documentElement.style.setProperty('--page-base-a', theme.pageBaseA);
        document.documentElement.style.setProperty('--page-base-b', theme.pageBaseB);
        document.documentElement.style.setProperty('--page-base-c', theme.pageBaseC);
        document.documentElement.style.setProperty('--panel-a', theme.panelA);
        document.documentElement.style.setProperty('--panel-b', theme.panelB);
        document.documentElement.style.setProperty('--section-a', theme.sectionA);
        document.documentElement.style.setProperty('--section-b', theme.sectionB);
        document.documentElement.style.setProperty('--frame-a', theme.frameA);
        document.documentElement.style.setProperty('--frame-b', theme.frameB);
        document.documentElement.style.setProperty('--frame-c', theme.frameC);
        document.documentElement.style.setProperty('--frame-rays-opacity', theme.frameRaysOpacity);
        document.documentElement.style.setProperty('--toolbar-a', theme.toolbarA);
        document.documentElement.style.setProperty('--toolbar-b', theme.toolbarB);
        document.documentElement.style.setProperty('--top-chip-bg', theme.topChipBg);
        document.documentElement.style.setProperty('--top-chip-border', theme.topChipBorder);
        document.documentElement.style.setProperty('--top-chip-ink', theme.topChipInk);
        document.documentElement.style.setProperty('--bottom-nav-a', theme.bottomNavA);
        document.documentElement.style.setProperty('--bottom-nav-b', theme.bottomNavB);
        document.documentElement.style.setProperty('--bottom-nav-border', theme.bottomNavBorder);
        document.documentElement.style.setProperty('--bottom-nav-ink', theme.bottomNavInk);
        document.documentElement.style.setProperty('--bottom-nav-active-a', theme.bottomNavActiveA);
        document.documentElement.style.setProperty('--bottom-nav-active-b', theme.bottomNavActiveB);
        document.documentElement.style.setProperty('--bottom-nav-active-ink', theme.bottomNavActiveInk);
        document.documentElement.style.setProperty('--module-a', theme.moduleA);
        document.documentElement.style.setProperty('--module-b', theme.moduleB);
        document.documentElement.style.setProperty('--module-copy', theme.moduleCopy);
        document.documentElement.style.setProperty('--module-selected-a', theme.moduleSelectedA);
        document.documentElement.style.setProperty('--module-selected-b', theme.moduleSelectedB);
        document.documentElement.style.setProperty('--surface-card-a', theme.surfaceCardA);
        document.documentElement.style.setProperty('--surface-card-b', theme.surfaceCardB);
        document.documentElement.style.setProperty('--question-a', theme.questionA);
        document.documentElement.style.setProperty('--question-b', theme.questionB);
        document.documentElement.style.setProperty('--question-border', theme.questionBorder);
        document.documentElement.style.setProperty('--question-text', '#ffffff');
        document.documentElement.style.setProperty('--question-support-a', theme.questionSupportA);
        document.documentElement.style.setProperty('--question-support-b', theme.questionSupportB);
        document.documentElement.style.setProperty('--question-support-border', theme.questionSupportBorder);
        document.documentElement.style.setProperty('--question-support-text', 'rgba(248, 252, 255, 0.96)');
        document.documentElement.style.setProperty('--choice-a', theme.choiceA);
        document.documentElement.style.setProperty('--choice-b', theme.choiceB);
        document.documentElement.style.setProperty('--choice-border', theme.choiceBorder);
        document.documentElement.style.setProperty('--choice-text', theme.choiceText);
        document.documentElement.style.setProperty('--choice-active-a', theme.choiceActiveA);
        document.documentElement.style.setProperty('--choice-active-b', theme.choiceActiveB);
        document.documentElement.style.setProperty('--choice-active-border', theme.choiceActiveBorder);
        applyThemeOverrides(theme);
      }

      function getUnreadNotificationsCount() {
        return state.notifications.filter(function (item) {
          return item.status !== 'read';
        }).length;
      }

      function getActiveDuelsCount() {
        return state.duels.filter(function (item) {
          return item.status === 'pending_opener' || item.status === 'in_progress';
        }).length;
      }

      function renderNotificationShortcut() {
        if (!refs.notificationsShortcutBtn || !refs.notificationsShortcutBadge) {
          return;
        }

        var connected = !!state.token;
        refs.notificationsShortcutBtn.classList.toggle('hidden', !connected);
        if (!connected) {
          refs.notificationsShortcutBadge.classList.add('hidden');
          refs.notificationsShortcutBadge.textContent = '0';
          refs.notificationsShortcutBtn.classList.remove('is-active');
          return;
        }

        var unreadCount = getUnreadNotificationsCount();
        refs.notificationsShortcutBtn.classList.toggle(
          'is-active',
          state.activeScreen === 'duel' && state.duelFlow === 'notifications'
        );

        if (unreadCount > 0) {
          refs.notificationsShortcutBadge.classList.remove('hidden');
          refs.notificationsShortcutBadge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
        } else {
          refs.notificationsShortcutBadge.classList.add('hidden');
          refs.notificationsShortcutBadge.textContent = '0';
        }
      }

      function getAvatarItemTypeLabel(itemType) {
        var labels = {
          outfit: 'Tenue',
          pose: 'Pose',
          object: 'Objet',
          background: 'Décor'
        };
        return labels[itemType] || itemType;
      }

      function getAvatarEquippedItem(itemType) {
        return state.myAvatar && state.myAvatar.equipment ? state.myAvatar.equipment[itemType] : null;
      }

      function getAvatarInventoryForType(itemType) {
        return state.avatarInventoryByType && Array.isArray(state.avatarInventoryByType[itemType])
          ? state.avatarInventoryByType[itemType]
          : [];
      }

      function canSetAvatarSpecialty() {
        var code = state.myAvatar && state.myAvatar.currentStage ? state.myAvatar.currentStage.code : '';
        if (!code) {
          return false;
        }
        return !/^pass_|^dfgsm|^dfasm/.test(code);
      }

      function setNavButtonActive(button, active) {
        if (!button) {
          return;
        }
        button.classList.toggle('is-active', !!active);
      }

      function normalizeActiveScreen(screenKey) {
        if (!state.token) {
          return 'welcome';
        }
        return screenMeta[screenKey] ? screenKey : 'dashboard';
      }

      function getTrainingScreenSubtitle() {
        if (state.trainingFlow === 'setup') {
          return 'Dernière étape: choisis le nombre de questions avant de démarrer.';
        }
        if (state.trainingFlow === 'scope') {
          return 'Choisis d’abord les matières et chapitres à réviser.';
        }
        if (state.trainingFlow === 'play') {
          return 'Ici on garde seulement la question, la progression et les actions utiles.';
        }
        if (state.trainingFlow === 'result') {
          return 'Débrief de session puis relance simple.';
        }
        return 'Choisis d’abord le type d’entraînement que tu veux lancer.';
      }

      function getDuelScreenSubtitle() {
        if (state.duelFlow === 'notifications') {
          return 'Ici tu lis seulement les alertes liées aux duels.';
        }
        if (state.duelFlow === 'create') {
          return 'Choisis le type de duel, puis crée ton défi.';
        }
        if (state.duelFlow === 'inbox') {
          return 'Parcours simplement tes duels, puis ouvre celui qui t’intéresse.';
        }
        if (state.duelFlow === 'detail') {
          return 'Le duel résumé au strict minimum avant de démarrer.';
        }
        if (state.duelFlow === 'subject') {
          return 'Choisis une matière parmi les 3 proposées pour cette manche.';
        }
        if (state.duelFlow === 'play') {
          return 'On garde seulement la question duel en cours et l’action suivante.';
        }
        return 'Choisis simplement: notifications, nouveau duel, ou mes duels.';
      }

      function getScreenSubtitle(screenKey) {
        if (screenKey === 'training') {
          return getTrainingScreenSubtitle();
        }
        if (screenKey === 'duel') {
          return getDuelScreenSubtitle();
        }
        return screenMeta[screenKey].subtitle;
      }

      function renderTrainingFlow() {
        if (!refs.trainingHomeView) {
          return;
        }
        refs.trainingHomeView.classList.toggle('hidden', state.trainingFlow !== 'home');
        refs.trainingSetupView.classList.toggle('hidden', state.trainingFlow !== 'setup');
        refs.trainingScopeView.classList.toggle('hidden', state.trainingFlow !== 'scope');
        refs.trainingPlayView.classList.toggle('hidden', state.trainingFlow !== 'play');
        refs.trainingResultView.classList.toggle('hidden', state.trainingFlow !== 'result');
      }

      function renderDuelFlow() {
        if (!refs.duelHomeView) {
          return;
        }
        refs.duelHomeView.classList.toggle('hidden', state.duelFlow !== 'home');
        refs.duelNotificationsView.classList.toggle('hidden', state.duelFlow !== 'notifications');
        refs.duelCreateView.classList.toggle('hidden', state.duelFlow !== 'create');
        refs.duelInboxView.classList.toggle('hidden', state.duelFlow !== 'inbox');
        refs.duelDetailView.classList.toggle('hidden', state.duelFlow !== 'detail');
        refs.duelSubjectView.classList.toggle('hidden', state.duelFlow !== 'subject');
        refs.duelPlayView.classList.toggle('hidden', state.duelFlow !== 'play');
        renderDuelStatusFilters();
      }

      function pickRandomAmbientScene(exclude) {
        if (!ambientSceneAssets.length) {
          return null;
        }
        var pool = ambientSceneAssets.filter(function (scene) {
          return scene !== exclude;
        });
        var candidates = pool.length ? pool : ambientSceneAssets;
        return candidates[Math.floor(Math.random() * candidates.length)] || null;
      }

      function applyAmbientScene() {
        var sceneUrl = 'none';

        if (state.activeScreen === 'training' && state.trainingFlow === 'play' && state.ambientScenes.trainingPlay) {
          sceneUrl = 'url("' + state.ambientScenes.trainingPlay + '")';
        } else if (state.activeScreen === 'duel' && state.ambientScenes.duel) {
          sceneUrl = 'url("' + state.ambientScenes.duel + '")';
        } else if (state.ambientScenes.app) {
          sceneUrl = 'url("' + state.ambientScenes.app + '")';
        }

        document.documentElement.style.setProperty('--ambient-scene-image', sceneUrl);
      }

      function setTrainingFlow(step) {
        var previousFlow = state.trainingFlow;
        state.trainingFlow = step || 'home';
        if (state.trainingFlow === 'play' && previousFlow !== 'play') {
          state.ambientScenes.trainingPlay = pickRandomAmbientScene(state.ambientScenes.duel);
        } else if (state.trainingFlow !== 'play') {
          state.ambientScenes.trainingPlay = null;
        }
        document.body.setAttribute('data-training-flow', state.trainingFlow);
        renderTrainingFlow();
        if (state.activeScreen === 'training') {
          refs.screenSubtitle.textContent = getTrainingScreenSubtitle();
        }
        applyAmbientScene();
      }

      function setDuelFlow(step) {
        var nextStep = step || 'home';
        if (nextStep === 'detail' && !state.selectedDuel) {
          nextStep = 'inbox';
        }
        if (nextStep === 'subject' && !state.selectedDuel) {
          nextStep = 'inbox';
        }
        if (nextStep === 'play' && !state.selectedDuel) {
          nextStep = 'inbox';
        }
        if (nextStep !== 'play') {
          clearDuelPlayAutoAdvance();
        }
        state.duelFlow = nextStep;
        document.body.setAttribute('data-duel-flow', state.duelFlow);
        renderDuelFlow();
        if (state.activeScreen === 'duel') {
          refs.screenSubtitle.textContent = getDuelScreenSubtitle();
        }
        applyAmbientScene();
      }

      function renderScreenFrame() {
        var connected = !!state.token;
        var active = normalizeActiveScreen(state.activeScreen);
        var screenRefs = {
          dashboard: refs.dashboardScreen,
          training: refs.trainingScreen,
          duel: refs.duelScreen,
          stats: refs.statsScreen,
          settings: refs.settingsScreen
        };

        state.activeScreen = active;
        if (!state.ambientScenes.app) {
          state.ambientScenes.app = pickRandomAmbientScene(null);
        }
        document.body.setAttribute('data-screen', active);
        document.body.setAttribute('data-auth', connected ? 'connected' : 'guest');
        document.body.setAttribute('data-training-flow', state.trainingFlow || 'home');
        document.body.setAttribute('data-duel-flow', state.duelFlow || 'home');
        refs.welcomeScreen.classList.toggle('hidden', connected);
        refs.appShell.classList.toggle('hidden', !connected);

        Object.keys(screenRefs).forEach(function (key) {
          screenRefs[key].classList.toggle('hidden', !connected || key !== active);
        });

        if (!connected) {
          applyAmbientScene();
          return;
        }

        refs.screenTitle.textContent = screenMeta[active].title;
        refs.screenSubtitle.textContent = getScreenSubtitle(active);
        refs.menuBackBtn.classList.toggle('hidden', active === 'dashboard');
        setNavButtonActive(refs.quickTrainingNavBtn, active === 'training');
        setNavButtonActive(refs.quickDuelNavBtn, active === 'duel');
        setNavButtonActive(refs.statsNavBtn, active === 'stats');
        setNavButtonActive(refs.settingsNavBtn, active === 'settings');
        renderTrainingFlow();
        renderDuelFlow();
        renderNotificationShortcut();
        applyAmbientScene();
      }

      function setActiveScreen(screenKey) {
        var previousScreen = state.activeScreen;
        state.activeScreen = normalizeActiveScreen(screenKey);
        if (state.activeScreen !== 'duel') {
          clearDuelPlayAutoAdvance();
        }
        if (state.activeScreen === 'duel' && previousScreen !== 'duel') {
          state.ambientScenes.duel = pickRandomAmbientScene(state.ambientScenes.trainingPlay);
        } else if (state.activeScreen !== 'duel' && previousScreen === 'duel' && !state.ambientScenes.app) {
          state.ambientScenes.app = pickRandomAmbientScene(state.ambientScenes.duel);
        }
        renderScreenFrame();
      }

      async function api(path, options) {
        var opts = options || {};
        var hasBody = Object.prototype.hasOwnProperty.call(opts, 'body');
        var headers = Object.assign({}, opts.headers || {});
        if (hasBody) {
          headers['content-type'] = 'application/json';
        }
        if (state.token) {
          headers.Authorization = 'Bearer ' + state.token;
        }

        var res = await fetch(baseUrl + path, {
          method: opts.method || 'GET',
          headers: headers,
          body: hasBody ? JSON.stringify(opts.body) : undefined
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
        refs.refreshDashboardBtn.disabled = !connected;
        refs.logoutBtn.classList.toggle('hidden', !connected);
        refs.refreshNotificationsBtn.disabled = !connected;
        refs.createDuelBtn.disabled = !connected;
        refs.refreshDuelsBtn.disabled = !connected;
        if (!connected) {
          refs.createSessionBtn.disabled = true;
          refs.createDuelBtn.disabled = true;
          refs.refreshDuelsBtn.disabled = true;
        }
        renderSetupGuide();
        renderNotificationShortcut();
      }

      function getPreferredPlayerName() {
        if (!state.me) {
          return 'Non connecté';
        }
        if (state.me.publicAlias) {
          return String(state.me.publicAlias).trim();
        }
        if (state.me.displayName) {
          return String(state.me.displayName).trim();
        }
        if (state.me.email) {
          return String(state.me.email).split('@')[0];
        }
        return 'Joueur MedQuiz';
      }

      function summaryCardHtml(label, value, note) {
        return '<div class="summary-card">'
          + '<div class="summary-card-label">' + escapeHtml(label) + '</div>'
          + '<div class="summary-card-value">' + escapeHtml(value) + '</div>'
          + (note ? ('<div class="summary-card-note">' + escapeHtml(note) + '</div>') : '')
          + '</div>';
      }

      function themeColorCardHtml(label, key, value, note) {
        return '<div class="settings-option-card">'
          + '<div class="settings-option-head">'
          + '<b>' + escapeHtml(label) + '</b>'
          + '<span>' + escapeHtml(note) + '</span>'
          + '</div>'
          + '<input type="color" class="theme-color-input" data-theme-color="' + escapeHtml(key) + '" value="' + escapeHtml(normalizeHexColor(value, '#44c8f5')) + '" />'
          + '<div class="theme-color-meta"><span>' + escapeHtml(normalizeHexColor(value, '#44c8f5').toUpperCase()) + '</span><span>Personnalisable</span></div>'
          + '</div>';
      }

      function getSubscriptionLabel() {
        if (!state.me || !state.me.subscription) {
          return 'Free';
        }
        var plan = state.me.subscription.plan || 'free';
        var status = state.me.subscription.status || 'active';
        return String(plan).toUpperCase() + ' · ' + status;
      }

      function getDashboardOverview() {
        return state.dashboard && state.dashboard.overview ? state.dashboard.overview : null;
      }

      function getGreetingLabel() {
        var hours = new Date().getHours();
        if (hours < 12) {
          return 'Bonjour';
        }
        if (hours < 18) {
          return 'Bon après-midi';
        }
        return 'Bonsoir';
      }

      function pulseCardHtml(label, value, note) {
        return '<div class="dashboard-pulse-card">'
          + '<div class="k">' + escapeHtml(label) + '</div>'
          + '<div class="v">' + escapeHtml(value) + '</div>'
          + '<div class="n">' + escapeHtml(note) + '</div>'
          + '</div>';
      }

      function renderDashboardHero() {
        if (!state.token) {
          refs.dashboardHero.innerHTML = '<div class="muted">Connecte-toi pour afficher ton menu principal.</div>';
          return;
        }

        var name = getPreferredPlayerName();
        var stageName = state.myAvatar && state.myAvatar.currentStage ? state.myAvatar.currentStage.name : 'Début du parcours';
        var initials = getInitials(name);

        refs.dashboardHero.innerHTML =
          + '<div class="menu-home-head">'
          + '<div class="menu-home-avatar">' + escapeHtml(initials) + '</div>'
          + '<div class="menu-home-copy">'
          + '<div class="menu-home-kicker">' + escapeHtml(stageName) + '</div>'
          + '<div class="menu-home-title">' + escapeHtml(getGreetingLabel() + ', ' + name) + '</div>'
          + '<div class="menu-home-text">Choisis juste un espace et avance tranquillement.</div>'
          + '</div>'
          + '</div>';
      }

      function renderDashboardPulse() {
        if (!refs.dashboardPulse) {
          return;
        }
        if (!state.token) {
          refs.dashboardPulse.innerHTML = '<div class="muted">Connecte-toi pour afficher les indicateurs du moment.</div>';
          return;
        }

        var overview = getDashboardOverview();
        var unreadNotifications = getUnreadNotificationsCount();
        var activeDuels = getActiveDuelsCount();
        refs.dashboardPulse.innerHTML = [
          pulseCardHtml(
            'Sessions récentes',
            String(overview ? overview.sessions7dCount : 0),
            'Nombre de sessions réalisées sur les 7 derniers jours.'
          ),
          pulseCardHtml(
            'Tentatives',
            String(overview ? overview.attemptsCount : 0),
            'Volume global de réponses déjà jouées dans ton espace.'
          ),
          pulseCardHtml(
            'Couverture',
            overview ? (overview.chapterCoveragePct + '%') : '—',
            'Part du programme déjà travaillée dans tes matières.'
          ),
          pulseCardHtml(
            'Veille duel',
            activeDuels ? String(activeDuels) : '0',
            unreadNotifications
              ? (String(unreadNotifications) + ' notification' + (unreadNotifications > 1 ? 's' : '') + ' à lire.')
              : 'Aucune notification en attente pour le moment.'
          )
        ].join('');
      }

      function renderDashboardJourney() {
        if (!refs.dashboardJourney) {
          return;
        }
        if (!state.token) {
          refs.dashboardJourney.innerHTML = '<div class="muted">Connecte-toi pour afficher les prochains meilleurs pas.</div>';
          return;
        }

        var overview = getDashboardOverview();
        var suggestedMode = overview && overview.suggestedMode ? getModeLabel(overview.suggestedMode) : 'Apprentissage';
        var unreadNotifications = getUnreadNotificationsCount();
        var activeDuels = getActiveDuelsCount();
        var nextStage = state.myAvatar && state.myAvatar.nextStage ? state.myAvatar.nextStage.name : '';

        var steps = [
          {
            title: 'Relancer une session utile',
            note: 'Le mode le plus pertinent actuellement semble être ' + suggestedMode.toLowerCase() + '.',
            chip: suggestedMode,
            screen: 'training',
            actionLabel: 'Aller à l’entraînement'
          },
          {
            title: unreadNotifications ? 'Répondre à tes alertes duel' : 'Garder un oeil sur les duels',
            note: unreadNotifications
              ? ('Tu as ' + unreadNotifications + ' notification' + (unreadNotifications > 1 ? 's' : '') + ' à traiter, avec ' + activeDuels + ' duel' + (activeDuels > 1 ? 's' : '') + ' actif' + (activeDuels > 1 ? 's' : '') + '.')
              : 'Même sans alerte immédiate, le centre duel reste ton point de suivi challenge.',
            chip: unreadNotifications ? (String(unreadNotifications) + ' alerte' + (unreadNotifications > 1 ? 's' : '')) : 'Duel',
            chipTone: unreadNotifications ? 'warn' : '',
            screen: 'duel',
            actionLabel: 'Ouvrir duel'
          },
          {
            title: nextStage ? ('Préparer ' + nextStage) : 'Relire ta progression',
            note: 'Tes statistiques, ton profil joueur et ton avatar sont regroupés ici pour lire la trajectoire complète.',
            chip: state.myAvatar && state.myAvatar.currentStage ? state.myAvatar.currentStage.name : 'Stats',
            screen: 'stats',
            actionLabel: 'Ouvrir statistiques'
          }
        ];

        refs.dashboardJourney.innerHTML =
          '<div class="dashboard-lane">'
          + '<div class="dashboard-lane-head">'
          + '<div class="dashboard-lane-copy"><b>Ce que je te ferais faire maintenant</b><span>Un chemin simple en 3 pas pour repartir sans te perdre dans l’interface.</span></div>'
          + '<span class="chip">Guidé</span>'
          + '</div>'
          + '<div class="dashboard-lane-list">' + steps.map(function (step, index) {
            var chipClass = step.chipTone ? ('chip ' + step.chipTone) : 'chip';
            return '<div class="dashboard-lane-item">'
              + '<div class="dashboard-lane-top">'
              + '<div>'
              + '<div class="dashboard-lane-title">' + escapeHtml(String(index + 1) + '. ' + step.title) + '</div>'
              + '<div class="dashboard-lane-note">' + escapeHtml(step.note) + '</div>'
              + '</div>'
              + '<span class="' + chipClass + '">' + escapeHtml(step.chip) + '</span>'
              + '</div>'
              + '<button class="btn-secondary btn-inline" data-nav-screen="' + escapeHtml(step.screen) + '">' + escapeHtml(step.actionLabel) + '</button>'
              + '</div>';
          }).join('') + '</div>'
          + '</div>';
      }

      function renderDashboardCards() {
        if (!state.token) {
          refs.dashboardHero.innerHTML = '<div class="muted">Connecte-toi pour retrouver ton menu.</div>';
          if (refs.dashboardPulse) {
            refs.dashboardPulse.innerHTML = '<div class="muted">Connecte-toi pour retrouver tes indicateurs.</div>';
          }
          if (refs.dashboardJourney) {
            refs.dashboardJourney.innerHTML = '<div class="muted">Connecte-toi pour retrouver ta trajectoire.</div>';
          }
          refs.dashboardCards.innerHTML = '<div class="muted">Connecte-toi pour ouvrir les modules.</div>';
          return;
        }

        var overview = getDashboardOverview();
        var suggestedMode = overview && overview.suggestedMode ? getModeLabel(overview.suggestedMode) : 'À déterminer';
        var successRate = overview && overview.successRatePct != null ? (overview.successRatePct + '%') : '—';
        var activeDuels = getActiveDuelsCount();
        var unreadNotifications = getUnreadNotificationsCount();

        renderDashboardHero();
        renderDashboardPulse();
        renderDashboardJourney();

        var cards = [
          {
            title: 'Entraînement',
            icon: 'TR',
            copy: 'Reprendre avec ' + suggestedMode.toLowerCase(),
            screen: 'training'
          },
          {
            title: 'Duel',
            icon: 'DU',
            copy: unreadNotifications
              ? (String(unreadNotifications) + ' notif à voir')
              : (activeDuels ? (String(activeDuels) + ' duel actif' + (activeDuels > 1 ? 's' : '')) : 'Prêt pour un défi'),
            screen: 'duel'
          },
          {
            title: 'Statistiques',
            icon: 'ST',
            copy: 'Réussite actuelle: ' + successRate,
            screen: 'stats'
          },
          {
            title: 'Paramètres',
            icon: 'RG',
            copy: 'Couleurs, avatar et ambiance',
            screen: 'settings'
          }
        ];

        refs.dashboardCards.innerHTML = cards.map(function (card) {
          return '<button class="menu-module-card" data-nav-screen="' + escapeHtml(card.screen) + '">'
            + '<div class="menu-module-top">'
            + '<div class="menu-module-icon">' + escapeHtml(card.icon) + '</div>'
            + '<div class="menu-module-copy-wrap">'
            + '<div class="menu-module-label">' + escapeHtml(card.title) + '</div>'
            + '<div class="menu-module-copy">' + escapeHtml(card.copy) + '</div>'
            + '</div>'
            + '</div>'
            + '<div class="menu-module-icon">›</div>'
            + '</button>';
        }).join('');
      }

      function renderProfileSummary() {
        if (!state.token) {
          refs.profileSummary.innerHTML = '<div class="muted">Connecte-toi pour afficher ton profil.</div>';
          refs.profileAvatarSummary.innerHTML = '<div class="muted">Connecte-toi pour afficher ton avatar.</div>';
          return;
        }

        if (!state.me) {
          refs.profileSummary.innerHTML = '<div class="muted">Chargement du profil…</div>';
        } else {
          refs.profileSummary.innerHTML =
            '<div class="summary-stack">'
            + '<div class="summary-head">'
            + '<div class="summary-title">' + escapeHtml(getPreferredPlayerName()) + '</div>'
            + '<div class="summary-text">Lecture rapide de ton identité joueur, sans détails administratifs inutiles.</div>'
            + '<div class="summary-inline-chips">'
            + '<span class="chip">' + escapeHtml(state.me.publicAlias || 'Alias libre') + '</span>'
            + '<span class="chip">' + escapeHtml(state.me.visibility || 'friends') + '</span>'
            + '<span class="chip">' + escapeHtml(getSubscriptionLabel()) + '</span>'
            + '</div>'
            + '</div>'
            + '<div class="summary-grid">'
            + summaryCardHtml('Alias visible', state.me.publicAlias || getPreferredPlayerName(), 'Nom montré dans les écrans sociaux')
            + summaryCardHtml('Couleur profil', state.me.profileColor || '#c9758a', 'Repère visuel dans l’application')
            + summaryCardHtml('Visibilité', state.me.visibility || 'friends', 'Qui peut voir ton profil')
            + summaryCardHtml('Abonnement', getSubscriptionLabel(), 'État du compte actuel')
            + '</div>'
            + '</div>';
        }

        if (!state.myAvatar) {
          refs.profileAvatarSummary.innerHTML = '<div class="muted">Ton avatar n’est pas encore initialisé.</div>';
          return;
        }

        var equipmentSummary = Array.isArray(state.myAvatar.inventorySummary)
          ? state.myAvatar.inventorySummary
          : [];
        var equipmentLabels = ['outfit', 'pose', 'object', 'background']
          .map(function (type) {
            return state.myAvatar.equipment && state.myAvatar.equipment[type] && state.myAvatar.equipment[type].name
              ? state.myAvatar.equipment[type].name
              : '';
          })
          .filter(Boolean);

        refs.profileAvatarSummary.innerHTML =
          '<div class="summary-stack">'
          + '<div class="summary-head">'
          + '<div class="summary-title">' + escapeHtml(state.myAvatar.currentStage.name) + '</div>'
          + '<div class="summary-text">' + escapeHtml(
            state.myAvatar.nextStage
              ? ('Prochaine étape: ' + state.myAvatar.nextStage.name + '. Continue à jouer pour progresser.')
              : 'Tu es à un stade avancé du parcours avatar.'
          ) + '</div>'
          + '<div class="summary-inline-chips">'
          + '<span class="chip">' + escapeHtml(state.myAvatar.specialty ? state.myAvatar.specialty.name : 'Spécialité non choisie') + '</span>'
          + '<span class="chip">' + escapeHtml(String(state.myAvatar.xpPoints)) + ' XP</span>'
          + '</div>'
          + '</div>'
          + '<div class="summary-grid">'
          + summaryCardHtml('Stade actuel', state.myAvatar.currentStage.name, 'Progression médecine en cours')
          + summaryCardHtml('Prochain stade', state.myAvatar.nextStage ? state.myAvatar.nextStage.name : 'Dernier stade connu', 'Vision long terme')
          + summaryCardHtml('XP avatar', String(state.myAvatar.xpPoints), 'Points gagnés via tes sessions')
          + summaryCardHtml('Équipement actif', equipmentLabels.length ? equipmentLabels.join(' · ') : 'Aucun objet équipé', 'Tenue, pose, objet, décor')
          + summaryCardHtml('Inventaire', equipmentSummary.length ? equipmentSummary.map(function (item) { return item.type + ': ' + item.totalUnlocked; }).join(' · ') : 'Inventaire vide', 'Objets débloqués par catégorie')
          + '</div>'
          + '</div>';
      }

      function renderSettingsSummary() {
        if (!state.token) {
          refs.settingsSummary.innerHTML = '<div class="muted">Connecte-toi pour afficher les paramètres du compte.</div>';
          return;
        }

        if (!state.me) {
          refs.settingsSummary.innerHTML = '<div class="muted">Chargement des paramètres…</div>';
          return;
        }

        var theme = getThemeDefinition(state.visualTheme);
        var equipmentTypes = ['outfit', 'pose', 'object', 'background'];
        var equippedCount = equipmentTypes.filter(function (type) {
          return !!getAvatarEquippedItem(type);
        }).length;
        var themeButtons = Object.keys(themeDefinitions).map(function (themeKey) {
          var config = themeDefinitions[themeKey];
          var classes = 'theme-chip' + (themeKey === state.visualTheme ? ' is-active' : '');
          var activeLabel = themeKey === state.visualTheme ? '<span class="chip">Actif</span>' : '<span class="chip neutral">Choisir</span>';
          var previewStyle = 'background:linear-gradient(135deg,' + escapeHtml(config.previewBgA) + ',' + escapeHtml(config.previewBgB) + ')';
          var signStyle = 'background:linear-gradient(180deg,' + escapeHtml(config.previewSignA) + ',' + escapeHtml(config.previewSignB) + ')';
          var questionStyle = 'background:linear-gradient(180deg,' + escapeHtml(config.previewQuestionA) + ',' + escapeHtml(config.previewQuestionB) + ')';
          var idleChoiceStyle = 'background:linear-gradient(180deg,' + escapeHtml(config.previewChoiceA) + ',' + escapeHtml(config.previewChoiceB) + ')';
          var activeChoiceStyle = 'background:linear-gradient(180deg,' + escapeHtml(config.previewChoiceActiveA) + ',' + escapeHtml(config.previewChoiceActiveB) + ')';
          return '<button type="button" class="' + classes + '" data-theme-choice="' + escapeHtml(themeKey) + '">'
            + '<div class="theme-preview" style="' + previewStyle + '">'
            + '<span class="theme-preview-sign" style="' + signStyle + '"></span>'
            + '<span class="theme-preview-question" style="' + questionStyle + '"></span>'
            + '<div class="theme-preview-answer-row">'
            + '<span class="theme-preview-answer" style="' + idleChoiceStyle + '"></span>'
            + '<span class="theme-preview-answer" style="' + activeChoiceStyle + '"></span>'
            + '</div>'
            + '</div>'
            + '<div class="theme-chip-head">'
            + '<div class="theme-chip-title"><b>' + escapeHtml(config.label) + '</b><span>' + escapeHtml(config.note) + '</span></div>'
            + activeLabel
            + '</div>'
            + '<div class="theme-swatch-row">'
            + config.swatches.map(function (swatch) {
              return '<span class="theme-swatch" style="background:' + escapeHtml(swatch) + '"></span>';
            }).join('')
            + '</div>'
            + '</button>';
        }).join('');

        var avatarControls = equipmentTypes.map(function (itemType) {
          var items = getAvatarInventoryForType(itemType);
          var equipped = getAvatarEquippedItem(itemType);
          var disabled = !items.length ? ' disabled' : '';
          var options = items.length
            ? items.map(function (item) {
                var selected = equipped && equipped.id === item.id ? ' selected' : '';
                return '<option value="' + escapeHtml(item.id) + '"' + selected + '>' + escapeHtml(item.name) + '</option>';
              }).join('')
            : '<option value="">Aucun objet disponible</option>';
          return '<div class="settings-option-card">'
            + '<div class="settings-option-head">'
            + '<b>' + escapeHtml(getAvatarItemTypeLabel(itemType)) + '</b>'
            + '<span>' + escapeHtml(equipped && equipped.name ? ('Actuel: ' + equipped.name) : 'Choisis parmi tes objets débloqués.') + '</span>'
            + '</div>'
            + '<select class="settings-select" data-avatar-item-type="' + escapeHtml(itemType) + '"' + disabled + '>'
            + options
            + '</select>'
            + '</div>';
        }).join('');

        var specialtyOptions = Array.isArray(state.avatarSpecialties) && state.avatarSpecialties.length
          ? state.avatarSpecialties.map(function (specialty) {
              var selected = state.myAvatar && state.myAvatar.specialty && state.myAvatar.specialty.id === specialty.id ? ' selected' : '';
              return '<option value="' + escapeHtml(specialty.id) + '"' + selected + '>' + escapeHtml(specialty.name) + '</option>';
            }).join('')
          : '<option value="">Aucune spécialité chargée</option>';
        var specialtyDisabled = !canSetAvatarSpecialty() || !state.avatarSpecialties.length ? ' disabled' : '';
        var paletteCards = [
          themeColorCardHtml('Ciel haut', 'pageBaseA', state.themeOverrides.pageBaseA || theme.pageBaseA, 'La partie lumineuse du fond'),
          themeColorCardHtml('Ciel bas', 'pageBaseC', state.themeOverrides.pageBaseC || theme.pageBaseC, 'La base du décor derrière l’app'),
          themeColorCardHtml('Bleu principal', 'brand', state.themeOverrides.brand || theme.brand, 'Les accents, contours et marqueurs'),
          themeColorCardHtml('Carte question', 'questionA', state.themeOverrides.questionA || theme.questionA, 'La plaque centrale qui porte la question'),
          themeColorCardHtml('Bonne réponse', 'choiceActiveA', state.themeOverrides.choiceActiveA || theme.choiceActiveA, 'La couleur quand une réponse est choisie')
        ].join('');

        refs.settingsSummary.innerHTML =
          '<div class="settings-stack">'
          + '<div class="settings-hero">'
          + '<div class="settings-hero-top">'
          + '<div class="settings-hero-title">'
          + '<b>Réglages utiles, pas de bruit.</b>'
          + '<span>On garde ici seulement ce qui change vraiment ton ressenti: avatar, apparence et état joueur.</span>'
          + '</div>'
          + '<div class="settings-avatar-mark">' + escapeHtml((getPreferredPlayerName() || 'JM').slice(0, 2).toUpperCase()) + '</div>'
          + '</div>'
          + '<div class="summary-grid">'
          + summaryCardHtml('Avatar', state.myAvatar && state.myAvatar.currentStage ? state.myAvatar.currentStage.name : 'Non initialisé', 'Ta progression visible dans l’app')
          + summaryCardHtml('Spécialité', state.myAvatar && state.myAvatar.specialty ? state.myAvatar.specialty.name : 'Pas encore choisie', 'Débloquée plus tard dans le parcours')
          + summaryCardHtml('Style actif', String(equippedCount) + '/4', 'Tenue, pose, objet et décor équipés')
          + summaryCardHtml('Univers actif', theme.label, 'Ambiance visuelle actuellement appliquée')
          + summaryCardHtml('Notifications', String(getUnreadNotificationsCount()), 'Notifications non lues actuellement')
          + summaryCardHtml('Duels actifs', String(getActiveDuelsCount()), 'Invitations + duels en cours')
          + summaryCardHtml('Abonnement', getSubscriptionLabel(), 'État premium ou free')
          + '</div>'
          + '</div>'
          + '<div class="section">'
          + '<div class="section-head">'
          + '<h3>Choisis ton univers</h3>'
          + '<span class="section-note">Chaque thème change le fond, les cartes, les boutons et le rythme visuel de l’app.</span>'
          + '</div>'
          + '<div class="theme-picker">' + themeButtons + '</div>'
          + '</div>'
          + '<div class="section">'
          + '<div class="section-head">'
          + '<h3>Palette perso</h3>'
          + '<span class="section-note">Tu peux garder un thème puis retoucher ses couleurs clés à ta main.</span>'
          + '</div>'
          + '<div class="settings-card-grid">' + paletteCards + '</div>'
          + '<div class="training-setup-actions" style="margin-top:10px">'
          + '<button class="btn-secondary btn-inline" type="button" data-theme-palette-reset="true">Réinitialiser la palette</button>'
          + '</div>'
          + '</div>'
          + '<div class="section">'
          + '<div class="section-head">'
          + '<h3>Personnalisation avatar</h3>'
          + '<span class="section-note">Ajuste ton apparence avec les objets déjà débloqués.</span>'
          + '</div>'
          + '<div class="settings-card-grid">' + avatarControls + '</div>'
          + '<div class="settings-option-card" style="margin-top:10px">'
          + '<div class="settings-option-head">'
          + '<b>Spécialité</b>'
          + '<span>' + escapeHtml(canSetAvatarSpecialty() ? 'Disponible à partir du stage Interne.' : 'Cette option se débloque plus tard dans le parcours avatar.') + '</span>'
          + '</div>'
          + '<select class="settings-select" data-avatar-specialty="true"' + specialtyDisabled + '>'
          + specialtyOptions
          + '</select>'
          + '</div>'
          + '</div>'
          + '<div class="section">'
          + '<div class="section-head">'
          + '<h3>Compte</h3>'
          + '<span class="section-note">La déconnexion reste ici, là où on s’attend à la trouver.</span>'
          + '</div>'
          + '<div class="training-setup-actions">'
          + '<button class="btn-danger" type="button" data-settings-logout="true">Se déconnecter</button>'
          + '</div>'
          + '</div>';
      }

      function renderUserBadge() {
        if (!state.me) {
          refs.userBadge.textContent = 'Non connecté';
          return;
        }
        var name = getPreferredPlayerName();
        var stage = state.myAvatar && state.myAvatar.currentStage ? state.myAvatar.currentStage.name : null;
        refs.userBadge.textContent = stage ? (name + ' · ' + stage + ' · connecté') : (name + ' · connecté');
      }

      async function loadMe() {
        state.me = await api('/me');
        renderUserBadge();
        renderDashboardCards();
        renderProfileSummary();
        renderSettingsSummary();
      }

      async function loadMyAvatar() {
        try {
          state.myAvatar = await api('/me/avatar');
        } catch (err) {
          state.myAvatar = null;
        }
        renderUserBadge();
        renderDashboardCards();
        renderProfileSummary();
        renderSettingsSummary();
      }

      async function loadAvatarSettingsData() {
        if (!state.token) {
          state.avatarSpecialties = [];
          state.avatarInventoryByType = { outfit: [], pose: [], object: [], background: [] };
          renderSettingsSummary();
          return;
        }

        var itemTypes = ['outfit', 'pose', 'object', 'background'];
        try {
          var results = await Promise.allSettled(
            itemTypes.map(function (itemType) {
              return api('/me/avatar/inventory?itemType=' + encodeURIComponent(itemType));
            }).concat([api('/avatar/specialties')])
          );

          state.avatarInventoryByType = { outfit: [], pose: [], object: [], background: [] };
          itemTypes.forEach(function (itemType, index) {
            var result = results[index];
            state.avatarInventoryByType[itemType] =
              result && result.status === 'fulfilled' && result.value && Array.isArray(result.value.items)
                ? result.value.items
                : [];
          });

          var specialtiesResult = results[results.length - 1];
          state.avatarSpecialties =
            specialtiesResult && specialtiesResult.status === 'fulfilled' && specialtiesResult.value && Array.isArray(specialtiesResult.value.items)
              ? specialtiesResult.value.items
              : [];
        } catch (err) {
          state.avatarSpecialties = [];
          state.avatarInventoryByType = { outfit: [], pose: [], object: [], background: [] };
        }
        renderSettingsSummary();
      }

      async function ensureDemoCatalogReady() {
        if (!state.token) {
          return;
        }
        await api('/demo/bootstrap-data', { method: 'POST', body: {} });
      }

      async function loadDashboard() {
        state.dashboard = await api('/trainings/dashboard');
        renderStats();
        renderFocus();
        renderSetupGuide();
        renderDashboardCards();
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
          statHtml('Tentatives', String(o.attemptsCount), 'Total cumulé'),
          statHtml('Taux réussite', (o.successRatePct == null ? '-' : o.successRatePct + '%'), 'Tous quiz confondus'),
          statHtml('Sessions 7j', String(o.sessions7dCount), 'Rythme récent'),
          statHtml('Couverture chapitres', String(o.chapterCoveragePct) + '%', 'Matière déjà vue')
        ].join('');
      }

      function statHtml(label, value, note) {
        return '<div class="stat"><div class="k">' + escapeHtml(label) + '</div><div class="v">' + escapeHtml(value) + '</div>'
          + (note ? ('<div class="subject-meta">' + escapeHtml(note) + '</div>') : '')
          + '</div>';
      }

      function getChoiceMarker(index) {
        return String.fromCharCode(65 + (index % 26));
      }

      function getModeLabel(mode) {
        var labels = {
          learning: 'Apprentissage',
          discovery: 'Découverte',
          review: 'Révision',
          par_coeur: 'Par coeur',
          rattrapage: 'À revoir'
        };
        return labels[mode] || mode;
      }

      function getDuelModeLabel(mode) {
        var labels = {
          friend_invite: 'Ami',
          random_free: 'Aléatoire',
          random_level: 'Niveau proche'
        };
        return labels[mode] || mode;
      }

      function getDuelStatusLabel(status) {
        var labels = {
          pending_opener: 'Opener',
          in_progress: 'En cours',
          completed: 'Terminé',
          cancelled: 'Annulé',
          expired: 'Expiré'
        };
        return labels[status] || status;
      }

      function getDuelRoundStatusLabel(status) {
        var labels = {
          awaiting_choice: 'Choix matière',
          player1_turn: 'Tour joueur 1',
          player2_turn: 'Tour joueur 2',
          completed: 'Terminée',
          scored_zero: 'Zéro automatique'
        };
        return labels[status] || status;
      }

      function getSafeProfileColor(value) {
        var raw = String(value || '').trim();
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
          return raw;
        }
        return '#c9758a';
      }

      function getInitials(value) {
        var text = String(value || '').trim();
        if (!text) {
          return 'MQ';
        }
        var words = text.split(/\s+/).filter(Boolean);
        if (words.length === 1) {
          return words[0].slice(0, 2).toUpperCase();
        }
        return (words[0].slice(0, 1) + words[1].slice(0, 1)).toUpperCase();
      }

      function capitalizeDisplayLabel(value) {
        var text = String(value || '').trim();
        if (!text) {
          return '';
        }
        return text.charAt(0).toUpperCase() + text.slice(1);
      }

      function getDuelOpponentTitle(duel) {
        if (duel.matchmakingMode === 'friend_invite') {
          return duel.acceptedAt ? 'Adversaire invité' : 'Invitation en attente';
        }
        if (duel.matchmakingMode === 'random_level') {
          return 'Rival niveau proche';
        }
        return 'Rival aléatoire';
      }

      function getDuelPlayerDisplayNameById(duel, userId) {
        if (!duel || !userId) {
          return '';
        }
        if (duel.player1Id === userId) {
          return capitalizeDisplayLabel(
            duel.player1Profile && duel.player1Profile.displayLabel
              ? duel.player1Profile.displayLabel
              : getPreferredPlayerName()
          );
        }
        if (duel.player2Id === userId) {
          return capitalizeDisplayLabel(
            duel.player2Profile && duel.player2Profile.displayLabel
              ? duel.player2Profile.displayLabel
              : getDuelOpponentTitle(duel)
          );
        }
        return '';
      }

      function getDuelOpponentUserId(duel, meId) {
        if (!duel || !meId) {
          return '';
        }
        if (duel.player1Id === meId) {
          return duel.player2Id || '';
        }
        if (duel.player2Id === meId) {
          return duel.player1Id || '';
        }
        return '';
      }

      function getAvatarLoadoutLabels() {
        if (!state.myAvatar || !state.myAvatar.equipment) {
          return [];
        }
        var equipment = state.myAvatar.equipment;
        return ['outfit', 'pose', 'object', 'background']
          .map(function (type) {
            return equipment[type] && equipment[type].name ? equipment[type].name : '';
          })
          .filter(Boolean)
          .slice(0, 3);
      }

      function getDuelProfile(slotKey, duel) {
        if (!duel) {
          return null;
        }
        return slotKey === 'player1' ? (duel.player1Profile || null) : (duel.player2Profile || null);
      }

      function getDuelProfileStageName(profile) {
        return profile && profile.avatar && profile.avatar.currentStage && profile.avatar.currentStage.name
          ? profile.avatar.currentStage.name
          : '';
      }

      function getDuelProfileSpecialtyName(profile) {
        return profile && profile.avatar && profile.avatar.specialty && profile.avatar.specialty.name
          ? profile.avatar.specialty.name
          : '';
      }

      function getDuelProfileEquipmentSummary(profile) {
        return profile && profile.avatar && Array.isArray(profile.avatar.equipmentSummary)
          ? profile.avatar.equipmentSummary.slice(0, 3)
          : [];
      }

      function compactUpperLabel(value, maxLength) {
        var text = String(value || '').trim();
        if (!text) {
          return '';
        }
        var normalized = text.replace(/\s+/g, ' ').toUpperCase();
        if (normalized.length <= maxLength) {
          return normalized;
        }
        var words = normalized.split(' ').filter(Boolean);
        if (words.length > 1) {
          var shortWords = words.slice(0, 2).map(function (word) {
            return word.slice(0, Math.min(4, word.length));
          }).join(' ');
          if (shortWords.length <= maxLength) {
            return shortWords;
          }
          return words.slice(0, 3).map(function (word) {
            return word.slice(0, 1);
          }).join('');
        }
        return normalized.slice(0, maxLength);
      }

      function getStageToken(profile, fallbackAvatar) {
        var code = profile && profile.avatar && profile.avatar.currentStage && profile.avatar.currentStage.code
          ? profile.avatar.currentStage.code
          : (fallbackAvatar && fallbackAvatar.currentStage && fallbackAvatar.currentStage.code ? fallbackAvatar.currentStage.code : '');
        var name = getDuelProfileStageName(profile) || (fallbackAvatar && fallbackAvatar.currentStage ? fallbackAvatar.currentStage.name : '');
        if (code) {
          return String(code).replace(/_/g, '/').toUpperCase();
        }
        return compactUpperLabel(name || 'MedQuiz', 12);
      }

      function getSpecialtyToken(profile, fallbackAvatar) {
        var name = getDuelProfileSpecialtyName(profile) || (fallbackAvatar && fallbackAvatar.specialty ? fallbackAvatar.specialty.name : '');
        if (!name) {
          return 'PARCOURS';
        }
        return compactUpperLabel(name, 12);
      }

      function getLoadoutTokens(items) {
        return (items || [])
          .filter(Boolean)
          .slice(0, 3)
          .map(function (item) {
            return compactUpperLabel(item, 10);
          })
          .filter(Boolean);
      }

      function renderDuelPlayerCard(config) {
        var orbitHtml = (config.sceneTokens || []).map(function (label, index) {
          return '<div class="duel-player-orbit pos-' + escapeHtml(String(index)) + '">' + escapeHtml(label) + '</div>';
        }).join('');
        var tagsHtml = (config.tags || []).length
          ? '<div class="duel-player-tags">' + config.tags.map(function (tag) {
            var toneClass = tag.tone === 'warn' ? ' warn' : (tag.tone === 'neutral' ? ' neutral' : '');
            return '<span class="chip' + toneClass + '">' + escapeHtml(tag.label) + '</span>';
          }).join('') + '</div>'
          : '';
        var factsHtml = (config.facts || []).map(function (fact) {
          return '<div class="duel-player-fact"><span>' + escapeHtml(fact.label) + '</span><b>' + escapeHtml(fact.value) + '</b></div>';
        }).join('');
        return '<div class="duel-player-card ' + escapeHtml(config.variant) + '" style="--player-accent:' + escapeHtml(config.accent) + ';">'
          + '<div class="duel-player-head">'
          + '<div class="duel-player-main">'
          + '<div class="duel-player-avatar">' + escapeHtml(config.initials) + '</div>'
          + '<div class="duel-player-identity">'
          + '<div class="duel-player-role">' + escapeHtml(config.role) + '</div>'
          + '<div class="duel-player-name">' + escapeHtml(config.name) + '</div>'
          + '<div class="duel-player-subtitle">' + escapeHtml(config.subtitle) + '</div>'
          + '</div>'
          + '</div>'
          + '<div class="duel-player-score"><b>' + escapeHtml(String(config.score)) + '</b><span>points</span></div>'
          + '</div>'
          + '<div class="duel-player-scene">'
          + '<div class="duel-player-scene-top">'
          + '<span class="duel-player-stage-badge">' + escapeHtml(config.stageToken) + '</span>'
          + '<span class="duel-player-specialty-badge">' + escapeHtml(config.specialtyToken) + '</span>'
          + '</div>'
          + '<div class="duel-player-scene-body">'
          + '<div class="duel-player-portrait-shell">'
          + '<div class="duel-player-avatar large">' + escapeHtml(config.initials) + '</div>'
          + orbitHtml
          + '</div>'
          + '</div>'
          + '<div class="duel-player-scene-copy"><b>' + escapeHtml(config.sceneTitle) + '</b><span>' + escapeHtml(config.sceneCaption) + '</span></div>'
          + '</div>'
          + tagsHtml
          + '<div class="duel-player-facts">' + factsHtml + '</div>'
          + '</div>';
      }

      function getDuelGuideState(duel, meId) {
        var isMyTurn = Boolean(meId && duel.currentTurnUserId === meId);

        if (duel.status === 'completed' || duel.status === 'cancelled' || duel.status === 'expired') {
          return {
            stageKey: 'finish',
            title: 'Duel clôturé',
            detail: duel.winnerUserId
              ? 'Le résultat est figé. Tu peux relire les manches et le score final.'
              : 'Le duel est terminé.'
          };
        }

        if (duel.matchmakingMode === 'friend_invite' && !duel.acceptedAt) {
          if (duel.player2Id === meId) {
            return {
              stageKey: 'invite',
              title: 'Invitation reçue',
              detail: 'Accepte ou refuse avant de lancer la première manche.'
            };
          }
          return {
            stageKey: 'invite',
            title: 'Invitation envoyée',
            detail: 'En attente de la réponse adverse.'
          };
        }

        if (!state.currentRound) {
          return {
            stageKey: 'round',
            title: isMyTurn ? 'Charger la manche' : 'Attendre la manche',
            detail: isMyTurn
              ? 'Charge la manche courante pour voir l\'action attendue.'
              : 'Le duel est en cours, mais l\'initiative est adverse pour l\'instant.'
          };
        }

        if (!state.currentRound.chosenSubjectId) {
          return {
            stageKey: 'round',
            title: isMyTurn ? 'Choisir la matière' : 'Choix matière en attente',
            detail: isMyTurn
              ? 'Sélectionne une des 3 matières proposées pour lancer la manche.'
              : 'L\'adversaire doit d\'abord choisir la matière de cette manche.'
          };
        }

        if (isMyTurn && !state.roundQuestions.length) {
          return {
            stageKey: 'round',
            title: 'Charger tes 3 questions',
            detail: 'La matière est fixée: charge maintenant les slots de la manche.'
          };
        }

        if (isMyTurn) {
          return {
            stageKey: 'round',
            title: 'Jouer tes 3 slots',
            detail: 'Réponds à tes questions pour terminer ton tour.'
          };
        }

        return {
          stageKey: 'round',
          title: 'Tour adverse en cours',
          detail: 'Tu reprendras la main quand le tour adverse sera terminé ou expiré.'
        };
      }

      function getDuelGuideActions(context) {
        var primary = [];
        var secondary = [];
        var hint = '';

        if (context.canAccept) {
          primary.push('<button class="btn-primary" data-duel-action="accept">Accepter le duel</button>');
          if (context.canDecline) {
            secondary.push('<button class="btn-secondary" data-duel-action="decline">Refuser</button>');
          }
          return { primary: primary, secondary: secondary, hint: 'Commence par répondre à l\'invitation.' };
        }

        if (!context.currentRound) {
          if (context.isMyTurn) {
            primary.push('<button class="btn-primary" data-duel-action="load-round">Voir ma manche</button>');
            return { primary: primary, secondary: secondary, hint: 'Charge la manche pour voir l\'action demandée.' };
          }
          return { primary: primary, secondary: secondary, hint: 'Pour l\'instant, tu attends l\'action adverse.' };
        }

        if (!context.currentRound.chosenSubjectId) {
          return {
            primary: primary,
            secondary: secondary,
            hint: context.isMyTurn
              ? 'Choisis une matière dans la section manche juste en dessous.'
              : 'L\'adversaire doit choisir la matière avant de continuer.'
          };
        }

        if (context.isMyTurn && !context.roundQuestions.length) {
          primary.push('<button class="btn-primary" data-duel-action="load-round-questions">Préparer mon tour</button>');
          return { primary: primary, secondary: secondary, hint: 'La matière est choisie: ouvre maintenant ton tour de jeu.' };
        }

        if (context.isMyTurn && context.roundQuestions.length) {
          primary.push('<button class="btn-primary" data-duel-action="open-round-play">Continuer mon tour</button>');
          return { primary: primary, secondary: secondary, hint: 'Tes questions sont prêtes: ouvre le tour pour les jouer une à une.' };
        }

        return {
          primary: primary,
          secondary: secondary,
          hint: 'Le duel continue, mais aucune action immédiate n\'est attendue de ta part.'
        };
      }

      function getNotificationTypeLabel(type) {
        var labels = {
          duel_turn: 'À toi de jouer',
          duel_joker_request: 'Demande de sursis',
          duel_joker_granted: 'Sursis accordé',
          duel_finished: 'Duel terminé',
          review_reminder: 'Rappel de révision'
        };
        return labels[type] || type;
      }

      function getNotificationStatusLabel(status) {
        var labels = {
          pending: 'En attente',
          sent: 'Nouvelle',
          failed: 'Échec',
          read: 'Lue'
        };
        return labels[status] || status;
      }

      function formatDateTime(value) {
        if (!value) {
          return '-';
        }
        var date = new Date(value);
        if (!Number.isFinite(date.getTime())) {
          return String(value);
        }
        return new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      }

      function formatRemainingTime(value) {
        if (!value) {
          return '-';
        }
        var date = new Date(value);
        var diffMs = date.getTime() - Date.now();
        if (!Number.isFinite(diffMs)) {
          return '-';
        }
        if (diffMs <= 0) {
          return 'Expiré';
        }
        var totalMinutes = Math.ceil(diffMs / 60000);
        var days = Math.floor(totalMinutes / (24 * 60));
        var hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        var minutes = totalMinutes % 60;

        if (days > 0) {
          return days + ' j ' + hours + ' h';
        }
        if (hours > 0) {
          return hours + ' h ' + minutes + ' min';
        }
        return minutes + ' min';
      }

      function getNotificationSummary(item) {
        var payload = item && item.payload && typeof item.payload === 'object' ? item.payload : {};
        var duelShort = payload.duelId ? 'Duel ' + String(payload.duelId).slice(0, 8) : 'Le duel';
        var reason = typeof payload.reason === 'string' ? payload.reason : '';
        var roundNo = payload.roundNo ? 'Manche ' + String(payload.roundNo) + '. ' : '';

        if (item.type === 'duel_turn') {
          if (reason === 'duel_created_random') {
            return duelShort + ' créé en matchmaking aléatoire. Tu peux lancer l\'opener.';
          }
          if (reason === 'duel_accepted') {
            return duelShort + ' accepté. Le duel peut commencer.';
          }
          if (reason === 'opener_decision_made') {
            return duelShort + ' prêt. À toi de choisir la matière de la première manche.';
          }
          if (reason === 'timeout_subject_choice') {
            return duelShort + '. L\'adversaire a dépassé le délai de choix, la main revient vers toi.';
          }
          if (reason === 'turn_ready') {
            return duelShort + '. ' + roundNo + 'Ton adversaire a terminé, c\'est ton tour.';
          }
          if (reason === 'new_round') {
            return duelShort + '. Nouvelle manche disponible, à toi de lancer la suite.';
          }
          return duelShort + '. C\'est ton tour.';
        }

        if (item.type === 'duel_joker_request') {
          var jokerReason = reason ? (' Motif: ' + reason + '.') : '';
          return duelShort + '. Ton adversaire demande un sursis de 24h.' + jokerReason;
        }

        if (item.type === 'duel_joker_granted') {
          var deadline = payload.newDeadlineAt ? (' Nouvelle deadline: ' + formatDateTime(String(payload.newDeadlineAt)) + '.') : '';
          return duelShort + '. Ton sursis a été accordé.' + deadline;
        }

        if (item.type === 'duel_finished') {
          if (reason === 'declined') {
            return duelShort + ' a été refusé.';
          }
          if (reason === 'forfeit') {
            return duelShort + ' est terminé sur abandon.';
          }
          return duelShort + ' est terminé.';
        }

        if (item.type === 'review_reminder') {
          return 'Petit rappel: une session courte peut t\'aider à garder le rythme.';
        }

        return 'Nouvelle notification disponible.';
      }

      function isSessionSetupDurationValid() {
        var stopRule = refs.stopRuleSelect.value;
        if (stopRule !== 'fixed_custom') {
          return true;
        }
        var n = Number(refs.targetCountInput.value || '0');
        return Number.isFinite(n) && n >= 1 && n <= 200;
      }

      function getSessionScopeLabel() {
        var subjectCount = Object.keys(state.selectedSubjects).length;
        var chapterCount = Object.keys(state.selectedChapters).length;
        if (chapterCount > 0) {
          return chapterCount + ' chapitres ciblés';
        }
        if (subjectCount > 0) {
          return subjectCount + ' matières ciblées';
        }
        return 'Toutes les matières actives';
      }

      function setupStepHtml(index, label, done, detail) {
        var klass = done ? 'setup-step done' : 'setup-step todo';
        var marker = done ? 'Prêt' : 'À régler';
        return '<div class="' + klass + '">'
          + '<div class="setup-step-top">'
          + '<div class="setup-step-index">' + escapeHtml(String(index)) + '</div>'
          + '<div class="setup-step-status">' + escapeHtml(marker) + '</div>'
          + '</div>'
          + '<div class="setup-step-copy">'
          + '<div class="setup-step-label">' + escapeHtml(label) + '</div>'
          + '<div class="setup-step-detail">' + escapeHtml(detail) + '</div>'
          + '</div>'
          + '</div>';
      }

      function renderSetupGuide() {
        var connected = !!state.token;
        var mode = refs.modeSelect.value;
        var stopRule = refs.stopRuleSelect.value;
        var durationValid = isSessionSetupDurationValid();
        var modeReady = !!mode;
        var scopeLabel = getSessionScopeLabel();
        var scopeReady = true;
        var durationText = stopRule === 'fixed_custom'
          ? (durationValid ? (String(refs.targetCountInput.value) + ' questions') : 'Nombre invalide (1..200)')
          : (stopRule === 'fixed_10' ? '10 questions' : 'Session libre');

        refs.setupChecklist.innerHTML = [
          setupStepHtml(1, 'Type', modeReady, getModeLabel(mode)),
          setupStepHtml(2, 'Matières', scopeReady, scopeLabel),
          setupStepHtml(3, 'Questions', durationValid, durationText),
          setupStepHtml(4, 'Session prête', connected && durationValid, connected ? (durationValid ? 'Prête à lancer' : 'Vérifie le nombre de questions') : 'Connecte-toi pour activer le lancement')
        ].join('');

        if (!connected) {
          refs.setupStateChip.className = 'chip warn';
          refs.setupStateChip.textContent = 'Connexion requise';
        } else if (!durationValid) {
          refs.setupStateChip.className = 'chip warn';
          refs.setupStateChip.textContent = 'Paramètres invalides';
        } else {
          refs.setupStateChip.className = 'chip';
          refs.setupStateChip.textContent = 'Prêt';
        }

        refs.createSessionBtn.disabled = !connected;
        if (refs.trainingSetupNextBtn) {
          refs.trainingSetupNextBtn.disabled = !connected || !durationValid;
        }
        refs.presetDiscoveryBtn.disabled = !connected;
        refs.presetReviewBtn.disabled = !connected;

        var suggestedMode = state.dashboard && state.dashboard.overview
          ? state.dashboard.overview.suggestedMode
          : '';
        refs.presetRecommendedBtn.disabled = !connected || !suggestedMode;
        renderSelectedTrainingModeBanner();
        renderTrainingScopeSummary();
        renderTrainingModeCards();
      }

      function renderSelectedTrainingModeBanner() {
        if (!refs.selectedTrainingModeBanner) {
          return;
        }
        refs.selectedTrainingModeBanner.innerHTML =
          '<div><b>' + escapeHtml(getModeLabel(refs.modeSelect.value || 'learning')) + '</b><span>Type choisi</span></div>'
          + '<span class="chip">' + escapeHtml(getSessionScopeLabel()) + '</span>';
      }

      function renderTrainingScopeSummary() {
        if (!refs.trainingScopeSummary) {
          return;
        }
        refs.trainingScopeSummary.innerHTML =
          'Type choisi: <b>' + escapeHtml(getModeLabel(refs.modeSelect.value || 'learning'))
          + '</b> · Si tu ne sélectionnes rien ci-dessous, la session partira sur toutes les matières actives.';
      }

      function renderTrainingModeCards() {
        if (!refs.trainingModeCards) {
          return;
        }

        var currentMode = refs.modeSelect.value || 'learning';
        var cards = [
          {
            mode: 'learning',
            title: 'Apprentissage',
            copy: 'Le mode de base pour travailler calmement sans te disperser.'
          },
          {
            mode: 'discovery',
            title: 'Découverte',
            copy: 'Voir des questions jamais vues et tester le terrain.'
          },
          {
            mode: 'review',
            title: 'Révision',
            copy: 'Repasser sur les questions déjà rencontrées.'
          },
          {
            mode: 'par_coeur',
            title: 'Par coeur',
            copy: 'Revenir sur les questions déjà réussies pour les ancrer.'
          },
          {
            mode: 'rattrapage',
            title: 'À revoir',
            copy: 'Cibler les points à retravailler en priorité.'
          }
        ];

        refs.trainingModeCards.innerHTML = cards.map(function (card) {
          var selected = currentMode === card.mode;
          return '<button class="training-mode-card' + (selected ? ' is-selected' : '') + '" data-training-mode="' + escapeHtml(card.mode) + '">'
            + '<div class="training-mode-top">'
            + '<div class="training-mode-title">' + escapeHtml(card.title) + '</div>'
            + '<span class="chip' + (selected ? '' : ' neutral') + '">' + (selected ? 'Choisi' : 'Ouvrir') + '</span>'
            + '</div>'
            + '<div class="training-mode-copy">' + escapeHtml(card.copy) + '</div>'
            + '</button>';
        }).join('');
      }

      async function selectTrainingMode(mode) {
        if (mode === 'discovery') {
          await applyPresetDiscovery({ silent: true });
        } else if (mode === 'review') {
          await applyPresetReviewFree({ silent: true });
        } else if (mode === 'rattrapage') {
          await applyPresetCatchup({ silent: true });
        } else {
          refs.modeSelect.value = mode || 'learning';
          refs.stopRuleSelect.value = 'fixed_10';
          refs.targetCountInput.value = '10';
          refs.targetCountInput.disabled = true;
          clearSessionFilters();
          renderSessionGoal();
          renderSetupGuide();
        }

        setTrainingFlow('scope');
        setStatus('Type d’entraînement choisi: ' + getModeLabel(refs.modeSelect.value) + '.', 'info');
      }

      function goToTrainingSetup() {
        if (!state.token) {
          throw new Error('Connecte-toi pour continuer.');
        }
        setTrainingFlow('setup');
      }

      function clearSessionFilters() {
        state.selectedSubjects = {};
        state.selectedChapters = {};
        renderSubjects();
        renderChapters();
      }

      async function applySessionSetupConfig(config) {
        if (!config) {
          return;
        }

        refs.modeSelect.value = config.mode || 'learning';
        refs.stopRuleSelect.value = config.stopRule || 'fixed_10';

        if (refs.stopRuleSelect.value === 'fixed_custom') {
          var t = Number(config.targetQuestionCount || 10);
          var safeTarget = Math.max(1, Math.min(200, Number.isFinite(t) ? t : 10));
          refs.targetCountInput.value = String(safeTarget);
          refs.targetCountInput.disabled = false;
        } else {
          refs.targetCountInput.disabled = true;
          if (refs.stopRuleSelect.value === 'fixed_10') {
            refs.targetCountInput.value = '10';
          }
        }

        state.selectedSubjects = {};
        state.selectedChapters = {};
        var subjectIds = Array.isArray(config.subjectIds) ? config.subjectIds : [];
        var chapterIds = Array.isArray(config.chapterIds) ? config.chapterIds : [];

        subjectIds.forEach(function (id) {
          state.selectedSubjects[id] = true;
        });
        renderSubjects();
        if (subjectIds.length) {
          await Promise.all(subjectIds.map(function (id) { return loadChapters(id); }));
        }
        chapterIds.forEach(function (id) {
          state.selectedChapters[id] = true;
        });
        renderChapters();
        renderSessionGoal();
        renderSetupGuide();
      }

      async function selectTopReinforceSubjects(maxCount) {
        if (!state.dashboard || !Array.isArray(state.dashboard.subjects)) {
          clearSessionFilters();
          return 0;
        }
        var candidates = state.dashboard.subjects
          .filter(function (s) { return Number(s.questionsToReinforceCount || 0) > 0; })
          .sort(function (a, b) { return Number(b.questionsToReinforceCount || 0) - Number(a.questionsToReinforceCount || 0); })
          .slice(0, maxCount);

        if (!candidates.length) {
          clearSessionFilters();
          return 0;
        }

        state.selectedSubjects = {};
        state.selectedChapters = {};
        candidates.forEach(function (s) {
          state.selectedSubjects[s.id] = true;
        });
        renderSubjects();
        await Promise.all(candidates.map(function (s) { return loadChapters(s.id); }));
        renderChapters();
        return candidates.length;
      }

      function getSuggestedMode() {
        return (state.dashboard && state.dashboard.overview && state.dashboard.overview.suggestedMode) || '';
      }

      function getCompletionActions(successRate) {
        var items = [];
        var seen = {};
        function push(key, label) {
          if (seen[key]) {
            return;
          }
          seen[key] = true;
          items.push({ key: key, label: label });
        }

        if (state.lastSessionSetup) {
          push('same', 'Relancer la même session');
        }
        if (successRate < 60) {
          push('catchup', 'Rattrapage ciblé (10)');
        } else if (successRate < 85) {
          push('review10', 'Consolider (10)');
        } else {
          push('discovery', 'Passer en découverte (10)');
        }

        if (getSuggestedMode()) {
          push('suggested', 'Suivre le mode conseillé');
        }

        return items.slice(0, 3);
      }

      function getCompletionMood(successRate) {
        if (successRate >= 85) {
          return {
            badge: 'Très solide',
            note: 'Très belle session. Tu sembles à l’aise sur ce lot et tu peux viser plus haut dès la prochaine révision.',
            scoreNote: 'Niveau bien tenu sur cette session.'
          };
        }
        if (successRate >= 70) {
          return {
            badge: 'Bien joué',
            note: 'Bonne session. La base est là, et une courte relance peut te faire gagner en régularité.',
            scoreNote: 'Base solide avec quelques points à consolider.'
          };
        }
        if (successRate >= 50) {
          return {
            badge: 'En progression',
            note: 'Tu avances. Cette session a surtout permis de faire ressortir les notions à retravailler ensuite.',
            scoreNote: 'Une relance ciblée peut faire monter le score rapidement.'
          };
        }
        return {
          badge: 'Cap sur la suite',
          note: 'Même si c’était difficile, la session a été utile: on voit mieux où concentrer tes prochaines révisions.',
          scoreNote: 'On repart maintenant avec des priorités plus claires.'
        };
      }

      function getCompletionInsights() {
        var chapterResults = state.lastCompletedSession && Array.isArray(state.lastCompletedSession.chapterResults)
          ? state.lastCompletedSession.chapterResults.slice()
          : [];

        if (chapterResults.length) {
          var strengthsByChapter = chapterResults
            .filter(function (item) { return Number(item.attemptsCount || 0) > 0; })
            .sort(function (a, b) {
              var successA = a.successRatePct == null ? -1 : Number(a.successRatePct);
              var successB = b.successRatePct == null ? -1 : Number(b.successRatePct);
              if (successB !== successA) {
                return successB - successA;
              }
              return Number(b.attemptsCount || 0) - Number(a.attemptsCount || 0);
            })
            .slice(0, 3);

          var prioritiesByChapter = chapterResults
            .filter(function (item) { return Number(item.attemptsCount || 0) > 0; })
            .sort(function (a, b) {
              var successA = a.successRatePct == null ? 100 : Number(a.successRatePct);
              var successB = b.successRatePct == null ? 100 : Number(b.successRatePct);
              if (successA !== successB) {
                return successA - successB;
              }
              return Number(b.attemptsCount || 0) - Number(a.attemptsCount || 0);
            })
            .slice(0, 3);

          return {
            strengths: strengthsByChapter,
            priorities: prioritiesByChapter,
            byChapter: true
          };
        }

        var subjects = state.dashboard && Array.isArray(state.dashboard.subjects)
          ? state.dashboard.subjects.slice()
          : [];

        var strengths = subjects
          .filter(function (item) { return Number(item.attemptsCount || 0) > 0; })
          .sort(function (a, b) {
            var successA = a.successRatePct == null ? -1 : Number(a.successRatePct);
            var successB = b.successRatePct == null ? -1 : Number(b.successRatePct);
            if (successB !== successA) {
              return successB - successA;
            }
            var reinforceA = Number(a.questionsToReinforceCount || 0);
            var reinforceB = Number(b.questionsToReinforceCount || 0);
            if (reinforceA !== reinforceB) {
              return reinforceA - reinforceB;
            }
            return Number(b.attemptsCount || 0) - Number(a.attemptsCount || 0);
          })
          .slice(0, 3);

        var priorities = subjects
          .filter(function (item) {
            return Number(item.questionsToReinforceCount || 0) > 0 || Number(item.attemptsCount || 0) > 0;
          })
          .sort(function (a, b) {
            var reinforceA = Number(a.questionsToReinforceCount || 0);
            var reinforceB = Number(b.questionsToReinforceCount || 0);
            if (reinforceB !== reinforceA) {
              return reinforceB - reinforceA;
            }
            var successA = a.successRatePct == null ? 100 : Number(a.successRatePct);
            var successB = b.successRatePct == null ? 100 : Number(b.successRatePct);
            if (successA !== successB) {
              return successA - successB;
            }
            return Number(b.attemptsCount || 0) - Number(a.attemptsCount || 0);
          })
          .slice(0, 3);

        return {
          strengths: strengths,
          priorities: priorities,
          byChapter: false
        };
      }

      function renderCompletionStrengths(items) {
        if (!items.length) {
          return '<div class="completion-empty">Continue quelques sessions pour faire ressortir clairement tes matières les plus solides.</div>';
        }
        return '<div class="completion-insight-list">' + items.map(function (item) {
          var success = item.successRatePct == null ? '—' : (item.successRatePct + '%');
          var title = item.referenceLabel || item.name;
          var subline = item.referenceLabel
            ? ('Réussite ' + success + ' · ' + String(item.attemptsCount || 0) + ' question(s) jouée(s) sur ce cours')
            : ('Réussite ' + success + ' · ' + String(item.attemptsCount || 0) + ' tentative(s)');
          return '<div class="completion-insight-item">'
            + '<div class="completion-insight-top">'
            + '<div class="completion-insight-title">' + escapeHtml(title) + '</div>'
            + '<span class="chip">Solide</span>'
            + '</div>'
            + '<div class="completion-insight-meta">' + escapeHtml(subline) + '</div>'
            + '</div>';
        }).join('') + '</div>';
      }

      function renderCompletionPriorities(items) {
        if (!items.length) {
          return '<div class="completion-empty">Pas de point faible net pour l’instant. Tu peux continuer à consolider ou augmenter un peu la difficulté.</div>';
        }
        return '<div class="completion-insight-list">' + items.map(function (item) {
          var success = item.successRatePct == null ? '—' : (item.successRatePct + '%');
          var title = item.referenceLabel || item.name;
          var reinforce = Number(item.questionsToReinforceCount || 0);
          var note = item.referenceLabel
            ? ('Réussite ' + success + ' · ' + String(item.attemptsCount || 0) + ' question(s) jouée(s) sur ce cours')
            : (reinforce > 0
              ? (reinforce + ' question(s) à revoir · réussite ' + success)
              : ('Réussite ' + success + ' · base encore à consolider'));
          return '<div class="completion-insight-item">'
            + '<div class="completion-insight-top">'
            + '<div class="completion-insight-title">' + escapeHtml(title) + '</div>'
            + '<span class="chip warn">' + escapeHtml(item.referenceLabel ? 'Chapitre à revoir' : (reinforce > 0 ? 'À retravailler' : 'À consolider')) + '</span>'
            + '</div>'
            + '<div class="completion-insight-meta">' + escapeHtml(note) + '</div>'
            + '</div>';
        }).join('') + '</div>';
      }

      function getQuestionTypeLabel(type) {
        var labels = {
          single_choice: 'QCM simple',
          multi_choice: 'QCM multiple',
          open_text: 'Réponse ouverte'
        };
        return labels[type] || type;
      }

      function getQuestionInstruction(type) {
        if (type === 'single_choice') {
          return 'Choisis une seule réponse. Va au plus juste, sans te précipiter.';
        }
        if (type === 'multi_choice') {
          return 'Sélectionne toutes les réponses exactes. Ici, l’exactitude complète compte.';
        }
        return 'Rédige une réponse claire et brève. Le but est de mobiliser activement ton souvenir.';
      }

      function renderSessionSummary() {
        if (!state.session || !state.session.id) {
          refs.sessionSummary.innerHTML =
            '<div class="session-brief empty">'
            + '<div class="session-brief-top">'
            + '<div class="session-brief-copy">'
            + '<div class="session-brief-eyebrow">Prêt à démarrer</div>'
            + '<div class="session-brief-title">Aucune session active</div>'
            + '<div class="session-brief-text">Choisis un mode, un périmètre, puis lance une session courte ou longue selon ton moment disponible.</div>'
            + '</div>'
            + '<div class="session-brief-chips">'
            + '<span class="chip neutral">Mode libre</span>'
            + '<span class="chip neutral">' + escapeHtml(getSessionScopeLabel()) + '</span>'
            + '</div>'
            + '</div>'
            + '</div>';
          return;
        }

        var progress = state.session.progress || {};
        var attempts = Number(progress.attempts || 0);
        var correct = Number(progress.correct || 0);
        var successRate = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
        var goal = getGoalFromSession() || getGoalFromUi();
        var goalText = goal && goal.target ? (attempts + '/' + goal.target) : 'Libre';
        var title = attempts === 0 ? 'Session lancée, première question à jouer' : 'Session en cours, garde le rythme';
        var summaryText = attempts === 0
          ? ('Mode ' + getModeLabel(state.session.mode) + ' · ' + getSessionScopeLabel())
          : ('Déjà ' + attempts + ' réponse(s) jouée(s) avec ' + correct + ' juste(s).');

        refs.sessionSummary.innerHTML =
          '<div class="session-brief">'
          + '<div class="session-brief-top">'
          + '<div class="session-brief-copy">'
          + '<div class="session-brief-eyebrow">Session active</div>'
          + '<div class="session-brief-title">' + escapeHtml(title) + '</div>'
          + '<div class="session-brief-text">' + escapeHtml(summaryText) + '</div>'
          + '</div>'
          + '<div class="session-brief-chips">'
          + '<span class="chip">' + escapeHtml(getModeLabel(state.session.mode)) + '</span>'
          + '<span class="chip neutral">' + escapeHtml(getSessionScopeLabel()) + '</span>'
          + '<span class="chip neutral">' + escapeHtml(goalText) + '</span>'
          + '</div>'
          + '</div>'
          + '<div class="session-brief-kpis">'
          + '<div class="session-brief-kpi"><div class="k">Bonnes réponses</div><div class="v">' + escapeHtml(String(correct)) + '</div></div>'
          + '<div class="session-brief-kpi"><div class="k">Tentatives</div><div class="v">' + escapeHtml(String(attempts)) + '</div></div>'
          + '<div class="session-brief-kpi"><div class="k">Réussite live</div><div class="v">' + escapeHtml(String(successRate)) + '%</div></div>'
          + '</div>'
          + '</div>';
      }

      async function applyPresetDiscovery(options) {
        refs.modeSelect.value = 'discovery';
        refs.stopRuleSelect.value = 'fixed_10';
        refs.targetCountInput.value = '10';
        refs.targetCountInput.disabled = true;
        clearSessionFilters();
        renderSessionGoal();
        renderSetupGuide();
        if (!(options && options.silent)) {
          setStatus('Preset appliqué: Découverte 10 (toutes matières).', 'info');
        }
      }

      async function applyPresetReviewFixed10(options) {
        refs.modeSelect.value = 'review';
        refs.stopRuleSelect.value = 'fixed_10';
        refs.targetCountInput.value = '10';
        refs.targetCountInput.disabled = true;
        clearSessionFilters();
        renderSessionGoal();
        renderSetupGuide();
        if (!(options && options.silent)) {
          setStatus('Preset appliqué: Révision 10 (toutes matières).', 'info');
        }
      }

      async function applyPresetReviewFree(options) {
        refs.modeSelect.value = 'review';
        refs.stopRuleSelect.value = 'until_stop';
        refs.targetCountInput.disabled = true;
        clearSessionFilters();
        renderSessionGoal();
        renderSetupGuide();
        if (!(options && options.silent)) {
          setStatus('Preset appliqué: Révision libre (toutes matières).', 'info');
        }
      }

      async function applyPresetCatchup(options) {
        refs.modeSelect.value = 'rattrapage';
        refs.stopRuleSelect.value = 'fixed_10';
        refs.targetCountInput.value = '10';
        refs.targetCountInput.disabled = true;
        var selectedCount = await selectTopReinforceSubjects(3);
        if (!selectedCount) {
          clearSessionFilters();
        }
        renderSessionGoal();
        renderSetupGuide();
        if (!(options && options.silent)) {
          var scopeLabel = selectedCount > 0 ? (' · ' + selectedCount + ' matière(s) ciblée(s)') : '';
          setStatus('Preset appliqué: Rattrapage ciblé (10)' + scopeLabel + '.', 'info');
        }
      }

      async function applyPresetRecommended(options) {
        var suggestedMode = getSuggestedMode();
        if (!suggestedMode) {
          throw new Error('Aucun mode conseillé disponible pour le moment.');
        }

        if (suggestedMode === 'rattrapage') {
          await applyPresetCatchup({ silent: true });
        } else if (suggestedMode === 'review') {
          await applyPresetReviewFixed10({ silent: true });
        } else if (suggestedMode === 'discovery') {
          await applyPresetDiscovery({ silent: true });
        } else {
          refs.modeSelect.value = suggestedMode;
          refs.stopRuleSelect.value = 'fixed_10';
          refs.targetCountInput.value = '10';
          refs.targetCountInput.disabled = true;
          clearSessionFilters();
          renderSessionGoal();
          renderSetupGuide();
        }

        if (!(options && options.silent)) {
          setStatus('Preset conseillé appliqué: ' + getModeLabel(suggestedMode) + '.', 'ok');
        }
      }

      async function startRecommendedSession(action) {
        if (action === 'same') {
          if (!state.lastSessionSetup) {
            throw new Error('Aucune session précédente à relancer.');
          }
          await applySessionSetupConfig(state.lastSessionSetup);
        } else if (action === 'catchup') {
          await applyPresetCatchup({ silent: true });
        } else if (action === 'review10') {
          await applyPresetReviewFixed10({ silent: true });
        } else if (action === 'discovery') {
          await applyPresetDiscovery({ silent: true });
        } else if (action === 'suggested') {
          await applyPresetRecommended({ silent: true });
        } else {
          throw new Error('Action recommandée inconnue.');
        }

        await createSession();
      }

      function renderFocus() {
        var d = state.dashboard;
        if (!d || !Array.isArray(d.subjects) || !d.overview) {
          refs.focusList.innerHTML = '<div class="muted">Données insuffisantes pour proposer une priorité.</div>';
          refs.suggestedModeLabel.textContent = 'Mode conseillé: -';
          refs.applySuggestedModeBtn.disabled = true;
          refs.applySuggestedModeBtn.removeAttribute('data-mode');
          return;
        }

        var sorted = d.subjects.slice().sort(function (a, b) {
          var reinforceA = Number(a.questionsToReinforceCount || 0);
          var reinforceB = Number(b.questionsToReinforceCount || 0);
          if (reinforceB !== reinforceA) {
            return reinforceB - reinforceA;
          }
          var successA = a.successRatePct == null ? 100 : Number(a.successRatePct);
          var successB = b.successRatePct == null ? 100 : Number(b.successRatePct);
          if (successA !== successB) {
            return successA - successB;
          }
          return Number(b.attemptsCount || 0) - Number(a.attemptsCount || 0);
        });

        var focus = sorted.slice(0, 3);
        if (!focus.length) {
          refs.focusList.innerHTML = '<div class="muted">Commence quelques sessions pour obtenir des priorités automatiques.</div>';
        } else {
          refs.focusList.innerHTML = focus.map(function (item, index) {
            var reinforce = Number(item.questionsToReinforceCount || 0);
            var success = item.successRatePct == null ? '-' : item.successRatePct + '%';
            var chipClass = reinforce > 0 ? 'chip warn' : 'chip';
            var chipText = reinforce > 0 ? (reinforce + ' à revoir') : 'Stable';
            var pressurePct = Math.max(6, Math.min(100, reinforce > 0 ? reinforce * 8 : 14));
            return '<div class="focus-item">'
              + '<div class="focus-top">'
              + '<div class="focus-title">'
              + '<div class="focus-rank">' + escapeHtml(String(index + 1).padStart(2, '0')) + '</div>'
              + '<div class="focus-title-copy"><b>' + escapeHtml(item.name) + '</b><div class="subject-meta">' + escapeHtml(item.momentumLabel || 'Progression en cours') + '</div></div>'
              + '</div>'
              + '<span class="' + chipClass + '">' + escapeHtml(chipText) + '</span>'
              + '</div>'
              + '<div class="focus-meter"><div class="focus-meter-fill" style="width:' + escapeHtml(String(pressurePct)) + '%"></div></div>'
              + '<div class="subject-meta">Réussite ' + escapeHtml(String(success)) + ' · Tentatives ' + escapeHtml(String(item.attemptsCount || 0)) + ' · ' + escapeHtml(reinforce ? (reinforce + ' question(s) à retravailler') : 'Socle déjà solide') + '</div>'
              + '</div>';
          }).join('');
        }

        var suggestedMode = d.overview.suggestedMode || '';
        if (suggestedMode) {
          refs.suggestedModeLabel.textContent = 'Mode conseillé: ' + getModeLabel(suggestedMode);
          refs.applySuggestedModeBtn.disabled = false;
          refs.applySuggestedModeBtn.setAttribute('data-mode', suggestedMode);
        } else {
          refs.suggestedModeLabel.textContent = 'Mode conseillé: -';
          refs.applySuggestedModeBtn.disabled = true;
          refs.applySuggestedModeBtn.removeAttribute('data-mode');
        }
      }

      function isUuidV4(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
      }

      function setDuelModeUi() {
        var isFriendInvite = refs.duelModeSelect.value === 'friend_invite';
        if (refs.duelOpponentField) {
          refs.duelOpponentField.classList.toggle('hidden', !isFriendInvite);
        }
        refs.duelOpponentInput.disabled = !isFriendInvite;
        if (!isFriendInvite) {
          refs.duelOpponentInput.value = '';
        }
        renderDuelModeCards();
      }

      function renderDuelStatusFilters() {
        if (!refs.duelStatusFilterButtons || !refs.duelStatusFilterSelect) {
          return;
        }

        var current = refs.duelStatusFilterSelect.value || 'all';
        var filters = [
          { value: 'all', label: 'Tous' },
          { value: 'pending_opener', label: 'Invitation' },
          { value: 'in_progress', label: 'En cours' },
          { value: 'completed', label: 'Terminés' },
          { value: 'cancelled', label: 'Annulés' },
          { value: 'expired', label: 'Expirés' }
        ];

        refs.duelStatusFilterButtons.innerHTML = filters.map(function (filter) {
          var active = filter.value === current;
          return '<button class="duel-filter-chip' + (active ? ' is-active' : '') + '" data-duel-status-filter="' + escapeHtml(filter.value) + '">'
            + escapeHtml(filter.label)
            + '</button>';
        }).join('');
      }

      function renderDuelModeCards() {
        if (!refs.duelModeCards) {
          return;
        }

        var currentMode = refs.duelModeSelect.value || 'friend_invite';
        var cards = [
          {
            mode: 'friend_invite',
            title: 'Défier un ami',
            copy: 'Tu choisis directement la personne à inviter.',
            meta: 'Invitation privée'
          },
          {
            mode: 'random_free',
            title: 'Joueur aléatoire',
            copy: 'L’app te trouve un adversaire sans contrainte particulière.',
            meta: 'Rapide'
          },
          {
            mode: 'random_level',
            title: 'Niveau proche',
            copy: 'L’app cherche un duel plus équilibré entre joueurs.',
            meta: 'Équilibré'
          }
        ];

        refs.duelModeCards.innerHTML = cards.map(function (card) {
          var selected = currentMode === card.mode;
          return '<button class="training-mode-card' + (selected ? ' is-selected' : '') + '" data-duel-mode="' + escapeHtml(card.mode) + '">'
            + '<div class="training-mode-top">'
            + '<div class="training-mode-title">' + escapeHtml(card.title) + '</div>'
            + '<span class="chip' + (selected ? '' : ' neutral') + '">' + escapeHtml(selected ? 'Choisi' : card.meta) + '</span>'
            + '</div>'
            + '<div class="training-mode-copy">' + escapeHtml(card.copy) + '</div>'
            + '</button>';
        }).join('');
      }

      function getDuelStatusFilterParam() {
        var raw = refs.duelStatusFilterSelect.value;
        return raw === 'all' ? '' : raw;
      }

      function resetDuelTransientView() {
        clearDuelPlayAutoAdvance();
        state.duelPlayKind = '';
        state.duelPlayCursor = 0;
        state.duelPlayReview = null;
        state.duelRoundAnsweredSlots = {};
        state.openerQuestion = null;
        state.openerShownAt = 0;
        state.currentRound = null;
        state.roundQuestions = [];
        state.roundQuestionShownAtBySlot = {};
      }

      function closeSelectedDuelView() {
        state.selectedDuelId = null;
        state.selectedDuel = null;
        resetDuelTransientView();
        if (refs.duelDetail) {
          refs.duelDetail.innerHTML = '';
          refs.duelDetail.classList.add('hidden');
        }
        if (refs.duelSubjectContent) {
          refs.duelSubjectContent.innerHTML = '';
          refs.duelSubjectContent.classList.add('hidden');
        }
        setDuelFlow('home');
        renderDuelsList();
        setStatus('Duel fermé.', 'info');
      }

      function findNextUnansweredDuelRoundIndex(startIndex) {
        var fromIndex = Number.isFinite(startIndex) ? startIndex : 0;
        for (var index = Math.max(0, fromIndex); index < state.roundQuestions.length; index += 1) {
          var item = state.roundQuestions[index];
          if (!item) {
            continue;
          }
          if (!state.duelRoundAnsweredSlots[String(item.slotNo)]) {
            return index;
          }
        }
        return -1;
      }

      function getCurrentDuelPlayItem() {
        if (state.duelPlayKind === 'opener' && state.openerQuestion) {
          return {
            kind: 'opener',
            question: state.openerQuestion,
            progressLabel: 'Opener',
            scopeLabel: state.selectedDuel ? getDuelOpponentTitle(state.selectedDuel) : 'Duel',
            topicLabel: 'Question d’ouverture',
            guidance: 'Réponds rapidement pour lancer le duel.',
            submitLabel: 'Valider l’opener'
          };
        }

        if (state.duelPlayKind === 'round' && state.roundQuestions.length) {
          var currentIndex = findNextUnansweredDuelRoundIndex(state.duelPlayCursor);
          if (currentIndex < 0) {
            currentIndex = findNextUnansweredDuelRoundIndex(0);
          }
          if (currentIndex < 0) {
            return null;
          }
          state.duelPlayCursor = currentIndex;
          var item = state.roundQuestions[currentIndex];
          var selectedSubjectName = '';
          if (state.currentRound && state.currentRound.chosenSubjectId && Array.isArray(state.currentRound.offeredSubjects)) {
            var subject = state.currentRound.offeredSubjects.find(function (candidate) {
              return candidate.id === state.currentRound.chosenSubjectId;
            });
            selectedSubjectName = subject ? subject.name : '';
          }
          return {
            kind: 'round',
            slotNo: item.slotNo,
            difficultySnapshot: item.difficultySnapshot,
            question: item.question,
            progressLabel: 'Question ' + item.slotNo + ' / 3',
            scopeLabel: selectedSubjectName || 'Manche en cours',
            topicLabel: 'Manche ' + (state.currentRound ? state.currentRound.roundNo : '-') + ' · duel',
            guidance: 'Réponds à cette question, puis on t’enchaîne directement sur la suivante.',
            submitLabel: 'Valider cette question'
          };
        }

        return null;
      }

      function getReviewedDuelPlayItem() {
        if (!state.duelPlayReview) {
          return null;
        }

        if (state.duelPlayKind === 'opener' && state.openerQuestion) {
          return {
            kind: 'opener',
            question: state.openerQuestion,
            progressLabel: 'Opener',
            scopeLabel: state.selectedDuel ? getDuelOpponentTitle(state.selectedDuel) : 'Duel',
            topicLabel: 'Question d’ouverture',
            guidance: 'Réponds rapidement pour lancer le duel.',
            submitLabel: 'Valider l’opener'
          };
        }

        if (state.duelPlayKind === 'round' && state.roundQuestions.length) {
          var reviewed = state.roundQuestions.find(function (item) {
            return item && (
              Number(item.slotNo) === Number(state.duelPlayReview.slotNo)
              || (item.question && item.question.id === state.duelPlayReview.questionId)
            );
          });
          if (!reviewed) {
            return null;
          }
          var selectedSubjectName = '';
          if (state.currentRound && state.currentRound.chosenSubjectId && Array.isArray(state.currentRound.offeredSubjects)) {
            var subject = state.currentRound.offeredSubjects.find(function (candidate) {
              return candidate.id === state.currentRound.chosenSubjectId;
            });
            selectedSubjectName = subject ? subject.name : '';
          }
          return {
            kind: 'round',
            slotNo: reviewed.slotNo,
            difficultySnapshot: reviewed.difficultySnapshot,
            question: reviewed.question,
            progressLabel: 'Question ' + reviewed.slotNo + ' / 3',
            scopeLabel: selectedSubjectName || 'Manche en cours',
            topicLabel: 'Manche ' + (state.currentRound ? state.currentRound.roundNo : '-') + ' · duel',
            guidance: 'Réponds à cette question, puis on t’enchaîne directement sur la suivante.',
            submitLabel: 'Valider cette question'
          };
        }

        return null;
      }

      async function refreshRoundQuestionsForPlay() {
        if (!state.selectedDuelId || !state.currentRound) {
          return;
        }
        var result = await api('/duels/' + state.selectedDuelId + '/rounds/' + state.currentRound.roundNo + '/questions');
        state.roundQuestions = result.items || [];
        (state.roundQuestions || []).forEach(function (item) {
          var slotKey = String(item.slotNo);
          if (!state.roundQuestionShownAtBySlot[slotKey]) {
            state.roundQuestionShownAtBySlot[slotKey] = Date.now();
          }
        });
      }

      function startDuelPlay(kind) {
        state.duelPlayKind = kind || '';
        state.duelPlayReview = null;
        if (kind === 'round') {
          var firstIndex = findNextUnansweredDuelRoundIndex(0);
          state.duelPlayCursor = firstIndex >= 0 ? firstIndex : 0;
        } else {
          state.duelPlayCursor = 0;
        }
        renderDuelPlay();
        setDuelFlow('play');
      }

      function renderDuelPlay() {
        if (!refs.duelPlayContent || !refs.duelSubmitAnswerBtn || !refs.duelNextAnswerBtn) {
          return;
        }

        var playItem = state.duelPlayReview ? getReviewedDuelPlayItem() : getCurrentDuelPlayItem();
        if (!playItem && state.duelPlayReview) {
          playItem = getCurrentDuelPlayItem();
        }
        if (!playItem) {
          clearDuelPlayAutoAdvance();
          refs.duelPlayContent.classList.remove('hidden');
          refs.duelPlayContent.classList.add('empty');
          refs.duelPlayContent.innerHTML = '<div class="q-empty-title">Aucune question duel à jouer</div>'
            + '<div class="q-empty-copy">Reviens au duel pour charger l’opener ou la manche en cours.</div>';
          refs.duelSubmitAnswerBtn.disabled = true;
          refs.duelSubmitAnswerBtn.classList.remove('hidden');
          refs.duelNextAnswerBtn.disabled = true;
          refs.duelNextAnswerBtn.classList.add('hidden');
          return;
        }

        var duel = state.selectedDuel || null;
        var duelMeId = state.me && state.me.id ? state.me.id : null;
        var duelIsPlayer1 = Boolean(duel && duelMeId && duel.player1Id === duelMeId);
        var duelMyScore = duel ? (duelIsPlayer1 ? duel.score.player1 : duel.score.player2) : 0;
        var duelOpponentScore = duel ? (duelIsPlayer1 ? duel.score.player2 : duel.score.player1) : 0;
        var duelOpponentProfile = duel ? (duelIsPlayer1 ? (duel.player2Profile || null) : (duel.player1Profile || null)) : null;
        var duelOpponentName = capitalizeDisplayLabel(
          duelOpponentProfile && duelOpponentProfile.displayLabel
            ? duelOpponentProfile.displayLabel
            : (duel ? getDuelOpponentTitle(duel) : 'Adversaire')
        );
        var q = playItem.question;
        var review = state.duelPlayReview && state.duelPlayReview.questionId === q.id
          ? state.duelPlayReview
          : null;
        var correctChoiceId = review ? review.correctChoiceId : '';
        var selectedChoiceId = review ? review.selectedChoiceId : '';
        var slotTrackHtml = '';
        if (playItem.kind === 'round') {
          slotTrackHtml = '<div class="duel-play-track">' + [1, 2, 3].map(function (slotNo) {
            var slotKey = String(slotNo);
            var answer = state.duelRoundAnsweredSlots[slotKey];
            var className = 'duel-play-pill';
            var stateLabel = 'À jouer';
            if (answer && answer.isCorrect) {
              className += ' is-correct';
              stateLabel = 'Réussie';
            } else if (answer && !answer.isCorrect) {
              className += ' is-wrong';
              stateLabel = 'À revoir';
            } else if (slotNo === playItem.slotNo) {
              className += ' is-current';
              stateLabel = review ? 'Corrigée' : 'En cours';
            }
            return '<div class="' + className + '"><div class="slot">Question ' + escapeHtml(String(slotNo)) + '</div><div class="state">' + escapeHtml(stateLabel) + '</div></div>';
          }).join('') + '</div>';
        }

        var choicesHtml = '<div class="choice-list">' + (q.choices || []).map(function (choice, index) {
          var checked = selectedChoiceId === choice.id ? ' checked' : '';
          var disabled = review ? ' disabled' : '';
          var isCorrectChoice = !!correctChoiceId && correctChoiceId === choice.id;
          var isSelected = selectedChoiceId === choice.id;
          var reviewClass = '';
          var reviewBadge = '';
          if (review) {
            if (review.isCorrect && isSelected) {
              reviewClass = ' is-review-miss';
              reviewBadge = '<span class="choice-state solution">Bonne réponse</span>';
            } else if (!review.isCorrect && isCorrectChoice) {
              reviewClass = ' is-review-miss';
              reviewBadge = '<span class="choice-state solution">Bonne réponse</span>';
            } else if (!review.isCorrect && isSelected) {
              reviewClass = ' is-review-dim';
              reviewBadge = '<span class="choice-state neutral">Ton choix</span>';
            } else if (review.isCorrect) {
              reviewClass = ' is-review-dim';
            } else {
              reviewClass = ' is-review-dim';
            }
          }
          return '<label class="choice' + reviewClass + '"><input type="radio" name="duelPlayChoice" value="' + choice.id + '"' + checked + disabled + ' /> <span class="choice-badge">' + escapeHtml(getChoiceMarker(index)) + '</span><span class="choice-copy-wrap"><span class="choice-copy">' + escapeHtml(choice.label) + '</span>' + reviewBadge + '</span></label>';
        }).join('') + '</div>';

        var feedbackHtml = '';
        if (review) {
          var duelAutoAdvanceSeconds = Math.round(getDuelPlayAutoAdvanceMs(review) / 1000);
          feedbackHtml =
            '<div class="q-feedback ' + (review.isCorrect ? 'ok' : 'err') + '">'
            + '<div class="q-feedback-top">'
            + '<div class="q-feedback-title">' + (review.isCorrect ? 'Bien joué' : 'Voilà ce qu’il fallait retenir') + '</div>'
            + '<span class="chip ' + (review.isCorrect ? '' : 'warn') + '">' + (review.isCorrect ? 'Correct' : 'Corrigé') + '</span>'
            + '</div>'
            + '<div class="q-feedback-copy">' + escapeHtml(review.explanation || '') + '</div>'
            + '</div>'
            + '<div class="q-auto-advance">'
            + '<div class="q-auto-advance-top"><span>Transition automatique</span><b id="duelAutoAdvanceLabel">Suite automatique dans ' + duelAutoAdvanceSeconds + ' s</b></div>'
            + '<div class="q-auto-advance-track"><div id="duelAutoAdvanceBar" class="q-auto-advance-bar"></div></div>'
            + '</div>';
        }

        refs.duelPlayContent.classList.remove('hidden');
        refs.duelPlayContent.classList.remove('empty');
        refs.duelPlayContent.innerHTML =
          '<div class="duel-play-top">'
          + '<div class="duel-play-hero">'
          + '<div class="duel-play-copy">'
          + '<div class="duel-play-kicker">' + escapeHtml(playItem.kind === 'opener' ? 'Question d’ouverture' : 'Tour duel') + '</div>'
          + '<div class="duel-play-name">' + escapeHtml(duelOpponentName) + '</div>'
          + '<div class="mini">' + escapeHtml(playItem.kind === 'opener' ? 'Une question pour lancer le duel.' : 'Ton tour comporte 3 questions, jouées l’une après l’autre.') + '</div>'
          + '</div>'
          + '<div class="duel-play-score"><b>' + escapeHtml(String(duelMyScore)) + '</b><span>VS</span><b>' + escapeHtml(String(duelOpponentScore)) + '</b></div>'
          + '</div>'
          + slotTrackHtml
          + '</div>'
          + '<div class="q-focus-top">'
          + '<div class="q-progress-pill">' + escapeHtml(playItem.progressLabel) + '</div>'
          + '<span class="chip neutral q-scope-chip">' + escapeHtml(playItem.scopeLabel) + '</span>'
          + '</div>'
          + '<div class="q-question-card">'
          + '<div class="q-topic-line">'
          + '<div class="q-type">' + escapeHtml(playItem.topicLabel) + '</div>'
          + '</div>'
          + '<h3 class="q-prompt" style="color:#ffffff;">' + escapeHtml(q.prompt) + '</h3>'
          + '<div class="q-guidance">' + escapeHtml(playItem.guidance) + '</div>'
          + '</div>'
          + '<div class="q-answer-shell">' + choicesHtml + '</div>'
          + feedbackHtml;

        refs.duelPlayBackBtn.textContent = playItem.kind === 'opener' ? 'Retour au duel' : 'Quitter le tour';
        refs.duelSubmitAnswerBtn.textContent = playItem.submitLabel;

        if (review) {
          refs.duelSubmitAnswerBtn.classList.add('hidden');
          refs.duelSubmitAnswerBtn.disabled = true;
          refs.duelNextAnswerBtn.classList.remove('hidden');
          refs.duelNextAnswerBtn.disabled = false;
          refs.duelNextAnswerBtn.textContent = review.turnCompleted || review.remainingSlots === 0
            ? 'Retour au résumé duel'
            : 'Question suivante';
          startDuelPlayAutoAdvance();
          return;
        }

        clearDuelPlayAutoAdvance();
        refs.duelSubmitAnswerBtn.classList.remove('hidden');
        refs.duelSubmitAnswerBtn.disabled = false;
        refs.duelNextAnswerBtn.classList.add('hidden');
        refs.duelNextAnswerBtn.disabled = true;
      }

      async function advanceDuelPlay() {
        clearDuelPlayAutoAdvance();
        if (state.duelPlayKind === 'round' && state.duelPlayReview && !state.duelPlayReview.turnCompleted) {
          var nextIndex = -1;
          try {
            await refreshRoundQuestionsForPlay();
            nextIndex = findNextUnansweredDuelRoundIndex(state.duelPlayCursor + 1);
            if (nextIndex < 0) {
              nextIndex = findNextUnansweredDuelRoundIndex(0);
            }
          } catch (err) {
            nextIndex = findNextUnansweredDuelRoundIndex(state.duelPlayCursor + 1);
          }
          if (nextIndex >= 0) {
            state.duelPlayCursor = nextIndex;
            state.duelPlayReview = null;
            renderDuelPlay();
            return;
          }
        }

        var shouldReturnToDuelSummary = Boolean(
          state.duelPlayKind === 'round'
          && state.duelPlayReview
          && (state.duelPlayReview.turnCompleted || state.duelPlayReview.remainingSlots === 0)
        );
        state.duelPlayReview = null;
        await loadDuelDetail(state.selectedDuelId);
        try {
          if (state.selectedDuel && state.selectedDuel.status === 'in_progress') {
            await loadCurrentRound();
          }
        } catch (err) {
          // duel may have changed state between refreshes
        }
        setDuelFlow('detail');
        if (shouldReturnToDuelSummary) {
          setStatus('Tour terminé. Retour au résumé duel.', 'ok');
        }
      }

      function renderDuelHome() {
        if (!refs.duelHomeSummary || !refs.duelHomeCards) {
          return;
        }

        var unreadNotifications = getUnreadNotificationsCount();
        var activeDuels = getActiveDuelsCount();
        var totalDuels = Array.isArray(state.duels) ? state.duels.length : 0;
        var selectedDuelLabel = state.selectedDuel && state.selectedDuel.status
          ? getDuelStatusLabel(state.selectedDuel.status)
          : (state.selectedDuelId ? ('Duel ' + state.selectedDuelId.slice(0, 8)) : 'Aucun duel ouvert');
        var summaryChips = [
          '<span class="chip">' + escapeHtml(String(activeDuels)) + ' duel' + (activeDuels > 1 ? 's' : '') + ' actif' + (activeDuels > 1 ? 's' : '') + '</span>',
          '<span class="chip' + (unreadNotifications > 0 ? ' warn' : ' neutral') + '">' + escapeHtml(unreadNotifications > 0 ? (String(unreadNotifications) + ' alerte' + (unreadNotifications > 1 ? 's' : '')) : 'Aucune alerte') + '</span>',
          '<span class="chip neutral">' + escapeHtml(String(totalDuels)) + ' visible' + (totalDuels > 1 ? 's' : '') + '</span>'
        ].join('');

        refs.duelHomeSummary.innerHTML =
          '<div class="session-brief">'
          + '<div class="session-brief-top">'
          + '<div class="session-brief-copy">'
          + '<div class="session-brief-eyebrow">Mode duel</div>'
          + '<div class="session-brief-title">Ton espace duel.</div>'
          + '<div class="session-brief-text">' + escapeHtml(
            state.selectedDuelId
              ? ('Dernier duel ouvert: ' + selectedDuelLabel + '. Tu peux le reprendre tout de suite ou lancer un nouveau défi.')
              : 'Lance un défi ou rouvre simplement une partie en cours.'
          ) + '</div>'
          + '</div>'
          + '</div>'
          + '<div class="session-brief-chips">' + summaryChips + '</div>'
          + '</div>';

        var cards = [
          {
            key: 'create',
            title: 'Nouveau duel',
            copy: 'Créer un défi ami, aléatoire ou niveau proche.',
            chip: 'Créer'
          },
          {
            key: 'inbox',
            title: 'Mes duels',
            copy: 'Voir la liste et reprendre une partie.',
            chip: totalDuels ? (String(totalDuels) + ' visible(s)') : 'Liste vide'
          }
        ];

        if (state.selectedDuelId) {
          cards.unshift({
            key: 'detail',
            title: 'Reprendre le duel',
            copy: 'Retourner directement sur ton duel déjà ouvert.',
            chip: state.selectedDuel && state.selectedDuel.status ? getDuelStatusLabel(state.selectedDuel.status) : 'Ouvert'
          });
        }

        refs.duelHomeCards.innerHTML = cards.map(function (card) {
          return '<button class="training-mode-card" data-duel-flow-target="' + escapeHtml(card.key) + '">'
            + '<div class="training-mode-top">'
            + '<div class="training-mode-title">' + escapeHtml(card.title) + '</div>'
            + '<span class="chip neutral">' + escapeHtml(card.chip) + '</span>'
            + '</div>'
            + '<div class="training-mode-copy">' + escapeHtml(card.copy) + '</div>'
            + '</button>';
        }).join('');
      }

      function renderDuelsList() {
        if (!state.token) {
          refs.duelsList.innerHTML = '<div class="muted">Connecte-toi pour voir les duels.</div>';
          renderDuelHome();
          return;
        }
        if (!state.duels.length) {
          refs.duelsList.innerHTML = '<div class="muted">Aucun duel pour ce filtre.</div>';
          renderDuelHome();
          return;
        }

        refs.duelsList.innerHTML = state.duels.map(function (d) {
          var isSelected = state.selectedDuelId === d.id;
          var opponent = d.opponent || null;
          var opponentName = opponent && opponent.displayLabel ? opponent.displayLabel : 'Adversaire';
          var opponentStage = getDuelProfileStageName(opponent) || 'Profil duel';
          var duelMeId = state.me && state.me.id ? state.me.id : null;
          var duelIsMyTurn = Boolean(duelMeId && d.currentTurnUserId === duelMeId);
          var ctaLabel = duelIsMyTurn ? 'Jouer' : 'Ouvrir';
          return '<div class="duel-item">'
            + '<div class="duel-item-top">'
            + '<b>Duel ' + escapeHtml(d.id.slice(0, 8)) + '</b>'
            + '<span class="chip' + (isSelected ? '' : ' warn') + '">' + escapeHtml(getDuelStatusLabel(d.status)) + '</span>'
            + '</div>'
            + '<div class="mini">Face à: ' + escapeHtml(opponentName) + ' · ' + escapeHtml(opponentStage) + '</div>'
            + '<div class="mini">Score ' + escapeHtml(String(d.meScore != null ? d.meScore : d.player1Score)) + ' - ' + escapeHtml(String(d.opponentScore != null ? d.opponentScore : d.player2Score)) + '</div>'
            + '<div class="mini">Créé: ' + escapeHtml(String(d.createdAt || '').slice(0, 19).replace('T', ' ')) + ' · ' + escapeHtml(duelIsMyTurn ? 'À toi' : 'En attente') + '</div>'
            + '<button class="btn-secondary" data-duel-id="' + escapeHtml(d.id) + '">' + escapeHtml(ctaLabel) + '</button>'
            + '</div>';
        }).join('');
        renderDuelHome();
      }

      function renderDuelSubjectSelection() {
        if (!refs.duelSubjectContent) {
          return;
        }

        var d = state.selectedDuel;
        if (!d || !state.currentRound) {
          refs.duelSubjectContent.classList.add('hidden');
          refs.duelSubjectContent.innerHTML = '';
          return;
        }

        var meId = state.me && state.me.id ? state.me.id : null;
        var isMyTurn = Boolean(meId && d.currentTurnUserId === meId);
        var opponentName = getDuelPlayerDisplayNameById(d, meId === d.player1Id ? d.player2Id : d.player1Id) || 'Adversaire';
        var starterName = getDuelPlayerDisplayNameById(d, d.currentTurnUserId);
        var subjects = Array.isArray(state.currentRound.offeredSubjects) ? state.currentRound.offeredSubjects : [];
        var chosenSubject = state.currentRound.chosenSubjectId
          ? subjects.find(function (subject) { return subject.id === state.currentRound.chosenSubjectId; })
          : null;
        var summaryLine = isMyTurn
          ? 'Tu choisis la matière de cette manche.'
          : ((starterName || opponentName) + ' choisit la matière de cette manche.');

        refs.duelSubjectContent.classList.remove('hidden');
        refs.duelSubjectContent.innerHTML =
          '<div class="session-brief">'
          + '<div class="session-brief-top">'
          + '<div class="session-brief-copy">'
          + '<div class="session-brief-eyebrow">Manche ' + escapeHtml(String(state.currentRound.roundNo)) + '</div>'
          + '<div class="session-brief-title">' + escapeHtml(summaryLine) + '</div>'
          + '<div class="session-brief-text">Score ' + escapeHtml(String(d.score.player1)) + ' - ' + escapeHtml(String(d.score.player2)) + ' · Tour de ' + escapeHtml(starterName || opponentName) + '.</div>'
          + '</div>'
          + '</div>'
          + '</div>'
          + (chosenSubject
            ? (
              '<div class="duel-question is-current">'
              + '<div class="duel-section-kicker">Matière choisie</div>'
              + '<b>' + escapeHtml(chosenSubject.name) + '</b>'
              + '<div class="mini">' + escapeHtml(isMyTurn ? 'La matière est prête. Tu peux lancer tes 3 questions.' : 'La matière est fixée. Le tour adverse peut maintenant commencer.') + '</div>'
              + (isMyTurn ? '<div class="duel-actions"><button class="btn-primary" data-duel-subject-action="load-round-questions">Lancer mes 3 questions</button></div>' : '')
              + '</div>'
            )
            : (
              '<div class="training-mode-grid">' + subjects.map(function (subject) {
                return '<button class="training-mode-card" data-duel-subject-action="choose-subject" data-subject-id="' + escapeHtml(subject.id) + '"' + (isMyTurn ? '' : ' disabled') + '>'
                  + '<div class="training-mode-top"><div class="training-mode-title">' + escapeHtml(subject.name) + '</div><span class="chip neutral">Matière</span></div>'
                  + '<div class="training-mode-copy">' + escapeHtml(isMyTurn ? 'Choisir pour cette manche.' : 'Visible pendant que l’adversaire choisit.') + '</div>'
                  + '</button>';
              }).join('') + '</div>'
            ));
      }

      function renderDuelDetail() {
        var d = state.selectedDuel;
        if (!d) {
          refs.duelDetail.classList.add('hidden');
          refs.duelDetail.innerHTML = '';
          renderDuelHome();
          return;
        }

        refs.duelDetail.classList.remove('hidden');
        var meId = state.me && state.me.id ? state.me.id : null;
        var isPlayer1 = Boolean(meId && d.player1Id === meId);
        var isMyTurn = Boolean(meId && d.currentTurnUserId === meId);
        var canAccept = d.matchmakingMode === 'friend_invite'
          && d.status === 'pending_opener'
          && d.player2Id === meId
          && !d.acceptedAt;
        var canDecline = canAccept;
        var canForfeit = d.status === 'pending_opener' || d.status === 'in_progress';
        var myJokerUsed = d.jokers ? (isPlayer1 ? d.jokers.player1Used : d.jokers.player2Used) : false;
        var opponentJokerUsed = d.jokers ? (isPlayer1 ? d.jokers.player2Used : d.jokers.player1Used) : false;
        var pendingJoker = d.jokers ? d.jokers.pending : null;
        var canRequestJoker = d.status === 'in_progress' && isMyTurn && !myJokerUsed && !pendingJoker;
        var canRespondToPendingJoker = Boolean(
          pendingJoker &&
          meId &&
          pendingJoker.grantedByUserId === meId
        );
        var guideState = getDuelGuideState(d, meId);
        var guideActions = getDuelGuideActions({
          duel: d,
          meId: meId,
          isMyTurn: isMyTurn,
          canAccept: canAccept,
          canDecline: canDecline,
          currentRound: state.currentRound,
          roundQuestions: state.roundQuestions,
          openerQuestion: state.openerQuestion
        });
        var stageOrder = ['invite', 'round', 'finish'];
        var stageTitles = {
          invite: 'Invitation',
          round: 'Manches',
          finish: 'Clôture'
        };
        var activeStageIndex = stageOrder.indexOf(guideState.stageKey);
        var stageListHtml = stageOrder.map(function (stageKey, index) {
          var className = 'duel-stage';
          if (index < activeStageIndex) {
            className += ' done';
          }
          if (stageKey === guideState.stageKey) {
            className += ' active';
          }
          return '<div class="' + className + '">'
            + '<div class="step">Étape ' + escapeHtml(String(index + 1)) + '</div>'
            + '<div class="title">' + escapeHtml(stageTitles[stageKey]) + '</div>'
            + '</div>';
        }).join('');
        var roundsStripHtml = Array.isArray(d.rounds) && d.rounds.length
          ? d.rounds.map(function (round) {
            var roundClass = 'duel-round-pill' + (round.roundNo === d.currentRoundNo && d.status === 'in_progress' ? ' active' : '');
            return '<div class="' + roundClass + '">'
              + '<b>Manche ' + escapeHtml(String(round.roundNo)) + '</b>'
              + '<div class="mini">' + escapeHtml(getDuelRoundStatusLabel(round.status)) + '</div>'
              + '</div>';
          }).join('')
          : '<div class="mini">Aucune manche initialisée pour l\'instant.</div>';
        var myScore = isPlayer1 ? d.score.player1 : d.score.player2;
        var opponentScore = isPlayer1 ? d.score.player2 : d.score.player1;
        var myProfile = null;
        var opponentProfile = null;
        if (meId && d.player1Id === meId) {
          myProfile = d.player1Profile || null;
          opponentProfile = d.player2Profile || null;
        } else if (meId && d.player2Id === meId) {
          myProfile = d.player2Profile || null;
          opponentProfile = d.player1Profile || null;
        } else {
          myProfile = getDuelProfile(isPlayer1 ? 'player1' : 'player2', d);
          opponentProfile = getDuelProfile(isPlayer1 ? 'player2' : 'player1', d);
        }
        var myAccent = getSafeProfileColor((myProfile && myProfile.profileColor) || (state.me && state.me.profileColor));
        var opponentAccent = getSafeProfileColor(opponentProfile && opponentProfile.profileColor);
        var myName = capitalizeDisplayLabel(myProfile && myProfile.displayLabel ? myProfile.displayLabel : getPreferredPlayerName());
        var myStage = getDuelProfileStageName(myProfile) || (state.myAvatar && state.myAvatar.currentStage ? state.myAvatar.currentStage.name : 'Progression initiale');
        var mySpecialty = getDuelProfileSpecialtyName(myProfile) || (state.myAvatar && state.myAvatar.specialty ? state.myAvatar.specialty.name : 'Spécialité non choisie');
        var myLoadout = getDuelProfileEquipmentSummary(myProfile);
        if (!myLoadout.length) {
          myLoadout = getAvatarLoadoutLabels();
        }
        var opponentName = capitalizeDisplayLabel(opponentProfile && opponentProfile.displayLabel ? opponentProfile.displayLabel : getDuelOpponentTitle(d));
        var starterName = getDuelPlayerDisplayNameById(d, d.currentTurnUserId);
        var starterLine = '';
        if (d.status === 'in_progress' && starterName) {
          starterLine = d.currentTurnUserId === meId
            ? 'Tu commences cette manche.'
            : (starterName + ' commence cette manche.');
        }
        var opponentStage = getDuelProfileStageName(opponentProfile) || 'Progression non visible';
        var opponentSpecialty = getDuelProfileSpecialtyName(opponentProfile) || 'Spécialité non visible';
        var opponentLoadout = getDuelProfileEquipmentSummary(opponentProfile);
        var mySceneTokens = getLoadoutTokens(myLoadout);
        var opponentSceneTokens = getLoadoutTokens(opponentLoadout);
        var myNextStage = state.myAvatar && state.myAvatar.nextStage ? state.myAvatar.nextStage.name : '';
        var duelModeLabel = getDuelModeLabel(d.matchmakingMode);
        var duelTurnLabel = isMyTurn ? 'À toi de jouer' : ('Tour de ' + opponentName);
        var duelRemainingLabel = d.turnDeadlineAt ? formatRemainingTime(d.turnDeadlineAt) : '-';
        var duelResultLabel = d.winnerUserId
          ? (d.winnerUserId === meId ? 'Tu as gagné' : (opponentName + ' a gagné'))
          : 'Duel en cours';
        var primaryActionHtml = '';
        var soloTestActionHtml = '';
        var rematchActionHtml = '';
        if (canAccept) {
          primaryActionHtml = '<div class="duel-actions"><button class="btn-primary" data-duel-action="accept">Accepter</button><button class="btn-secondary" data-duel-action="decline">Refuser</button></div>';
        } else if (d.status === 'in_progress' && state.currentRound) {
          if (!state.currentRound.chosenSubjectId) {
            primaryActionHtml = isMyTurn
              ? '<div class="duel-actions"><button class="btn-primary" data-duel-action="start-round-flow">Démarrer</button></div>'
              : '';
          } else if (isMyTurn && state.roundQuestions.length) {
            primaryActionHtml = '<div class="duel-actions"><button class="btn-primary" data-duel-action="open-round-play">Reprendre mes 3 questions</button></div>';
          } else if (isMyTurn) {
            primaryActionHtml = '<div class="duel-actions"><button class="btn-primary" data-duel-action="load-round-questions">Commencer mes 3 questions</button></div>';
          }
        }
        if (d.status === 'in_progress' && meId && d.currentTurnUserId && d.currentTurnUserId !== meId) {
          soloTestActionHtml = '<div class="duel-actions"><button class="btn-secondary" data-duel-action="simulate-opponent-turn">Simuler le tour adverse</button></div>';
        }
        if (d.status === 'completed' && getDuelOpponentUserId(d, meId)) {
          rematchActionHtml = '<div class="duel-actions"><button class="btn-primary" data-duel-action="rematch">Rejouer contre ' + escapeHtml(opponentName) + '</button></div>';
        }

        refs.duelDetail.innerHTML =
          '<div class="session-brief">'
          + '<div class="session-brief-top">'
          + '<div class="session-brief-copy">'
          + '<div class="session-brief-eyebrow">Duel contre</div>'
          + '<div class="session-brief-title">' + escapeHtml(opponentName) + '</div>'
          + '<div class="session-brief-text">' + escapeHtml(starterLine || duelResultLabel) + '</div>'
          + '</div>'
          + '<div class="duel-scoreboard">'
          + '<div class="duel-score-col"><span>Toi</span><b>' + escapeHtml(String(myScore)) + '</b></div>'
          + '<div class="duel-score-vs">VS</div>'
          + '<div class="duel-score-col"><span>' + escapeHtml(opponentName) + '</span><b>' + escapeHtml(String(opponentScore)) + '</b></div>'
          + '</div>'
          + '</div>'
          + '<div class="duel-overview-grid">'
          + '<div class="duel-overview-card tour"><div class="k">Tour</div><div class="v">' + escapeHtml(duelTurnLabel) + '</div><div class="s">' + escapeHtml(state.currentRound ? ('Manche ' + state.currentRound.roundNo + ' / 5') : 'En attente') + '</div></div>'
          + '<div class="duel-overview-card manches"><div class="k">Temps restant</div><div class="v">' + escapeHtml(duelRemainingLabel) + '</div><div class="s">' + escapeHtml(d.status === 'in_progress' ? 'Le chrono tourne.' : getDuelStatusLabel(d.status)) + '</div></div>'
          + '<div class="duel-overview-card status"><div class="k">Matière</div><div class="v">' + escapeHtml(state.currentRound && state.currentRound.chosenSubjectId && Array.isArray(state.currentRound.offeredSubjects) ? ((state.currentRound.offeredSubjects.find(function (subject) { return subject.id === state.currentRound.chosenSubjectId; }) || {}).name || 'Choix à venir') : 'Choix à venir') + '</div><div class="s">' + escapeHtml(state.currentRound && !state.currentRound.chosenSubjectId ? '3 matières seront proposées.' : duelResultLabel) + '</div></div>'
          + '</div>'
          + primaryActionHtml
          + soloTestActionHtml
          + rematchActionHtml;
        refs.duelDetail.classList.remove('hidden');
        renderDuelHome();
        renderDuelSubjectSelection();
        return;

        var playerCardsHtml =
          '<div class="duel-player-grid">'
          + renderDuelPlayerCard({
            variant: 'me',
            accent: myAccent,
            initials: getInitials(myName),
            role: 'Moi',
            name: myName,
            subtitle: myStage + (mySpecialty !== 'Spécialité non choisie' ? (' · ' + mySpecialty) : ''),
            score: myScore,
            stageToken: getStageToken(myProfile, state.myAvatar),
            specialtyToken: getSpecialtyToken(myProfile, state.myAvatar),
            sceneTitle: myNextStage ? ('Cap vers ' + myNextStage) : 'Parcours en cours',
            sceneCaption: myLoadout.length
              ? ('Equipement actif: ' + myLoadout.join(' · '))
              : 'Ton avatar progresse avec tes sessions et tes duels.',
            sceneTokens: mySceneTokens,
            tags: [
              { label: isMyTurn ? 'À toi de jouer' : 'En attente', tone: isMyTurn ? 'default' : 'neutral' },
              { label: myJokerUsed ? 'Joker utilisé' : 'Joker dispo', tone: myJokerUsed ? 'warn' : 'default' }
            ],
            facts: [
              { label: 'Stade', value: myStage },
              { label: 'Spécialité', value: mySpecialty },
              { label: myNextStage ? 'Cap suivant' : 'XP avatar', value: myNextStage || String(state.myAvatar && state.myAvatar.xpPoints != null ? state.myAvatar.xpPoints : 0) }
            ]
          })
          + renderDuelPlayerCard({
            variant: 'opponent',
            accent: opponentAccent,
            initials: getInitials(opponentName),
            role: 'Adversaire',
            name: opponentName,
            subtitle: opponentStage + (opponentSpecialty !== 'Spécialité non visible' ? (' · ' + opponentSpecialty) : ''),
            score: opponentScore,
            stageToken: getStageToken(opponentProfile, null),
            specialtyToken: getSpecialtyToken(opponentProfile, null),
            sceneTitle: opponentLoadout.length ? 'Style détecté' : 'Parcours observé',
            sceneCaption: opponentLoadout.length
              ? ('Equipement visible: ' + opponentLoadout.join(' · '))
              : 'Les détails visuels évoluent au fil de sa progression.',
            sceneTokens: opponentSceneTokens,
            tags: [
              { label: isMyTurn ? 'Attend ta réponse' : 'Joue maintenant', tone: isMyTurn ? 'neutral' : 'default' },
              { label: opponentJokerUsed ? 'Joker utilisé' : 'Joker dispo', tone: opponentJokerUsed ? 'warn' : 'default' }
            ],
            facts: [
              { label: 'Stade', value: opponentStage },
              { label: 'Spécialité', value: opponentSpecialty },
              {
                label: 'Style',
                value: opponentLoadout.length ? opponentLoadout.join(' · ') : 'Aucun équipement visible'
              }
            ]
          })
          + '</div>';

        var utilityActions = [];
        if (canForfeit) {
          utilityActions.push('<button class="btn-danger" data-duel-action="forfeit">Abandonner le duel</button>');
        }

        var roundBlockClass = 'duel-question' + (guideState.stageKey === 'round' ? ' is-current' : ' is-passive');
        var jokerBlockClass = 'duel-question' + ((pendingJoker || canRequestJoker || canRespondToPendingJoker) ? ' is-current' : ' is-passive');

        var roundBlock = '<div class="' + roundBlockClass + '"><div class="duel-section-kicker">Tour en cours</div><b>Manche courante</b><div class="mini">Charge la manche pour voir l’action suivante.</div></div>';
        if (state.currentRound) {
          var subjectsButtons = '';
          var chosenRoundSubjectName = '';
          var roundBadges = '';
          if (state.currentRound.chosenSubjectId && Array.isArray(state.currentRound.offeredSubjects)) {
            var chosenRoundSubject = state.currentRound.offeredSubjects.find(function (subject) {
              return subject.id === state.currentRound.chosenSubjectId;
            });
            chosenRoundSubjectName = chosenRoundSubject ? chosenRoundSubject.name : '';
          }
          if (!state.currentRound.chosenSubjectId) {
            subjectsButtons =
              '<div class="duel-subject-choice">'
              + '<div class="mini"><b>3 matières proposées</b></div>'
              + '<div class="mini">' + escapeHtml(
                isMyTurn
                  ? 'Choisis la matière que tu veux pour cette manche.'
                  : (starterName ? (starterName + ' choisit la matière parmi ces 3 propositions.') : 'Le joueur qui commence choisit la matière de cette manche.')
              ) + '</div>'
              + '<div class="duel-actions">' + (state.currentRound.offeredSubjects || []).map(function (s) {
                return '<button class="btn-secondary" data-duel-action="choose-subject" data-subject-id="' + escapeHtml(s.id) + '"' + (isMyTurn ? '' : ' disabled') + '>'
                  + escapeHtml(s.name)
                  + '</button>';
              }).join('') + '</div>'
              + '</div>';
          }

          var loadQuestionsBtn = '';
          if (state.currentRound.chosenSubjectId && isMyTurn) {
            loadQuestionsBtn = '<button class="btn-secondary" data-duel-action="load-round-questions">Préparer mon tour</button>';
          }

          var questionsHtml = '';
          if (state.roundQuestions.length) {
            var answeredSlotsCount = Object.keys(state.duelRoundAnsweredSlots || {}).length;
            questionsHtml =
              '<div class="mini">' + escapeHtml(String(Math.max(0, 3 - answeredSlotsCount))) + ' question(s) encore à jouer dans ce tour.</div>'
              + '<div class="duel-actions"><button class="btn-primary" data-duel-action="open-round-play"' + (isMyTurn ? '' : ' disabled') + '>Continuer mon tour</button></div>';
          }

          roundBadges =
            '<div class="duel-detail-badges">'
            + '<span class="chip neutral">Manche ' + escapeHtml(String(state.currentRound.roundNo)) + ' / 5</span>'
            + '<span class="chip' + (isMyTurn ? '' : ' neutral') + '">' + escapeHtml(isMyTurn ? 'À toi' : ('Tour de ' + opponentName)) + '</span>'
            + (chosenRoundSubjectName ? ('<span class="chip neutral">' + escapeHtml(chosenRoundSubjectName) + '</span>') : '')
            + '</div>';

          roundBlock =
            '<div class="' + roundBlockClass + '">'
            + '<div class="duel-section-kicker">Tour en cours</div>'
            + '<b>Manche ' + escapeHtml(String(state.currentRound.roundNo)) + ' · ' + escapeHtml(getDuelStatusLabel(state.currentRound.status)) + '</b>'
            + roundBadges
            + (starterLine ? ('<div class="mini"><b>' + escapeHtml(starterLine) + '</b></div>') : '')
            + (state.currentRound.chosenSubjectId
              ? '<div class="mini">La matière est fixée. Tu peux maintenant jouer le tour.</div>'
              : '<div class="mini">Choisis une matière parmi les propositions pour lancer la manche.</div>')
            + subjectsButtons
            + (loadQuestionsBtn ? ('<div style="margin-top:8px">' + loadQuestionsBtn + '</div>') : '')
            + (questionsHtml ? ('<div style="margin-top:8px; display:grid; gap:8px;">' + questionsHtml + '</div>') : '')
            + '</div>';
        }

        var jokerBlock = '<div class="' + jokerBlockClass + '"><div class="duel-section-kicker">Sursis</div><b>Joker 24h</b><div class="mini">Un joker maximum par joueur sur ce duel.</div></div>';
        if (d.status === 'in_progress') {
          var pendingHtml = '';
          if (pendingJoker) {
            if (canRespondToPendingJoker) {
              pendingHtml =
                '<div class="mini">Ton adversaire demande un sursis depuis le ' + escapeHtml(formatDateTime(pendingJoker.requestedAt)) + '.</div>'
                + '<div class="duel-actions">'
                + '<button class="btn-primary" data-duel-action="respond-joker-grant" data-joker-id="' + escapeHtml(pendingJoker.id) + '">Accorder 24h</button>'
                + '<button class="btn-danger" data-duel-action="respond-joker-reject" data-joker-id="' + escapeHtml(pendingJoker.id) + '">Refuser</button>'
                + '</div>';
            } else {
              pendingHtml = '<div class="mini">Une demande de sursis est déjà en attente depuis le ' + escapeHtml(formatDateTime(pendingJoker.requestedAt)) + '.</div>';
            }
          }

          var requestHtml = '';
          if (canRequestJoker) {
            requestHtml =
              '<label class="label" for="duelJokerReasonInput">Motif du sursis (optionnel)</label>'
              + '<textarea id="duelJokerReasonInput" rows="3" placeholder="Ex: trajet, garde, imprévu..."></textarea>'
              + '<div class="duel-actions"><button class="btn-secondary" data-duel-action="request-joker">Demander 24h de plus</button></div>';
          }

          var helperText = '';
          if (!pendingJoker && !canRequestJoker) {
            if (myJokerUsed) {
              helperText = '<div class="mini">Ton joker a déjà été utilisé dans ce duel.</div>';
            } else if (!isMyTurn) {
              helperText = '<div class="mini">Le joker ne peut être demandé que pendant ton propre tour.</div>';
            }
          }

          jokerBlock =
            '<div class="' + jokerBlockClass + '">'
            + '<div class="duel-section-kicker">Sursis</div>'
            + '<b>Joker 24h</b>'
            + '<div class="duel-detail-badges">'
            + '<span class="chip' + (myJokerUsed ? ' warn' : ' neutral') + '">Mon joker: ' + escapeHtml(myJokerUsed ? 'utilisé' : 'disponible') + '</span>'
            + '<span class="chip' + (opponentJokerUsed ? ' warn' : ' neutral') + '">Adverse: ' + escapeHtml(opponentJokerUsed ? 'utilisé' : 'disponible') + '</span>'
            + '</div>'
            + pendingHtml
            + requestHtml
            + helperText
            + '</div>';
        }

        refs.duelDetail.innerHTML =
          '<div class="duel-guide">'
          + '<div class="duel-hero">'
          + '<div class="duel-hero-top">'
          + '<div class="duel-hero-copy">'
          + '<div class="duel-hero-kicker">Ton duel du moment</div>'
          + '<div class="duel-hero-name">' + escapeHtml(opponentName) + '</div>'
          + '<div class="mini">' + escapeHtml(duelModeLabel) + ' · duel en cours.</div>'
          + (starterLine ? ('<div class="mini"><b>' + escapeHtml(starterLine) + '</b></div>') : '')
          + '</div>'
          + '<div class="duel-detail-badges"><span class="chip">' + escapeHtml(getDuelStatusLabel(d.status)) + '</span><span class="chip neutral">Temps restant: ' + escapeHtml(duelRemainingLabel) + '</span></div>'
          + '</div>'
          + '<div class="duel-scoreboard">'
          + '<div class="duel-score-col"><span>Toi</span><b>' + escapeHtml(String(myScore)) + '</b></div>'
          + '<div class="duel-score-vs">VS</div>'
          + '<div class="duel-score-col"><span>' + escapeHtml(opponentName) + '</span><b>' + escapeHtml(String(opponentScore)) + '</b></div>'
          + '</div>'
          + '<div class="duel-overview-grid">'
          + '<div class="duel-overview-card tour"><div class="k">Tour actuel</div><div class="v">' + escapeHtml(duelTurnLabel) + '</div><div class="s">' + escapeHtml(isMyTurn ? 'Tu peux agir maintenant.' : 'Tu reprends la main au prochain tour.') + '</div></div>'
          + '<div class="duel-overview-card manches"><div class="k">Manches</div><div class="v">' + escapeHtml(String(d.currentRoundNo)) + ' / 5</div><div class="s">' + escapeHtml('On avance manche par manche.') + '</div></div>'
          + '<div class="duel-overview-card status"><div class="k">Statut</div><div class="v">' + escapeHtml(duelResultLabel) + '</div><div class="s">' + escapeHtml(getDuelStatusLabel(d.status)) + '</div></div>'
          + '</div>'
          + '</div>'
          + '<div class="duel-guide-focus">'
          + '<div class="duel-guide-focus-top">'
          + '<div class="duel-guide-kicker">Ce qu\'il faut faire maintenant</div>'
          + '<div class="duel-guide-title">' + escapeHtml(guideState.title) + '</div>'
          + '<div class="duel-guide-copy">' + escapeHtml(guideState.detail) + '</div>'
          + '</div>'
          + (guideActions.primary.length ? ('<div class="duel-guide-primary">' + guideActions.primary.join('') + '</div>') : '')
          + (guideActions.secondary.length ? ('<div class="duel-guide-secondary">' + guideActions.secondary.join('') + '</div>') : '')
          + (guideActions.hint ? ('<div class="duel-guide-hint">' + escapeHtml(guideActions.hint) + '</div>') : '')
          + '</div>'
          + playerCardsHtml
          + '<div class="duel-stage-list">' + stageListHtml + '</div>'
          + '<div class="duel-round-strip">' + roundsStripHtml + '</div>'
          + (utilityActions.length ? ('<div class="duel-detail-utility">' + utilityActions.join('') + '</div>') : '')
          + jokerBlock
          + roundBlock;
        renderDuelHome();
      }

      function renderNotifications() {
        if (!state.token) {
          refs.notificationsUnreadChip.className = 'chip';
          refs.notificationsUnreadChip.textContent = '0 non lues';
          refs.notificationsList.innerHTML = '<div class="muted">Connecte-toi pour voir tes notifications.</div>';
          return;
        }

        var unreadCount = state.notifications.filter(function (item) {
          return item.status !== 'read';
        }).length;

        refs.notificationsUnreadChip.className = unreadCount > 0 ? 'chip warn' : 'chip';
        refs.notificationsUnreadChip.textContent = unreadCount > 0
          ? (unreadCount + ' non lue' + (unreadCount > 1 ? 's' : ''))
          : 'Tout lu';

        if (!state.notifications.length) {
          refs.notificationsList.innerHTML = '<div class="muted">Aucune notification pour le moment.</div>';
          return;
        }

        refs.notificationsList.innerHTML = state.notifications.map(function (item) {
          var payload = item.payload && typeof item.payload === 'object' ? item.payload : {};
          var duelId = typeof payload.duelId === 'string' ? payload.duelId : '';
          var isUnread = item.status !== 'read';
          var openBtn = duelId
            ? '<button class="btn-primary btn-inline" data-notification-action="open" data-notification-id="' + escapeHtml(item.id) + '">Ouvrir duel</button>'
            : '';
          var readBtn = isUnread
            ? '<button class="btn-secondary btn-inline" data-notification-action="read" data-notification-id="' + escapeHtml(item.id) + '">Marquer lu</button>'
            : '';

          return '<div class="notification-item' + (isUnread ? ' unread' : '') + '">'
            + '<div class="notification-top">'
            + '<div><b>' + escapeHtml(getNotificationTypeLabel(item.type)) + '</b></div>'
            + '<span class="' + (isUnread ? 'chip warn' : 'chip') + '">' + escapeHtml(getNotificationStatusLabel(item.status)) + '</span>'
            + '</div>'
            + '<div class="notification-body">' + escapeHtml(getNotificationSummary(item)) + '</div>'
            + '<div class="notification-meta">'
            + '<span>' + escapeHtml(formatDateTime(item.createdAt)) + '</span>'
            + '<span>' + escapeHtml(duelId ? ('Duel ' + duelId.slice(0, 8)) : 'Notification générale') + '</span>'
            + '</div>'
            + ((openBtn || readBtn) ? ('<div class="notification-actions">' + openBtn + readBtn + '</div>') : '')
            + '</div>';
        }).join('');
      }

      function renderNotificationToasts() {
        if (!state.notificationToasts.length) {
          refs.notificationToastStack.innerHTML = '';
          return;
        }

        refs.notificationToastStack.innerHTML = state.notificationToasts.map(function (item) {
          var payload = item.payload && typeof item.payload === 'object' ? item.payload : {};
          var duelId = typeof payload.duelId === 'string' ? payload.duelId : '';
          var openBtn = duelId
            ? '<button class="btn-primary btn-inline" data-toast-action="open" data-toast-id="' + escapeHtml(item.id) + '">Ouvrir</button>'
            : '<button class="btn-secondary btn-inline" data-toast-action="read" data-toast-id="' + escapeHtml(item.id) + '">Marquer lu</button>';

          return '<div class="toast-card">'
            + '<div class="toast-top">'
            + '<div><b>' + escapeHtml(getNotificationTypeLabel(item.type)) + '</b><div class="mini">' + escapeHtml(formatDateTime(item.createdAt)) + '</div></div>'
            + '<button class="toast-close" data-toast-action="dismiss" data-toast-id="' + escapeHtml(item.id) + '">×</button>'
            + '</div>'
            + '<div class="toast-body">' + escapeHtml(getNotificationSummary(item)) + '</div>'
            + '<div class="toast-actions">' + openBtn + '</div>'
            + '</div>';
        }).join('');
      }

      function dismissNotificationToast(notificationId) {
        if (!notificationId) {
          return;
        }
        if (notificationToastTimers[notificationId]) {
          clearTimeout(notificationToastTimers[notificationId]);
          delete notificationToastTimers[notificationId];
        }
        state.notificationToasts = state.notificationToasts.filter(function (item) {
          return item.id !== notificationId;
        });
        renderNotificationToasts();
      }

      function enqueueNotificationToasts(items) {
        if (!Array.isArray(items) || !items.length) {
          return;
        }

        var fresh = items.filter(function (item) {
          return !state.notificationToasts.some(function (current) {
            return current.id === item.id;
          });
        }).slice(0, 3);

        if (!fresh.length) {
          return;
        }

        state.notificationToasts = fresh.concat(state.notificationToasts).slice(0, 3);
        renderNotificationToasts();

        fresh.forEach(function (item) {
          if (notificationToastTimers[item.id]) {
            clearTimeout(notificationToastTimers[item.id]);
          }
          notificationToastTimers[item.id] = window.setTimeout(function () {
            dismissNotificationToast(item.id);
          }, 9000);
        });
      }

      async function loadNotifications(options) {
        if (!state.token) {
          state.notifications = [];
          state.notificationSeeded = false;
          renderNotifications();
          renderDuelHome();
          renderNotificationShortcut();
          renderNotificationToasts();
          renderDashboardCards();
          renderSettingsSummary();
          return;
        }
        var previousIds = state.notifications.map(function (item) { return item.id; });
        var result = await api('/notifications?limit=12');
        var nextItems = result.items || [];
        var newItems = [];
        if (state.notificationSeeded) {
          newItems = nextItems.filter(function (item) {
            return item.status !== 'read' && previousIds.indexOf(item.id) === -1;
          });
        }
        state.notifications = nextItems;
        state.notificationSeeded = true;
        renderNotifications();
        renderDuelHome();
        renderNotificationShortcut();
        renderDashboardCards();
        renderSettingsSummary();
        if (newItems.length) {
          enqueueNotificationToasts(newItems);
        }
        if (!(options && options.silent)) {
          setStatus('Notifications rafraîchies.', 'info');
        }
      }

      async function markNotificationRead(notificationId, options) {
        if (!notificationId) {
          return;
        }
        var result = await api('/notifications/' + notificationId + '/read', { method: 'POST' });
        state.notifications = state.notifications.map(function (item) {
          if (item.id !== notificationId) {
            return item;
          }
          return {
            id: item.id,
            type: item.type,
            status: result.status,
            payload: item.payload,
            createdAt: item.createdAt,
            sentAt: item.sentAt,
            readAt: result.readAt
          };
        });
        renderNotifications();
        renderDuelHome();
        renderNotificationShortcut();
        dismissNotificationToast(notificationId);
        if (!(options && options.silent)) {
          setStatus('Notification marquée comme lue.', 'ok');
        }
      }

      function stopNotificationPolling() {
        if (notificationPollHandle) {
          clearInterval(notificationPollHandle);
          notificationPollHandle = null;
        }
      }

      function startNotificationPolling() {
        stopNotificationPolling();
        if (!state.token) {
          return;
        }
        notificationPollHandle = window.setInterval(function () {
          loadNotifications({ silent: true }).catch(function () {
            // silent polling errors: manual refresh stays available
          });
        }, 30000);
      }

      async function openNotification(notificationId) {
        var item = state.notifications.find(function (current) {
          return current.id === notificationId;
        });
        if (!item) {
          throw new Error('Notification introuvable.');
        }

        if (item.status !== 'read') {
          await markNotificationRead(notificationId, { silent: true });
        }
        dismissNotificationToast(notificationId);

        var payload = item.payload && typeof item.payload === 'object' ? item.payload : {};
        var duelId = typeof payload.duelId === 'string' ? payload.duelId : '';
        if (duelId && isUuidV4(duelId)) {
          await loadDuels();
          await loadDuelDetail(duelId);
          setActiveScreen('duel');
          setDuelFlow('detail');
          if (state.selectedDuel && state.selectedDuel.status === 'in_progress') {
            try {
              await loadCurrentRound();
            } catch (err) {
              // duel can change state between two requests, keep current detail loaded
            }
          }
          setStatus('Notification ouverte: duel chargé.', 'info');
          return;
        }

        setStatus('Notification ouverte.', 'info');
      }

      async function loadDuels() {
        if (!state.token) {
          state.duels = [];
          renderDuelsList();
          renderDashboardCards();
          renderSettingsSummary();
          return;
        }
        var status = getDuelStatusFilterParam();
        var path = '/duels' + (status ? ('?status=' + encodeURIComponent(status)) : '');
        var result = await api(path);
        state.duels = result.items || [];
        renderDuelsList();
        renderDashboardCards();
        renderSettingsSummary();
      }

      async function loadDuelDetail(duelId) {
        if (!duelId) {
          return;
        }
        state.selectedDuelId = duelId;
        resetDuelTransientView();
        state.selectedDuel = await api('/duels/' + duelId);
        renderDuelsList();
        renderDuelDetail();
        setDuelFlow('detail');
        if (state.selectedDuel && state.selectedDuel.status === 'in_progress') {
          try {
            await loadCurrentRound();
          } catch (err) {
            // keep duel detail visible even if current round cannot be loaded yet
          }
        }
      }

      async function simulateOpponentTurnFromUi() {
        if (!state.selectedDuelId) {
          throw new Error('Sélectionne un duel.');
        }
        var result = await api('/demo/duels/' + state.selectedDuelId + '/simulate-opponent-turn', {
          method: 'POST'
        });
        await loadDuels();
        await loadDuelDetail(state.selectedDuelId);
        var updatedDuel = result && result.duel ? result.duel : state.selectedDuel;
        if (updatedDuel && updatedDuel.status === 'completed') {
          setStatus('Tour adverse simulé. Le duel est terminé.', 'ok');
          return;
        }
        setStatus('Tour adverse simulé. Tu peux reprendre.', 'ok');
      }

      async function createRematchFromUi() {
        if (!state.selectedDuel) {
          throw new Error('Sélectionne un duel terminé.');
        }
        var meId = state.me && state.me.id ? state.me.id : '';
        var opponentUserId = getDuelOpponentUserId(state.selectedDuel, meId);
        if (!opponentUserId) {
          throw new Error('Adversaire introuvable pour la revanche.');
        }
        var result = await api('/duels', {
          method: 'POST',
          body: {
            matchmakingMode: 'random_free',
            opponentUserId: opponentUserId
          }
        });
        await loadDuels();
        if (result && result.duelId) {
          await loadDuelDetail(result.duelId);
          setDuelFlow('detail');
        }
        setStatus('Nouveau duel lancé contre le même adversaire.', 'ok');
      }

      async function createDuelFromUi() {
        var mode = refs.duelModeSelect.value;
        var body = { matchmakingMode: mode };
        if (mode === 'friend_invite') {
          var opponent = refs.duelOpponentInput.value.trim();
          if (!isUuidV4(opponent)) {
            throw new Error('UUID adversaire invalide pour un duel ami.');
          }
          body.opponentUserId = opponent;
        }
        var result = await api('/duels', { method: 'POST', body: body });
        await loadDuels();
        if (result && result.duelId) {
          await loadDuelDetail(result.duelId);
        }
        setDuelFlow(result && result.duelId ? 'detail' : 'inbox');
        setStatus('Duel créé: ' + getDuelModeLabel(mode) + '.', 'ok');
      }

      async function loadOpenerQuestion() {
        if (!state.selectedDuelId) {
          throw new Error('Sélectionne un duel.');
        }
        var result = await api('/duels/' + state.selectedDuelId + '/opener');
        state.openerQuestion = result.question;
        state.openerShownAt = Date.now();
        renderDuelDetail();
        startDuelPlay('opener');
      }

      async function answerOpenerFromUi() {
        if (!state.selectedDuelId || !state.openerQuestion) {
          throw new Error('Charge l\'opener d\'abord.');
        }
        var selected = refs.duelPlayContent.querySelector('input[name="duelPlayChoice"]:checked');
        if (!selected) {
          throw new Error('Choisis une réponse pour l\'opener.');
        }
        var payload = {
          selectedChoiceId: selected.value,
          responseTimeMs: Math.max(1, Math.round(Date.now() - state.openerShownAt))
        };
        var result = await api('/duels/' + state.selectedDuelId + '/opener/answer', {
          method: 'POST',
          body: payload
        });
        await loadDuelDetail(state.selectedDuelId);
        if (state.selectedDuel && state.selectedDuel.status === 'in_progress') {
          await loadCurrentRound();
        }
        setDuelFlow('detail');
        if (result.starterPolicy === 'random' && result.resolved) {
          setStatus('Opener résolu. La main de départ a été tirée au sort.', 'ok');
          return;
        }
        setStatus(result.resolved ? 'Opener résolu.' : 'Réponse opener enregistrée.', 'ok');
      }

      async function decideOpenerFromUi(decision) {
        if (!state.selectedDuelId) {
          throw new Error('Sélectionne un duel.');
        }
        await api('/duels/' + state.selectedDuelId + '/opener/decision', {
          method: 'POST',
          body: { decision: decision }
        });
        await loadDuelDetail(state.selectedDuelId);
        await loadCurrentRound();
        setStatus('Décision opener appliquée.', 'ok');
      }

      async function loadCurrentRound() {
        if (!state.selectedDuelId) {
          throw new Error('Sélectionne un duel.');
        }
        state.currentRound = await api('/duels/' + state.selectedDuelId + '/rounds/current');
        state.roundQuestions = [];
        state.roundQuestionShownAtBySlot = {};
        renderDuelDetail();
        renderDuelSubjectSelection();
      }

      async function chooseCurrentRoundSubject(subjectId) {
        if (!state.selectedDuelId || !state.currentRound) {
          throw new Error('Charge la manche courante d\'abord.');
        }
        await api('/duels/' + state.selectedDuelId + '/rounds/' + state.currentRound.roundNo + '/choose-subject', {
          method: 'POST',
          body: { subjectId: subjectId }
        });
        await loadDuelDetail(state.selectedDuelId);
        await loadCurrentRound();
        setStatus('Matière de manche choisie.', 'ok');
        await loadRoundQuestions();
      }

      async function loadRoundQuestions() {
        if (!state.selectedDuelId || !state.currentRound) {
          throw new Error('Charge la manche courante d\'abord.');
        }
        await refreshRoundQuestionsForPlay();
        state.roundQuestionShownAtBySlot = {};
        state.duelRoundAnsweredSlots = {};
        state.duelPlayReview = null;
        (state.roundQuestions || []).forEach(function (q) {
          state.roundQuestionShownAtBySlot[String(q.slotNo)] = Date.now();
        });
        if (state.roundQuestions.length < 3) {
          setStatus('Tour duel chargé, mais moins de 3 questions ont été reçues.', 'warn');
        }
        renderDuelDetail();
        startDuelPlay('round');
      }

      async function submitRoundAnswerFromUi(slotNo, questionId) {
        if (!state.selectedDuelId || !state.currentRound) {
          throw new Error('Charge la manche courante d\'abord.');
        }
        var selected = refs.duelPlayContent.querySelector('input[name="duelPlayChoice"]:checked');
        if (!selected) {
          throw new Error('Choisis une réponse pour le slot ' + slotNo + '.');
        }
        var startedAt = Number(state.roundQuestionShownAtBySlot[String(slotNo)] || Date.now());
        var payload = {
          slotNo: Number(slotNo),
          questionId: questionId,
          selectedChoiceId: selected.value,
          responseTimeMs: Math.max(1, Math.round(Date.now() - startedAt))
        };
        var result = await api('/duels/' + state.selectedDuelId + '/rounds/' + state.currentRound.roundNo + '/answers', {
          method: 'POST',
          body: payload
        });
        state.duelRoundAnsweredSlots[String(slotNo)] = {
          questionId: questionId,
          isCorrect: !!(result.answerResult && result.answerResult.isCorrect)
        };
        state.duelPlayReview = {
          slotNo: Number(slotNo),
          questionId: questionId,
          selectedChoiceId: selected.value,
          isCorrect: !!(result.answerResult && result.answerResult.isCorrect),
          correctChoiceId: result.answerResult ? result.answerResult.correctChoiceId : null,
          explanation: result.answerResult ? result.answerResult.explanation : '',
          turnCompleted: !!result.turnCompleted,
          answeredSlots: result.roundProgress ? Number(result.roundProgress.answeredSlots || 0) : null,
          remainingSlots: result.roundProgress ? Number(result.roundProgress.remainingSlots || 0) : null
        };
        renderDuelPlay();
        var resultTone = result.answerResult && result.answerResult.isCorrect ? 'ok' : 'info';
        setStatus('Réponse duel enregistrée (slot ' + slotNo + ').', resultTone);
      }

      async function requestJokerFromUi() {
        if (!state.selectedDuelId || !state.selectedDuel) {
          throw new Error('Sélectionne un duel.');
        }
        var reasonInput = refs.duelDetail.querySelector('#duelJokerReasonInput');
        var reason = reasonInput ? String(reasonInput.value || '').trim() : '';
        var payload = {};
        if (reason) {
          payload.reason = reason;
        }
        await api('/duels/' + state.selectedDuelId + '/jokers/request', {
          method: 'POST',
          body: payload
        });
        await loadDuels();
        await loadDuelDetail(state.selectedDuelId);
        setStatus('Demande de sursis envoyée.', 'ok');
      }

      async function respondJokerFromUi(jokerId, decision) {
        if (!state.selectedDuelId) {
          throw new Error('Sélectionne un duel.');
        }
        if (!jokerId) {
          throw new Error('Joker introuvable.');
        }
        await api('/duels/' + state.selectedDuelId + '/jokers/' + jokerId + '/respond', {
          method: 'POST',
          body: { decision: decision }
        });
        await loadDuels();
        await loadDuelDetail(state.selectedDuelId);
        setStatus(
          decision === 'grant' ? 'Sursis accordé.' : 'Sursis refusé.',
          decision === 'grant' ? 'ok' : 'info'
        );
      }

      function getGoalFromUi() {
        var stopRule = refs.stopRuleSelect.value;
        if (stopRule === 'fixed_10') {
          return { stopRule: stopRule, target: 10 };
        }
        if (stopRule === 'fixed_custom') {
          var customTarget = Number(refs.targetCountInput.value || '0');
          return { stopRule: stopRule, target: Number.isFinite(customTarget) && customTarget > 0 ? customTarget : null };
        }
        return { stopRule: stopRule, target: null };
      }

      function getGoalFromSession() {
        if (!state.session) {
          return null;
        }
        if (state.session.stopRule === 'fixed_10') {
          return { stopRule: state.session.stopRule, target: 10 };
        }
        if (state.session.stopRule === 'fixed_custom') {
          return { stopRule: state.session.stopRule, target: Number(state.session.targetQuestionCount || 0) || null };
        }
        return { stopRule: state.session.stopRule, target: null };
      }

      function renderSessionGoal() {
        var config = getGoalFromSession() || getGoalFromUi();
        var attempts = state.session && state.session.progress ? Number(state.session.progress.attempts || 0) : 0;

        if (config && config.target) {
          var pct = Math.max(0, Math.min(100, Math.round((attempts / config.target) * 100)));
          refs.sessionGoalLabel.textContent = 'Objectif: ' + config.target + ' questions';
          refs.sessionGoalChip.textContent = attempts + '/' + config.target;
          refs.sessionGoalProgressBar.style.width = pct + '%';
          return;
        }

        refs.sessionGoalLabel.textContent = 'Objectif: session libre';
        refs.sessionGoalChip.textContent = 'Libre';
        refs.sessionGoalProgressBar.style.width = '0%';
      }

      function renderCompletion() {
        if (!state.lastCompletedSession) {
          refs.completionSection.classList.add('hidden');
          refs.completionContent.innerHTML = '';
          return;
        }

        var result = state.lastCompletedSession;
        var attempts = Number(result.attempts || 0);
        var correct = Number(result.correct || 0);
        var successRate = attempts > 0 ? Math.round((correct / attempts) * 1000) / 10 : 0;
        var mood = getCompletionMood(successRate);
        var badgeClass = successRate >= 70 ? 'completion-badge' : 'completion-badge warn';
        var insights = getCompletionInsights();
        var actions = getCompletionActions(successRate);
        var actionsHtml = actions.map(function (item) {
          return '<button class="btn-primary completion-action-btn" data-completion-action="' + escapeHtml(item.key) + '">' + escapeHtml(item.label) + '</button>';
        }).join('');

        refs.completionSection.classList.remove('hidden');
        refs.completionContent.innerHTML =
          '<div class="completion-hero">'
          + '<div class="completion-hero-copy">'
          + '<div class="' + badgeClass + '">' + escapeHtml(mood.badge) + '</div>'
          + '<div class="completion-hero-title">Félicitations, tu as terminé la session</div>'
          + '<div class="completion-hero-note">' + escapeHtml(mood.note) + '</div>'
          + '</div>'
          + '<div class="completion-hero-score">'
          + '<div class="k">Taux de réussite</div>'
          + '<div class="v">' + escapeHtml(String(successRate)) + '%</div>'
          + '<div class="n">' + escapeHtml(mood.scoreNote) + '</div>'
          + '</div>'
          + '</div>'
          + '<div class="completion-kpis">'
          + '<div class="completion-kpi"><div class="k">Bonnes réponses</div><div class="v">' + escapeHtml(String(correct)) + '</div></div>'
          + '<div class="completion-kpi"><div class="k">Tentatives</div><div class="v">' + escapeHtml(String(attempts)) + '</div></div>'
          + '<div class="completion-kpi"><div class="k">Taux de réussite</div><div class="v">' + escapeHtml(String(successRate)) + '%</div></div>'
          + '</div>'
          + '<div class="completion-insight-grid">'
          + '<div class="completion-insight-card">'
          + '<div class="completion-insight-head"><b>Ce qui t’a le mieux réussi</b><span>' + escapeHtml(insights.byChapter ? 'Les chapitres les mieux tenus pendant cette session.' : 'Les matières où ton niveau ressort le plus solidement en ce moment.') + '</span></div>'
          + renderCompletionStrengths(insights.strengths)
          + '</div>'
          + '<div class="completion-insight-card priority">'
          + '<div class="completion-insight-head"><b>À axer sur la prochaine révision</b><span>' + escapeHtml(insights.byChapter ? 'Voici les chapitres précis à rouvrir en priorité.' : 'Les matières où un petit effort ciblé aura le plus d’impact.') + '</span></div>'
          + renderCompletionPriorities(insights.priorities)
          + '</div>'
          + '</div>'
          + (actionsHtml ? ('<div class="completion-actions">' + actionsHtml + '</div>') : '')
          + '<div class="completion-summary"><div class="muted">Tu peux repartir sur une nouvelle session juste après, avec une direction beaucoup plus claire.</div></div>';
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
            renderSetupGuide();
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
            renderSetupGuide();
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
        state.lastSessionSetup = {
          mode: mode,
          stopRule: stopRule,
          targetQuestionCount: body.targetQuestionCount || null,
          subjectIds: subjectIds.slice(),
          chapterIds: chapterIds.slice()
        };
        state.session = session;
        state.history = [];
        state.lastCompletedSession = null;
        state.currentAnswerReview = null;
        renderCompletion();
        renderHistory();
        renderSessionSummary();
        setTrainingFlow('play');
        setActiveScreen('training');
        refs.completeSessionBtn.disabled = false;
        refs.nextQuestionBtn.disabled = false;
        refs.submitAnswerBtn.disabled = false;
        await refreshSessionAndQuestion();
        setStatus('Session démarrée.', 'ok');
      }

      async function refreshSessionAndQuestion() {
        clearReviewAutoAdvance();
        if (!state.session || !state.session.id) {
          return;
        }
        var sessionDetails = await api('/trainings/sessions/' + state.session.id);
        state.session = sessionDetails;
        renderSessionSummary();
        renderSessionGoal();

        var next = await api('/trainings/sessions/' + state.session.id + '/next-question');
        state.currentQuestion = next.item;
        state.currentAnswerReview = null;
        if (!state.currentQuestion) {
          await completeSession({ auto: true });
          return;
        }
        state.questionShownAt = Date.now();
        renderQuestion();
      }

      function clearReviewAutoAdvance() {
        if (reviewAutoAdvanceTimeout) {
          clearTimeout(reviewAutoAdvanceTimeout);
          reviewAutoAdvanceTimeout = null;
        }
        if (reviewAutoAdvanceTick) {
          clearInterval(reviewAutoAdvanceTick);
          reviewAutoAdvanceTick = null;
        }
      }

      function clearDuelPlayAutoAdvance() {
        if (duelPlayAutoAdvanceTimeout) {
          clearTimeout(duelPlayAutoAdvanceTimeout);
          duelPlayAutoAdvanceTimeout = null;
        }
        if (duelPlayAutoAdvanceTick) {
          clearInterval(duelPlayAutoAdvanceTick);
          duelPlayAutoAdvanceTick = null;
        }
      }

      function getReviewAutoAdvanceMs(review) {
        return review && review.isCorrect ? REVIEW_AUTO_ADVANCE_OK_MS : REVIEW_AUTO_ADVANCE_ERR_MS;
      }

      function getDuelPlayAutoAdvanceMs(review) {
        if (review && (review.turnCompleted || review.remainingSlots === 0)) {
          return 5000;
        }
        return review && review.isCorrect ? REVIEW_AUTO_ADVANCE_OK_MS : REVIEW_AUTO_ADVANCE_ERR_MS;
      }

      function syncReviewAutoAdvanceUi(deadlineAt, durationMs) {
        var label = document.getElementById('autoAdvanceLabel');
        var bar = document.getElementById('autoAdvanceBar');
        if (!label || !bar) {
          return;
        }
        var remainingMs = Math.max(0, deadlineAt - Date.now());
        var remainingSeconds = remainingMs > 0 ? Math.max(1, Math.ceil(remainingMs / 1000)) : 0;
        label.textContent = remainingSeconds > 0
          ? ('Passage automatique dans ' + remainingSeconds + ' s')
          : 'Passage automatique…';
        bar.style.width = ((remainingMs / durationMs) * 100) + '%';
      }

      function syncDuelPlayAutoAdvanceUi(deadlineAt, durationMs) {
        var label = document.getElementById('duelAutoAdvanceLabel');
        var bar = document.getElementById('duelAutoAdvanceBar');
        if (!label || !bar) {
          return;
        }
        var remainingMs = Math.max(0, deadlineAt - Date.now());
        var remainingSeconds = remainingMs > 0 ? Math.max(1, Math.ceil(remainingMs / 1000)) : 0;
        var returnToDuel = Boolean(
          state.duelPlayReview
          && (state.duelPlayReview.turnCompleted || state.duelPlayReview.remainingSlots === 0)
        );
        label.textContent = remainingSeconds > 0
          ? ((returnToDuel ? 'Retour au duel dans ' : 'Suite automatique dans ') + remainingSeconds + ' s')
          : (returnToDuel ? 'Retour au duel…' : 'Suite automatique…');
        bar.style.width = ((remainingMs / durationMs) * 100) + '%';
      }

      function startReviewAutoAdvance() {
        clearReviewAutoAdvance();
        if (!state.currentAnswerReview || !state.currentQuestion || !state.session || !state.session.id) {
          return;
        }
        var durationMs = getReviewAutoAdvanceMs(state.currentAnswerReview);
        var deadlineAt = Date.now() + durationMs;
        syncReviewAutoAdvanceUi(deadlineAt, durationMs);
        reviewAutoAdvanceTick = window.setInterval(function () {
          syncReviewAutoAdvanceUi(deadlineAt, durationMs);
        }, 100);
        reviewAutoAdvanceTimeout = window.setTimeout(async function () {
          clearReviewAutoAdvance();
          try {
            await refreshSessionAndQuestion();
            setStatus('Question suivante chargée.', 'info');
          } catch (err) {
            setStatus(err.message || String(err), 'err');
          }
        }, durationMs);
      }

      function startDuelPlayAutoAdvance() {
        clearDuelPlayAutoAdvance();
        if (!state.duelPlayReview || state.duelFlow !== 'play') {
          return;
        }
        var durationMs = getDuelPlayAutoAdvanceMs(state.duelPlayReview);
        var deadlineAt = Date.now() + durationMs;
        syncDuelPlayAutoAdvanceUi(deadlineAt, durationMs);
        duelPlayAutoAdvanceTick = window.setInterval(function () {
          syncDuelPlayAutoAdvanceUi(deadlineAt, durationMs);
        }, 100);
        duelPlayAutoAdvanceTimeout = window.setTimeout(async function () {
          clearDuelPlayAutoAdvance();
          try {
            await advanceDuelPlay();
          } catch (err) {
            setStatus(err.message || String(err), 'err');
          }
        }, durationMs);
      }

      function renderQuestion() {
        var q = state.currentQuestion;
        var review = state.currentAnswerReview && q && state.currentAnswerReview.questionId === q.id
          ? state.currentAnswerReview
          : null;
        if (!q) {
          clearReviewAutoAdvance();
          refs.questionContainer.classList.remove('hidden');
          refs.questionContainer.classList.add('empty');
          if (!state.session) {
            refs.questionContainer.innerHTML = '<div class="q-empty-title">Lance une session pour entrer dans le vif du sujet</div>'
              + '<div class="q-empty-copy">Le studio de question affichera ici la prochaine question, son format, et les consignes utiles pour répondre sans te disperser.</div>';
            refs.questionActions.classList.add('hidden');
            refs.questionExitRow.classList.add('hidden');
            refs.submitAnswerBtn.disabled = true;
            refs.nextQuestionBtn.disabled = true;
            refs.nextQuestionBtn.classList.add('hidden');
            refs.submitAnswerBtn.textContent = 'Valider la réponse';
            refs.completeSessionBtn.textContent = 'Terminer session';
            return;
          }
          refs.questionContainer.innerHTML = '<div class="q-empty-title">Félicitations, tu as terminé la session</div>'
            + '<div class="q-empty-copy">Le débrief va te montrer ton résultat, ce que tu maîtrises déjà le mieux et les matières sur lesquelles axer la suite.</div>';
          refs.questionActions.classList.add('hidden');
          refs.questionExitRow.classList.remove('hidden');
          refs.submitAnswerBtn.disabled = true;
          refs.nextQuestionBtn.disabled = true;
          refs.nextQuestionBtn.classList.add('hidden');
          refs.submitAnswerBtn.textContent = 'Valider la réponse';
          refs.completeSessionBtn.textContent = 'Voir mon résultat';
          refs.completeSessionBtn.disabled = false;
          return;
        }

        refs.questionContainer.classList.remove('empty');
        refs.questionActions.classList.remove('hidden');
        refs.questionExitRow.classList.remove('hidden');
        refs.completeSessionBtn.textContent = 'Terminer session';

        var type = q.questionType;
        var choicesHtml = '';
        var feedbackHtml = '';
        var selectedChoiceIds = review && Array.isArray(review.selectedChoiceIds) ? review.selectedChoiceIds : [];
        var selectedOpenText = review && typeof review.openTextAnswer === 'string' ? review.openTextAnswer : '';
        var correctChoiceIds = review && review.correction && Array.isArray(review.correction.correctChoiceIds)
          ? review.correction.correctChoiceIds
          : [];
        var choicesDisabledAttr = review ? ' disabled' : '';

        if (type === 'single_choice') {
          choicesHtml = '<div class="choice-list">' + q.choices.map(function (c, index) {
            var isSelected = selectedChoiceIds.indexOf(c.id) >= 0;
            var isCorrectChoice = correctChoiceIds.indexOf(c.id) >= 0;
            var checked = isSelected ? ' checked' : '';
            var reviewClass = '';
            var reviewBadge = '';
            if (review) {
              if (review.isCorrect) {
                if (isCorrectChoice && isSelected) {
                  reviewClass = ' is-review-correct-picked';
                  reviewBadge = '<span class="choice-state ok">Ta réponse</span>';
                } else if (isCorrectChoice) {
                  reviewClass = ' is-review-correct';
                  reviewBadge = '<span class="choice-state ok">Bonne réponse</span>';
                } else if (isSelected) {
                  reviewClass = ' is-review-wrong';
                  reviewBadge = '<span class="choice-state err">Ton choix</span>';
                } else {
                  reviewClass = ' is-review-dim';
                }
              } else {
                if (isSelected) {
                  reviewClass = ' is-review-wrong';
                  reviewBadge = '<span class="choice-state err">Ton choix</span>';
                } else if (isCorrectChoice) {
                  reviewClass = ' is-review-miss';
                  reviewBadge = '<span class="choice-state solution">Bonne réponse</span>';
                } else {
                  reviewClass = ' is-review-dim';
                }
              }
            }
            return '<label class="choice' + reviewClass + '"><input type="radio" name="singleChoice" value="' + c.id + '"' + checked + choicesDisabledAttr + ' /> <span class="choice-badge">' + escapeHtml(getChoiceMarker(index)) + '</span><span class="choice-copy-wrap"><span class="choice-copy">' + escapeHtml(c.label) + '</span>' + reviewBadge + '</span></label>';
          }).join('') + '</div>';
        } else if (type === 'multi_choice') {
          choicesHtml = '<div class="choice-list">' + q.choices.map(function (c, index) {
            var isSelected = selectedChoiceIds.indexOf(c.id) >= 0;
            var isCorrectChoice = correctChoiceIds.indexOf(c.id) >= 0;
            var checked = isSelected ? ' checked' : '';
            var reviewClass = '';
            var reviewBadge = '';
            if (review) {
              if (review.isCorrect) {
                if (isCorrectChoice && isSelected) {
                  reviewClass = ' is-review-correct-picked';
                  reviewBadge = '<span class="choice-state ok">Bien coché</span>';
                } else if (isCorrectChoice) {
                  reviewClass = ' is-review-correct';
                  reviewBadge = '<span class="choice-state ok">À cocher</span>';
                } else if (isSelected) {
                  reviewClass = ' is-review-wrong';
                  reviewBadge = '<span class="choice-state err">À décocher</span>';
                } else {
                  reviewClass = ' is-review-dim';
                }
              } else {
                if (isCorrectChoice && isSelected) {
                  reviewClass = ' is-review-miss-picked';
                  reviewBadge = '<span class="choice-state solution">Bien coché</span>';
                } else if (isCorrectChoice) {
                  reviewClass = ' is-review-miss';
                  reviewBadge = '<span class="choice-state solution">À cocher</span>';
                } else if (isSelected) {
                  reviewClass = ' is-review-wrong';
                  reviewBadge = '<span class="choice-state err">À décocher</span>';
                } else {
                  reviewClass = ' is-review-dim';
                }
              }
            }
            return '<label class="choice' + reviewClass + '"><input type="checkbox" name="multiChoice" value="' + c.id + '"' + checked + choicesDisabledAttr + ' /> <span class="choice-badge">' + escapeHtml(getChoiceMarker(index)) + '</span><span class="choice-copy-wrap"><span class="choice-copy">' + escapeHtml(c.label) + '</span>' + reviewBadge + '</span></label>';
          }).join('') + '</div>';
        } else {
          choicesHtml = '<textarea id="openAnswerInput" class="open-answer-box" rows="4" placeholder="Écris ta réponse..."'
            + (review ? ' disabled' : '')
            + '>' + escapeHtml(selectedOpenText) + '</textarea>';
        }

        if (review) {
          var correctionText = '';
          var autoAdvanceSeconds = Math.round(getReviewAutoAdvanceMs(review) / 1000);
          if (review.correction && review.correction.questionType === 'open_text') {
            correctionText = '<div class="q-feedback-copy">Réponses attendues: ' + escapeHtml((review.correction.expectedAnswers || []).join(' · ')) + '</div>';
          } else if (!review.isCorrect && correctChoiceIds.length) {
            correctionText = '<div class="q-feedback-copy">La bonne réponse est maintenant mise en évidence juste en dessous.</div>';
          }
          feedbackHtml =
            '<div class="q-feedback ' + (review.isCorrect ? 'ok' : 'err') + '">'
            + '<div class="q-feedback-top">'
            + '<div class="q-feedback-title">' + (review.isCorrect ? 'Bonne réponse' : 'À retenir pour la suite') + '</div>'
            + '<span class="chip ' + (review.isCorrect ? '' : 'warn') + '">' + (review.isCorrect ? 'Bravo' : 'Corrigé') + '</span>'
            + '</div>'
            + '<div class="q-feedback-copy">' + escapeHtml(review.explanation || '') + '</div>'
            + correctionText
            + '</div>'
            + '<div class="q-auto-advance">'
            + '<div class="q-auto-advance-top"><span>Transition automatique</span><b id="autoAdvanceLabel">Passage automatique dans ' + autoAdvanceSeconds + ' s</b></div>'
            + '<div class="q-auto-advance-track"><div id="autoAdvanceBar" class="q-auto-advance-bar"></div></div>'
            + '</div>';
        }

        var currentAttemptNo = 1;
        if (state.session && state.session.progress) {
          var attemptsSoFar = Number(state.session.progress.attempts || 0);
          currentAttemptNo = review ? Math.max(1, attemptsSoFar) : (attemptsSoFar + 1);
        }
        var goal = getGoalFromSession();
        var stageProgressLabel = goal && goal.target
          ? ('Question ' + currentAttemptNo + ' / ' + goal.target)
          : ('Question ' + currentAttemptNo);
        var guidanceText = type === 'single_choice' ? '' : getQuestionInstruction(type);
        refs.questionContainer.classList.remove('hidden');
        refs.questionContainer.innerHTML =
          '<div class="q-focus-top">'
          + '<div class="q-progress-pill">' + escapeHtml(stageProgressLabel) + '</div>'
          + '<span class="chip neutral q-scope-chip">' + escapeHtml(getSessionScopeLabel()) + '</span>'
          + '</div>'
          + '<div class="q-question-card">'
          + '<div class="q-topic-line">'
          + '<div class="q-type">' + escapeHtml(getQuestionTypeLabel(type)) + '</div>'
          + '</div>'
          + '<h3 class="q-prompt" style="color:#ffffff;">' + escapeHtml(q.prompt) + '</h3>'
          + (guidanceText ? ('<div class="q-guidance">' + escapeHtml(guidanceText) + '</div>') : '')
          + '</div>'
          + '<div class="q-answer-shell">' + choicesHtml + '</div>'
          + feedbackHtml;

        if (review) {
          refs.submitAnswerBtn.classList.add('hidden');
          refs.submitAnswerBtn.disabled = true;
          refs.submitAnswerBtn.textContent = 'Valider la réponse';
          refs.nextQuestionBtn.classList.remove('hidden');
          refs.nextQuestionBtn.disabled = false;
          return;
        }

        clearReviewAutoAdvance();
        refs.nextQuestionBtn.classList.add('hidden');
        refs.nextQuestionBtn.disabled = true;
        refs.submitAnswerBtn.classList.remove('hidden');
        refs.submitAnswerBtn.disabled = false;
        refs.submitAnswerBtn.textContent = 'Valider la réponse';
      }

      async function submitAnswer() {
        if (!state.session || !state.currentQuestion) {
          return;
        }

        var q = state.currentQuestion;
        var selectedChoiceIds = [];
        var openTextAnswer = null;
        var payload = {
          questionId: q.id,
          responseTimeMs: Math.max(1, Math.round((Date.now() - state.questionShownAt) / 1))
        };

        if (q.questionType === 'single_choice') {
          var selected = refs.questionContainer.querySelector('input[name="singleChoice"]:checked');
          if (!selected) {
            throw new Error('Choisis une réponse.');
          }
          selectedChoiceIds = [selected.value];
          payload.selectedChoiceId = selected.value;
        } else if (q.questionType === 'multi_choice') {
          var selectedNodes = refs.questionContainer.querySelectorAll('input[name="multiChoice"]:checked');
          var ids = Array.prototype.map.call(selectedNodes, function (n) { return n.value; });
          if (!ids.length) {
            throw new Error('Choisis au moins une réponse.');
          }
          selectedChoiceIds = ids.slice();
          payload.selectedChoiceIds = ids;
        } else {
          var text = refs.questionContainer.querySelector('#openAnswerInput').value.trim();
          if (!text) {
            throw new Error('Saisis une réponse.');
          }
          openTextAnswer = text;
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
        if (state.session && state.session.progress) {
          state.session.progress.attempts = Number(state.session.progress.attempts || 0) + 1;
          if (result.isCorrect) {
            state.session.progress.correct = Number(state.session.progress.correct || 0) + 1;
          }
        }
        state.currentAnswerReview = {
          questionId: q.id,
          isCorrect: !!result.isCorrect,
          explanation: result.explanation,
          correction: result.correction || null,
          selectedChoiceIds: selectedChoiceIds,
          openTextAnswer: openTextAnswer
        };
        renderSessionSummary();
        renderSessionGoal();
        renderHistory();

        setStatus(result.isCorrect ? 'Bonne réponse.' : 'Réponse incorrecte.', result.isCorrect ? 'ok' : 'err');
        renderQuestion();
        startReviewAutoAdvance();
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
            + '<div class="history-top"><div class="history-prompt">' + escapeHtml(item.prompt) + '</div><div class="history-pill ' + (item.isCorrect ? 'ok' : 'err') + '">' + (item.isCorrect ? 'Correct' : 'Incorrect') + '</div></div>'
            + '<div class="muted">' + escapeHtml(item.explanation || '') + '</div>'
            + correctionText
            + '</div>';
        }).join('');
      }

      async function completeSession(options) {
        if (!state.session || !state.session.id) {
          return;
        }
        clearReviewAutoAdvance();
        var result = await api('/trainings/sessions/' + state.session.id + '/complete', { method: 'POST' });
        state.lastCompletedSession = result;
        refs.completeSessionBtn.disabled = true;
        refs.nextQuestionBtn.disabled = true;
        refs.submitAnswerBtn.disabled = true;
        state.session = null;
        state.currentQuestion = null;
        state.currentAnswerReview = null;
        renderSessionSummary();
        renderSessionGoal();
        renderSetupGuide();
        renderQuestion();
        await loadDashboard();
        renderCompletion();
        setTrainingFlow('result');
        setActiveScreen('training');
        if (!(options && options.auto)) {
          setStatus('Session terminée: ' + result.correct + '/' + result.attempts + ' correctes.', 'ok');
        }
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
        await loadMyAvatar();
        await loadAvatarSettingsData();
        await ensureDemoCatalogReady();
        await loadDashboard();
        await loadSubjects();
        renderSessionSummary();
        await loadNotifications({ silent: true });
        await loadDuels();
        startNotificationPolling();
        setDuelModeUi();
        setTrainingFlow('home');
        setDuelFlow('home');
        setActiveScreen('dashboard');
        setStatus('Prêt. Lance une session d\'entraînement.', 'info');
      }

      async function handleRegister() {
        try {
          setAuthPending('Création du compte');
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
        } finally {
          clearAuthPending();
        }
      }

      async function handleLogin() {
        try {
          setAuthPending('Connexion');
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
        } finally {
          clearAuthPending();
        }
      }

      refs.registerBtn.addEventListener('click', handleRegister);
      refs.loginBtn.addEventListener('click', handleLogin);

      refs.showLoginBtn.addEventListener('click', function () {
        setWelcomeAuthMode('login');
        setStatus('Entre ton email et ton mot de passe pour te connecter.', 'info');
      });

      refs.showRegisterBtn.addEventListener('click', function () {
        setWelcomeAuthMode('register');
        setStatus('Crée ton compte pour entrer dans MedQuiz.', 'info');
      });

      refs.welcomeBackBtn.addEventListener('click', function () {
        setWelcomeAuthMode('home');
        setStatus('Choisis simplement comment tu veux entrer.', 'info');
      });

      refs.passwordInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (state.welcomeAuthMode === 'register') {
            handleRegister();
          } else {
            handleLogin();
          }
        }
      });

      refs.emailInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (state.welcomeAuthMode === 'register') {
            handleRegister();
          } else {
            handleLogin();
          }
        }
      });

      refs.displayNameInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleRegister();
        }
      });

      refs.logoutBtn.addEventListener('click', function () {
        stopNotificationPolling();
        clearReviewAutoAdvance();
        Object.keys(notificationToastTimers).forEach(function (id) {
          clearTimeout(notificationToastTimers[id]);
          delete notificationToastTimers[id];
        });
        saveToken('');
        state.me = null;
        state.myAvatar = null;
        state.dashboard = null;
        state.session = null;
        state.currentQuestion = null;
        state.subjects = [];
        state.chaptersBySubject = {};
        state.selectedSubjects = {};
        state.selectedChapters = {};
        state.history = [];
        state.lastCompletedSession = null;
        state.lastSessionSetup = null;
        state.ambientScenes.app = null;
        state.ambientScenes.trainingPlay = null;
        state.ambientScenes.duel = null;
        state.notificationSeeded = false;
        state.notificationToasts = [];
        state.notifications = [];
        state.duels = [];
        state.selectedDuelId = null;
        state.selectedDuel = null;
        state.openerQuestion = null;
        state.openerShownAt = 0;
        state.currentRound = null;
        state.roundQuestions = [];
        state.roundQuestionShownAtBySlot = {};
        state.currentAnswerReview = null;
        state.trainingFlow = 'home';
        state.welcomeAuthMode = 'home';
        state.duelFlow = 'home';
        renderUserBadge();
        refs.subjectsList.innerHTML = '';
        refs.chaptersList.innerHTML = '';
        refs.stats.innerHTML = '';
        refs.focusList.innerHTML = '';
        refs.dashboardHero.innerHTML = '';
        if (refs.dashboardPulse) {
          refs.dashboardPulse.innerHTML = '';
        }
        if (refs.dashboardJourney) {
          refs.dashboardJourney.innerHTML = '';
        }
        refs.dashboardCards.innerHTML = '';
        refs.profileSummary.innerHTML = '';
        refs.profileAvatarSummary.innerHTML = '';
        refs.settingsSummary.innerHTML = '';
        refs.notificationsList.innerHTML = '';
        refs.notificationsUnreadChip.className = 'chip';
        refs.notificationsUnreadChip.textContent = '0 non lues';
        refs.notificationToastStack.innerHTML = '';
        renderNotificationShortcut();
        refs.suggestedModeLabel.textContent = 'Mode conseillé: -';
        refs.applySuggestedModeBtn.disabled = true;
        refs.applySuggestedModeBtn.removeAttribute('data-mode');
        renderSessionSummary();
        refs.questionContainer.innerHTML = '';
        refs.questionContainer.classList.add('hidden');
        refs.duelsList.innerHTML = '';
        refs.duelDetail.innerHTML = '';
        refs.duelDetail.classList.add('hidden');
        if (refs.duelHomeSummary) {
          refs.duelHomeSummary.innerHTML = '';
        }
        if (refs.duelHomeCards) {
          refs.duelHomeCards.innerHTML = '';
        }
        renderHistory();
        renderSessionGoal();
        renderCompletion();
        renderTrainingModeCards();
        renderTrainingFlow();
        ensureAuthUi();
        setWelcomeAuthMode('home');
        setActiveScreen('welcome');
        setStatus('Déconnecté.', 'info');
      });

      refs.menuBackBtn.addEventListener('click', function () {
        setActiveScreen('dashboard');
      });

      refs.quickTrainingNavBtn.addEventListener('click', function () {
        setActiveScreen('training');
      });

      refs.quickDuelNavBtn.addEventListener('click', function () {
        setDuelFlow('home');
        setActiveScreen('duel');
      });

      refs.notificationsShortcutBtn.addEventListener('click', function () {
        if (!state.token) {
          return;
        }
        setActiveScreen('duel');
        setDuelFlow('notifications');
      });

      refs.statsNavBtn.addEventListener('click', function () {
        setActiveScreen('stats');
      });

      refs.settingsNavBtn.addEventListener('click', function () {
        setActiveScreen('settings');
      });

      refs.duelHomeCards.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-duel-flow-target]');
        if (!btn) {
          return;
        }
        var flow = btn.getAttribute('data-duel-flow-target');
        if (!flow) {
          return;
        }
        if (flow === 'detail' && !state.selectedDuel) {
          setDuelFlow('inbox');
          return;
        }
        setDuelFlow(flow);
      });

      refs.duelNotificationsBackBtn.addEventListener('click', function () {
        setDuelFlow('home');
      });

      refs.duelCreateBackBtn.addEventListener('click', function () {
        setDuelFlow('home');
      });

      refs.duelInboxBackBtn.addEventListener('click', function () {
        setDuelFlow('home');
      });

      refs.duelDetailBackBtn.addEventListener('click', function () {
        setDuelFlow('inbox');
      });
      refs.duelDetailCloseBtn.addEventListener('click', function () {
        closeSelectedDuelView();
      });
      refs.duelSubjectBackBtn.addEventListener('click', function () {
        setDuelFlow('detail');
      });
      refs.duelSubjectCloseBtn.addEventListener('click', function () {
        closeSelectedDuelView();
      });

      refs.duelPlayBackBtn.addEventListener('click', function () {
        state.duelPlayReview = null;
        setDuelFlow('detail');
      });
      refs.duelPlayCloseBtn.addEventListener('click', function () {
        closeSelectedDuelView();
      });

      refs.settingsSummary.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var logoutBtn = target.closest('button[data-settings-logout]');
        if (logoutBtn) {
          refs.logoutBtn.click();
          return;
        }
        var resetBtn = target.closest('button[data-theme-palette-reset]');
        if (resetBtn) {
          state.themeOverrides = {};
          saveThemeOverrides();
          applyVisualTheme(state.visualTheme);
          renderDashboardCards();
          renderSettingsSummary();
          setStatus('Palette réinitialisée sur le thème choisi.', 'ok');
          return;
        }
        var btn = target.closest('button[data-theme-choice]');
        if (!btn) {
          return;
        }
        var themeKey = btn.getAttribute('data-theme-choice');
        if (!themeKey) {
          return;
        }
        applyVisualTheme(themeKey);
        renderDashboardCards();
        renderSettingsSummary();
        setStatus('Ambiance visuelle mise à jour.', 'ok');
      });

      refs.settingsSummary.addEventListener('change', async function (event) {
        var target = event.target;
        if (!target) {
          return;
        }
        try {
          if (target.matches('input[data-theme-color]')) {
            var colorKey = target.getAttribute('data-theme-color');
            var colorValue = normalizeHexColor(target.value, '');
            if (!colorKey || !colorValue) {
              return;
            }
            state.themeOverrides[colorKey] = colorValue;
            saveThemeOverrides();
            applyVisualTheme(state.visualTheme);
            renderDashboardCards();
            renderSettingsSummary();
            setStatus('Palette personnalisée mise à jour.', 'ok');
            return;
          }

          if (!state.token) {
            return;
          }

          if (target.matches('select[data-avatar-item-type]')) {
            var itemType = target.getAttribute('data-avatar-item-type');
            var itemId = target.value;
            if (!itemType || !itemId) {
              return;
            }
            await api('/me/avatar/equipment', {
              method: 'POST',
              body: { itemType: itemType, itemId: itemId }
            });
            await loadMyAvatar();
            await loadAvatarSettingsData();
            setStatus(getAvatarItemTypeLabel(itemType) + ' mis à jour.', 'ok');
            return;
          }

          if (target.matches('select[data-avatar-specialty]')) {
            var specialtyId = target.value;
            if (!specialtyId) {
              return;
            }
            await api('/me/avatar/specialty', {
              method: 'POST',
              body: { specialtyId: specialtyId }
            });
            await loadMyAvatar();
            renderSettingsSummary();
            setStatus('Spécialité avatar mise à jour.', 'ok');
          }
        } catch (err) {
          renderSettingsSummary();
          setStatus(err.message || String(err), 'err');
        }
      });

      function handleDashboardNavClick(event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-nav-screen]');
        if (!btn) {
          return;
        }
        var screen = btn.getAttribute('data-nav-screen');
        if (!screen) {
          return;
        }
        if (screen === 'training' && !state.session) {
          setTrainingFlow('home');
        }
        if (screen === 'duel') {
          setDuelFlow('home');
        }
        setActiveScreen(screen);
      }

      refs.dashboardHero.addEventListener('click', handleDashboardNavClick);
      if (refs.dashboardJourney) {
        refs.dashboardJourney.addEventListener('click', handleDashboardNavClick);
      }
      refs.dashboardCards.addEventListener('click', handleDashboardNavClick);

      refs.trainingModeCards.addEventListener('click', async function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-training-mode]');
        if (!btn) {
          return;
        }
        try {
          await selectTrainingMode(btn.getAttribute('data-training-mode'));
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.duelModeCards.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-duel-mode]');
        if (!btn) {
          return;
        }
        var mode = btn.getAttribute('data-duel-mode');
        if (!mode) {
          return;
        }
        refs.duelModeSelect.value = mode;
        setDuelModeUi();
      });

      refs.trainingSetupBackBtn.addEventListener('click', function () {
        setTrainingFlow('scope');
      });

      refs.trainingSetupNextBtn.addEventListener('click', async function () {
        try {
          await createSession();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.trainingScopeBackBtn.addEventListener('click', function () {
        setTrainingFlow('home');
      });

      refs.trainingResultBackBtn.addEventListener('click', function () {
        setTrainingFlow('home');
      });

      refs.createSessionBtn.addEventListener('click', async function () {
        try {
          goToTrainingSetup();
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

      refs.refreshNotificationsBtn.addEventListener('click', async function () {
        try {
          await loadNotifications();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.submitAnswerBtn.addEventListener('click', async function () {
        try {
          if (state.currentAnswerReview) {
            clearReviewAutoAdvance();
            await refreshSessionAndQuestion();
            setStatus('Question suivante chargée.', 'info');
            return;
          }
          await submitAnswer();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.nextQuestionBtn.addEventListener('click', async function () {
        try {
          clearReviewAutoAdvance();
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
        renderSessionGoal();
        renderSetupGuide();
      });

      refs.targetCountInput.addEventListener('input', function () {
        renderSessionGoal();
        renderSetupGuide();
      });

      refs.applySuggestedModeBtn.addEventListener('click', async function () {
        var suggested = refs.applySuggestedModeBtn.getAttribute('data-mode');
        if (!suggested) {
          return;
        }
        try {
          await selectTrainingMode(suggested);
          setActiveScreen('training');
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.modeSelect.addEventListener('change', function () {
        renderSetupGuide();
      });

      refs.presetDiscoveryBtn.addEventListener('click', async function () {
        try {
          await applyPresetDiscovery();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.presetReviewBtn.addEventListener('click', async function () {
        try {
          await applyPresetReviewFree();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.presetRecommendedBtn.addEventListener('click', async function () {
        try {
          await applyPresetRecommended();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.duelModeSelect.addEventListener('change', function () {
        setDuelModeUi();
      });

      refs.duelStatusFilterSelect.addEventListener('change', async function () {
        try {
          renderDuelStatusFilters();
          await loadDuels();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.duelStatusFilterButtons.addEventListener('click', async function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-duel-status-filter]');
        if (!btn) {
          return;
        }
        var nextFilter = btn.getAttribute('data-duel-status-filter') || 'all';
        refs.duelStatusFilterSelect.value = nextFilter;
        try {
          renderDuelStatusFilters();
          await loadDuels();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.createDuelBtn.addEventListener('click', async function () {
        try {
          await createDuelFromUi();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.refreshDuelsBtn.addEventListener('click', async function () {
        try {
          await loadDuels();
          if (state.selectedDuelId) {
            await loadDuelDetail(state.selectedDuelId);
          }
          setStatus('Liste des duels rafraîchie.', 'info');
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.duelsList.addEventListener('click', async function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-duel-id]');
        if (!btn) {
          return;
        }
        var duelId = btn.getAttribute('data-duel-id');
        if (!duelId) {
          return;
        }
        try {
          await loadDuelDetail(duelId);
          setStatus('Duel chargé.', 'info');
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.notificationsList.addEventListener('click', async function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-notification-action]');
        if (!btn) {
          return;
        }
        var action = btn.getAttribute('data-notification-action');
        var notificationId = btn.getAttribute('data-notification-id');
        if (!action || !notificationId) {
          return;
        }
        try {
          if (action === 'read') {
            await markNotificationRead(notificationId);
            return;
          }
          if (action === 'open') {
            await openNotification(notificationId);
          }
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.notificationToastStack.addEventListener('click', async function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-toast-action]');
        if (!btn) {
          return;
        }
        var action = btn.getAttribute('data-toast-action');
        var notificationId = btn.getAttribute('data-toast-id');
        if (!action || !notificationId) {
          return;
        }
        try {
          if (action === 'dismiss') {
            dismissNotificationToast(notificationId);
            return;
          }
          if (action === 'read') {
            await markNotificationRead(notificationId);
            return;
          }
          if (action === 'open') {
            await openNotification(notificationId);
          }
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.duelDetail.addEventListener('click', async function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-duel-action]');
        if (!btn) {
          return;
        }
        var action = btn.getAttribute('data-duel-action');
        if (!action) {
          return;
        }
        try {
          if (action === 'accept') {
            await api('/duels/' + state.selectedDuelId + '/accept', { method: 'POST' });
            await loadDuels();
            await loadDuelDetail(state.selectedDuelId);
            setStatus('Duel accepté.', 'ok');
            return;
          }
          if (action === 'decline') {
            await api('/duels/' + state.selectedDuelId + '/decline', { method: 'POST' });
            await loadDuels();
            await loadDuelDetail(state.selectedDuelId);
            setStatus('Duel refusé.', 'info');
            return;
          }
          if (action === 'forfeit') {
            await api('/duels/' + state.selectedDuelId + '/forfeit', { method: 'POST' });
            await loadDuels();
            await loadDuelDetail(state.selectedDuelId);
            setStatus('Duel abandonné.', 'info');
            return;
          }
          if (action === 'simulate-opponent-turn') {
            await simulateOpponentTurnFromUi();
            return;
          }
          if (action === 'rematch') {
            await createRematchFromUi();
            return;
          }
          if (action === 'load-opener') {
            await loadOpenerQuestion();
            setStatus('Opener chargé.', 'info');
            return;
          }
          if (action === 'open-opener-play') {
            startDuelPlay('opener');
            return;
          }
          if (action === 'answer-opener') {
            await answerOpenerFromUi();
            return;
          }
          if (action === 'opener-decision-take') {
            await decideOpenerFromUi('take_hand');
            return;
          }
          if (action === 'opener-decision-leave') {
            await decideOpenerFromUi('leave_hand');
            return;
          }
          if (action === 'load-round') {
            await loadCurrentRound();
            setStatus('Manche courante chargée.', 'info');
            return;
          }
          if (action === 'start-round-flow') {
            if (!state.currentRound) {
              await loadCurrentRound();
            }
            setDuelFlow('subject');
            return;
          }
          if (action === 'choose-subject') {
            var subjectId = btn.getAttribute('data-subject-id');
            if (!subjectId) {
              throw new Error('subjectId manquant.');
            }
            await chooseCurrentRoundSubject(subjectId);
            return;
          }
          if (action === 'load-round-questions') {
            await loadRoundQuestions();
            setStatus('Questions de manche chargées.', 'info');
            return;
          }
          if (action === 'open-round-play') {
            startDuelPlay('round');
            return;
          }
          if (action === 'request-joker') {
            await requestJokerFromUi();
            return;
          }
          if (action === 'respond-joker-grant') {
            await respondJokerFromUi(btn.getAttribute('data-joker-id'), 'grant');
            return;
          }
          if (action === 'respond-joker-reject') {
            await respondJokerFromUi(btn.getAttribute('data-joker-id'), 'reject');
            return;
          }
          if (action === 'submit-round-answer') {
            var slotNo = btn.getAttribute('data-slot-no');
            var questionId = btn.getAttribute('data-question-id');
            if (!slotNo || !questionId) {
              throw new Error('Paramètres de réponse manquants.');
            }
            await submitRoundAnswerFromUi(slotNo, questionId);
            return;
          }
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.duelSubjectContent.addEventListener('click', async function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-duel-subject-action]');
        if (!btn) {
          return;
        }
        var action = btn.getAttribute('data-duel-subject-action');
        if (!action) {
          return;
        }
        try {
          if (action === 'choose-subject') {
            var subjectId = btn.getAttribute('data-subject-id');
            if (!subjectId) {
              throw new Error('subjectId manquant.');
            }
            await chooseCurrentRoundSubject(subjectId);
            return;
          }
          if (action === 'load-round-questions') {
            await loadRoundQuestions();
            setStatus('Questions de manche chargées.', 'info');
            return;
          }
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.duelSubmitAnswerBtn.addEventListener('click', async function () {
        try {
          var playItem = getCurrentDuelPlayItem();
          if (!playItem) {
            throw new Error('Aucune question duel à jouer.');
          }
          if (playItem.kind === 'opener') {
            await answerOpenerFromUi();
            return;
          }
          await submitRoundAnswerFromUi(playItem.slotNo, playItem.question.id);
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.duelNextAnswerBtn.addEventListener('click', async function () {
        try {
          await advanceDuelPlay();
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      refs.completionContent.addEventListener('click', async function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
          return;
        }
        var btn = target.closest('button[data-completion-action]');
        if (!btn) {
          return;
        }
        try {
          var action = btn.getAttribute('data-completion-action');
          if (!action) {
            return;
          }
          await startRecommendedSession(action);
        } catch (err) {
          setStatus(err.message || String(err), 'err');
        }
      });

      (async function init() {
        try {
          applyVisualTheme(state.visualTheme);
          ensureAuthUi();
          renderScreenFrame();
          setDuelModeUi();
          renderDashboardCards();
          renderProfileSummary();
          renderSettingsSummary();
          renderDuelsList();
          renderDuelDetail();
          renderSessionSummary();
          renderQuestion();
          renderHistory();
          renderFocus();
          renderNotifications();
          renderNotificationToasts();
          renderSessionGoal();
          renderCompletion();
          renderSetupGuide();
          setWelcomeAuthMode('home');
          prepareWelcomeImage(refs.welcomeTitleImage, { clearNeutralBackground: true, padding: 10 });
          prepareWelcomeImage(refs.welcomeHeroImage, { padding: 6 });
          refs.targetCountInput.disabled = refs.stopRuleSelect.value !== 'fixed_custom';
          if (state.token) {
            await bootstrapConnectedState();
          } else {
            setActiveScreen('welcome');
          }
        } catch (err) {
          saveToken('');
          ensureAuthUi();
          setActiveScreen('welcome');
          setStatus((err && err.message) ? err.message : 'Session invalide, reconnecte-toi.', 'err');
        }
      })();
    })();
  </script>
</body>
</html>`;
