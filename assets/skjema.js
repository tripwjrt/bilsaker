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
    if (n.length < 2) return visFeil(navn, 'Skriv inn fullt navn.');
    if (!t) return visFeil(tlf, 'Skriv inn et gyldig telefonnummer.');

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
      location.href = TAKK;
    }).catch(function () {
      sender = false;
      knapp.disabled = false;
      knapp.textContent = 'Kontakt meg';
      visFeil(null, 'Noe gikk galt. Sjekk nettforbindelsen og prøv igjen.');
    });
  });
})();
