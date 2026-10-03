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

  var css = '' +
    '#samtykke{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#fff;color:#111827;' +
    'box-shadow:0 -4px 24px rgba(0,0,0,.18);font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45;}' +
    '#samtykke .s-inner{max-width:960px;margin:0 auto;padding:14px 16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;}' +
    '#samtykke p{margin:0;flex:1 1 320px;}' +
    '#samtykke a{color:#188bf6;}' +
    '#samtykke .s-knapper{display:flex;gap:10px;flex:0 0 auto;}' +
    '#samtykke button{font:bold 15px Arial,Helvetica,sans-serif;min-width:110px;height:44px;padding:0 18px;border-radius:4px;cursor:pointer;}' +
    '#samtykke .s-nei{background:#fff;color:#188bf6;border:2px solid #188bf6;}' +
    '#samtykke .s-ja{background:#188bf6;color:#fff;border:2px solid #188bf6;}' +
    '@media (max-width:480px){#samtykke .s-knapper{width:100%;}#samtykke button{flex:1;}}';

  function visBanner() {
    if (document.getElementById('samtykke')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div');
    d.id = 'samtykke';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Informasjonskapsler');
    d.innerHTML =
      '<div class="s-inner">' +
      '<p>Vi bruker informasjonskapsler fra Google for å måle hvordan annonsene våre fungerer. ' +
      'Les mer i <a href="privacy-policy">personvernerklæringen</a>.</p>' +
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
