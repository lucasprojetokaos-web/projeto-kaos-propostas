(function(){
  document.documentElement.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const secs = Array.from(document.querySelectorAll('[data-sec]'));
  const counter = document.getElementById('counter');
  const pad = n => String(n).padStart(2,'0');
  const topOf = el => el.getBoundingClientRect().top + window.scrollY;
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  const clamp = v => Math.max(0, Math.min(maxY(), v));

  /* ── Scroll suave: o wheel define um alvo e a página desliza até ele ── */
  let cur = window.scrollY, tgt = cur, running = false, last = 0, lock = false;
  const SMOOTH = 0.085;           // quanto menor, mais longo e macio o deslize

  function frame(now){
    const dt = Math.min(64, now - (last || now)); last = now;
    const k = 1 - Math.pow(1 - SMOOTH, dt / 16.67);
    cur += (tgt - cur) * k;
    if (Math.abs(tgt - cur) < 0.5) { cur = tgt; running = false; }
    lock = true; window.scrollTo(0, cur);
    if (running) requestAnimationFrame(frame); else { last = 0; }
  }
  function run(){ if (!running){ running = true; last = 0; requestAnimationFrame(frame); } }
  function scrollToY(y){
    tgt = clamp(y);
    if (reduce){ cur = tgt; window.scrollTo(0, tgt); return; }
    run();
  }

  if (!reduce){
    window.addEventListener('wheel', e => {
      if (e.ctrlKey) return;                                   // zoom do navegador
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;     // rolagem horizontal nativa
      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= window.innerHeight;
      if (!running) cur = window.scrollY;
      tgt = clamp(tgt + d);
      run();
    }, { passive: false });
  }

  // Scroll nativo (touch, barra de rolagem, busca) ressincroniza o alvo
  window.addEventListener('scroll', () => {
    if (lock){ lock = false; } else if (!running){ cur = tgt = window.scrollY; }
    requestAnimationFrame(paint);
  }, { passive: true });

  /* ── Setas direcionais: seção a seção ── */
  function current(){
    const y = (running ? tgt : window.scrollY) + window.innerHeight * 0.3;
    let i = 0;
    secs.forEach((s, k) => { if (topOf(s) <= y) i = k; });
    return i;
  }
  function go(i){
    i = Math.max(0, Math.min(secs.length - 1, i));
    if (!running) cur = window.scrollY;
    scrollToY(topOf(secs[i]));
  }
  window.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    const i = current();
    if (['ArrowDown','ArrowRight','PageDown'].includes(e.key)) { e.preventDefault(); go(i + 1); }
    else if (['ArrowUp','ArrowLeft','PageUp'].includes(e.key)) { e.preventDefault(); go(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(secs.length - 1); }
  });

  // Links internos (#) usam o mesmo deslize
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault(); if (!running) cur = window.scrollY; scrollToY(topOf(el));
  }));

  /* ── Contador ── */
  function paint(){ counter.textContent = pad(current()) + ' / ' + pad(secs.length - 1); }
  window.addEventListener('resize', () => { tgt = clamp(tgt); paint(); });

  /* ── Revelação: 400ms, 8px, 60ms entre irmãos ── */
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const sibs = Array.from(e.target.parentElement.children).filter(c => c.classList.contains('rv'));
      e.target.style.transitionDelay = (Math.min(sibs.indexOf(e.target), 4) * 60) + 'ms';
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  paint();
})();
