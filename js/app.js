/* Uddevalla Centrum – sidans logik: vyer, sökning, navigering och formulär.
   Läser data från foretag.js, innehall.js, policyer.js och sidinfo.js, som måste laddas först. */
(function(){
"use strict";

/* ---------- Hjälpare ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ico = (n,cls) => `<svg class="ico ${cls||""}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const initials = n => { const w = n.replace(/[^A-Za-zÅÄÖåäöÉé0-9& ]/g," ").split(/\s+/).filter(x=>x && !/^(&|och|i|by|and|på|the)$/i.test(x)); return ((w[0]||"")[0]||"").toUpperCase() + ((w[1]||"")[0]||"").toUpperCase(); };
const count = f => BIZ.filter(f).length;
// Säljläge: öppna sidan med ?demo för att visa nivåer, låsta ytor, nivåväljaren och interna verifieringsnoteringar.
// Vanliga besökare ser aldrig vilken nivå ett företag har, vad det betalar eller centrumföreningens arbetsanteckningar.
const DEMO = new URLSearchParams(location.search).has("demo");
const pubTier = t => DEMO ? tierTag(t) : "";
const tierTag = t => t==="premium" ? `<span class="tag premium">Premium</span>` : t==="plus" ? `<span class="tag plus">Plus</span>` : "";

/* ---------- Adresser ----------
   Lokalt (file://) används #-adresser. På en server används riktiga adresser som /foretag/viola-blommor,
   så att varje sida kan hittas av Google. routeToPath och pathToRoute finns i sidinfo.js. */
const PATHS = false;   // Delningslänk: använd #-adresser
const ASSET = PATHS ? "/" : "";
const currentRoute = () => PATHS ? pathToRoute(location.pathname) : (location.hash.slice(1) || "start");
const urlFor = r => PATHS ? routeToPath(r) + location.search : "#" + r;
function go(r){
  if(PATHS){ history.pushState(null, "", urlFor(r)); onRoute(); }
  else location.hash = r;
}
// Mallarna skriver länkar som href="#route". På en server görs de om till riktiga adresser.
function linkify(root){
  if(!PATHS) return;
  root.querySelectorAll('a[href^="#"]').forEach(a=>{ const r=a.getAttribute("href").slice(1); if(r) a.setAttribute("href", urlFor(r)); });
}

/* ---------- Öppettider ----------
   Öppettider och avvikande dagar fylls i under DETALJER i foretag.js. */
const DAYS = ["mån","tis","ons","tor","fre","lör","sön"];
const DAYS_LONG = ["Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag","Söndag"];
const weekday = d => (d.getDay()+6)%7;   // 0 = måndag
const isoDay = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const toMin = t => { const [h,m] = t.split(":").map(Number); return h*60 + (m||0); };
const fmtHours = h => h ? h.replace("-","–") : "Stängt";
function hoursOn(b, d){ const a = b.avvik && b.avvik[isoDay(d)]; return a!==undefined ? a : b.oppet[weekday(d)]; }
function openState(b, now){
  if(!b.oppet) return null;
  now = now || new Date();
  const h = hoursOn(b, now), mins = now.getHours()*60 + now.getMinutes();
  if(h){
    const [o,c] = h.split("-");
    if(mins>=toMin(o) && mins<toMin(c)) return {open:true, soon:toMin(c)-mins<=30, text:`Öppet · stänger ${c}`};
    if(mins<toMin(o)) return {open:false, text:`Stängt · öppnar ${o}`};
  }
  for(let i=1; i<=7; i++){
    const d = new Date(now); d.setDate(d.getDate()+i);
    const n = hoursOn(b, d);
    if(n) return {open:false, text:`Stängt · öppnar ${i===1?"i morgon":DAYS[weekday(d)]} ${n.split("-")[0]}`};
  }
  return {open:false, text:"Stängt"};
}
function statusHTML(b){
  const s = openState(b); if(!s) return "";
  return `<span class="status ${s.open?(s.soon?"soon":"open"):"closed"}"><i aria-hidden="true"></i>${s.text}</span>`;
}

/* ---------- Sök ----------
   Söker i namn, adress, typ, kategori, utbud och "bra att veta". Vanliga ord översätts så att
   t.ex. "glasögon" hittar optiker och "klippning" hittar frisörer. Fyll gärna på listan. */
const SYN = {
  "glasögon":["optik"], "linser":["optik"], "syn":["optik"],
  "klippning":["frisör","barber","klipp"], "klippa":["frisör","barber","klipp"], "hår":["frisör","barber","klipp","hår"], "skägg":["barber","skägg"],
  "fika":["café","konditori","bageri","kaffe"], "kaffe":["café","kaffe"], "bulle":["bageri","konditori","bullar"], "tårta":["konditori","tårt"], "frukost":["frukost","bageri","café"],
  "lunch":["lunch"], "middag":["restaurang","à la carte","krog"], "äta":["restaurang","café","pizzeria","lunch"], "mat":["restaurang","livsmedel","lunch"],
  "present":["present","blommor","bok","smycken","choklad","inredning"], "blomma":["blommor"], "bukett":["blommor","bukett"],
  "kläder":["mode","kläder"], "smycke":["smycken"], "klocka":["ur"], "mobil":["mobil"], "telefon":["mobil"],
  "godis":["godis","choklad","kiosk"], "böcker":["bok","antikvariat"], "bok":["bok","antikvariat"], "burgare":["burgare"],
  "vegetariskt":["vegetarisk","vego"], "vegan":["vegetarisk","vego"], "veg":["vegetarisk","vego"], "uteservering":["uteservering"]
};
const norm = s => String(s||"").toLowerCase().trim();
// Två söktexter per företag: en bred (allt) och en smal (namn, typ och utbud). Synonymer matchas bara mot den smala,
// annars skulle t.ex. "glasögon" → "optik" träffa hela kategorin "Skor, accessoarer & optik".
const hay = {}, hayNarrow = {};
const haystack = b => hay[b.id] || (hay[b.id] = norm([b.n, b.a, typeOf(b), CATS[b.c].name, CATS[b.c].short, (b.utbud||[]).join(" "),
  (b.fakta||[]).map(f=>FACTS[f] && FACTS[f].l).join(" "), PROFILES[b.id]?.tagline, PROFILES[b.id]?.pres].join(" ")));
const narrow = b => hayNarrow[b.id] || (hayNarrow[b.id] = norm([b.n, typeOf(b), (b.utbud||[]).join(" "), PROFILES[b.id]?.tagline].join(" ")));
function termMatches(b, t){
  const h = haystack(b);
  if(h.includes(t)) return true;
  if(t.length>=5 && narrow(b).includes(t.replace(/(erna|arna|orna|na|er|ar|or|en)$/,""))) return true;   // frisörer → frisör, caféer → café
  return (SYN[t]||[]).some(a=>narrow(b).includes(a));
}
function searchBiz(q){
  const terms = norm(q).split(/\s+/).filter(Boolean); if(!terms.length) return [];
  const r = {premium:0, plus:1, gratis:2};
  return BIZ.map(b=>{
    const n = norm(b.n);
    if(!terms.every(t=>termMatches(b, t))) return null;
    const score = n.startsWith(norm(q)) ? 3 : n.includes(norm(q)) ? 2 : 1;
    return {b, score};
  }).filter(Boolean).sort((x,y)=>y.score-x.score || r[x.b.tier]-r[y.b.tier] || x.b.n.localeCompare(y.b.n,"sv")).map(x=>x.b);
}

function card(b){
  const cat = CATS[b.c];
  return `<a class="card" href="#f-${b.id}">
    <div class="art" style="${tint(cat)}">${ico(cat.icon)}<span class="mono">${esc(initials(b.n))}</span>${pubTier(b.tier)}</div>
    <div class="body">
      <h3>${esc(b.n)}</h3>
      <div class="meta">${esc(PROFILES[b.id]?.tagline || typeOf(b))}</div>
      ${statusHTML(b)}
      ${DEMO&&(b.v||b.nw)?`<div class="flags">${b.nw?'<span class="tag new">Nytt förslag</span>':''}${b.v?'<span class="tag warn">Verifiera</span>':''}</div>`:""}
      <div class="addr">${ico("pin")}${esc(b.a || "Adress ej inlagd")}</div>
    </div></a>`;
}
function portrait(b,label){
  const cat = CATS[b.c];
  return `<div class="portrait" style="background:linear-gradient(160deg,${cat.bg},#fff6dc);color:${cat.fg}"><span class="mono">${esc(initials(b.n))}</span><span class="ph">${esc(label||"Foto av företagaren")}</span></div>`;
}
function weekNo(d){ const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day); const y=new Date(Date.UTC(t.getUTCFullYear(),0,1)); return Math.ceil(((t-y)/864e5+1)/7); }

/* ---------- Vyer ---------- */
let featIdx = weekNo(new Date()) % FEATURED.length;
let dirGroup = "alla", dirCat = null, dirQ = "";
let previewTier = null;

function viewStart(){
  const tiles = Object.entries(CATS).filter(([k])=>k!=="upplev").map(([k,c])=>`
    <a class="tile" href="#hitta-${k}" style="${tint(c)}">
      <svg class="ico big" aria-hidden="true"><use href="#i-${c.icon}"/></svg>
      ${ico(c.icon,"lead")}
      <h3>${esc(c.name)}</h3>
      <span>${count(b=>b.c===k)} företag ${ico("arrow")}</span>
    </a>`).join("");
  return `
  <section class="hero">
    <video class="hero-video" autoplay muted loop playsinline preload="auto" aria-hidden="true"><source src="${ASSET}download.mp4" type="video/mp4"></video>
    <div class="wrap">
      <h1><small>Välkommen till</small>Uddevalla Centrum</h1>
      <p class="slogan">Lokalt. Personligt. Levande.</p>
      <p class="lede">Här möts lokala favoriter, god mat, unika butiker och människorna som gör centrum speciellt.</p>
      <form class="hero-search" id="heroSearch" role="search">
        ${ico("search")}
        <input id="heroQ" type="search" placeholder="Vad letar du efter? T.ex. lunch, glasögon, present" aria-label="Sök företag">
        <button type="submit">Sök</button>
      </form>
      <div class="quick" aria-label="Snabbval">
        <a href="#lunch">${ico("bowl")}Dagens lunch</a>
        <a href="#hitta-cafe">${ico("cafe")}Ta en fika</a>
        <button type="button" data-q="present">${ico("gift")}Hitta en present</button>
        <button type="button" data-q="klippning">${ico("beauty")}Klippa mig</button>
        <a href="#hitta-oppet">${ico("clock")}Öppet nu</a>
      </div>
    </div>
  </section>

  <section class="block"><div class="wrap split">
    <div class="intro">
      <span class="eyebrow">${BIZ.length} verksamheter inom gångavstånd</span>
      <h2>Ett centrum fullt av möjligheter</h2>
      <p>Uddevalla centrum är fullt av människor, idéer och verksamheter värda att upptäcka. Här hittar du allt från personliga butiker och lokala specialiteter till restauranger, caféer och service.</p>
      <p>Bakom varje verksamhet finns människor med en historia, ett engagemang och något eget att erbjuda. Upptäck vad som finns runt hörnet, hitta nya favoriter och upplev Uddevalla centrum på ditt sätt.</p>
      <div class="row"><a class="btn dark" href="#hitta">Upptäck vårt centrum ${ico("arrow")}</a><a class="btn ghost" href="#mot">Möt företagarna</a></div>
    </div>
    <div id="featured">${featuredHTML()}</div>
  </div></section>

  <section class="block" style="padding-top:8px"><div class="wrap">
    <div class="ruled"><h2>Butiker &amp; Restauranger</h2></div>
    <p class="sub">Hitta din nästa favorit bland verksamheterna i centrum.</p>
    <div class="tiles">${tiles}</div>
    <div class="row" style="justify-content:center"><a class="btn ghost" href="#hitta">Visa alla ${BIZ.length} företag ${ico("arrow")}</a></div>
  </div></section>

  ${activeOffers().length ? `<section class="block" style="padding-top:8px"><div class="wrap">
    <div class="ruled"><h2>Passa på</h2></div>
    <p class="sub">Aktuella erbjudanden från företagen i centrum.</p>
    <div class="offers">${activeOffers().slice(0,3).map(offerCard).join("")}</div>
    <div class="row" style="justify-content:center"><a class="btn ghost" href="#erbjudanden">Alla erbjudanden ${ico("arrow")}</a></div>
  </div></section>` : ""}

  <section class="block" style="padding-top:8px"><div class="wrap">
    <div class="ruled"><h2>På gång i centrum</h2></div>
    <p class="sub">Det här händer i centrum de närmaste veckorna.</p>
    ${eventsHTML(upcoming().slice(0,3))}
    <div class="row" style="justify-content:center"><a class="btn ghost" href="#evenemang">Alla evenemang ${ico("arrow")}</a></div>
  </div></section>

  <section class="block" style="padding-top:8px"><div class="wrap">${newsHTML()}</div></section>

  <section class="block" style="padding-top:8px"><div class="wrap">
    <div class="claim" style="display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;padding:32px">
      <div style="min-width:0"><span class="eyebrow">För dig som driver företag i centrum</span>
      <h3 style="font-size:1.6rem;margin:8px 0">Grundprofilen är gratis för alla företag i centrum</h3>
      <p style="margin:0">Ta över din profil, uppdatera öppettider och bilder själv, och välj om du vill synas mer med ägarpresentation och plats i nyhetsbrevet.</p></div>
      <a class="btn gold" href="#anslut">Till företagarsidan ${ico("arrow")}</a>
    </div>
  </div></section>`;
}

function featuredHTML(){
  const b = byId[FEATURED[featIdx]], p = PROFILES[b.id];
  return `<span class="eyebrow" style="display:block;margin-bottom:10px">Veckans företagare</span>
  <div class="person">
    ${portrait(b)}
    <div class="quote">
      <span class="tag ex" style="align-self:flex-start">Exempelcitat</span>
      <blockquote>${esc(p.quote)}</blockquote>
      <div class="who"><b>Ägaren till ${esc(b.n)}</b><span class="muted">${esc(p.role)}</span></div>
      <div class="nav2">
        <button class="iconbtn" data-feat="-1" aria-label="Föregående företagare">${ico("left")}</button>
        <button class="iconbtn" data-feat="1" aria-label="Nästa företagare">${ico("arrow")}</button>
        <a class="btn ghost" style="margin-left:auto;padding:8px 16px" href="#f-${b.id}">Läs mer</a>
      </div>
    </div>
  </div>
  <p class="small muted" style="margin-top:10px">Varje vecka presenterar vi en ny företagare i centrum.</p>`;
}

// Filter i katalogen: "Öppet nu" och ett urval av "bra att veta"
const DIR_FILTERS = [["oppet","Öppet nu","clock"],["ute",FACTS.ute.l,FACTS.ute.i],["vego",FACTS.vego.l,FACTS.vego.i],["rullstol",FACTS.rullstol.l,FACTS.rullstol.i],["barn",FACTS.barn.l,FACTS.barn.i],["present",FACTS.present.l,FACTS.present.i]];
let dirFilters = new Set();
function viewDirectory(){
  const tabs = GROUPS.map(g=>`<button type="button" data-group="${g.id}" aria-pressed="${dirGroup===g.id}">${g.icon?ico(g.icon):""}${esc(g.name)}</button>`).join("");
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Företag i centrum</span>
    <h1>Hitta din nästa favorit</h1>
    <p>Sök på namn eller på det du letar efter, till exempel ”glasögon”, ”lunch” eller ”present”. Klicka på ett företag för att se utbud, öppettider och hur du hittar dit.</p>
  </div></section>
  <section style="padding-block:24px 64px"><div class="wrap">
    <div class="toolbar">
      <div class="tabs" role="toolbar" aria-label="Huvudkategori">${tabs}</div>
      <label class="search">${ico("search")}<input id="dirQ" type="search" placeholder="Sök namn, vara eller tjänst…" value="${esc(dirQ)}" aria-label="Sök företag"></label>
    </div>
    <div class="chips" id="chips"></div>
    <div class="filters" role="group" aria-label="Filtrera">
      <span class="small muted">Visa bara:</span>
      ${DIR_FILTERS.map(([k,l,i])=>`<button type="button" class="ftog" data-df="${k}" aria-pressed="${dirFilters.has(k)}">${ico(i)}${esc(l)}</button>`).join("")}
    </div>
    <p class="small muted" id="resCount" style="margin-bottom:14px"></p>
    <div class="grid" id="results"></div>
    <div class="panel" style="margin-top:40px" id="tipsa">
      <h2>Saknas ett företag?</h2>
      <p class="muted" style="margin-bottom:16px">Tipsa oss om en butik, restaurang eller annan verksamhet i centrum som inte finns med.</p>
      <form class="form" data-demo="tips">
        <div class="field"><label for="tipName">Företagets namn</label><input id="tipName" required placeholder="T.ex. Butiken på hörnet"></div>
        <div class="field"><label for="tipAddr">Adress eller plats</label><input id="tipAddr" placeholder="T.ex. Kungsgatan"></div>
        <div class="full"><button class="btn dark" type="submit">Skicka tips</button><p class="consent">Läs om hur vi hanterar uppgifter i vår <a href="#integritet">integritetspolicy</a>.</p></div>
      </form>
    </div>
  </div></section>`;
}
function filterDir(){
  const q = dirQ.trim();
  const inGroup = b => dirGroup==="alla" || CATS[b.c].group===dirGroup;
  const pool = BIZ.filter(inGroup);
  const cats = [...new Set(pool.map(b=>b.c))];
  $("#chips").innerHTML = cats.length>1 ? [`<button type="button" class="chip" data-cat="" aria-pressed="${!dirCat}">Alla<span class="n">${pool.length}</span></button>`]
    .concat(cats.map(k=>`<button type="button" class="chip" data-cat="${k}" aria-pressed="${dirCat===k}">${esc(CATS[k].name)}<span class="n">${pool.filter(b=>b.c===k).length}</span></button>`)).join("") : "";
  const hits = q ? new Map(searchBiz(q).map((b,i)=>[b.id,i])) : null;
  const r = {premium:0, plus:1, gratis:2};
  const list = pool.filter(b=>(!dirCat||b.c===dirCat) && (!hits||hits.has(b.id))
      && [...dirFilters].every(f=> f==="oppet" ? openState(b)?.open : (b.fakta||[]).includes(f)))
    .sort(hits ? (a,b)=>hits.get(a.id)-hits.get(b.id) : (a,b)=>r[a.tier]-r[b.tier] || a.n.localeCompare(b.n,"sv"));
  const fl = [...dirFilters].map(k=>DIR_FILTERS.find(f=>f[0]===k)[1].toLowerCase());
  $("#resCount").textContent = `${list.length} företag${q?` för ”${q}”`:""}${fl.length?` · ${fl.join(", ")}`:""}`;
  $("#results").innerHTML = list.length ? list.map(card).join("")
    : `<div class="empty" style="grid-column:1/-1">Inga företag matchar. Prova ett annat ord eller ta bort ett filter.${dirFilters.size?" Alla företag har ännu inte fyllt i öppettider och övrig information.":""}</div>`;
  linkify($("#results"));
  return list.length;
}

/* ---------- Företagssidan ---------- */
function lunchFor(b, dayIdx){
  const l = LUNCH.find(x=>x.biz===b.id); if(!l || dayIdx>4) return null;
  return {l, dishes: (l.dagar[dayIdx]||[]).concat(l.veckans||[])};
}
const dishHTML = d => d.startsWith("v:") ? `<li class="veg">${ico("leaf")}<span>${esc(d.slice(2))}</span></li>` : `<li>${ico("bowl")}<span>${esc(d)}</span></li>`;
const UPD_MONTHS = ["januari","februari","mars","april","maj","juni","juli","augusti","september","oktober","november","december"];
function hoursHTML(b){
  if(!b.oppet) return `<p class="muted small">Öppettider är inte inlagda ännu. Företaget kan fylla i dem gratis.</p>`;
  const now = new Date(), today = weekday(now);
  const special = Object.entries(b.avvik||{}).filter(([d])=>{ const t = new Date(d) - new Date(isoDay(now)); return t>=0 && t<=14*864e5; });
  return `${statusHTML(b)}
    <table class="hours"><tbody>${b.oppet.map((h,i)=>`<tr${i===today?' class="today"':""}><td>${DAYS_LONG[i]}${i===today?" <small>idag</small>":""}</td><td>${fmtHours(h)}</td></tr>`).join("")}</tbody></table>
    ${special.length?`<div class="avvik"><b>Avvikande öppettider</b>${special.map(([d,h])=>`<span>${fmtDate(d)}: ${fmtHours(h)}</span>`).join("")}</div>`:""}`;
}
function actionsHTML(b){
  const a = [];
  if(b.tel) a.push(`<a class="act" href="tel:${esc(b.tel.replace(/[^\d+]/g,""))}" data-track="Klick telefon" data-biz="${esc(b.n)}">${ico("phone")}<span>Ring</span></a>`);
  if(b.a) a.push(`<a class="act" target="_blank" rel="noopener" data-track="Klick karta" data-biz="${esc(b.n)}" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.n+", "+b.a+", Uddevalla")}">${ico("arrow")}<span>Vägbeskrivning</span></a>`);
  if(b.geo) a.push(`<a class="act" href="#karta-${b.id}">${ico("pin")}<span>Karta</span></a>`);
  if(b.boka) a.push(`<a class="act" target="_blank" rel="noopener" href="${esc(b.boka)}" data-track="Klick boka" data-biz="${esc(b.n)}">${ico("cal")}<span>Boka</span></a>`);
  if(b.web) a.push(`<a class="act" target="_blank" rel="noopener" href="${esc(b.web)}" data-track="Klick webb" data-biz="${esc(b.n)}">${ico("globe")}<span>Webbplats</span></a>`);
  a.push(`<button type="button" class="act" data-share="${esc(b.n)}">${ico("share")}<span>Dela</span></button>`);
  return `<div class="actions">${a.join("")}</div>`;
}
function viewBusiness(id){
  const b = byId[id];
  if(!b) return `<section class="page-head"><div class="wrap"><h1>Företaget hittades inte</h1><p><a href="#hitta">Tillbaka till alla företag</a></p></div></section>`;
  const tier = previewTier || b.tier;
  const cat = CATS[b.c];
  const p = PROFILES[b.id] || {};
  const lvl = {gratis:0,plus:1,premium:2}[tier];
  const pres = p.pres || `${b.n} är en ${typeOf(b).toLowerCase()} i Uddevalla centrum. Här skriver företaget själv en längre presentation av sin verksamhet, sitt utbud och vad som gör dem speciella.`;
  const lunch = lunchFor(b, weekday(new Date()));
  const offers = activeOffers().filter(o=>o.biz===b.id);
  const upd = b.upd ? `${UPD_MONTHS[Number(b.upd.slice(5,7))-1]} ${b.upd.slice(0,4)}` : null;
  return `
  <div class="wrap">
    <p class="crumbs"><a href="#hitta">Företag</a> / <a href="#hitta-${b.c}">${esc(cat.name)}</a> / ${esc(b.n)}</p>
    ${DEMO?`<div class="demo">
      ${ico("info")}<span><b>Säljläge:</b> visa sidan som</span>
      <div class="seg" role="group" aria-label="Förhandsvisa nivå">
        ${["gratis","plus","premium"].map(t=>`<button type="button" data-tier="${t}" aria-pressed="${tier===t}">${t==="gratis"?"Gratis":t==="plus"?"Plus":"Premium"}</button>`).join("")}
      </div>
      <span class="muted">Syns bara i säljläget, aldrig för besökare.</span>
      <a class="more small" style="margin-left:auto" href="#statistik-${b.id}">Se företagets statistik ${ico("arrow")}</a>
    </div>`:""}
    <div class="biz-head">
      <div class="art" style="${tint(cat)}">${ico(cat.icon)}<span class="mono">${esc(initials(b.n))}</span>${pubTier(tier)}</div>
      <div style="min-width:0">
        <span class="eyebrow">${esc(typeOf(b))}</span>
        <h1>${esc(b.n)}</h1>
        <p class="muted" style="font-size:1.08rem">${esc(p.tagline || "En del av Uddevalla centrum")}</p>
        <div class="row" style="margin-top:14px">
          ${statusHTML(b)}
          ${b.a?`<span class="tag ex">${ico("pin")} ${esc(b.a)}</span>`:""}
          ${DEMO&&b.nw?'<span class="tag new">Nytt förslag</span>':""}
          ${DEMO?(lvl>=1?'<span class="tag ok">'+ico("check")+' Uppgifter från företaget</span>':'<span class="tag warn">Ej verifierad</span>'):""}
        </div>
        ${DEMO&&(b.v||b.nw)?`<div class="note">${ico("info")}<span>${esc([b.v, b.nw?NEW:""].filter(Boolean).join(" "))}</span></div>`:""}
        ${actionsHTML(b)}
      </div>
    </div>

    <div class="biz-cols">
      <div>
        ${lvl>=1 ? `
        <div class="panel">
          <h2>Om ${esc(b.n)}</h2>
          <p class="muted">${esc(pres)}</p>
          <div class="gallery"><div>Bild 1</div><div>Bild 2</div><div>Bild 3</div></div>
          ${(offers.length ? offers : [{title:"Aktuellt erbjudande", text:"Exempel: företaget lägger själv upp kampanjer och erbjudanden."}])
            .map(o=>`<div class="offer">${ico("tag")}<div><b>${esc(o.title)}${o.price?` · ${esc(o.price)}`:""}</b>${esc(o.text)}${o.until?`<span class="small"> Gäller t.o.m. ${fmtDate(o.until)}.</span>`:""}</div></div>`).join("")}
        </div>` : `
        <div class="panel">
          <h2>Om ${esc(b.n)}</h2>
          <p class="muted">${esc(b.n)} är en ${esc(typeOf(b).toLowerCase())} i Uddevalla centrum.</p>
        </div>${DEMO?`
        <div class="panel locked">
          <h3>${ico("lock")} Presentation, bilder och erbjudanden</h3>
          <p class="muted small">Ingår i Plus. Företaget kan visa en längre presentation, upp till tio bilder och egna erbjudanden.</p>
        </div>`:""}`}

        ${b.utbud ? `<div class="panel">
          <h2>Det här erbjuder vi</h2>
          <ul class="utbud">${b.utbud.map(u=>`<li>${ico("check")}${esc(u)}</li>`).join("")}</ul>
        </div>` : ""}

        ${lunch ? `<div class="panel lunch-today">
          <div class="ph"><h2>Lunch idag</h2><span class="small muted">${esc(lunch.l.tid)} · ${esc(lunch.l.pris)}</span></div>
          <ul class="dishes">${lunch.dishes.map(dishHTML).join("")}</ul>
          <p class="small muted" style="margin-top:10px">${esc(lunch.l.ingar)}. <a href="#lunch">Se all lunch i centrum</a></p>
        </div>` : ""}

        ${lvl>=2 ? `
        <div class="panel">
          <span class="eyebrow">Människan bakom</span>
          <h2 style="margin-top:6px">Möt ägaren</h2>
          <div class="owner">
            ${portrait(b,"Foto")}
            <div style="display:flex;flex-direction:column;gap:12px">
              <span class="tag ex" style="align-self:flex-start">Exempeltext</span>
              <blockquote style="margin:0;font-family:var(--f-display);font-size:1.15rem;line-height:1.45">”${esc(p.quote || "Här står ett personligt citat från företagaren.")}”</blockquote>
              <p class="muted">${esc(p.story || `Här berättar ägaren till ${b.n} om sig själv, hur verksamheten började och vad de brinner för. Texten tas fram tillsammans med centrumföreningen.`)}</p>
              ${DEMO?`<div class="row" style="margin-top:4px"><span class="tag premium">Med i nyhetsbrevet</span><span class="tag plus">Roterar på startsidan</span></div>`:""}
            </div>
          </div>
        </div>` : DEMO ? `
        <div class="panel locked">
          <h3>${ico("lock")} Ägarpresentation</h3>
          <p class="muted small">Ingår i Premium. En bild och berättelse om människan bakom företaget, plats på startsidan och i nyhetsbrevet.</p>
        </div>` : ""}
      </div>

      <aside>
        <div class="panel"><h3>${ico("clock")} Öppettider</h3>${hoursHTML(b)}</div>
        ${b.fakta ? `<div class="panel"><h3>Bra att veta</h3>
          <ul class="factlist">${b.fakta.filter(f=>FACTS[f]).map(f=>`<li>${ico(FACTS[f].i)}${esc(FACTS[f].l)}</li>`).join("")}</ul>
        </div>` : ""}
        <div class="panel">
          <h3>Kontakt</h3>
          <dl class="facts">
            <div><dt>${ico("pin")}</dt><dd><b>Adress</b>${esc(b.a ? b.a+", Uddevalla" : "Inte inlagd ännu")}</dd></div>
            ${b.tel?`<div><dt>${ico("phone")}</dt><dd><b>Telefon</b><a href="tel:${esc(b.tel.replace(/[^\d+]/g,""))}">${esc(b.tel)}</a></dd></div>`:""}
            ${b.web?`<div><dt>${ico("globe")}</dt><dd><b>Webbplats</b><a href="${esc(b.web)}" target="_blank" rel="noopener">${esc(b.web.replace(/^https?:\/\/(www\.)?/,""))}</a></dd></div>`:""}
          </dl>
          ${!b.tel&&!b.web?`<p class="small muted" style="margin-top:10px">Telefon och webbplats visas när företaget har fyllt i dem.</p>`:""}
        </div>
        ${upd?`<p class="small muted updated">${ico("check")} Uppgifterna uppdaterades i ${upd}</p>`:DEMO?`<p class="small muted updated">${ico("info")} Uppgifterna är inte uppdaterade av företaget</p>`:""}
        ${tier==="gratis"?`<div class="claim" style="margin-top:16px">
          <h3>Är det här ditt företag?</h3>
          <p>Ta över profilen gratis och håll öppettider, utbud och kontaktuppgifter uppdaterade själv.</p>
          <a class="btn gold" href="#anmal">Ta över profilen ${ico("arrow")}</a>
        </div>`:""}
      </aside>
    </div>
  </div>
  <div style="height:64px"></div>`;
}

