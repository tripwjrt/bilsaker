/* Trakt-teller: teller sidevisninger, klikk på knappene og stegene i skjemaet.
   Ingen cookies, ingen lagring i nettleseren og ingen persondata (ikke navn eller telefon).
   Alt er pakket i try/catch og sendes i bakgrunnen, så siden og skjemaet virker uansett. */
(function () {
  try {
    var SUPABASE = 'https://aikbzmkbiigkywothywj.supabase.co';
    var KEY = 'sb_publishable_zCYTO6fGdymrvHLNt77OrA_vpoIzFfV';
    var site = location.hostname.replace(/^www\./, '');
    var pv = Math.random().toString(36).slice(2, 10);
    var qs = new URLSearchParams(location.search);
    var device = window.innerWidth < 768 ? 'mobil' : 'pc';
    var gclid = !!qs.get('gclid');
    try { if ((JSON.parse(sessionStorage.getItem('lead_sporing') || '{}') || {}).gclid) gclid = true; } catch (e) {}
    var utm = qs.get('utm_content') || null;

    var logg = function (ev, detail) {
      try {
        fetch(SUPABASE + '/rest/v1/rpc/log_event', {
          method: 'POST',
          keepalive: true,
          headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_site: site, p_event: ev, p_detail: detail || null, p_pv: pv,
            p_device: device, p_has_gclid: gclid, p_utm_content: utm })
        }).catch(function () {});
      } catch (e) {}
    };
    window.__trakt = logg;

    logg('sidevisning');

    document.addEventListener('click', function (e) {
      try {
        var t = e.target;
        if (!t || !t.closest) return;
        var b = t.closest('.c-button button');
        if (b) logg('cta_klikk', (b.id || '').replace(/_btn$/, ''));
        if (t.closest('.closeLPModal')) logg('popup_lukket', 'kryss');
        if (t.id === 'overlay') logg('popup_lukket', 'utenfor');
      } catch (err) {}
    }, true);

    var startet = false;
    document.addEventListener('focusin', function (e) {
      try {
        if (!startet && e.target && e.target.name && e.target.closest && e.target.closest('#lead-skjema')) {
          startet = true;
          logg('skjema_start', e.target.name || '');
        }
      } catch (err) {}
    }, true);
  } catch (e) {}
})();

/* Skjemaet i popupen: navn + telefon sendes til vår egen database (Supabase).
   Etter innsending går den besøkende til takkesiden, der konverteringen måles. */
(function () {
  var SUPABASE = 'https://aikbzmkbiigkywothywj.supabase.co';
  var KEY = 'sb_publishable_zCYTO6fGdymrvHLNt77OrA_vpoIzFfV'; // offentlig nøkkel: kan bare sende inn leads
  var CLIENT = 'resolve';
  var TAKK = '/thank-you';

  var form = document.getElementById('lead-skjema');
  if (!form) return;
  var site = form.getAttribute('data-site') || location.hostname.replace(/^www\./, '');

  // Husk annonseparametere fra første side i økten (gclid, utm_*), også om de forsvinner fra adressen.
  var KEYS = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var sporing = {};
  try { sporing = JSON.parse(sessionStorage.getItem('lead_sporing') || '{}') || {}; } catch (e) {}
  var qs = new URLSearchParams(location.search);
  KEYS.forEach(function (k) { if (qs.get(k)) sporing[k] = qs.get(k); });
  if (!sporing.referrer && document.referrer && document.referrer.indexOf(location.host) < 0) sporing.referrer = document.referrer;
  if (!sporing.landing) sporing.landing = location.href;
  try { sessionStorage.setItem('lead_sporing', JSON.stringify(sporing)); } catch (e) {}

  var navn = form.elements.navn;
  var tlf = form.elements.tlf;
  var knapp = form.querySelector('button');
  var feil = form.querySelector('.ls-feil');

  // Hengelås på send-knappen (signaliserer trygg innsending).
  var LAS = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" style="vertical-align:-2px;margin-right:8px" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var KNAPPETEKST = 'Kontakt meg';
  try { knapp.innerHTML = LAS + KNAPPETEKST; } catch (e) {}
  var trakt = function (ev, d) { try { if (window.__trakt) window.__trakt(ev, d); } catch (e) {} };

  function telefon(raw) {
    var s = String(raw || '').trim().replace(/[\s().-]/g, '');
    if (s.indexOf('00') === 0) s = '+' + s.slice(2);
    var d = s.replace(/\D/g, '');
    if (s.charAt(0) === '+') return d.length >= 8 ? '+' + d : null;
    if (d.length === 8) return '+47' + d;
    if (d.length === 10 && d.indexOf('47') === 0) return '+' + d;
    return d.length >= 8 ? d : null;
  }

  function visFeil(el, msg) {
    feil.textContent = msg;
    feil.hidden = false;
    if (el) { el.classList.add('ls-ugyldig'); el.focus(); }
  }

  [navn, tlf].forEach(function (el) {
    el.addEventListener('input', function () { el.classList.remove('ls-ugyldig'); feil.hidden = true; });
  });

  var sender = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sender) return;
    var n = navn.value.trim();
    var t = telefon(tlf.value);
    trakt('innsending_forsok');
    if (n.length < 2) { trakt('ugyldig', 'navn'); return visFeil(navn, 'Skriv inn fullt navn.'); }
    if (!t) { trakt('ugyldig', 'tlf'); return visFeil(tlf, 'Skriv inn et gyldig telefonnummer.'); }

    sender = true;
    knapp.disabled = true;
    knapp.textContent = 'Sender …';
    feil.hidden = true;

    fetch(SUPABASE + '/rest/v1/rpc/submit_lead', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_client: CLIENT,
        p_name: n,
        p_phone: t,
        p_source_site: site,
        p_page_url: sporing.landing || location.href,
        p_referrer: sporing.referrer || null,
        p_utm_source: sporing.utm_source || null,
        p_utm_medium: sporing.utm_medium || null,
        p_utm_campaign: sporing.utm_campaign || null,
        p_utm_term: sporing.utm_term || null,
        p_utm_content: sporing.utm_content || null,
        p_gclid: sporing.gclid || null
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      trakt('innsendt');
      location.href = TAKK;
    }).catch(function (err) {
      trakt('feil', String(err && err.message || err).slice(0, 40));
      sender = false;
      knapp.disabled = false;
      knapp.innerHTML = LAS + KNAPPETEKST;
      visFeil(null, 'Noe gikk galt. Sjekk nettforbindelsen og prøv igjen.');
    });
  });
})();
