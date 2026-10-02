const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');

// Keep native anchor navigation clear of the actual sticky header on every screen.
const stickyHeader = document.querySelector('.site-header');
if (stickyHeader) {
  const measureHeader = () => document.documentElement.style.scrollPaddingTop = (stickyHeader.getBoundingClientRect().height + 16) + 'px';
  measureHeader();
  if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(stickyHeader);
  else window.addEventListener('resize', measureHeader);
}

document.querySelectorAll('.footer-nav').forEach(section => {
  if (section.querySelector('a[href*="contrate-online"]')) {
    const central = document.createElement('a'); central.href='/central-originalli/'; central.textContent='Central · Emergências e serviços'; section.append(central);
  }
});

if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menu.classList.toggle('open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      document.body.classList.remove('menu-open');
    });
  });
}

const attributionKeys = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid'
];
const currentParams = new URLSearchParams(window.location.search);
const attribution = {};

attributionKeys.forEach((key) => {
  const incomingValue = currentParams.get(key);
  if (incomingValue) attribution[key] = incomingValue;
  try {
    if (incomingValue) sessionStorage.setItem('originalli_' + key, incomingValue);
    const storedValue = sessionStorage.getItem('originalli_' + key);
    if (storedValue) attribution[key] = storedValue;
  } catch { /* Navigation and forms remain available when storage is blocked. */ }
});

window.dataLayer = window.dataLayer || [];

function trackEvent(eventName, details) {
  window.dataLayer.push(Object.assign({
    event: eventName
  }, details || {}, attribution));
}

document.querySelectorAll('[data-track]').forEach((element) => {
  element.addEventListener('click', () => {
    trackEvent('originalli_cta_click', {
      cta_name: element.dataset.track,
      page_path: window.location.pathname
    });
  });
});

document.querySelectorAll('[data-product]').forEach((element) => {
  element.addEventListener('click', () => {
    trackEvent('originalli_product_click', {
      product_name: element.dataset.product,
      page_path: window.location.pathname
    });
  });
});

document.querySelectorAll('[data-fill-interest]').forEach((element) => {
  element.addEventListener('click', () => {
    const interestField = document.querySelector('[name="interesse"]');
    if (interestField) interestField.value = element.dataset.fillInterest;
    trackEvent('originalli_product_select', {
      product_name: element.dataset.fillInterest,
      page_path: window.location.pathname
    });
  });
});

if (Object.keys(attribution).length) {
  document.querySelectorAll('a[href]').forEach((link) => {
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;
    const target = new URL(rawHref, window.location.href);
    if (target.origin !== window.location.origin) return;
    Object.entries(attribution).forEach(([key, value]) => {
      if (!target.searchParams.has(key)) target.searchParams.set(key, value);
    });
    link.href = target.toString();
  });
}

const interestFromUrl = currentParams.get('interesse');
const form = document.querySelector('#whatsapp-form');

if (form) {
  const interestField = form.elements.interesse;
  if (interestFromUrl && interestField) {
    if (interestField.tagName === 'SELECT') {
      const matchingOption = Array.from(interestField.options).find((option) => option.value === interestFromUrl);
      if (matchingOption) interestField.value = interestFromUrl;
    } else {
      interestField.value = interestFromUrl;
    }
  }

  const consentLabel = document.createElement('label');
  consentLabel.className = 'contact-consent';
  const consent = document.createElement('input');
  consent.type = 'checkbox'; consent.name = 'consent'; consent.required = true;
  const consentText = document.createElement('span');
  consentText.append('Autorizo a Originalli a usar estes dados para atender minha solicitação. ');
  const privacy = document.createElement('a');
  privacy.href = '/privacidade/'; privacy.textContent = 'Como usamos seus dados';
  consentText.append(privacy); consentLabel.append(consent, consentText);
  const submit = form.querySelector('[type="submit"]');
  submit.before(consentLabel);
  const trap = document.createElement('input');
  trap.name = 'website'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.hidden = true;
  form.append(trap);
  const receipt = document.createElement('p');
  receipt.setAttribute('role', 'status'); receipt.setAttribute('aria-live', 'polite');
  submit.after(receipt);
  let requestId, lastPayload;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const nome = String(data.get('nome') || '').trim();
    const perfil = String(data.get('perfil') || '').trim();
    const interesse = String(data.get('interesse') || '').trim();
    const telefone = String(data.get('telefone') || '').trim();
    const cidade = String(data.get('cidade') || '').trim();
    const context = form.dataset.formContext || document.title;
    const sourceDetails = [
      attribution.utm_source && 'fonte ' + attribution.utm_source,
      attribution.utm_campaign && 'campanha ' + attribution.utm_campaign
    ].filter(Boolean).join(' · ');
    const lines = [
      'Olá! Sou ' + nome + ' e gostaria de uma análise da Originalli.',
      interesse && 'Interesse: ' + interesse + '.',
      perfil && 'Perfil: ' + perfil + '.',
      telefone && 'Telefone: ' + telefone + '.',
      cidade && 'Cidade/UF: ' + cidade + '.',
      'Página: ' + context + '.',
      sourceDetails && 'Origem: ' + sourceDetails + '.'
    ].filter(Boolean);

    const payload = {name:nome, phone:telefone, profile:perfil, interest:interesse,
      city:cidade, page:window.location.pathname, attribution,
      consent:consent.checked, website:String(data.get('website') || '')};
    const signature = JSON.stringify(payload);
    if (signature !== lastPayload) { requestId = crypto.randomUUID(); lastPayload = signature; }
    submit.disabled = true;
    receipt.textContent = 'Registrando sua solicitação…';
    try {
      const response = await fetch('/api/leads', {method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...payload,requestId})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível registrar sua solicitação.');
      receipt.replaceChildren();
      const confirmation = document.createElement('span');
      confirmation.textContent = 'Solicitação registrada. Continue a conversa com nossa equipe: ';
      const link = document.createElement('a');
      link.href = 'https://wa.me/554333759800?text=' + encodeURIComponent([...lines,'Protocolo: '+result.id].join('\n'));
      link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Continuar pelo WhatsApp';
      receipt.append(confirmation,link);
      trackEvent('originalli_generate_lead', {lead_product:interesse, lead_profile:perfil,
        form_context:context,page_path:window.location.pathname});
    } catch (error) { receipt.textContent = error.message || 'Não foi possível enviar. Tente novamente.'; }
    finally { submit.disabled = false; }
  });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((item) => item.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach((item) => observer.observe(item));
}