function viewPeople(){
  const list = Object.keys(PROFILES).map(id=>byId[id]);
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Människorna i centrum</span>
    <h1>Möt företagarna</h1>
    <p>Bakom varje dörr i centrum finns någon som valt att satsa på Uddevalla. Här presenterar vi dem, en i taget. Presentationerna nedan är exempel på hur det kan se ut.</p>
  </div></section>
  <section style="padding-block:24px 64px"><div class="wrap">
    <div class="people">${list.map(b=>{const p=PROFILES[b.id];return `
      <article class="pcard">
        ${portrait(b)}
        <div class="in">
          <div style="display:flex;gap:8px;flex-wrap:wrap">${pubTier(b.tier)}<span class="tag ex">Exempel</span></div>
          <h3 style="font-size:1.3rem">${esc(b.n)}</h3>
          ${p.quote ? `<blockquote>”${esc(p.quote)}”</blockquote>
          <p class="small muted">${esc(p.role)}</p>` : `<p class="muted">${esc(p.pres)}</p>`}
          <a class="more" href="#f-${b.id}">Läs hela presentationen ${ico("arrow")}</a>
        </div>
      </article>`;}).join("")}
      <article class="pcard" style="border-style:dashed;justify-content:center">
        <div class="in" style="justify-content:center;text-align:center;align-items:center">
          <svg class="ico" style="width:40px;height:40px;color:var(--gold)" aria-hidden="true"><use href="#i-heart"/></svg>
          <h3 style="font-size:1.3rem">Vill du också presenteras här?</h3>
          <p class="muted small">Driver du företag i centrum? Vi hjälper gärna till med intervju och text.</p>
          <a class="btn dark" href="#anslut">För företagare</a>
        </div>
      </article>
    </div>
  </div></section>`;
}

/* ---------- Erbjudanden (data i innehall.js) ---------- */
const MONTH_NO = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
const fmtDate = iso => { const [y,m,d] = iso.split("-").map(Number); return `${d} ${MONTH_NO[m-1]}`; };
// Erbjudanden som fortfarande gäller, de som går ut snart först
function activeOffers(){
  const today = new Date().toISOString().slice(0,10);
  return OFFERS.filter(o=>byId[o.biz] && o.until>=today).sort((a,b)=>a.until.localeCompare(b.until));
}
let offerGroup = "alla";
function offerCard(o){
  const b = byId[o.biz], cat = CATS[b.c];
  const days = Math.round((new Date(o.until) - new Date(new Date().toISOString().slice(0,10)))/864e5);
  return `<article class="ocard" style="${tint(cat)}">
    <div class="ohead">${ico(cat.icon)}<span>${esc(typeOf(b))}</span>${o.price?`<b class="oprice">${esc(o.price)}</b>`:""}</div>
    <div class="obody">
      <h3>${esc(o.title)}</h3>
      <p class="muted small">${esc(o.text)}</p>
      <div class="ofoot">
        <a href="#f-${b.id}">${esc(b.n)} ${ico("arrow")}</a>
        <span class="small ${days<=7?"soon":"muted"}">${ico("clock")} ${days<=0?"Sista dagen idag":days<=7?`${days} ${days===1?"dag":"dagar"} kvar`:`T.o.m. ${fmtDate(o.until)}`}</span>
      </div>
    </div>
  </article>`;
}
function viewOffers(){
  const all = activeOffers();
  const groups = GROUPS.filter(g=>g.id==="alla" || all.some(o=>CATS[byId[o.biz].c].group===g.id));
  if(!groups.some(g=>g.id===offerGroup)) offerGroup = "alla";
  const list = all.filter(o=>offerGroup==="alla" || CATS[byId[o.biz].c].group===offerGroup);
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Erbjudanden</span>
    <h1>Passa på i centrum</h1>
    <p>Kampanjer, lunchtips och erbjudanden från butikerna, caféerna och restaurangerna i Uddevalla centrum. Erbjudandena i piloten är exempel.</p>
  </div></section>
  <section style="padding-block:24px 64px"><div class="wrap">
    ${groups.length>2?`<div class="chips">${groups.map(g=>`<button type="button" class="chip" data-og="${g.id}" aria-pressed="${offerGroup===g.id}">${esc(g.name)}<span class="n">${g.id==="alla"?all.length:all.filter(o=>CATS[byId[o.biz].c].group===g.id).length}</span></button>`).join("")}</div>`:""}
    ${list.length ? `<div class="offers">${list.map(offerCard).join("")}</div>` : `<div class="empty">Inga erbjudanden just nu. Titta in igen snart!</div>`}
    <div class="panel" style="margin-top:32px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      ${ico("tag")}<p style="flex:1;min-width:220px" class="muted">Driver du företag i centrum? Lägg upp dina egna erbjudanden och nå alla som besöker sidan.</p>
      <a class="btn dark" href="#anslut">För företagare</a>
    </div>
  </div></section>`;
}

