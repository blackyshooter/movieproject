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
};

// 🔑 Pega tu API key aquí
const TMDB_KEY = '20600cdcada2dc0d20425d2fc04c9e8b';
const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/';
const POSTER = (path, size='w342') => path ? `${IMG}${size}${path}` : './assets/placeholder.svg';

let lastQuery = '';
let currentPage = 1;
let totalPages = 1;

function setState(msg){ els.state.innerHTML = msg; }
function clearGrid(){ els.grid.innerHTML = ''; }
function skeletonCards(qty = 8){
  const card = `
  <div class="animate-pulse">
    <div class="aspect-[2/3] w-full rounded-lg bg-slate-800"></div>
    <div class="mt-2 h-4 w-3/4 rounded bg-slate-800"></div>
    <div class="mt-1 h-3 w-1/2 rounded bg-slate-800"></div>
  </div>`;
  els.grid.insertAdjacentHTML('beforeend', Array.from({length: qty}).map(() => card).join(''));
}

function cardTemplate({ id, title, year, poster, rating }) {
  return `
  <button data-id="${id}" class="group text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded">
    <div class="aspect-[2/3] w-full overflow-hidden rounded-lg ring-1 ring-white/10 bg-slate-900">
      <img src="${poster}" alt="Póster de ${title}"
        class="h-full w-full object-cover group-hover:scale-[1.02] transition">
    </div>
    <h3 class="mt-2 text-sm font-medium line-clamp-2">${title}</h3>
    <p class="text-xs text-slate-400">${year ?? '—'} · ⭐ ${rating ?? '—'}</p>
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
  // Con append_to_response traemos géneros y más data en una
  return fetchJSON(`/movie/${id}`, { append_to_response: 'release_dates,credits' });
}

function renderResults(list, append=false) {
  const items = list.map(m => {
    const title = m.title || m.name || 'Sin título';
    const year = m.release_date ? m.release_date.slice(0,4) : null;
    const poster = POSTER(m.poster_path);
    const rating = m.vote_average ? m.vote_average.toFixed(1) : '—';
    return cardTemplate({ id: m.id, title, year, poster, rating });
  }).join('');

  if (!append) clearGrid();
  els.grid.insertAdjacentHTML('beforeend', items);

  // Delegación: abrir modal al click
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
  els.mGenres.innerHTML = genres.map(g => `<span class="px-2 py-0.5 rounded-full text-xs bg-slate-800">${g}</span>`).join('');
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

// Buscar
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

    setState(`Mostrando ${Math.min(data.results.length, 20)} de ~${data.total_results} resultados.`);
    renderResults(data.results);
    els.loadMore.classList.toggle('hidden', currentPage >= totalPages);
  } catch (err) {
    console.error(err);
    clearGrid();
    setState('Ocurrió un error al buscar. Intenta de nuevo.');
    els.loadMore.classList.add('hidden');
  }
});

// Paginación
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