// QuizWhiz frontend — plain JavaScript, hash-based views, no frameworks.
// All user content is rendered with textContent (never raw HTML) to prevent XSS.

const state = { user: null };

// --- Tiny helpers ---------------------------------------------------------

async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Try again.');
  }
  return data;
}

// DOM builder: el('div', { class: 'x', text: 'hi' }, childEl, ...)
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child);
  }
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

const app = document.getElementById('app');
const nav = document.getElementById('nav-links');

const SUBJECTS = [
  { title: 'Math', icon: '🧮', meta: '10 questions · 30 s each' },
  { title: 'Science', icon: '🔬', meta: '10 questions · 30 s each' },
  { title: 'History', icon: '📜', meta: '10 questions · 30 s each' },
  { title: 'Geography', icon: '🌍', meta: '10 questions · 30 s each' },
  { title: 'English', icon: '📚', meta: '10 questions · 30 s each' }
];

// --- Nav ---------------------------------------------------------------

function renderNav() {
  clear(nav);
  if (state.user) {
    nav.append(
      el('a', { class: 'nav-link', href: '#/', text: 'Home' }),
      el('a', { class: 'nav-link', href: '#/leaderboards', text: 'Leaderboards' }),
      el('a', { class: 'nav-link', href: '#/history', text: 'My History' }),
      el('span', { class: 'user-chip', text: state.user.username }),
      el(
        'button',
        {
          class: 'btn btn-secondary',
          text: 'Log out',
          onclick: async () => {
            await api('/auth/logout', { method: 'POST' });
            state.user = null;
            location.hash = '#/';
            route();
          }
        }
      )
    );
  } else {
    nav.append(
      el('a', { class: 'nav-link', href: '#/login', text: 'Log in' }),
      el('a', { class: 'btn btn-primary', href: '#/register', text: 'Sign up' })
    );
  }
}

// --- Views ---------------------------------------------------------------

function viewWelcome() {
  app.append(
    el(
      'section',
      { class: 'hero' },
      el('h1', { text: 'QuizWhiz 🌟' }),
      el('p', { class: 'tagline', text: 'Five subjects. Ten questions. How smart are your classmates?' }),
      el(
        'div',
        { class: 'hero-actions' },
        el('a', { class: 'btn btn-primary', href: '#/register', text: 'Create account' }),
        el('a', { class: 'btn btn-secondary', href: '#/login', text: 'Log in' })
      ),
      el(
        'div',
        { class: 'feature-row' },
        el(
          'div',
          { class: 'feature-card' },
          el('div', { class: 'icon', text: '📚' }),
          el('h3', { text: 'Five subjects' }),
          el('p', { text: 'Math, Science, History, Geography, English — ten questions each.' })
        ),
        el(
          'div',
          { class: 'feature-card' },
          el('div', { class: 'icon', text: '⏱' }),
          el('h3', { text: 'Timed rounds' }),
          el('p', { text: 'Thirty seconds per question keeps the energy up.' })
        ),
        el(
          'div',
          { class: 'feature-card' },
          el('div', { class: 'icon', text: '🏆' }),
          el('h3', { text: 'Leaderboards' }),
          el('p', { text: 'See how you rank against your classmates.' })
        )
      )
    ),
    el('footer', { class: 'page-footer', text: 'QuizWhiz — built for class 🌟' })
  );
}

function viewHome() {
  app.append(
    el('h1', { text: 'Hi, ' + state.user.username + '! 🌟' }),
    el('p', { class: 'tagline', text: 'Pick a subject and show off what you know.' }),
    el(
      'div',
      { class: 'quiz-grid' },
      SUBJECTS.map((subject) =>
        el(
          'div',
          { class: 'quiz-card' },
          el('div', { class: 'icon', text: subject.icon }),
          el('h3', { text: subject.title }),
          el('div', { class: 'meta', text: subject.meta }),
          el('span', { class: 'badge', text: 'Coming in Phase 2' })
        )
      )
    )
  );
}