// Visar bara evenemang som inte har passerat, sorterade efter datum
const eventDate = e => new Date(e.y, MONTH_NO.indexOf(e.m), e.d);
function upcoming(){
  const today = new Date(); today.setHours(0,0,0,0);
  return EVENTS.filter(e=>eventDate(e)>=today).sort((a,b)=>eventDate(a)-eventDate(b));
}
function eventsHTML(list){
  return list.length ? `<div class="events">${list.map(eventHTML).join("")}</div>`
    : `<div class="empty">Inga kommande evenemang är inlagda just nu. Titta in igen snart!</div>`;
}
function eventHTML(e){
  return `<article class="event"><div class="date"><b>${e.d}</b><span>${e.m}</span></div>
    <div><h3>${esc(e.t)}</h3><p class="muted small">${ico("pin")} ${esc(e.p)} · ${esc(e.txt)}</p></div>
    <span class="tag ex">Exempel</span></article>`;
}
function viewEvents(){
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Evenemang</span>
    <h1>På gång i Uddevalla centrum</h1>
    <p>Marknader, kvällsöppet, högtider och aktiviteter i butikerna. Datumen nedan är exempel för piloten.</p>
  </div></section>
  <section style="padding-block:24px 64px"><div class="wrap">
    ${eventsHTML(upcoming())}
    <div class="panel" style="margin-top:32px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      ${ico("cal")}<p style="flex:1;min-width:220px" class="muted">Driver du företag i centrum? Då kan du lägga upp egna evenemang i kalendern.</p>
      <a class="btn dark" href="#anslut">För företagare</a>
    </div>
  </div></section>`;
}

function planCard(p){
  const once = ONEOFF.includes(p);
  const label = p.id==="gratis" ? "Skapa gratisprofil" : once ? "Boka "+p.name.toLowerCase() : "Välj "+p.name;
  return `
      <div class="plan${p.hl?" hl":""}${once?" once":""}">
        <h3>${p.name}</h3>
        <div class="price">${p.price} <small>${p.per}</small></div>
        <p class="muted small">${p.desc}</p>
        <ul>${p.items.map(i=>`<li>${ico("check")}<span>${i}</span></li>`).join("")}</ul>
        ${p.stats?`<a class="more small" href="#statistik">Se exempel på statistiken ${ico("arrow")}</a>`:""}
        <a class="btn ${p.hl?"gold":p.id==="gratis"||once?"ghost":"dark"}" href="#anmal" data-plan="${once?"engang":p.id}" ${once?`data-once="${p.id}"`:""}>${label}</a>
      </div>`;
}
// Egen meny för företagarsidorna. De länkas inte från huvudmenyn, bara från sidfoten och företagsprofilerna.
function bizNav(active){
  const links = [["anslut","Paket &amp; priser"],["anmal","Anmäl företag"],["statistik","Statistik"]].concat(DEMO?[["lista","Arbetslista"]]:[]);
  return `<div class="biznav"><div class="wrap"><span>${ico("lock")} För företagare</span>${links.map(([h,l])=>`<a href="#${h}"${h===active?' aria-current="page"':""}>${l}</a>`).join("")}</div></div>`;
}
function viewJoin(){
  const rows = [
    ["Plats i katalogen",1,1,1],["Adress, öppettider, kontakt",1,1,1],["Uppdatera själv",1,1,1],
    ["Presentation och bildgalleri",0,1,1],["Erbjudanden och evenemang",0,1,1],["Prioriterad i sök",0,1,1],
    ["Ägarpresentation",0,0,1],["Plats på startsidan",0,0,1],["Med i nyhetsbrevet",0,0,1],
    ["Antal profilvisningar",0,1,1],["Full statistik: sökord, klick, jämförelse",0,0,1]];
  return bizNav("anslut") + `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">För företagare</span>
    <h1>Synas i Uddevalla centrum</h1>
    <p>Alla företag i centrum får en gratis grundprofil. Vill du synas mer kan du välja ett månadsabonnemang, eller betala en gång när du har något särskilt på gång.</p>
    <div class="paths">
      <a href="#anslut" data-scroll="paket-bas"><b>Gratis</b><span>Grundprofil i katalogen, alltid kostnadsfri</span></a>
      <a href="#anslut" data-scroll="paket-engang"><b>En gång</b><span>Kampanjvecka, nyhetsbrev eller evenemang</span></a>
      <a href="#anslut" data-scroll="paket-bas"><b>Varje månad</b><span>Plus eller Premium, säg upp när du vill</span></a>
    </div>
    <p class="small" style="margin-top:14px"><span class="tag ex">Priserna är förslag i piloten</span></p>
  </div></section>
  <section style="padding-block:24px 48px" id="paket-bas"><div class="wrap">
    <h2 style="font-size:1.6rem;margin-bottom:16px">Grundprofil och månadsabonnemang</h2>
    <div class="plans">${PLANS.map(planCard).join("")}</div>
  </div></section>

  <section style="padding-block:0 48px" id="paket-engang"><div class="wrap">
    <h2 style="font-size:1.6rem">Synas en gång</h2>
    <p class="muted" style="margin:6px 0 16px;max-width:62ch">Ingen bindningstid och inget abonnemang. Passar när du har en kampanj, en nyhet eller ett evenemang, och fungerar även om du har gratisprofilen.</p>
    <div class="plans">${ONEOFF.map(planCard).join("")}</div>
  </div></section>

  <section style="padding-block:0 48px"><div class="wrap">
    <h2 style="font-size:1.6rem;margin-bottom:16px">Jämför nivåerna</h2>
    <div class="cmp"><table><thead><tr><th></th><th>Bas</th><th>Plus</th><th>Premium</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>${r[0]}</td>${[1,2,3].map(i=>`<td>${r[i]?`<svg class="ico y" aria-label="Ingår"><use href="#i-check"/></svg>`:`<span class="n" aria-label="Ingår inte">–</span>`}</td>`).join("")}</tr>`).join("")}
    </tbody></table></div>
    <p class="small muted" style="margin-top:10px">Tips: öppna valfritt företag och växla mellan nivåerna för att se skillnaden på riktigt.</p>
  </div></section>

  <section style="padding-block:0 48px"><div class="wrap">
    <h2 style="font-size:1.6rem;margin-bottom:16px">Tillägg</h2>
    <div class="addons">${ADDONS.map(a=>`<div class="addon"><b>${a.n}</b><span class="p">${a.p}</span><span class="muted small">${a.d}</span></div>`).join("")}</div>
  </div></section>

  <section style="padding-block:0 48px"><div class="wrap">
    <h2 style="font-size:1.6rem;margin-bottom:16px">Så går det till</h2>
    <div class="steps">
      <div class="step"><b>Anmäl eller ta över din profil</b><span class="muted small">Fyll i formuläret nedan. Finns ditt företag redan med tar du över den befintliga profilen.</span></div>
      <div class="step"><b>Vi granskar uppgifterna</b><span class="muted small">Centrumföreningen kontrollerar att företaget ligger i centrum och publicerar profilen.</span></div>
      <div class="step"><b>Uppdatera när du vill</b><span class="muted small">Ändra öppettider, bilder och erbjudanden själv. Uppgradera eller säg upp när som helst.</span></div>
    </div>
  </div></section>

  <section style="padding-block:0 64px" id="anmal"><div class="wrap">
    <div class="panel" style="padding:28px">
      <h2 style="font-size:1.6rem">Anmäl eller uppdatera ditt företag</h2>
      <p class="muted" style="margin:6px 0 20px">Det tar ungefär fem minuter. Du kan komplettera med fler bilder senare.</p>
      <form class="form" data-demo="anmalan">
        <div class="field"><label for="fName">Företagets namn</label><input id="fName" required list="bizNames" placeholder="Börja skriva för att hitta din profil"></div>
        <datalist id="bizNames">${BIZ.map(b=>`<option value="${esc(b.n)}">`).join("")}</datalist>
        <div class="field"><label for="fCat">Kategori</label><select id="fCat">${Object.entries(CATS).map(([k,c])=>`<option value="${k}">${esc(c.name)}</option>`).join("")}</select></div>
        <div class="field"><label for="fPerson">Kontaktperson</label><input id="fPerson" required placeholder="För- och efternamn"></div>
        <div class="field"><label for="fMail">E-post</label><input id="fMail" type="email" required placeholder="namn@foretag.se"></div>
        <div class="field"><label for="fPhone">Telefon</label><input id="fPhone" type="tel" placeholder="0522-…"></div>
        <div class="field"><label for="fAddr">Adress</label><input id="fAddr" placeholder="Gata och nummer"></div>
        <div class="field full"><label for="fHours">Öppettider</label><input id="fHours" placeholder="T.ex. Mån–fre 10–18, lör 10–15"></div>
        <div class="field full"><label for="fDesc">Kort presentation</label><textarea id="fDesc" placeholder="Vad erbjuder ni och vad gör er speciella?"></textarea></div>
        <div class="field full"><label for="fImg">Bilder och logga</label><input id="fImg" type="file" accept="image/*" multiple><span class="small muted" id="fImgList">JPG eller PNG. Bas: en bild. Plus och Premium: upp till tio.</span></div>
        <fieldset class="field full"><legend>Nivå</legend>
          <div class="radios">
            <label><input type="radio" name="plan" id="pGratis" value="gratis" checked> Bas, gratis</label>
            <label><input type="radio" name="plan" id="pPlus" value="plus"> Plus, 195 kr/mån</label>
            <label><input type="radio" name="plan" id="pPremium" value="premium"> Premium, 395 kr/mån</label>
            <label><input type="radio" name="plan" id="pEngang" value="engang"> Synas en gång</label>
          </div>
        </fieldset>
        <div class="field full" id="onceField" hidden><label for="fOnce">Vilket engångspaket?</label><select id="fOnce">${ONEOFF.map(o=>`<option value="${o.id}">${esc(o.name)}, ${esc(o.price)}</option>`).join("")}</select></div>
        <label class="field full check"><input type="checkbox" required> <span>Jag har läst och godkänner <a href="#foretagsvillkor">villkoren för företagare</a> och har tagit del av <a href="#integritet">integritetspolicyn</a>.</span></label>
        <div class="full"><button class="btn dark" type="submit">Skicka in uppgifter</button></div>
      </form>
    </div>
  </div></section>`;
}

