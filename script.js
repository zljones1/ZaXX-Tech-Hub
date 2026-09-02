const starterProjects = [
  { id: 'orbit', name: 'Orbit Dashboard', category: 'web', description: 'A calm command center for making sense of busy systems.', year: '2026', code: '<div class="orbit-dashboard">\n  <span class="signal">All systems clear</span>\n</div>' },
  { id: 'type', name: 'Type / Motion', category: 'experiment', description: 'A playful study in kinetic type, rhythm, and responsive movement.', year: '2025', code: 'const words = [\'move\', \'make\', \'wonder\'];\nwords.forEach(animate);' },
  { id: 'tiny', name: 'Tiny Timer', category: 'tool', description: 'A focused little timer for people who like to work in sprints.', year: '2025', code: 'function startTimer(minutes) {\n  return minutes * 60;\n}' }
];

function loadProjects() {
  try {
    const storedProjects = localStorage.getItem('studio-projects');
    const parsedProjects = storedProjects ? JSON.parse(storedProjects) : starterProjects;
    return Array.isArray(parsedProjects) ? parsedProjects : starterProjects;
  } catch (error) {
    return starterProjects;
  }
}

let projects = loadProjects();
let activeFilter = 'all';
const grid = document.querySelector('#project-grid');
const emptyState = document.querySelector('#empty-state');
const githubGrid = document.querySelector('#github-grid');

function saveProjects() {
  try { localStorage.setItem('studio-projects', JSON.stringify(projects)); } catch (error) { }
}
function categoryLabel(category) { return category === 'web' ? 'Web' : category === 'experiment' ? 'Experiment' : 'Tool'; }

function renderProjects() {
  const query = document.querySelector('#search-input').value.toLowerCase().trim();
  const visible = projects.filter(project => (activeFilter === 'all' || project.category === activeFilter) && `${project.name} ${project.description}`.toLowerCase().includes(query));
  grid.innerHTML = visible.map((project, index) => `<article class="project-card" style="animation-delay:${index * 70}ms"><div class="project-visual visual-${project.category}"><div class="visual-lines"><i></i><i></i><i></i></div><span class="visual-mark">${project.category === 'web' ? '01' : project.category === 'experiment' ? '✳' : '↗'}</span></div><div class="card-body"><div class="card-meta"><span>${categoryLabel(project.category)}</span><span>${project.year}</span></div><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description)}</p><div class="card-footer"><button class="card-link view-code" data-id="${project.id}">View source ↗</button>${projects.length > 1 ? `<button class="delete-project" data-id="${project.id}">Remove</button>` : ''}</div></div></article>`).join('');
  emptyState.hidden = visible.length > 0;
  ['all', 'web', 'experiment', 'tool'].forEach(filter => { document.querySelector(`#${filter === 'all' ? 'all' : filter}-count`).textContent = filter === 'all' ? projects.length : projects.filter(project => project.category === filter).length; });
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character])); }

document.querySelectorAll('.filter-pill').forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; document.querySelectorAll('.filter-pill').forEach(item => item.classList.toggle('active', item === button)); renderProjects(); }));
document.querySelector('#search-input').addEventListener('input', renderProjects);
grid.addEventListener('click', event => {
  const id = event.target.dataset.id;
  if (event.target.classList.contains('delete-project')) { projects = projects.filter(project => project.id !== id); saveProjects(); renderProjects(); }
  if (event.target.classList.contains('view-code')) { const project = projects.find(item => item.id === id); if (!project) return; document.querySelector('#code-title').textContent = project.name; document.querySelector('#code-content').textContent = project.code || '// No source added yet.'; document.querySelector('#code-dialog').showModal(); }
});

const projectDialog = document.querySelector('#project-dialog');
document.querySelector('#open-add').addEventListener('click', () => projectDialog.showModal());
document.querySelector('#close-code').addEventListener('click', () => document.querySelector('#code-dialog').close());
document.querySelector('#copy-code').addEventListener('click', async event => { try { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(document.querySelector('#code-content').textContent); event.target.textContent = 'Copied ✓'; } catch (error) { event.target.textContent = 'Copy unavailable'; } setTimeout(() => { event.target.textContent = 'Copy code'; }, 1400); });
document.querySelector('#project-file').addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.addEventListener('load', () => { document.querySelector('#project-code').value = reader.result; }); reader.readAsText(file); });
document.querySelector('#project-form').addEventListener('submit', event => { event.preventDefault(); const name = document.querySelector('#project-name').value.trim(); projects.unshift({ id: `${Date.now()}`, name, category: document.querySelector('#project-category').value, description: document.querySelector('#project-description').value.trim(), code: document.querySelector('#project-code').value || '// Source coming soon.', year: new Date().getFullYear() }); saveProjects(); renderProjects(); projectDialog.close(); event.target.reset(); document.querySelector('#work').scrollIntoView({ behavior: 'smooth' }); });
renderProjects();

async function loadGithubRepos() {
  try {
    const response = await fetch('https://api.github.com/users/zljones1/repos?sort=updated&per_page=6');
    if (!response.ok) throw new Error('GitHub request failed');
    const repos = await response.json();
    if (!repos.length) { githubGrid.innerHTML = '<div class="github-error">No public repositories found yet.</div>'; return; }
    const repositoryMarkup = repos.map(repo => { let repoUrl; try { repoUrl = new URL(repo.html_url); } catch (error) { return ''; } if (repoUrl.protocol !== 'https:' || repoUrl.hostname !== 'github.com') return ''; return `<a class="github-repo" href="${escapeHtml(repoUrl.href)}" target="_blank" rel="noreferrer"><h3>${escapeHtml(repo.name)}</h3><p>${escapeHtml(repo.description || 'A public project from the archive.')}</p><div class="repo-meta"><span>${escapeHtml(repo.language || 'Code')}</span><span>★ ${repo.stargazers_count}</span><span>↗ GitHub</span></div></a>`; }).join('');
    githubGrid.innerHTML = repositoryMarkup || '<div class="github-error">No valid public repositories found yet.</div>';
  } catch (error) {
    githubGrid.innerHTML = '<div class="github-error">GitHub repos are unavailable right now. The rest of the archive is still here.</div>';
  }
}
loadGithubRepos();

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach(element => revealObserver.observe(element));
} else {
  revealElements.forEach(element => element.classList.add('is-visible'));
}