function authFormFields(form, fields) {
  for (const field of fields) {
    const input = el('input', {
      type: field.type,
      name: field.name,
      placeholder: field.placeholder || '',
      autocomplete: field.autocomplete
    });
    const wrap = el(
      'div',
      { class: 'field' },
      el('label', { text: field.label }),
      input,
      field.hint ? el('p', { class: 'hint', text: field.hint }) : null
    );
    form.append(wrap);
  }
  return form;
}

function makeAuthView({ heading, fields, submitLabel, swap, onSubmit }) {
  const banner = el('div');
  const form = el('form', { class: 'auth-form' });

  authFormFields(form, fields);

  const submitBtn = el(
    'button',
    { class: 'btn btn-primary btn-block', type: 'submit', text: submitLabel }
  );
  form.append(submitBtn);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clear(banner);
    submitBtn.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      await onSubmit(data);
    } catch (err) {
      banner.append(
        el('div', { class: 'banner banner-error', text: err.message })
      );
    } finally {
      submitBtn.disabled = false;
    }
  });

  app.append(
    el(
      'section',
      { class: 'card form-card' },
      el('h1', { text: heading }),
      banner,
      form,
      el('p', { class: 'swap-link', text: swap.question + ' ' }, el('a', { href: swap.href, text: swap.link }))
    )
  );
}

function viewRegister() {
  makeAuthView({
    heading: 'Create your account',
    fields: [
      { name: 'username', type: 'text', label: 'Username', placeholder: 'quizwhizkid', autocomplete: 'username', hint: '3-20 letters, numbers, or underscores. This is the name classmates will see.' },
      { name: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', autocomplete: 'email' },
      { name: 'password', type: 'password', label: 'Password', placeholder: 'At least 8 characters', autocomplete: 'new-password' },
      { name: 'confirm', type: 'password', label: 'Confirm password', autocomplete: 'new-password' },
      { name: 'inviteCode', type: 'text', label: 'Invite code (optional)', placeholder: 'Only if your teacher gave you a code', autocomplete: 'off' }
    ],
    submitLabel: 'Sign up',
    swap: { question: 'Already have an account?', link: 'Log in', href: '#/login' },
    onSubmit: async (data) => {
      if (data.password !== data.confirm) {
        throw new Error('Passwords do not match — try again.');
      }
      const user = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          inviteCode: data.inviteCode || ''
        })
      });
      state.user = user;
      location.hash = '#/';
      route();
    }
  });
}

function viewLogin() {
  makeAuthView({
    heading: 'Welcome back!',
    fields: [
      { name: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', autocomplete: 'email' },
      { name: 'password', type: 'password', label: 'Password', autocomplete: 'current-password' }
    ],
    submitLabel: 'Log in',
    swap: { question: 'New here?', link: 'Create an account', href: '#/register' },
    onSubmit: async (data) => {
      state.user = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      location.hash = '#/';
      route();
    }
  });
}

// --- Router ---------------------------------------------------------------

function route() {
  renderNav();
  clear(app);
  const hash = location.hash || '#/';

  if (!state.user && (hash === '#/' || hash === '')) {
    viewWelcome();
    return;
  }
  if (!state.user) {
    if (hash === '#/register') viewRegister();
    else viewLogin();
    return;
  }

  // Logged in
  if (hash === '#/login' || hash === '#/register' || hash === '#/' || hash === '') {
    viewHome();
  } else if (hash === '#/history' || hash === '#/leaderboards') {
    app.append(
      el('h1', { text: hash === '#/history' ? 'My History' : 'Leaderboards' }),
      el('p', { class: 'tagline', text: 'This page arrives in a later phase — stay tuned! 🌟' })
    );
  } else {
    viewHome();
  }
}

window.addEventListener('hashchange', route);

// On load: ask the server who we are, then render the right view.
(async () => {
  try {
    state.user = await api('/auth/me');
  } catch (err) {
    state.user = null;
  }
  route();
})();