function viewAbout(){
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Om Uddevalla centrum</span>
    <h1>Lokalt. Personligt. Levande.</h1>
  </div></section>
  <section style="padding-block:8px 64px"><div class="wrap split" style="align-items:start">
    <div class="prose">
      <p>Uddevalla centrum är stadens mötesplats. Kring Kungsgatan, Kungstorget, Norra och Södra Drottninggatan och gränderna mellan dem finns ${BIZ.length} butiker, restauranger, caféer och serviceföretag, de flesta inom några minuters promenad från varandra.</p>
      <p>Den här webbplatsen är en gemensam digital mötesplats för centrum. Besökaren ska få lust att upptäcka centrum och sedan enkelt hitta en viss butik, restaurang eller människan bakom verksamheten.</p>
      <h2>Vilka står bakom?</h2>
      <p>Här presenteras föreningen eller organisationen som driver sidan, styrelse och kontaktpersoner. Texten fylls i inför lansering.</p>
      <h2>Vilka företag finns med?</h2>
      <p>Alla verksamheter inom den beslutade centrumgränsen kan få en gratis grundprofil. Köpcentrum och ytterområden som Torp ingår inte.</p>
    </div>
    <div class="panel">
      <h3>Centrum i siffror</h3>
      <div class="stats" style="grid-template-columns:1fr 1fr;margin:12px 0 0">
        <div class="stat"><b>${count(b=>CATS[b.c].group==="ata")}</b><span>ställen att äta och fika</span></div>
        <div class="stat"><b>${count(b=>CATS[b.c].group==="butik")}</b><span>butiker</span></div>
        <div class="stat"><b>${count(b=>b.c==="beauty")}</b><span>frisörer och skönhet</span></div>
        <div class="stat"><b>${BIZ.length}</b><span>verksamheter totalt</span></div>
      </div>
      <p class="small muted" style="margin-top:12px">Baserat på pilotens företagslista, inte verifierat.</p>
    </div>
  </div></section>`;
}

function viewContact(){
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Kontakt</span>
    <h1>Hör av dig</h1>
    <p>Frågor om centrum, evenemang eller hur ditt företag kan synas på sidan.</p>
  </div></section>
  <section style="padding-block:8px 64px"><div class="wrap split" style="align-items:start">
    <div class="panel">
      <form class="form" data-demo="kontakt">
        <div class="field"><label for="cName">Namn</label><input id="cName" required></div>
        <div class="field"><label for="cMail">E-post</label><input id="cMail" type="email" required></div>
        <div class="field full"><label for="cTopic">Ärende</label><select id="cTopic"><option>Allmän fråga</option><option>Jag driver företag i centrum</option><option>Evenemang</option><option>Fel i uppgifter</option></select></div>
        <div class="field full"><label for="cMsg">Meddelande</label><textarea id="cMsg" required></textarea></div>
        <div class="full"><button class="btn dark" type="submit">Skicka meddelande</button><p class="consent">Vi använder dina uppgifter för att besvara ditt meddelande. Läs mer i vår <a href="#integritet">integritetspolicy</a>.</p></div>
      </form>
    </div>
    <div class="panel">
      <h3>Uddevalla Centrum</h3>
      <dl class="facts" style="margin-top:14px">
        <div><dt>${ico("mail")}</dt><dd><b>E-post</b>Läggs in inför lansering</dd></div>
        <div><dt>${ico("phone")}</dt><dd><b>Telefon</b>Läggs in inför lansering</dd></div>
        <div><dt>${ico("pin")}</dt><dd><b>Besöksadress</b>Läggs in inför lansering</dd></div>
      </dl>
    </div>
  </div></section>`;
}

