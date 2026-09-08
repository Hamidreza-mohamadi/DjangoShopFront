document.addEventListener('DOMContentLoaded', function () {
  if (window.lucide) lucide.createIcons();

  const nav = document.querySelector('[data-nav-row]');
  let hidden = false;
  let frame = 0;
  function onScroll() {
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      const y = window.scrollY;
      if (!hidden && y > 140) { hidden = true; nav && nav.classList.add('is-hidden'); }
      else if (hidden && y < 60) { hidden = false; nav && nav.classList.remove('is-hidden'); }
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});

  const menuButton = document.querySelector('[data-mobile-menu]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  if (menuButton && mobilePanel) menuButton.addEventListener('click', function () {
    const open = mobilePanel.hidden;
    mobilePanel.hidden = !open;
    menuButton.innerHTML = '<i data-lucide="' + (open ? 'x' : 'menu') + '"></i>';
    if (window.lucide) lucide.createIcons();
  });

  const userButton = document.querySelector('[data-user-menu]');
  const userPopover = document.querySelector('[data-user-popover]');
  if (userButton && userPopover) {
    userButton.addEventListener('click', function(e){ e.stopPropagation(); userPopover.hidden = !userPopover.hidden; });
    document.addEventListener('click', function(){ userPopover.hidden = true; });
  }

  document.querySelectorAll('[data-hero]').forEach(function(hero){
    const track = hero.querySelector('.hero-track');
    const slides = hero.querySelectorAll('.hero-slide');
    const dots = hero.querySelectorAll('.hero-dot');
    if (!track || slides.length < 2) return;
    let index = 0;
    function go(next){
      index = (next + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (index * 100) + '%)';
      dots.forEach(function(d,i){ d.classList.toggle('active', i === index); });
    }
    hero.querySelector('[data-hero-prev]')?.addEventListener('click', function(){go(index-1)});
    hero.querySelector('[data-hero-next]')?.addEventListener('click', function(){go(index+1)});
    dots.forEach(function(d,i){ d.addEventListener('click', function(){go(i)}); });
    setInterval(function(){go(index+1)}, 4500);
  });
});
