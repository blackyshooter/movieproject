// Parte 1: solo UI + estados. La llamada real a la API llega en la Parte 2.

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

let lastQuery = '';
let currentPage = 1;
let totalPages = 1;

// Render helpers
function setState(msg) {
  els.state.innerHTML = msg;
}
function clearGrid() {
  els.grid.innerHTML = '';
}
function skeletonCards(qty = 8) {
  const card = `
    <div class="animate-pulse">
      <div class="aspect-[2/3] w-full rounded-lg bg-slate-800"></div>
      <div class="mt-2 h-4 w-3/4 rounded bg-slate-800"></div>
      <div class="mt-1 h-3 w-1/2 rounded bg-slate-800"></div>
    </div>`;
  els.grid.innerHTML = Array.from({length: qty}).map(() => card).join('');
}

// Cards
function cardTemplate({ id, title, year, poster, rating }) {
  return `
  <button data-id="${id}" class="group text-left">
    <div class="aspect-[2/3] w-full overflow-hidden rounded-lg ring-1 ring-white/10 bg-slate-900">
      <img src="${poster}" alt="Póster de ${title}"
        class="h-full w-full object-cover group-hover:scale-[1.02] transition">
    </div>
    <h3 class="mt-2 text-sm font-medium line-clamp-2">${title}</h3>
    <p class="text-xs text-slate-400">${year ?? '—'} · ⭐ ${rating ?? '—'}</p>
  </button>`;
}

// Modal
function openModal({poster, title, meta, genres, overview}) {
  els.mPoster.src = poster;
  els.mTitle.textContent = title;
  els.mMeta.textContent = meta;
  els.mGenres.innerHTML = genres.map(g => (
    `<span class="px-2 py-0.5 rounded-full text-xs bg-slate-800">${g}</span>`
  )).join('');
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

// Eventos (búsqueda sin API real aún)
els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = els.input.value.trim();
  if (!q) return;

  lastQuery = q;
  currentPage = 1;
  totalPages = 1;

  setState(`Buscando <strong>“${q}”</strong>…`);
  clearGrid();
  skeletonCards();
  // La Parte 2 reemplaza esto por fetch real a la API
  setTimeout(() => {
    setState('Conecta la API en la Parte 2 para ver resultados reales.');
    els.grid.innerHTML = '';
  }, 600);
});

els.loadMore.addEventListener('click', () => {
  // La Parte 2 implementa paginación real
});