let listFilter = "alla";
function viewList(){
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Internt · tas bort före lansering</span>
    <h1>Arbetslista: företag i centrum</h1>
    <p>Alla företag som hittills hittats, med det som behöver kontrolleras. Nya förslag är verksamheter som inte fanns i ursprungslistan men som nämns i Visit Uddevallas guider.</p>
  </div></section>
  <section style="padding-block:16px 64px"><div class="wrap">
    <div class="stats">
      <div class="stat"><b>${BIZ.length}</b><span>företag totalt</span></div>
      <div class="stat"><b>${count(b=>b.v)}</b><span>behöver verifieras</span></div>
      <div class="stat"><b>${count(b=>!b.a)}</b><span>saknar adress</span></div>
      <div class="stat"><b>${count(b=>b.nw)}</b><span>nya förslag</span></div>
    </div>
    <div class="chips" id="listChips">
      ${[["alla","Alla"],["v","Behöver verifieras"],["a","Saknar adress"],["nw","Nya förslag"]].map(([k,l])=>`<button type="button" class="chip" data-lf="${k}" aria-pressed="${listFilter===k}">${l}</button>`).join("")}
    </div>
    <div class="tablewrap"><table class="list"><thead><tr><th>Företag</th><th>Kategori</th><th>Adress</th><th>Status</th><th>Att göra</th></tr></thead><tbody id="listBody"></tbody></table></div>
  </div></section>`;
}
function fillList(){
  const f = {alla:()=>true, v:b=>b.v, a:b=>!b.a, nw:b=>b.nw}[listFilter];
  const order = Object.keys(CATS);
  $("#listBody").innerHTML = BIZ.filter(f).sort((a,b)=>order.indexOf(a.c)-order.indexOf(b.c)||a.n.localeCompare(b.n,"sv")).map(b=>`
    <tr><td><a href="#f-${b.id}">${esc(b.n)}</a>${b.t?`<div class="small muted">${esc(b.t)}</div>`:""}</td>
    <td>${esc(CATS[b.c].name)}</td>
    <td>${b.a?esc(b.a):'<span class="muted">Saknas</span>'}</td>
    <td>${b.nw?'<span class="tag new">Nytt förslag</span>':b.v?'<span class="tag warn">Verifiera</span>':'<span class="tag ok">Från listan</span>'}</td>
    <td class="small">${esc([b.v, b.nw?"Verifiera läge och status.":"", !b.a&&!b.v?"Lägg till adress.":""].filter(Boolean).join(" "))}</td></tr>`).join("");
  linkify($("#listBody"));
}

function newsHTML(){
  return `<div class="news">
    <div><span class="eyebrow">Nyhetsbrev</span><h2 style="margin-top:6px">Nytt i centrum, en gång i månaden</h2>
    <p class="muted">Nyöppnat, erbjudanden från butikerna, evenemang och månadens företagare. Gratis och lätt att avsluta.</p></div>
    <div><form data-demo="nyhetsbrev"><input id="newsMail" type="email" required placeholder="Din e-postadress" aria-label="E-postadress"><button class="btn dark" type="submit">Prenumerera</button></form><p class="consent">Genom att prenumerera samtycker du till att vi skickar nyhetsbrevet till din e-post. Du kan avsluta när som helst. Läs mer i vår <a href="#integritet">integritetspolicy</a>.</p></div>
  </div>`;
}

function syncOnce(id){
  const field = $("#onceField"); if(!field) return;
  field.hidden = !$("#pEngang").checked;
  if(id) $("#fOnce").value = id;
}

/* ---------- Statistik ----------
   track() skickar händelser till ett cookiefritt analysverktyg (t.ex. Plausible eller Umami)
   när ett sådant är installerat. I piloten gör den ingenting.
   Statistiksidan visar påhittade exempelsiffror, framräknade så att de ser likadana ut varje gång. */
const track = (name, props) => { try{ if(typeof window.plausible==="function") window.plausible(name,{props}); }catch(_){} };
let searchTimer = null;
const trackSearch = (q, hits) => { clearTimeout(searchTimer); if(q.trim().length<2) return; searchTimer=setTimeout(()=>track("Sökning",{ord:q.trim().toLowerCase(),traffar:hits?"ja":"nej"}),1200); };

let statsDays = 30;
const nf = n => Math.round(n).toLocaleString("sv-SE");
const fmtDay = d => `${d.getDate()} ${MONTH_NO[d.getMonth()]}`;
const WEEKDAYS = ["söndag","måndag","tisdag","onsdag","torsdag","fredag","lördag"];
function rng(seed){
  let h = 2166136261;
  for(const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h>>>15), 2246822507); h = Math.imul(h ^ (h>>>13), 3266489909); h ^= h>>>16; return (h>>>0)/4294967296; };
}
function daily(seed, days, base, offset){
  const r = rng(seed), out = [], now = new Date();
  for(let i=days-1+(offset||0); i>=(offset||0); i--){
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
    const f = [.7,1,.95,1,1.05,1.2,1.55][d.getDay()];
    out.push({d, v:Math.max(0, Math.round(base*f*(.8+r()*.4)))});
  }
  return out;
}
const sum = a => a.reduce((s,x)=>s+x.v,0);
const TIER_F = {gratis:1, plus:2.1, premium:3.2};
const bizWeight = b => TIER_F[b.tier] * (.35 + rng("w"+b.id)()*1.3);

function delta(now, prev){
  const p = Math.round((now/prev-1)*100);
  return `<em class="${p>=0?"up":"down"}">${p>=0?"+":"−"}${Math.abs(p)} %</em> mot föregående ${statsDays} dagar`;
}
function kpis(list){
  return `<div class="stats">${list.map(k=>`<div class="stat"><b>${nf(k.v)}</b><span>${k.l}</span>${k.prev?`<small>${delta(k.v,k.prev)}</small>`:""}</div>`).join("")}</div>`;
}
function barChart(data, unit){
  // Ritas i skärmens bredd så att texten inte krymper i mobilen
  const W=Math.max(320, Math.min(800, window.innerWidth-80)), H=W<600?200:220, L=44, T=12, B=26, n=data.length;
  const max = Math.max(...data.map(x=>x.v));
  const step = [5,10,20,25,50,100,200,250,500,1000,2000].find(s=>max/s<=4) || 5000;
  const top = Math.ceil(max/step)*step, ih = H-T-B, cw = (W-L)/n, bw = Math.max(2, cw-2);
  const y = v => T + ih - v/top*ih;
  let g = "";
  for(let v=0; v<=top; v+=step) g += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${nf(v)}</text>`;
  const ticks = [0, Math.floor((n-1)/2), n-1];
  const bars = data.map((x,i)=>{
    const bx = L + i*cw + (cw-bw)/2, h = Math.max(1, x.v/top*ih);
    return `<g class="col" data-tip="${WEEKDAYS[x.d.getDay()]} ${fmtDay(x.d)}|${nf(x.v)} ${unit}"><rect class="hit" x="${L+i*cw}" y="${T}" width="${cw}" height="${ih}"/><rect class="bar" x="${bx}" y="${T+ih-h}" width="${bw}" height="${h}" rx="${Math.min(3,bw/2)}"/></g>`;
  }).join("");
  const xl = ticks.map(i=>`<text x="${L+i*cw+cw/2}" y="${H-6}" text-anchor="${i===0?"start":i===n-1?"end":"middle"}">${fmtDay(data[i].d)}</text>`).join("");
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${unit} per dag, de senaste ${n} dagarna. Högst ${nf(max)}, totalt ${nf(sum(data))}.">${g}${bars}${xl}</svg><div class="tip" hidden></div></div>`;
}
function hbars(rows, opts){
  const max = Math.max(...rows.map(r=>r.v)) || 1;
  return `<div class="hbars">${rows.map(r=>`
    <div class="hb"><span class="l">${r.href?`<a href="${r.href}">${esc(r.l)}</a>`:esc(r.l)}</span>
    <span class="track"><i style="width:${Math.max(2,r.v/max*100)}%"></i></span>
    <span class="v">${opts&&opts.pct?r.v+" %":nf(r.v)}</span></div>`).join("")}</div>`;
}
function shares(seed, list){
  const r = rng(seed), w = list.map(([l,p])=>[l, p*(.85+r()*.3)]), t = w.reduce((s,x)=>s+x[1],0);
  return w.map(([l,v])=>({l, v:Math.round(v/t*100)}));
}

function viewStats(id){
  const b = id ? byId[id] : null;
  const days = statsDays;
  const seg = `<div class="seg" role="group" aria-label="Period">${[7,30,90].map(d=>`<button type="button" data-period="${d}" aria-pressed="${days===d}">${d} dagar</button>`).join("")}</div>`;
  const firstPremium = BIZ.find(x=>x.tier==="premium");
  const head = bizNav("statistik") + `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Statistik · exempel</span>
    <h1>${b ? "Statistik för "+esc(b.n) : "Vad drar folk till centrum?"}</h1>
    <p>${b ? "Så här ser det ut när ett företag loggar in och följer sin profil. Plus visar antal visningar, Premium visar allt på sidan." : "Översikten för hela centrum visar vilka företag, kategorier och sökord som lockar besökare. Den är bara till för centrumföreningen, eftersom den visar andra företags siffror. Varje företag ser bara sin egen statistik."}</p>
  </div></section>
  <section style="padding-block:16px 64px"><div class="wrap">
    <div class="demo">
      ${ico("info")}<span><b>Exempeldata:</b> siffrorna är påhittade och visar hur statistiken kan se ut.</span>
    </div>
    <div class="toolbar stats-bar">
      <div class="tabs" role="tablist" aria-label="Vy">
        <a role="tab" href="#statistik" aria-selected="${!b}">${ico("heart")}Hela centrum</a>
        <a role="tab" href="#statistik-${(b||firstPremium).id}" aria-selected="${!!b}">${ico("tag")}Per företag</a>
      </div>
      ${seg}
    </div>`;
  return head + (b ? statsBiz(b, days) : statsSite(days)) + `
    <div class="panel how">
      <h3>${ico("lock")} Hur samlas statistiken in?</h3>
      <p class="muted small">Sidan räknar sidvisningar, sökningar och klick med ett cookiefritt analysverktyg, till exempel Plausible eller Umami. Inga personuppgifter sparas och ingen enskild besökare kan spåras, så det behövs ingen cookie-banner. Verktyget kostar från ungefär 100 kr i månaden, eller inget alls om man driver det själv.</p>
    </div>
  </div></section>`;
}

