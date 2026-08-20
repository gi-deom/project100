const BING_ENDPOINT = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=';
const bingMarkets = ['en-US', 'en-GB', 'en-CA', 'en-AU', 'de-DE', 'fr-FR', 'it-IT', 'es-ES', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN', 'sv-SE'];
const fallbackImages = Array.from({ length: 1000 }, (_, index) => ({
  url: `https://picsum.photos/seed/gidlight-${index + 1}/1800/1200`,
  type: 'image',
  title: 'A quiet view, held open',
  location: 'Gidlight demo archive'
}));

const savedInterval = Number(localStorage.getItem('northlight-interval-value')) || 8;
const savedUnit = localStorage.getItem('northlight-interval-unit') || 'minutes';
const unitSeconds = { seconds: 1, minutes: 60, hours: 3600, days: 86400 };
const state = { queue: [], currentIndex: 0, secondsLeft: savedInterval * unitSeconds[savedUnit], intervalValue: savedInterval, intervalUnit: savedUnit, isPlaying: true, timer: null, archiveTimer: null, isLoading: false, imageCache: new Map(), transitionToken: 0 };
const elements = {
  current: document.querySelector('.image-layer--current'), back: document.querySelector('.image-layer--back'), videoCurrent: document.querySelector('.video-layer--current'), videoBack: document.querySelector('.video-layer--back'),
  title: document.querySelector('#image-title'), caption: document.querySelector('#image-caption'), location: document.querySelector('#image-location'),
  loaded: document.querySelector('#loaded-count'),
  preview: document.querySelector('#queue-preview'), sync: document.querySelector('#sync-label'),
  playButton: document.querySelector('#play-button'), playIcon: document.querySelector('#play-icon'), playLabel: document.querySelector('#play-label'), playbackStatus: document.querySelector('#playback-status'),
  queueTab: document.querySelector('#queue-tab'), settingsTab: document.querySelector('#settings-tab'), updateTab: document.querySelector('#update-tab'), queueView: document.querySelector('#queue-view'), settingsView: document.querySelector('#settings-view'), updateView: document.querySelector('#update-view'),
  intervalValue: document.querySelector('#interval-value'), intervalUnit: document.querySelector('#interval-unit'), intervalOutput: document.querySelector('#interval-output'), desktopToggle: document.querySelector('#desktop-toggle'), lockToggle: document.querySelector('#lock-toggle'), menuButton: document.querySelector('#menu-button'), panelClose: document.querySelector('#panel-close'), queuePanel: document.querySelector('#queue-panel')
};

function updateIntervalLabel() { elements.intervalOutput.textContent = `${state.intervalValue} ${state.intervalUnit}`; }
function selectPanel(panel) {
  const settingsOpen = panel === 'settings';
  const updateOpen = panel === 'update';
  elements.queueView.hidden = settingsOpen || updateOpen;
  elements.settingsView.hidden = !settingsOpen;
  elements.updateView.hidden = !updateOpen;
  elements.queueTab.classList.toggle('is-active', !settingsOpen && !updateOpen);
  elements.settingsTab.classList.toggle('is-active', settingsOpen);
  elements.updateTab.classList.toggle('is-active', updateOpen);
  elements.queueTab.setAttribute('aria-selected', String(!settingsOpen && !updateOpen));
  elements.settingsTab.setAttribute('aria-selected', String(settingsOpen));
  elements.updateTab.setAttribute('aria-selected', String(updateOpen));
}
function togglePanel(open) {
  elements.queuePanel.classList.toggle('is-open', open);
  elements.queuePanel.setAttribute('aria-hidden', String(!open));
  elements.menuButton.setAttribute('aria-expanded', String(open));
  elements.menuButton.innerHTML = open ? '<span class="menu-line"></span><span class="menu-line"></span>' : '<span class="menu-line"></span><span class="menu-line"></span><span class="menu-line"></span>';
}

async function fetchBatch(index, market) {
  const response = await fetch(`${BING_ENDPOINT}${index}&n=8&mkt=${market}`);
  if (!response.ok) throw new Error('Bing archive unavailable');
  const data = await response.json();
  return (data.images || []).map(image => ({ url: `https://www.bing.com${image.url}`, type: 'image', title: image.title || 'Untitled landscape', location: image.copyright || 'Bing Image Archive' }));
}

async function fetchBingVideo() {
  const response = await fetch('https://www.bing.com');
  if (!response.ok) throw new Error('Bing homepage unavailable');
  const html = await response.text();
  const matches = [...html.matchAll(/https?:[^"']+\.(?:mp4|webm)(?:\?[^"']*)?/gi)];
  return matches.map(match => ({ url: match[0].replaceAll('\\u0026', '&'), type: 'video', title: 'Bing motion wallpaper', location: 'Bing homepage video' }));
}

async function loadQueue({ reset = false } = {}) {
  if (state.isLoading) return;
  state.isLoading = true;
  elements.sync.textContent = 'Loading archive';
  const images = [];
  const seen = new Set();
  try {
    const requests = bingMarkets.flatMap(market => Array.from({ length: 24 }, (_, index) => fetchBatch(index, market)));
    const batches = await Promise.allSettled(requests);
    batches.forEach(result => (result.status === 'fulfilled' ? result.value : []).forEach(image => {
      if (!seen.has(image.url)) { seen.add(image.url); images.push(image); }
    }));
    const videoResult = await Promise.allSettled([fetchBingVideo()]);
    videoResult.forEach(result => (result.status === 'fulfilled' ? result.value : []).forEach(video => {
      if (!seen.has(video.url)) { seen.add(video.url); images.unshift(video); }
    }));
    if (!images.length) throw new Error('No images returned');
    const existingUrls = new Set(state.queue.map(image => image.url));
    const newImages = images.filter(image => !existingUrls.has(image.url));
    if (reset || !state.queue.length) {
      fallbackImages.forEach(image => { if (!seen.has(image.url)) { seen.add(image.url); images.push(image); } });
      state.queue = images;
    } else {
      state.queue = [...state.queue, ...newImages];
    }
    elements.sync.textContent = newImages.length ? `Bing updated · ${newImages.length} new` : 'Bing archive synced';
  } catch (error) {
    if (reset || !state.queue.length) {
      state.queue = fallbackImages;
      elements.sync.textContent = 'Demo archive loaded';
    } else {
      elements.sync.textContent = 'Bing update unavailable';
    }
  }
  if (reset || !state.queue.length) {
    state.currentIndex = 0;
    renderQueue();
    showImage();
  } else {
    renderQueue();
  }
  if (!state.timer) startTimer();
  state.isLoading = false;
}

function renderQueue() {
  elements.loaded.textContent = String(state.queue.length);
  elements.preview.innerHTML = state.queue.slice(0, 12).map((image, index) => `<button class="preview-tile${index === state.currentIndex ? ' is-active' : ''}" style="background-image:url('${image.url}')" data-index="${index}" aria-label="View wallpaper ${index + 1}"></button>`).join('');
  elements.preview.querySelectorAll('[data-index]').forEach(button => button.addEventListener('click', () => { state.currentIndex = Number(button.dataset.index); showImage(); resetTimer(); }));
}

function preloadImage(image) {
  if (image.type === 'video') return preloadVideo(image);
  if (state.imageCache.has(image.url)) return state.imageCache.get(image.url);
  const request = new Promise(resolve => {
    const photo = new Image();
    photo.onload = () => resolve(true);
    photo.onerror = () => resolve(false);
    photo.src = image.url;
  });
  state.imageCache.set(image.url, request);
  return request;
}

function preloadVideo(media) {
  if (state.imageCache.has(media.url)) return state.imageCache.get(media.url);
  const request = new Promise(resolve => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.onloadeddata = () => resolve(true);
    video.onerror = () => resolve(false);
    video.src = media.url;
  });
  state.imageCache.set(media.url, request);
  return request;
}

async function showImage() {
  const image = state.queue[state.currentIndex];
  if (!image) return;
  const transitionToken = ++state.transitionToken;
  await preloadImage(image);
  if (transitionToken !== state.transitionToken) return;
  if (image.type === 'video') {
    elements.videoBack.src = image.url;
    elements.videoBack.classList.add('is-visible');
    elements.videoBack.play().catch(() => {});
    elements.current.classList.remove('is-visible');
    elements.videoCurrent.classList.remove('is-visible');
    elements.videoCurrent.src = image.url;
    await elements.videoCurrent.play().catch(() => {});
    elements.videoCurrent.classList.add('is-visible');
    elements.videoBack.classList.remove('is-visible');
  } else if (!elements.current.style.backgroundImage) {
    elements.current.style.backgroundImage = `url('${image.url}')`;
    elements.videoCurrent.classList.remove('is-visible');
  } else {
    elements.videoCurrent.classList.remove('is-visible');
    elements.back.style.backgroundImage = `url('${image.url}')`;
    elements.back.classList.add('is-visible');
    await new Promise(resolve => setTimeout(resolve, 1100));
    if (transitionToken !== state.transitionToken) return;
    elements.current.style.backgroundImage = `url('${image.url}')`;
    elements.back.classList.remove('is-visible');
  }
  elements.title.textContent = image.title;
  elements.caption.textContent = 'Bing daily wallpaper archive';
  elements.location.textContent = image.location;
  document.querySelectorAll('.preview-tile').forEach((tile, index) => tile.classList.toggle('is-active', index === state.currentIndex));
  elements.current.style.animation = 'none';
  requestAnimationFrame(() => { elements.current.style.animation = ''; });
}

function nextImage() { state.currentIndex = (state.currentIndex + 1) % state.queue.length; showImage(); resetTimer(); }
function previousImage() { state.currentIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length; showImage(); resetTimer(); }
function resetTimer() { state.secondsLeft = state.intervalValue * unitSeconds[state.intervalUnit]; }
function startTimer() { clearInterval(state.timer); state.timer = setInterval(() => { if (state.isPlaying) { state.secondsLeft -= 1; if (state.secondsLeft <= 0) nextImage(); } }, 1000); }
function togglePlay() { state.isPlaying = !state.isPlaying; elements.playIcon.textContent = state.isPlaying ? 'Ⅱ' : '▶'; elements.playLabel.textContent = state.isPlaying ? 'Pause slideshow' : 'Play slideshow'; elements.playButton.setAttribute('aria-label', state.isPlaying ? 'Pause slideshow' : 'Play slideshow'); elements.playbackStatus.textContent = state.isPlaying ? 'Automatic' : 'Paused'; }

document.querySelector('#next-button').addEventListener('click', nextImage);
document.querySelector('#previous-button').addEventListener('click', previousImage);
elements.playButton.addEventListener('click', togglePlay);
document.querySelector('#fullscreen-button').addEventListener('click', () => document.documentElement.requestFullscreen?.());
document.querySelector('#refresh-button').addEventListener('click', loadQueue);
elements.queueTab.addEventListener('click', () => selectPanel('queue'));
elements.settingsTab.addEventListener('click', () => selectPanel('settings'));
elements.updateTab.addEventListener('click', () => selectPanel('update'));
elements.menuButton.addEventListener('click', () => togglePanel(!elements.queuePanel.classList.contains('is-open')));
elements.panelClose.addEventListener('click', () => togglePanel(false));
function saveInterval() { state.intervalValue = Math.max(1, Number(elements.intervalValue.value) || 1); state.intervalUnit = elements.intervalUnit.value; elements.intervalValue.value = state.intervalValue; localStorage.setItem('northlight-interval-value', state.intervalValue); localStorage.setItem('northlight-interval-unit', state.intervalUnit); updateIntervalLabel(); resetTimer(); }
elements.intervalValue.addEventListener('input', saveInterval);
elements.intervalUnit.addEventListener('change', saveInterval);
elements.desktopToggle.addEventListener('change', event => localStorage.setItem('northlight-desktop-wallpaper', event.target.checked));
elements.lockToggle.addEventListener('change', event => localStorage.setItem('northlight-lock-wallpaper', event.target.checked));
const updateStatus = document.querySelector('#update-status');
const updateDetail = document.querySelector('#update-detail');
const updateDot = document.querySelector('#update-dot');
const downloadUpdateLink = document.querySelector('#download-update-link');
async function checkForUpdates() {
  updateStatus.textContent = 'Checking for updates';
  updateDetail.textContent = 'Looking at the latest Gidlight release.';
  try {
    const response = await fetch('https://api.github.com/repos/gi-deom/project100/releases/latest', { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error('Release lookup failed');
    const release = await response.json();
    updateStatus.textContent = `Latest release ${release.tag_name}`;
    updateDetail.textContent = 'You are using the live hosted version.';
    updateDot.classList.add('is-current');
    downloadUpdateLink.hidden = false;
    downloadUpdateLink.href = release.html_url;
  } catch (error) {
    updateStatus.textContent = 'Update check unavailable';
    updateDetail.textContent = 'Connect to the internet and try again.';
  }
}
document.querySelector('#check-update-button').addEventListener('click', checkForUpdates);
document.addEventListener('keydown', event => { if (event.key === 'ArrowRight') nextImage(); if (event.key === 'ArrowLeft') previousImage(); if (event.key === ' ') { event.preventDefault(); togglePlay(); } if (event.key === 'Escape') togglePanel(false); });
elements.intervalValue.value = state.intervalValue;
elements.intervalUnit.value = state.intervalUnit;
elements.desktopToggle.checked = localStorage.getItem('northlight-desktop-wallpaper') !== 'false';
elements.lockToggle.checked = localStorage.getItem('northlight-lock-wallpaper') !== 'false';
updateIntervalLabel();
checkForUpdates();
loadQueue({ reset: true });
state.archiveTimer = setInterval(() => loadQueue(), 15 * 60 * 1000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
