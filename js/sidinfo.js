/* Uddevalla Centrum – sidornas adresser, titlar och beskrivningar.
   Används både av webbplatsen (fliktitel och beskrivning) och av bygg.js (sökmotorer och delning). */
"use strict";

const SITE_NAME = "Uddevalla Centrum";
const typeOf = b => b.t || CATS[b.c].short;

/* ---------- Adresser ----------
   Varje sida har ett internt namn (route), t.ex. "f-viola-blommor".
   På en riktig server blir det en vanlig adress, t.ex. /foretag/viola-blommor. */
const FIXED_PATHS = {start:"", anslut:"for-foretagare", anmal:"for-foretagare/anmal"};
function routeToPath(r){
  const p = r in FIXED_PATHS ? FIXED_PATHS[r]
    : r.startsWith("f-") ? "foretag/" + r.slice(2)
    : r.startsWith("hitta-") ? "hitta/" + r.slice(6)
    : r.startsWith("statistik-") ? "statistik/" + r.slice(10)
    : r.startsWith("karta-") ? "karta/" + r.slice(6)
    : r;
  return p ? "/" + p + "/" : "/";
}
function pathToRoute(p){
  p = decodeURIComponent(p).replace(/index\.html$/,"").replace(/^\/+|\/+$/g,"");
  if(!p) return "start";
  const [a,b] = p.split("/");
  if(a==="foretag" && b) return "f-"+b;
  if(a==="for-foretagare") return b==="anmal" ? "anmal" : "anslut";
  if(b && (a==="hitta" || a==="statistik" || a==="karta")) return a+"-"+b;
  return a;
}

/* ---------- Titel och beskrivning per sida ----------
   index:false betyder att sidan inte ska synas i sökmotorer. */
function pageMeta(r){
  // Lägger till " | Uddevalla Centrum" i titeln om den inte redan nämner Uddevalla centrum
  const t = (title, desc, extra) => Object.assign({title: /uddevalla centrum/i.test(title) ? title : `${title} | ${SITE_NAME}`, desc, index:true}, extra);
  const PAGES = {
    start:    t(`${SITE_NAME} – butiker, restauranger och caféer`, `Upptäck ${BIZ.length} butiker, restauranger, caféer och frisörer i Uddevalla centrum. Möt människorna bakom företagen och se vad som händer i stan.`),
    hitta:    t("Butiker & restauranger i Uddevalla centrum", "Alla butiker, restauranger, caféer, frisörer och andra verksamheter i Uddevalla centrum på ett ställe. Sök och hitta adress och öppettider."),
    mot:      t("Möt företagarna", "Människorna bakom butikerna, caféerna och restaurangerna i Uddevalla centrum berättar om sina verksamheter."),
    erbjudanden:t("Erbjudanden i Uddevalla centrum", "Aktuella erbjudanden från butiker, caféer och restauranger i Uddevalla centrum."),
    lunch:    t("Dagens lunch i Uddevalla centrum", "Veckans lunchmenyer från restaurangerna och caféerna i Uddevalla centrum, samlade på ett ställe."),
    besok:    t("Besök Uddevalla centrum", "Parkering, buss, laddstolpar, toaletter och tillgänglighet i Uddevalla centrum."),
    "hitta-oppet": t("Öppet nu i Uddevalla centrum", "Butiker, caféer och restauranger i Uddevalla centrum som har öppet just nu."),
    karta:    t("Karta över Uddevalla centrum", "Se var butikerna, restaurangerna och caféerna ligger i Uddevalla centrum."),
    evenemang:t("Evenemang i Uddevalla centrum", "Marknader, kvällsöppet, högtider och aktiviteter i butikerna i Uddevalla centrum."),
    om:       t("Om Uddevalla centrum", "Uddevalla centrum är stadens mötesplats med butiker, restauranger, caféer och service inom gångavstånd."),
    kontakt:  t("Kontakt", "Kontakta Uddevalla Centrum med frågor om centrum, evenemang eller hur ditt företag kan synas."),
    anslut:   t("För företagare", "Driver du företag i Uddevalla centrum? Skapa en gratis profil eller välj att synas mer."),
    anmal:    t("Anmäl ditt företag", "Anmäl eller ta över ditt företags profil på Uddevalla Centrum.", {canonical:"anslut"}),
    statistik:t("Statistik", "Statistik för företag i Uddevalla centrum.", {index:false}),
    lista:    t("Arbetslista", "Intern arbetslista.", {index:false})
  };
  if(PAGES[r]) return PAGES[r];
  if(typeof POLICIES!=="undefined" && POLICIES[r]) return t(POLICIES[r].title, POLICIES[r].intro);
  if(r.startsWith("hitta-")){
    const k = r.slice(6), c = CATS[k], g = GROUPS.find(x=>x.id===k && x.id!=="alla");
    if(c) return t(`${c.name} i Uddevalla centrum`, `${c.name} i Uddevalla centrum. Se alla ${BIZ.filter(b=>b.c===k).length} verksamheter med adress och öppettider.`);
    if(g) return t(`${g.name} i Uddevalla centrum`, `${g.name} i Uddevalla centrum. Hitta adress, öppettider och människorna bakom verksamheterna.`);
  }
  if(r.startsWith("f-")){
    const b = BIZ.find(x=>x.id===r.slice(2));
    if(b){
      const p = PROFILES[b.id] || {};
      return t(`${b.n} – ${typeOf(b)} i Uddevalla centrum`,
        p.pres || `${b.n} är en ${typeOf(b).toLowerCase()}${b.a?` på ${b.a}`:""} i Uddevalla centrum. Se adress, öppettider och kontaktuppgifter.`,
        {biz:b});
    }
  }
  if(r.startsWith("statistik-")) return PAGES.statistik;
  if(r.startsWith("karta-")) return Object.assign({}, PAGES.karta, {canonical:"karta"});
  return t("Sidan hittades inte", "Sidan finns inte.", {index:false, notFound:true});
}

/* Alla sidor som ska finnas som egna filer när sidan publiceras */
function allRoutes(){
  return [].concat(
    ["start","hitta","hitta-oppet","lunch","besok","erbjudanden","karta","mot","evenemang","om","kontakt","anslut","anmal","statistik","lista"],
    Object.keys(POLICIES),
    GROUPS.filter(g=>g.id!=="alla").map(g=>"hitta-"+g.id),
    Object.keys(CATS).map(k=>"hitta-"+k),
    BIZ.map(b=>"f-"+b.id),
    BIZ.map(b=>"statistik-"+b.id),
    BIZ.filter(b=>b.geo).map(b=>"karta-"+b.id)
  );
}