function statsSite(days){
  const cur = daily("site", days, 410), prev = daily("site", days, 380, days);
  const v = sum(cur), pv = sum(prev);
  const ranked = BIZ.map(b=>({b, v:bizWeight(b)})).sort((a,c)=>c.v-a.v);
  const tw = ranked.reduce((s,x)=>s+x.v,0), views = v*1.15;
  const top = ranked.slice(0,10).map(x=>({l:x.b.n, v:x.v/tw*views, href:"#statistik-"+x.b.id}));
  const catViews = Object.entries(CATS).map(([k,c])=>({l:c.name, v:ranked.filter(x=>x.b.c===k).reduce((s,x)=>s+x.v,0)/tw*views})).sort((a,c)=>c.v-a.v);
  const r = rng("sok"+days), searches = v*.31;
  const terms = [["sushi",1],["pizza",.92],["frisör",.8],["lunch",.74],["café",.66],["blommor",.5],["optiker",.44],["presenter",.4],["second hand",.36],["barberare",.3]]
    .map(([l,w])=>({l, v:searches*.07*w*(.85+r()*.3)})).sort((a,c)=>c.v-a.v);
  const missing = [["apotek",1],["glass",.8],["skomakare",.62],["systembolaget",.55],["cykelverkstad",.4],["leksaker",.34]]
    .map(([l,w])=>({l, v:searches*.012*w*(.85+r()*.3)})).sort((a,c)=>c.v-a.v);
  const src = shares("src"+days, [["Google",41],["Direkt till sidan",22],["Instagram",14],["Facebook",11],["Nyhetsbrevet",8],["Övrigt",4]]);
  const best = cur.reduce((a,x)=>x.v>a.v?x:a);
  return `
    ${kpis([{l:"besökare",v,prev:pv},{l:"sidvisningar",v:v*2.6,prev:pv*2.5},{l:"sökningar på sidan",v:searches,prev:pv*.29},{l:"klick vidare till företagen",v:v*.18,prev:pv*.16}])}
    <div class="panel">
      <div class="ph"><h3>Besökare per dag</h3><span class="muted small">Flest på lördagar. Bästa dagen: ${WEEKDAYS[best.d.getDay()]} ${fmtDay(best.d)} med ${nf(best.v)} besökare.</span></div>
      ${barChart(cur,"besökare")}
    </div>
    <div class="stats-grid">
      <div class="panel"><h3>Mest besökta företag</h3><p class="muted small">Profilvisningar. Klicka på ett namn för att se företagets egen statistik.</p>${hbars(top)}</div>
      <div class="panel"><h3>Vanligaste sökorden</h3><p class="muted small">Vad besökarna skriver i sökrutan.</p>${hbars(terms)}</div>
      <div class="panel"><h3>Populäraste kategorierna</h3><p class="muted small">Profilvisningar per kategori.</p>${hbars(catViews)}</div>
      <div class="panel"><h3>Sökningar utan träff</h3><p class="muted small">Det besökarna letar efter men inte hittar i centrum. Bra underlag när lokaler ska hyras ut.</p>${hbars(missing)}</div>
      <div class="panel"><h3>Var besökarna kommer ifrån</h3><p class="muted small">Andel av besöken.</p>${hbars(src,{pct:1})}</div>
      <div class="panel"><h3>Nyhetsbrevet</h3><p class="muted small">Senaste utskicket.</p>
        <div class="stats mini"><div class="stat"><b>${nf(1840)}</b><span>prenumeranter</span></div><div class="stat"><b>52 %</b><span>öppnade</span></div><div class="stat"><b>${nf(312)}</b><span>klick till företag</span></div><div class="stat"><b>+64</b><span>nya prenumeranter</span></div></div>
      </div>
    </div>`;
}

function statsBiz(b, days){
  const share = bizWeight(b) / BIZ.reduce((s,x)=>s+bizWeight(x),0);
  const base = 410*1.15*share;
  const cur = daily("b"+b.id, days, base), prev = daily("b"+b.id, days, base*.9, days);
  const v = sum(cur), pv = sum(prev);
  const peers = BIZ.filter(x=>x.c===b.c);
  const avg = peers.reduce((s,x)=>s+bizWeight(x),0)/peers.length;
  const vs = Math.round((bizWeight(b)/avg-1)*100);
  const rank = BIZ.filter(x=>x.c===b.c).sort((a,c)=>bizWeight(c)-bizWeight(a)).indexOf(b)+1;
  const lvl = {gratis:0,plus:1,premium:2}[b.tier];
  const src = shares("bs"+b.id+days, [["Sökning på sidan",34],["Kategorisidan",24],["Google",18],["Startsidan",12],["Nyhetsbrevet",b.tier==="premium"?9:3],["Instagram",5]]);
  const r = rng("bt"+b.id+days);
  const words = [...new Set([typeOf(b).toLowerCase(), CATS[b.c].short.toLowerCase(), b.n.toLowerCase(), b.a?b.a.replace(/\s*\d.*$/,"").toLowerCase():"centrum"])]
    .map((l,i)=>({l, v:v*.2/(i+1)*(.8+r()*.4)})).sort((a,c)=>c.v-a.v);
  const opts = BIZ.slice().sort((a,c)=>a.n.localeCompare(c.n,"sv")).map(x=>`<option value="${x.id}"${x===b?" selected":""}>${esc(x.n)}</option>`).join("");
  return `
    <div class="pick">
      <label for="statsPick">Välj företag</label>
      <select id="statsPick">${opts}</select>
      ${tierTag(b.tier) || `<span class="tag ex">Bas</span>`}
      <a class="more small" href="#f-${b.id}">Visa profilen ${ico("arrow")}</a>
    </div>
    ${kpis([{l:"visningar av profilen",v,prev:pv},{l:"gånger i sökresultat",v:v*4.2,prev:pv*4},{l:"klick på karta och vägbeskrivning",v:v*.12,prev:pv*.11},{l:"klick på telefon och webb",v:v*.15,prev:pv*.13}])}
    <div class="panel">
      <div class="ph"><h3>Visningar per dag</h3><span class="muted small">${vs>=0?`${vs} % fler`:`${Math.abs(vs)} % färre`} visningar än snittet för ${esc(CATS[b.c].name.toLowerCase())}. Plats ${rank} av ${peers.length} i kategorin.</span></div>
      ${barChart(cur,"visningar")}
    </div>
    <div class="stats-grid">
      <div class="panel"><h3>Så hittade besökarna dig</h3><p class="muted small">Andel av visningarna.</p>${hbars(src,{pct:1})}</div>
      <div class="panel"><h3>Sökord som ledde till dig</h3><p class="muted small">Vad besökarna skrev innan de klickade på din profil.</p>${hbars(words)}</div>
    </div>
    ${lvl<2?`<div class="claim" style="margin-top:20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <p style="flex:1;min-width:220px;margin:0"><b>${lvl===0?"Med gratisprofilen syns ingen statistik.":"Med Plus ser företaget antal visningar per månad."}</b> Sökord, klick och jämförelse med kategorin ingår i Premium.</p>
      <a class="btn gold" href="#anslut">Se paketen ${ico("arrow")}</a></div>`:""}`;
}
function renderStats(){
  const id = currentRoute().slice(10) || null;
  paint(viewStats(byId[id] ? id : null));
}

/* ---------- Karta ----------
   Kartan ritas med MapLibre (vendor/maplibre) och kartdata från OpenFreeMap, som är gratis och får användas av
   webbplatser (även kommersiellt) utan nyckel. Allt laddas först när besökaren klickat på "Visa kartan" (valet kan sparas). */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
