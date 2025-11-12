const els = {
  form: document.getElementById('searchForm'),
  input: document.getElementById('q'),
  state: document.getElementById('state'),
  grid: document.getElementById('grid'),
  loadMore: document.getElementById('loadMore'),
  modal: document.getElementById('modal'),
  mClose: document.getElementById('mClose'),
  mPoster: document.getElementById('mPoster'),
  mTitle: document.getElementById('mTitle'),
  mMeta: document.getElementById('mMeta'),
  mGenres: document.getElementById('mGenres'),
  mOverview: document.getElementById('mOverview'),
  themeToggle: document.getElementById('themeToggle'),
};

// ===================== Tema (oscuro/claro) =====================
const THEME_KEY = 'mf-theme';
function applyTheme(mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  updateToggleIcon();
}
function getSystemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const mode = saved || (getSystemPrefersDark() ? 'dark' : 'light');
  applyTheme(mode);
}
function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}
function updateToggleIcon() {
  const isDark = document.documentElement.classList.contains('dark');
  if (!els.themeToggle) return;
  els.themeToggle.textContent = isDark ? '☀️' : '🌙';
  els.themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}
initTheme();
els.themeToggle?.addEventListener('click', toggleTheme);

// ===================== API TMDB =====================
const TMDB_KEY = 'TU_API_KEY';
const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/';
const POSTER = (path, size='w342') => path ? `${IMG}${size}${path}` : null;

let lastQuery = '';
let currentPage = 1;
let totalPages = 1;

function setState(msg){ els.state.innerHTML = msg; }
function clearGrid(){ els.grid.innerHTML = ''; }

function skeletonCards(qty = 8){
  const card = `
  <div class="animate-pulse transition">
    <div class="aspect-[2/3] w-full rounded-xl bg-slate-200 dark:bg-slate-800"></div>
    <div class="mt-2 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800"></div>
    <div class="mt-1 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800"></div>
  </div>`;
  els.grid.insertAdjacentHTML('beforeend', Array.from({length: qty}).map(() => card).join(''));
}

function cardTemplate({ id, title, year, poster, rating }) {
  return `
  <button data-id="${id}"
    class="group relative text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-xl overflow-hidden transition">
    <div class="aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-black/10 bg-slate-100
                dark:ring-white/10 dark:bg-slate-900 shadow-sm">
      <img src="${poster}" alt="Póster de ${title}"
        class="h-full w-full object-cover group-hover:scale-[1.06] transition-transform duration-300 ease-out opacity-0"
        onload="this.classList.remove('opacity-0')">
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
      <div class="absolute bottom-2 left-2 right-2 text-xs opacity-0 group-hover:opacity-100 transition">
        <div class="flex items-center justify-between">
          <span class="bg-black/40 px-2 py-0.5 rounded text-amber-300">⭐ ${rating ?? '—'}</span>
          <span class="bg-black/40 px-2 py-0.5 rounded text-slate-200">${year ?? '—'}</span>
        </div>
      </div>
    </div>
    <!-- Altura fija del título para alinear tarjetas -->
    <h3 class="mt-2 text-sm font-medium line-clamp-2 h-9 leading-tight">${title}</h3>
  </button>`;
}

async function fetchJSON(url, params = {}) {
  const q = new URLSearchParams({ api_key: TMDB_KEY, language: 'es-ES', ...params });
  const res = await fetch(`${API}${url}?${q.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchMovies(query, page=1) {
  return fetchJSON('/search/movie', { query, page, include_adult: false });
}

async function getMovie(id) {
  return fetchJSON(`/movie/${id}`, { append_to_response: 'release_dates,credits' });
}

function renderResults(list, append=false) {
  // Mostrar solo películas con póster
  const filtered = list.filter(m => m.poster_path);

  if (!filtered.length) {
    if (!append) clearGrid();
    setState('No hay películas con imagen disponible para mostrar.');
    els.loadMore.classList.add('hidden');
    return;
  }

  const items = filtered.map(m => {
    const title = m.title || m.name || 'Sin título';
    const year = m.release_date ? m.release_date.slice(0,4) : null;
    const poster = POSTER(m.poster_path);
    const rating = m.vote_average ? m.vote_average.toFixed(1) : '—';
    return cardTemplate({ id: m.id, title, year, poster, rating });
  }).join('');

  if (!append) clearGrid();
  els.grid.insertAdjacentHTML('beforeend', items);

  // Click → modal
  els.grid.querySelectorAll('button[data-id]').forEach(btn => {
    btn.onclick = async () => {
      try {
        const id = btn.dataset.id;
        const data = await getMovie(id);
        const title = data.title;
        const year = data.release_date ? data.release_date.slice(0,4) : '—';
        const runtime = data.runtime ? `${data.runtime} min` : '—';
        const rating = data.vote_average ? data.vote_average.toFixed(1) : '—';
        const genres = (data.genres || []).map(g => g.name);
        const overview = data.overview;

        openModal({
          poster: POSTER(data.poster_path, 'w500'),
          title,
          meta: `${year} • ${runtime} • ⭐ ${rating}`,
          genres,
          overview
        });
      } catch (e) {
        alert('No se pudo cargar el detalle.');
        console.error(e);
      }
    };
  });
}

function openModal({poster, title, meta, genres, overview}) {
  els.mPoster.src = poster;
  els.mTitle.textContent = title;
  els.mMeta.textContent = meta;
  els.mGenres.innerHTML = genres.map(g => `<span class="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">${g}</span>`).join('');
  els.mOverview.textContent = overview || 'Sin descripción disponible.';
  els.modal.showModal();
}

els.mClose.addEventListener('click', () => els.modal.close());
els.modal.addEventListener('click', (e) => {
  const r = els.modal.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
    els.modal.close();
  }
});

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = els.input.value.trim();
  if (!q) return;

  lastQuery = q;
  currentPage = 1;
  totalPages = 1;

  setState(`Buscando <strong>“${q}”</strong>…`);
  clearGrid();
  skeletonCards();

  try {
    const data = await searchMovies(q, 1);
    totalPages = data.total_pages || 1;

    if (!data.results?.length) {
      clearGrid();
      setState('No se encontraron resultados.');
      els.loadMore.classList.add('hidden');
      return;
    }

    renderResults(data.results);
    setState(`Mostrando ${Math.min(data.results.length, 20)} de ~${data.total_results} resultados.`);
    els.loadMore.classList.toggle('hidden', currentPage >= totalPages);
  } catch (err) {
    console.error(err);
    clearGrid();
    setState('Ocurrió un error al buscar. Intenta de nuevo.');
    els.loadMore.classList.add('hidden');
  }
});

els.loadMore.addEventListener('click', async () => {
  if (currentPage >= totalPages) return;
  els.loadMore.disabled = true;
  els.loadMore.textContent = 'Cargando…';
  skeletonCards(6);

  try {
    const next = await searchMovies(lastQuery, currentPage + 1);
    currentPage++;
    renderResults(next.results, true);
    els.loadMore.classList.toggle('hidden', currentPage >= totalPages);
  } catch (e) {
    console.error(e);
  } finally {
    els.loadMore.disabled = false;
    els.loadMore.textContent = 'Cargar más';
  }
});