const year = document.querySelector('#current-year');
if (year) year.textContent = String(new Date().getFullYear());

const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.type = 'button';
backToTop.setAttribute('aria-label', 'Voltar ao topo');
backToTop.setAttribute('aria-hidden', 'true');
backToTop.tabIndex = -1;
backToTop.innerHTML = '<span aria-hidden="true">↑</span><span class="back-to-top-label">Topo</span>';
document.body.append(backToTop);

function updateBackToTop() {
  const isVisible = window.scrollY > Math.min(640, window.innerHeight * 0.75);
  backToTop.classList.toggle('is-visible', isVisible);
  backToTop.setAttribute('aria-hidden', String(!isVisible));
  backToTop.tabIndex = isVisible ? 0 : -1;
}

backToTop.addEventListener('click', () => {
  trackEvent('originalli_back_to_top', { page_path: window.location.pathname });
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});

window.addEventListener('scroll', updateBackToTop, { passive: true });
updateBackToTop();

// Close the mobile navigation with Escape and when returning to desktop.
function closeMainMenu(){if(!menuButton||!menu)return;menuButton.setAttribute('aria-expanded','false');menu.classList.remove('open');document.body.classList.remove('menu-open');}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.classList.contains('open')){closeMainMenu();menuButton.focus();}});
window.matchMedia('(min-width:1101px)').addEventListener('change',e=>{if(e.matches)closeMainMenu();});

// Page keys follow subject boundaries; longer subjects retain overlapping reading steps.
if (stickyHeader && document.querySelector('main')) {
  document.addEventListener('keydown', event => {
    if (!['PageDown','PageUp'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented || event.repeat) return;
    if (!window.matchMedia('(min-width:1101px)').matches || document.body.classList.contains('menu-open')) return;
    const active = document.activeElement;
    if (active?.closest('input,textarea,select,button,[contenteditable="true"],[role="dialog"],iframe')) return;
    // Leave independently scrollable tables/panels to the browser.
    for(let node=active;node&&node!==document.body;node=node.parentElement){
      if(node.scrollHeight>node.clientHeight+4&&/auto|scroll/.test(getComputedStyle(node).overflowY))return;
    }
    const offset=stickyHeader.getBoundingClientRect().height+12;
    const step=Math.max(100,window.innerHeight-offset-32);
    const current=window.scrollY;
    const blocks=[...document.querySelectorAll('main > section,main > nav,.site-footer')].filter(el=>el.getClientRects().length);
    const stops=[0,...blocks.map(el=>Math.max(0,el.getBoundingClientRect().top+current-offset))].sort((a,b)=>a-b);
    const down=event.key==='PageDown';
    const boundary=down?stops.find(y=>y>current+8):stops.filter(y=>y<current-8).at(-1);
    let target=current+(down?step:-step);
    if(boundary!==undefined) target=down?Math.min(target,boundary):Math.max(target,boundary);
    target=Math.max(0,Math.min(target,document.documentElement.scrollHeight-window.innerHeight));
    event.preventDefault();
    // Instant positioning keeps consecutive page keys predictable and respects reduced motion.
    const prior=document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,target);
    document.documentElement.style.scrollBehavior=prior;
  });
}