let mapObj = null, mapMarkers = {}, mapGroup = "alla";
const MAP_OK_KEY = "uc-karta-ok";
const mapAllowed = () => { try{ return localStorage.getItem(MAP_OK_KEY)==="ja"; }catch(_){ return false; } };
const onMap = () => BIZ.filter(b=>b.geo);
function viewMap(focusId){
  const list = onMap(), missing = BIZ.length - list.length;
  const groups = GROUPS.filter(g=>g.id==="alla" || list.some(b=>CATS[b.c].group===g.id));
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Karta</span>
    <h1>Hitta i centrum</h1>
    <p>Allt ligger inom några minuters promenad. Välj ett företag i listan eller klicka på kartan.</p>
  </div></section>
  <section style="padding-block:16px 64px"><div class="wrap">
    <div class="chips">${groups.map(g=>`<button type="button" class="chip" data-mg="${g.id}" aria-pressed="${mapGroup===g.id}">${g.icon?ico(g.icon):""}${esc(g.name)}</button>`).join("")}</div>
    <div class="mapwrap">
      <div class="maplist" id="mapList">${list.sort((a,b)=>a.n.localeCompare(b.n,"sv")).map(b=>{const c=CATS[b.c]; return `
        <button type="button" class="mitem${b.id===focusId?" on":""}" data-mapbiz="${b.id}" data-g="${c.group}" style="${tint(c)}"${mapGroup!=="alla"&&c.group!==mapGroup?" hidden":""}>
          <span class="dot">${ico(c.icon)}</span><span><b>${esc(b.n)}</b><small>${esc(b.a)}</small></span>
        </button>`;}).join("")}
        <p class="small muted mnote">${missing} verksamheter saknar ännu plats på kartan. De läggs till när adresserna är kontrollerade.</p>
      </div>
      <div class="mapbox" id="map" data-focus="${focusId||""}">
        <div class="map-consent">
          ${ico("pin")}
          <h3>Visa kartan över centrum</h3>
          <p class="small muted">Kartan hämtas från OpenFreeMap, som bygger på OpenStreetMap. När den visas skickas din IP-adress till dem. Inga cookies sparas. <a href="#cookies">Läs mer</a></p>
          <button type="button" class="btn dark" id="mapShow">Visa kartan</button>
          <label class="small"><input type="checkbox" id="mapRemember" checked> Visa kartan direkt nästa gång</label>
        </div>
      </div>
    </div>
  </div></section>`;
}
function loadMapLib(){
  if(window.maplibregl) return Promise.resolve();
  return new Promise((ok, fail)=>{
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = ASSET + "vendor/maplibre/maplibre-gl.css"; document.head.appendChild(css);
    const s = document.createElement("script"); s.src = ASSET + "vendor/maplibre/maplibre-gl.js"; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
  });
}
function mapPopup(b){
  return `<div class="mpop"><span class="eyebrow">${esc(typeOf(b))}</span><b>${esc(b.n)}</b><span>${esc(b.a)}${b.ga?" <em>(ungefärligt läge)</em>":""}</span><a href="${urlFor("f-"+b.id)}">Visa företaget ${ico("arrow")}</a></div>`;
}
const mapFail = box => { box.innerHTML = `<div class="map-consent">${ico("info")}<p>Kartan kunde inte laddas just nu. Försök igen om en stund.</p></div>`; mapObj = null; };
async function showMap(){
  const box = $("#map"); if(!box || mapObj) return;
  box.innerHTML = `<div class="map-loading">Laddar kartan…</div>`;
  try{ await loadMapLib(); }catch(_){ return mapFail(box); }
  if(!document.body.contains(box)) return;   // besökaren hann byta sida
  box.innerHTML = "";
  const bounds = new maplibregl.LngLatBounds();
  onMap().forEach(b=>bounds.extend([b.geo[1], b.geo[0]]));
  mapObj = new maplibregl.Map({
    container: box, style: MAP_STYLE, bounds, fitBoundsOptions:{padding:48}, maxZoom:19,
    attributionControl: {compact: true},   // källhänvisningen (krävs av OpenStreetMap) fälls ihop till en i-knapp
    cooperativeGestures: true,   // sidan scrollar som vanligt, kartan zoomas med Ctrl + scroll eller två fingrar
    locale: {
      "CooperativeGesturesHandler.WindowsHelpText": "Håll ned Ctrl och scrolla för att zooma kartan",
      "CooperativeGesturesHandler.MacHelpText": "Håll ned ⌘ och scrolla för att zooma kartan",
      "CooperativeGesturesHandler.MobileHelpText": "Använd två fingrar för att flytta kartan",
      "NavigationControl.ZoomIn": "Zooma in", "NavigationControl.ZoomOut": "Zooma ut"
    }
  });
  mapObj.addControl(new maplibregl.NavigationControl({showCompass:false}), "top-left");
  // Ge den grå grundkartan sidans färger: varm bakgrund, ljusblått vatten och svagt gröna parker
  mapObj.on("style.load", ()=>{
    const paint = (id, prop, val) => { if(mapObj.getLayer(id)) mapObj.setPaintProperty(id, prop, val); };
    paint("background", "background-color", "#f6f4ee");
    paint("landuse_residential", "fill-color", "#f1eee6");
    paint("building", "fill-color", "#e9e5dc");
    paint("water", "fill-color", "#bfdff0");
    paint("park", "fill-color", "#dfecd6");
    paint("landcover_wood", "fill-color", "#d6e6cc");
  });
  mapObj.on("error", e=>{ if(e && e.error && /style/i.test(String(e.error.message||""))) mapFail(box); });
  // Företag på samma adress sprids ut lite så att alla går att klicka på
  const seen = {}; mapMarkers = {};
  for(const b of onMap()){
    const key = b.geo.join(","), n = seen[key] = (seen[key]||0) + 1, a = n*2.1;
    const [lat, lng] = n===1 ? b.geo : [b.geo[0] + Math.sin(a)*.00006, b.geo[1] + Math.cos(a)*.00011];
    const c = CATS[b.c], el = document.createElement("button");
    el.type = "button"; el.className = "mpin"; el.setAttribute("aria-label", b.n); el.title = b.n;
    el.innerHTML = `<span style="${tint(c)}">${ico(c.icon)}</span>`;
    el.addEventListener("click", ()=>markItem(b.id));
    const popup = new maplibregl.Popup({offset:34, maxWidth:"260px"}).setHTML(mapPopup(b));
    mapMarkers[b.id] = {marker: new maplibregl.Marker({element:el, anchor:"bottom"}).setLngLat([lng, lat]).setPopup(popup), shown:false};
  }
  filterMap();
  const focus = box.dataset.focus;
  if(focus && mapMarkers[focus]) mapObj.once("load", ()=>focusMap(focus));
}
function filterMap(){
  document.querySelectorAll("#mapList .mitem").forEach(el=>el.hidden = mapGroup!=="alla" && el.dataset.g!==mapGroup);
  if(!mapObj) return;
  for(const b of onMap()){
    const show = mapGroup==="alla" || CATS[b.c].group===mapGroup, m = mapMarkers[b.id];
    if(show && !m.shown) m.marker.addTo(mapObj); else if(!show && m.shown) m.marker.remove();
    m.shown = show;
  }
}
function markItem(id){
  document.querySelectorAll("#mapList .mitem").forEach(el=>el.classList.toggle("on", el.dataset.mapbiz===id));
  const el = document.querySelector(`#mapList [data-mapbiz="${id}"]`);
  // Scrolla bara listan, inte hela sidan
  if(el){ const list = el.parentNode; list.scrollTo({top: el.offsetTop - list.clientHeight/2 + el.offsetHeight/2, behavior:"smooth"}); }
}
function focusMap(id){
  markItem(id);
  const m = mapMarkers[id]; if(!mapObj || !m) return;
  if(!m.shown){ m.marker.addTo(mapObj); m.shown = true; }
  Object.values(mapMarkers).forEach(x=>{ const p = x.marker.getPopup(); if(x!==m && p.isOpen()) p.remove(); });
  mapObj.flyTo({center: m.marker.getLngLat(), zoom: 17.2, speed: 1.4});
  if(!m.marker.getPopup().isOpen()) m.marker.togglePopup();
}
function renderMap(){
  const id = currentRoute().slice(6) || null;
  paint(viewMap(byId[id] ? id : null));
  if(mapAllowed()) showMap();
}

/* ---------- Dagens lunch (menyer i innehall.js) ---------- */
let lunchDay = null, lunchVeg = false;
function viewLunch(){
  const today = weekday(new Date()), weekend = today>4;
  const day = lunchDay!==null ? lunchDay : (weekend ? 0 : today);
  const list = LUNCH.filter(l=>byId[l.biz]).map(l=>{
    const dishes = (l.dagar[day]||[]).concat(l.veckans||[]).filter(d=>!lunchVeg || d.startsWith("v:"));
    return {l, b:byId[l.biz], dishes};
  }).filter(x=>x.dishes.length);
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Dagens lunch</span>
    <h1>Lunch i centrum</h1>
    <p>${weekend ? "Lunch serveras måndag till fredag. Här är menyerna för kommande vecka." : "Veckans lunchmenyer från restaurangerna och caféerna i centrum, samlade på ett ställe."} Menyerna i piloten är exempel.</p>
  </div></section>
  <section style="padding-block:16px 64px"><div class="wrap">
    <div class="lunch-bar">
      <div class="seg daytabs" role="group" aria-label="Välj dag">${DAYS.slice(0,5).map((d,i)=>`<button type="button" data-ld="${i}" aria-pressed="${i===day}">${i===today?"Idag":DAYS_LONG[i]}</button>`).join("")}</div>
      <button type="button" class="ftog" data-lveg="1" aria-pressed="${lunchVeg}">${ico("leaf")}Bara vegetariskt</button>
    </div>
    ${list.length ? `<div class="lunches">${list.map(({l,b,dishes})=>`
      <article class="lcard" style="${tint(CATS[b.c])}">
        <header>
          <div style="min-width:0"><h3><a href="#f-${b.id}">${esc(b.n)}</a></h3><span class="small muted">${esc(typeOf(b))}${b.a?` · ${esc(b.a)}`:""}</span></div>
          <b class="oprice">${esc(l.pris)}</b>
        </header>
        <ul class="dishes">${dishes.map(dishHTML).join("")}</ul>
        <footer>
          <span class="small muted">${ico("clock")} ${esc(l.tid)} · ${esc(l.ingar)}</span>
          ${day===today ? statusHTML(b) : ""}
        </footer>
      </article>`).join("")}</div>`
      : `<div class="empty">Inga rätter matchar just nu. Prova en annan dag eller ta bort filtret.</div>`}
    <div class="panel" style="margin-top:32px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      ${ico("bowl")}<p style="flex:1;min-width:220px" class="muted">Serverar du lunch i centrum? Lägg in veckans meny så syns den här varje dag.</p>
      <a class="btn dark" href="#anslut">För företagare</a>
    </div>
  </div></section>`;
}

/* ---------- Besök centrum (innehåll i innehall.js) ---------- */
function viewVisit(){
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Besök centrum</span>
    <h1>Hitta hit och hitta rätt</h1>
    <p>Allt du behöver veta inför ditt besök: parkering, buss, laddstolpar, toaletter och tillgänglighet.</p>
  </div></section>
  <section style="padding-block:16px 64px"><div class="wrap">
    <div class="visit">${BESOK.map(x=>`<div class="vcard">${ico(x.i)}<div><h3>${esc(x.t)}</h3><p class="muted small">${x.text}</p></div></div>`).join("")}</div>
    <div class="vlinks">
      <a class="panel" href="#karta">${ico("pin")}<span><b>Karta över centrum</b><small>Se var butikerna och restaurangerna ligger</small></span>${ico("arrow")}</a>
      <a class="panel" href="#hitta-oppet">${ico("clock")}<span><b>Öppet nu</b><small>Företag som har öppet just nu</small></span>${ico("arrow")}</a>
    </div>
  </div></section>`;
}

/* ---------- Sök i sidhuvudet ---------- */
let hqActive = -1;
function hqRender(){
  const input = $("#hq"), box = $("#hqList"), q = input.value.trim();
  if(q.length<2){ box.hidden = true; input.setAttribute("aria-expanded","false"); return; }
  const hits = searchBiz(q), top = hits.slice(0,6);
  hqActive = -1;
  box.innerHTML = (top.length ? top.map(b=>{ const c = CATS[b.c]; return `
      <a class="hq-item" role="option" href="${urlFor("f-"+b.id)}" style="${tint(c)}"><span class="dot">${ico(c.icon)}</span><span><b>${esc(b.n)}</b><small>${esc(typeOf(b))}${b.a?` · ${esc(b.a)}`:""}</small></span>${statusHTML(b)}</a>`; }).join("")
      : `<p class="hq-none">Inga träffar för ”${esc(q)}”. Prova ett annat ord.</p>`)
    + (hits.length ? `<button type="button" class="hq-all" data-q="${esc(q)}">Visa ${hits.length===1?"träffen":`alla ${hits.length} träffar`} i katalogen ${ico("arrow")}</button>` : "");
  box.hidden = false; input.setAttribute("aria-expanded","true");
}
function hqClose(clear){
  const box = $("#hqList"); box.hidden = true; $("#hq").setAttribute("aria-expanded","false");
  if(clear) $("#hq").value = "";
}
function hqMove(dir){
  const items = [...document.querySelectorAll("#hqList .hq-item, #hqList .hq-all")]; if(!items.length) return;
  hqActive = (hqActive + dir + items.length) % items.length;
  items.forEach((el,i)=>el.classList.toggle("on", i===hqActive));
  items[hqActive].scrollIntoView({block:"nearest"});
}
// Sökning från sidhuvud, snabbval och "visa alla": öppna katalogen med sökordet
function searchFor(q){
  dirQ = q; dirGroup = "alla"; dirCat = null;
  hqClose(true); trackSearch(q, true);
  if(currentRoute()==="hitta"){ render(); } else go("hitta");
}

