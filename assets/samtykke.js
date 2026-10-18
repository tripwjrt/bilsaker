/* Samtykke til informasjonskapsler (Google Consent Mode v2).
   Standard er «avslått» (settes i <head> før Google-taggen). Banneret vises til
   besøkende som ikke har valgt ennå. Valget huskes i 12 måneder. */
(function () {
  var NOKKEL = 'bilsaker_samtykke';
  var GYLDIG_MS = 365 * 24 * 60 * 60 * 1000;

  function lesValg() {
    try {
      var v = JSON.parse(localStorage.getItem(NOKKEL) || 'null');
      if (v && v.t && Date.now() - v.t < GYLDIG_MS) return v.valg;
    } catch (e) {}
    return null;
  }
  function lagreValg(valg) {
    try { localStorage.setItem(NOKKEL, JSON.stringify({ valg: valg, t: Date.now() })); } catch (e) {}
  }
  function oppdaterGoogle(ja) {
    var s = ja ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: s, ad_user_data: s, ad_personalization: s, analytics_storage: s
      });
    }
  }

  // Kompakt stripe nederst, slik at «Kontakt meg»-knappen ikke dekkes på mobil.
  var css = '' +
    '#samtykke{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#fff;color:#111827;' +
    'box-shadow:0 -2px 12px rgba(0,0,0,.15);font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.35;}' +
    '#samtykke .s-inner{max-width:960px;margin:0 auto;padding:8px 12px;display:flex;gap:10px;align-items:center;}' +
    '#samtykke p{margin:0;flex:1 1 auto;}' +
    '#samtykke a{color:#188bf6;}' +
    '#samtykke .s-knapper{display:flex;gap:8px;flex:0 0 auto;}' +
    '#samtykke button{font:bold 13px Arial,Helvetica,sans-serif;min-width:72px;height:34px;padding:0 12px;border-radius:4px;cursor:pointer;}' +
    '#samtykke .s-nei{background:#fff;color:#188bf6;border:2px solid #188bf6;}' +
    '#samtykke .s-ja{background:#188bf6;color:#fff;border:2px solid #188bf6;}' +
    '@media (max-width:480px){#samtykke{font-size:12px;}#samtykke .s-inner{padding:6px 10px;gap:8px;}' +
    '#samtykke button{min-width:62px;height:32px;padding:0 8px;font-size:12.5px;}}';

  function visBanner() {
    if (document.getElementById('samtykke')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div');
    d.id = 'samtykke';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Informasjonskapsler');
    d.innerHTML =
      '<div class="s-inner">' +
      '<p>Vi bruker informasjonskapsler for å måle annonsene. <a href="privacy-policy">Les mer</a></p>' +
      '<div class="s-knapper">' +
      '<button type="button" class="s-nei">Avslå</button>' +
      '<button type="button" class="s-ja">Godta</button>' +
      '</div></div>';
    document.body.appendChild(d);
    d.querySelector('.s-ja').addEventListener('click', function () { lagreValg('ja'); oppdaterGoogle(true); d.remove(); });
    d.querySelector('.s-nei').addEventListener('click', function () { lagreValg('nei'); oppdaterGoogle(false); d.remove(); });
  }

  // Lenker med data-endre-samtykke åpner banneret igjen (brukes i personvernerklæringen).
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-endre-samtykke]');
    if (a) { e.preventDefault(); visBanner(); }
  });

  if (lesValg() === null) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', visBanner);
    else visBanner();
  }
})();
