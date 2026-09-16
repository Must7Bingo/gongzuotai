const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'app.js'), 'utf8');
const workspaceJs = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'workspace.js'), 'utf8');
const effectsJs = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'effects.js'), 'utf8');
const mainJs = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'styles.css'), 'utf8');

test('clipboard rows define both favorite icons before rendering entries', () => {
  assert.match(appJs, /const starOutlineSvg\s*=/);
  assert.match(appJs, /const starFilledSvg\s*=/);
});

test('notes have a dedicated top-level tab and management panel', () => {
  assert.match(html, /data-tab="notes"/);
  assert.match(html, /id="tab-notes"/);
  assert.match(html, /id="notes-search"/);
  assert.match(html, /id="notes-list"/);
  assert.match(html, /id="notes-detail"/);
});

test('home scratch note keeps only the save action', () => {
  const homeNote = html.match(/<section class="tile home-note"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(homeNote, /id="note-save-btn"/);
  assert.doesNotMatch(homeNote, /id="note-library-btn"/);
  assert.doesNotMatch(homeNote, /id="note-library"/);
});

test('recordings expose in-page API settings and create a live draft while recording', () => {
  assert.match(html, /id="recording-configure"/);
  assert.match(workspaceJs, /function beginRecordingDraft\(\)/);
  assert.match(workspaceJs, /recordingLiveTranscript/);
  assert.match(workspaceJs, /configure-transcription/);
});

test('a live recording can be paused, resumed, and stopped from the recordings tab', () => {
  assert.match(workspaceJs, /recording-live-pause/);
  assert.match(workspaceJs, /recording-live-stop/);
  assert.match(workspaceJs, /togglePauseRecording/);
  assert.match(workspaceJs, /stopRecording/);
});

test('homepage visibility has one storage key, exact validation, and lifecycle events', () => {
  assert.match(appJs, /notch-home-hidden-modules-v1/);
  assert.match(appJs, /validateHomeWidgetLayout/);
  assert.match(appJs, /window\.NotchHome\s*=/);
  assert.match(appJs, /notch:home-modules-changed/);
  assert.match(appJs, /notch:home-layout-error/);
  assert.match(appJs, /stopMirror\(\)/);
  assert.match(appJs, /new Set\(homeTiles\.map\(\(tile\) => tile\.dataset\.homeModule\)\)/);
});

test('settings exposes homepage layout presets and keeps them synchronized', () => {
  assert.match(html, /id="settings-home-layout-preset"/);
  assert.match(appJs, /notch-home-layout-preset-v1/);
  assert.match(appJs, /setLayoutPreset: setHomeLayoutPreset/);
  assert.match(appJs, /notch:home-layout-preset-changed/);
  assert.match(workspaceJs, /settingsHomeLayoutPreset/);
});

test('settings exposes exactly one switch for every homepage widget', () => {
  const switches = [...html.matchAll(/data-settings-home-module="([^"]+)"/g)]
    .map((match) => match[1]);
  assert.deepEqual(switches, [
    'music', 'pomodoro', 'recorder', 'windows', 'mirror', 'note', 'commands', 'calculator', 'translator', 'clip',
  ]);
  assert.match(workspaceJs, /isRecordingActive/);
  assert.match(workspaceJs, /recording_active/);
  assert.match(workspaceJs, /at_least_one_required/);
});

test('settings exposes every panel tab as a possible default opening page', () => {
  const select = html.match(/<select id="settings-default-tab"[\s\S]*?<\/select>/)?.[0] || '';
  const options = [...select.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(options, [
    'home', 'todo', 'notes', 'links', 'recordings', 'credentials', 'tools', 'settings',
  ]);
  assert.match(workspaceJs, /setDefaultTab/);
});

test('homepage exposes quick calculator and translation widgets', () => {
  assert.match(html, /id="home-calculator"/);
  assert.match(html, /id="home-translator"/);
  assert.match(workspaceJs, /homeCalculatorSubmit/);
  assert.ok(html.indexOf('id="home-calculator-result"') > html.indexOf('id="home-calculator-input"'));
  assert.ok(html.indexOf('id="calculator-result"') > html.indexOf('id="calculator-expression"'));
  assert.match(workspaceJs, /translateText\('home'\)/);
});

test('homepage clipboard keeps an actionable ten-item recent list', () => {
  assert.match(html, /id="home-clip-list"/);
  assert.match(html, /id="home-clip-count"/);
  assert.match(appJs, /const HOME_CLIP_LIMIT = 10;/);
  assert.match(appJs, /clipHistory\.slice\(0, HOME_CLIP_LIMIT\)/);
  assert.match(appJs, /data-home-clip-action="copy"/);
  assert.match(appJs, /data-home-clip-action="favorite"/);
  assert.match(appJs, /data-home-clip-action="delete"/);
  assert.match(appJs, /function renderHomeClip\(\)/);
});

test('translator workbench uses separately scrollable input and output regions', () => {
  assert.match(html, /class="[^\"]*translator-card/);
  assert.match(html, /class="translator-editor"/);
  assert.match(html, /class="translator-output"/);
  assert.match(html, /id="translator-result-meta"/);
  assert.match(stylesCss, /\.translator-card\s*\{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\)/);
  assert.match(html, /class="translator-workspace"/);
  assert.match(stylesCss, /\.translator-editor,\s*\.translator-output\s*\{[\s\S]*?min-height:\s*0;/);
  assert.match(stylesCss, /\.translator-result \{ min-height: 0; overflow-y: auto;/);
  assert.match(stylesCss, /grid-template-areas:\s*"source result"\s*"actions actions"/);
  assert.match(workspaceJs, /translatorResultMeta\.textContent = '正在处理'/);
});

test('clipboard uses a detail workbench and offers explicit screen recording controls', () => {
  assert.match(html, /class="workbench-page"/);
  assert.match(html, /data-workbench-view="clip"/);
  assert.match(html, /class="clip-workbench"/);
  assert.match(html, /id="clip-detail"/);
  assert.match(html, /id="screen-record-start"/);
  assert.match(html, /id="screen-record-stop"/);
  assert.match(appJs, /getDisplayMedia/);
  assert.match(mainJs, /screen-recordings:save/);
});

test('tools page keeps scientific calculation local and translation behind the preload bridge', () => {
  assert.match(html, /id="tab-button-tools"/);
  assert.match(html, /id="tab-tools"/);
  assert.match(html, /id="calculator-keypad"/);
  assert.match(html, /data-calculator-value="sin\("/);
  assert.match(html, /data-calculator-value="π"/);
  assert.match(html, /data-calculator-angle="deg"/);
  assert.match(html, /data-calculator-angle="rad"/);
  assert.match(html, /id="translator-source"/);
  assert.match(workspaceJs, /Domain\.calculateExpression/);
  assert.match(workspaceJs, /CALCULATOR_ANGLE_MODE_KEY/);
  assert.match(workspaceJs, /notchAPI\.translateText/);
});

test('homepage tiles use one shared liquid pointer-feedback controller', () => {
  assert.match(appJs, /function bindHomeLiquidFeedback\(\)/);
  assert.match(appJs, /tile-liquid-surface/);
  assert.match(stylesCss, /tile-liquid-ripple/);
  assert.doesNotMatch(html, /music-color-bends/);
  assert.match(workspaceJs, /NotchHome\?\.isVisible/);
});


test('macOS collapsed notch leaves a visible six-pixel grabber below the menu bar', () => {
  assert.match(mainJs, /const NOTCH_GRABBER_HEIGHT = 6;/);
  assert.match(mainJs, /\+ NOTCH_GRABBER_HEIGHT/);
  assert.match(stylesCss, /transparent var\(--mb-h\) 100%/);
});