/* ---------- Policyer (texterna finns i policyer.js) ---------- */
function viewPolicy(id){
  const p = POLICIES[id];
  const others = Object.entries(POLICIES).map(([k,x])=>`<a href="#${k}"${k===id?' aria-current="page"':""}>${esc(x.title)}</a>`).join("");
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow">Policyer och villkor</span>
    <h1>${esc(p.title)}</h1>
    <p>${esc(p.intro)}</p>
    <p class="small" style="margin-top:12px"><span class="tag warn">Utkast – granskas före publicering</span> <span class="muted">Senast uppdaterad: ${FILL("datum")}</span></p>
  </div></section>
  <section style="padding-block:16px 64px"><div class="wrap policy">
    <nav class="policy-nav" aria-label="Policyer och villkor">${others}</nav>
    <article class="prose">${p.body}</article>
  </div></section>`;
}

/* ---------- Router ---------- */
function setNav(r){
  document.querySelectorAll(".nav a").forEach(a=>a.classList.toggle("on", a.dataset.r===r));
  $("#dropBtn").classList.toggle("on", !!document.querySelector(`#dropMenu a[data-r="${r}"]`));
  $("#nav").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded","false");
  setDrop(false); hqClose(true);
}
function setDrop(open){ $("#drop").classList.toggle("open", open); $("#dropBtn").setAttribute("aria-expanded", String(open)); }
function paint(html){
  if(mapObj){ mapObj.remove(); mapObj = null; }   // städa upp kartan när sidan byts
  const app=$("#app"); app.innerHTML=html; linkify(app);
}
function viewNotFound(){
  return `<section class="page-head"><div class="wrap">
    <span class="eyebrow">Sidan hittades inte</span>
    <h1>Hoppsan, här fanns ingenting</h1>
    <p>Sidan kan ha flyttats eller tagits bort. Prova att söka efter företaget istället.</p>
    <div class="row" style="margin-top:20px"><a class="btn dark" href="#hitta">Butiker &amp; Restauranger ${ico("arrow")}</a><a class="btn ghost" href="#start">Till startsidan</a></div>
  </div></section><div style="height:64px"></div>`;
}
// Fliktitel, beskrivning och sökmotorinställning för sidan som visas
function setMeta(r){
  const m = pageMeta(r);
  document.title = m.title;
  const set = (name, content) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if(!content){ if(el) el.remove(); return; }
    if(!el){ el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
    el.content = content;
  };
  set("description", m.desc);
  set("robots", "noindex, nofollow");   // Pilot: ska inte synas i sökmotorer
}
function render(){
  const h = currentRoute();
  let r = h, scrollTo = null;
  if(h==="anmal"){ r="anslut"; scrollTo="anmal"; }
  if(h==="lista" && !DEMO) r = "saknas";
  setMeta(r==="saknas" ? "saknas" : h);
  if(h.startsWith("hitta")){
    const k = h.slice(6);
    if(k==="oppet"){ dirFilters = new Set(["oppet"]); dirGroup="alla"; dirCat=null; }
    else if(k){ if(CATS[k]){ dirGroup=CATS[k].group; dirCat=k; } else if(GROUPS.some(g=>g.id===k)){ dirGroup=k; dirCat=null; } }
    paint(viewDirectory()); filterDir(); setNav("hitta");
  } else if(h.startsWith("f-")){
    paint(viewBusiness(h.slice(2))); setNav("hitta");
    if(byId[h.slice(2)]) track("Profilvisning",{foretag:byId[h.slice(2)].n});
  } else if(h==="karta" || h.startsWith("karta-")){
    renderMap(); setNav("karta");
  } else if(h.startsWith("statistik")){
    renderStats(); setNav("anslut");
  } else {
    const views = {start:viewStart, lunch:viewLunch, besok:viewVisit, erbjudanden:viewOffers, mot:viewPeople, evenemang:viewEvents, anslut:viewJoin, om:viewAbout, kontakt:viewContact, lista:viewList};
    if(POLICIES[r]){ paint(viewPolicy(r)); setNav(""); }
    else { paint((views[r]||viewNotFound)()); setNav(views[r]?r:""); }
    if(r==="lista") fillList();
  }
  if(scrollTo){ requestAnimationFrame(()=>{ const el=document.getElementById(scrollTo); if(el) el.scrollIntoView({behavior:"smooth"}); }); }
  else window.scrollTo(0,0);
}
let lastBiz = null;
function onRoute(){
  const h = currentRoute();
  if(h.startsWith("f-") && h!==lastBiz){ previewTier=null; lastBiz=h; }
  render();
}
window.addEventListener(PATHS ? "popstate" : "hashchange", onRoute);
// Gamla #-länkar till servern (t.ex. /#f-viola-blommor) skrivs om till riktiga adresser
if(PATHS && location.hash.length>1 && !document.getElementById(location.hash.slice(1))){
  history.replaceState(null, "", routeToPath(location.hash.slice(1)) + location.search);
}

/* ---------- Händelser ---------- */
document.addEventListener("click", e=>{
  if(!e.target.closest(".hsearch")) hqClose(false);
  if(!e.target.closest("#drop")) setDrop(false);
  const t = e.target.closest("button,a"); if(!t) return;
  if(t.id==="dropBtn"){ setDrop(!$("#drop").classList.contains("open")); return; }
  if(t.dataset.q!==undefined){ searchFor(t.dataset.q); return; }
  if(t.dataset.df){ const k=t.dataset.df; dirFilters.has(k)?dirFilters.delete(k):dirFilters.add(k); t.setAttribute("aria-pressed",String(dirFilters.has(k))); filterDir(); return; }
  if(t.dataset.ld){ lunchDay=Number(t.dataset.ld); const y=window.scrollY; paint(viewLunch()); window.scrollTo(0,y); return; }
  if(t.dataset.lveg){ lunchVeg=!lunchVeg; const y=window.scrollY; paint(viewLunch()); window.scrollTo(0,y); return; }
  if(t.dataset.share){
    const url = location.href, label = t.querySelector("span");
    if(navigator.share) navigator.share({title:t.dataset.share, url}).catch(()=>{});
    else if(navigator.clipboard) navigator.clipboard.writeText(url).then(()=>{ label.textContent="Länken är kopierad"; setTimeout(()=>label.textContent="Dela",2000); }).catch(()=>{});
    return;
  }
  if(t.id==="menuBtn"){ const n=$("#nav"); const o=!n.classList.contains("open"); n.classList.toggle("open",o); t.setAttribute("aria-expanded",String(o)); return; }
  if(t.dataset.feat){ featIdx=(featIdx+Number(t.dataset.feat)+FEATURED.length)%FEATURED.length; $("#featured").innerHTML=featuredHTML(); linkify($("#featured")); return; }
  if(t.dataset.group){ dirGroup=t.dataset.group; dirCat=null; document.querySelectorAll("[data-group]").forEach(b=>b.setAttribute("aria-pressed",String(b===t))); filterDir(); return; }
  if(t.dataset.cat!==undefined && t.classList.contains("chip")){ dirCat=t.dataset.cat||null; filterDir(); return; }
  if(t.dataset.tier){ previewTier=t.dataset.tier; const y=window.scrollY; paint(viewBusiness(currentRoute().slice(2))); window.scrollTo(0,y); return; }
  if(t.dataset.og){ offerGroup=t.dataset.og; paint(viewOffers()); return; }
  if(t.dataset.mg){ mapGroup=t.dataset.mg; document.querySelectorAll("[data-mg]").forEach(b=>b.setAttribute("aria-pressed",String(b===t))); filterMap(); return; }
  if(t.dataset.mapbiz){ const id=t.dataset.mapbiz; if(mapObj) focusMap(id); else { markItem(id); $("#map").dataset.focus=id; } return; }
  if(t.id==="mapShow"){ try{ if($("#mapRemember").checked) localStorage.setItem(MAP_OK_KEY,"ja"); }catch(_){} showMap(); return; }
  if(t.dataset.lf){ listFilter=t.dataset.lf; document.querySelectorAll("[data-lf]").forEach(b=>b.setAttribute("aria-pressed",String(b===t))); fillList(); return; }
  if(t.dataset.scroll){ e.preventDefault(); const el=document.getElementById(t.dataset.scroll); if(el) el.scrollIntoView({behavior:"smooth"}); return; }
  if(t.dataset.period){ statsDays=Number(t.dataset.period); const y=window.scrollY; renderStats(); window.scrollTo(0,y); return; }
  if(t.dataset.plan){ setTimeout(()=>{ const r=document.querySelector(`input[name=plan][value=${t.dataset.plan}]`); if(r) r.checked=true; syncOnce(t.dataset.once); },50); }
  if(t.dataset.track){ track(t.dataset.track, {foretag:t.dataset.biz}); }
  // Interna länkar på servern: byt sida utan att ladda om
  if(PATHS && t.tagName==="A" && t.origin===location.origin && !t.target && !(e.ctrlKey||e.metaKey||e.shiftKey||e.button)){
    e.preventDefault();
    if(t.pathname+t.search !== location.pathname+location.search) history.pushState(null, "", t.pathname+t.search);
    onRoute();
  }
});
document.addEventListener("input", e=>{
  if(e.target.id==="dirQ"){ dirQ=e.target.value; trackSearch(dirQ, filterDir()); }
  if(e.target.id==="hq") hqRender();
});
document.addEventListener("focusin", e=>{ if(e.target.id==="hq" && e.target.value.trim().length>1) hqRender(); });
document.addEventListener("keydown", e=>{
  if(e.key==="Escape"){ hqClose(false); setDrop(false); return; }
  if(e.target.id!=="hq") return;
  if(e.key==="ArrowDown"){ e.preventDefault(); hqMove(1); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); hqMove(-1); }
  else if(e.key==="Enter"){
    e.preventDefault();
    const sel = document.querySelector("#hqList .on");
    if(sel) sel.click(); else if(e.target.value.trim()) searchFor(e.target.value.trim());
  }
});
// Tooltip för staplarna i statistiken
let tipChart = null;
function chartTip(e){
  const c = e.target.closest ? e.target.closest(".chart") : null;
  if(tipChart && tipChart!==c){ tipChart.querySelector(".tip").hidden=true; tipChart.querySelectorAll(".col.on").forEach(x=>x.classList.remove("on")); }
  tipChart = c; if(!c) return;
  const col = e.target.closest(".col"), tip = c.querySelector(".tip");
  c.querySelectorAll(".col.on").forEach(x=>{ if(x!==col) x.classList.remove("on"); });
  if(!col){ tip.hidden=true; return; }
  col.classList.add("on");
  const [day,val] = col.dataset.tip.split("|");
  tip.innerHTML = `<span>${day}</span><b>${val}</b>`; tip.hidden = false;
  const r = c.getBoundingClientRect(), w = tip.offsetWidth;
  tip.style.left = Math.min(Math.max(e.clientX-r.left-w/2, 0), r.width-w) + "px";
  tip.style.top = Math.max(0, e.clientY-r.top-tip.offsetHeight-14) + "px";
}
document.addEventListener("pointermove", chartTip);
document.addEventListener("pointerdown", chartTip);
document.addEventListener("change", e=>{
  if(e.target.name==="plan") syncOnce();
  if(e.target.id==="statsPick"){ go(e.target.value ? "statistik-"+e.target.value : "statistik"); return; }
  if(e.target.id==="fImg"){ const f=[...e.target.files]; $("#fImgList").textContent = f.length ? f.map(x=>x.name).join(", ") : "Inga bilder valda."; }
});
document.addEventListener("submit", e=>{
  const f = e.target;
  if(f.id==="heroSearch"){ e.preventDefault(); searchFor($("#heroQ").value.trim()); return; }
  if(f.dataset.demo){
    e.preventDefault();
    const msg = {
      tips:["Tack för tipset!","I den skarpa versionen hamnar tipset hos centrumföreningen, som lägger till företaget efter kontroll."],
      anmalan:["Tack! Uppgifterna är mottagna.","I den skarpa versionen skickas anmälan till centrumföreningen för granskning, och du får en bekräftelse via e-post."],
      kontakt:["Tack för ditt meddelande!","I den skarpa versionen skickas meddelandet vidare till centrumföreningen."],
      nyhetsbrev:["Tack! Du är anmäld.","I den skarpa versionen kopplas formuläret till ett utskicksverktyg och du får ett välkomstmejl."]
    }[f.dataset.demo];
    const old = f.parentNode.querySelector(".done"); if(old) old.remove();
    const d = document.createElement("div"); d.className="done"; d.setAttribute("role","status");
    d.innerHTML = `${ico("check")}<div><b>${msg[0]}</b><span class="small">Pilot: inget skickas eller sparas. ${msg[1]}</span></div>`;
    f.after(d); f.reset();
  }
});

// Kortare text i sökrutan på smala skärmar
if(window.matchMedia("(max-width:480px)").matches) $("#hq").placeholder = "Sök";
linkify(document.body);
render();
})();
