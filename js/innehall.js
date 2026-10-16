/* Uddevalla Centrum – innehåll: evenemang, erbjudanden, lunchmenyer, praktisk information, paket och priser. */
"use strict";

// Gul platshållare för text som ska fyllas i före lansering. Används även i policyer.js.
const FILL = s => `<mark class="fill">[${s}]</mark>`;

/* ---------- Exempelevenemang ---------- */
const EVENTS = [
  {d:24,m:"okt",y:2026,t:"Höstlov i centrum",p:"Kungstorget",txt:"Aktiviteter för barn och familjer i butiker och caféer under höstlovsveckan."},
  {d:7,m:"nov",y:2026,t:"Late night shopping",p:"Hela centrum",txt:"Butikerna har öppet till 21. Erbjudanden från deltagande företag och musik på torget."},
  {d:29,m:"nov",y:2026,t:"Julskyltning, första advent",p:"Kungsgatan",txt:"Julbelysningen tänds, skyltfönstren visas upp och caféerna bjuder på glögg."},
  {d:12,m:"dec",y:2026,t:"Julmarknad på torget",p:"Kungstorget",txt:"Lokala hantverkare, matställen och föreningar samlas på torget."}
];

/* ---------- Erbjudanden ----------
   Läggs upp av företag med Plus eller Premium. Visas till och med datumet i "until" och försvinner sedan av sig själva.
   biz = företagets id (namnet i små bokstäver med bindestreck, se adressen på profilen). Exempel i piloten. */
const OFFERS = [
  {biz:"lejas-cafe", title:"Fika för två", text:"Kaffe och nybakad kanelbulle för två. Gäller vardagar efter klockan 14.", price:"89 kr", until:"2026-11-30"},
  {biz:"lejas-cafe", title:"Höstlovsfika för barn", text:"Varm choklad och en kanelbulle för barn under höstlovsveckan.", price:"35 kr", until:"2026-11-01"},
  {biz:"viola-blommor", title:"Veckans bukett", text:"Säsongens blommor bundna i butiken. Ny bukett varje måndag.", price:"Från 199 kr", until:"2026-12-31"},
  {biz:"restaurang-koch", title:"Dagens lunch med kaffe", text:"Veckans lunchmeny publiceras varje måndag. Sallad, bröd och kaffe ingår.", price:"125 kr", until:"2026-12-20"},
  {biz:"hallmans-bokhandel", title:"Månadens boktips", text:"Personalens favoriter just nu, samlade på bordet vid entrén.", price:"20 % rabatt", until:"2026-10-31"},
  {biz:"hallmans-bokhandel", title:"Gratis julklappsinslagning", text:"Vi slår in dina julklappar när du handlar för minst 300 kr.", price:"Gratis", until:"2026-12-23"}
];

/* ---------- Dagens lunch ----------
   Restaurangerna lägger in veckans meny. dagar = rätter måndag–fredag.
   Börjar en rätt med "v:" är den vegetarisk. veckans = rätter som gäller hela veckan. Exempel i piloten. */
const LUNCH = [
  {biz:"kerstin-pa-torget", pris:"129 kr", tid:"11–14", ingar:"Sallad, bröd, dricka och kaffe",
   veckans:["v:Veckans vegetariska: halloumi med rostade rotfrukter och myntayoghurt"],
   dagar:[["Pannbiff med löksky, kokt potatis och lingon","Stekt sill med potatismos"],
          ["Kycklinggryta med curry och ris","Fiskgratäng med räkor och dill"],
          ["Ärtsoppa och pannkakor","v:Vegetarisk ärtsoppa och pannkakor"],
          ["Köttbullar med gräddsås och potatismos","Laxfilé med hollandaisesås"],
          ["Schnitzel med pommes och citron","Räksmörgås"]]},
  {biz:"restaurang-koch", pris:"145 kr", tid:"11–14", ingar:"Sallad, bröd och kaffe",
   veckans:["v:Svamprisotto med parmesan och rucola"],
   dagar:[["Helstekt fläskkarré med äppelchutney"],["Torskrygg med brynt smör och pepparrot"],
          ["Långkokt högrev med rödvinssky"],["Kycklinglårfilé med citronpasta"],["Hel röding med skaldjurssås"]]},
  {biz:"mortens-krog", pris:"125 kr", tid:"11–14:30", ingar:"Sallad, bröd och dricka",
   veckans:["Krogens burgare med pommes"],
   dagar:[["Biff Lindström med stekt potatis"],["Kålpudding med lingon"],["v:Pasta med pesto och rostade tomater"],["Fläskfilé med svampsås"],["Fish and chips"]]},
  {biz:"indian-masala", pris:"115 kr", tid:"11–15", ingar:"Buffé med ris, naan, sallad och dricka",
   veckans:["Butter chicken","v:Dal makhani","v:Palak paneer","Lamm rogan josh"], dagar:[[],[],[],[],[]]},
  {biz:"meatings", pris:"135 kr", tid:"11–14", ingar:"Pommes och dricka",
   veckans:["Dagens burgare: cheddar, bacon och rökig majonnäs","v:Vegoburgare med halloumi"], dagar:[[],[],[],[],[]]},
  {biz:"lejas-cafe", pris:"99 kr", tid:"11–14", ingar:"Hembakat bröd och kaffe",
   veckans:["v:Dagens soppa med hembakat bröd"],
   dagar:[["Smörgås med rostbiff och remoulad"],["Paj med skinka och purjolök"],["v:Paj med fetaost och spenat"],["Kycklingsallad med pasta"],["Räkmacka"]]}
];

/* ---------- Besök centrum: praktisk information ----------
   Fyll i det som är markerat innan lansering. */
const BESOK = [
  {i:"park",   t:"Parkering", text:`Det finns parkeringshus och gatuparkering runt centrum. ${FILL("Namn på parkeringshus, adresser, avgifter och första timmen gratis?")}`},
  {i:"bus",    t:"Buss och tåg", text:`Kampenhof resecentrum ligger några minuters promenad från Kungstorget. ${FILL("Busslinjer, tåg och länk till Västtrafik")}`},
  {i:"bike",   t:"Cykel", text:`Cykelparkering finns vid ${FILL("platser")}. Centrum är lätt att ta sig runt i till fots och med cykel.`},
  {i:"plug",   t:"Laddstolpar", text:`Laddplatser för elbil finns i ${FILL("parkeringshus/adresser")}.`},
  {i:"access", t:"Tillgänglighet", text:`${FILL("Ramper, hissar, tillgängliga toaletter och parkering för rörelsehindrade")}. I företagskatalogen kan du filtrera på rullstolsanpassade verksamheter.`},
  {i:"wc",     t:"Toaletter", text:`Offentliga toaletter finns vid ${FILL("platser och öppettider")}.`},
  {i:"cash",   t:"Bankomat", text:`Uttagsautomater finns vid ${FILL("platser")}.`},
  {i:"info",   t:"Frågor på plats", text:`${FILL("Turistinformation eller centrumvärdar, adress och öppettider")}`}
];

/* ---------- Paket och priser (förslag i piloten) ---------- */
// Månadsabonnemang
const PLANS = [
  {id:"gratis",name:"Bas",price:"0 kr",per:"alltid gratis",desc:"För alla företag inom centrumgränsen.",items:["Plats i företagskatalogen","Namn, kategori och adress","Öppettider och kontaktuppgifter","Logga eller en bild","Länk till webb och sociala medier","Uppdatera själv via formulär"]},
  {id:"plus",name:"Plus",price:"195 kr",per:"/ månad",desc:"För dig som vill synas mer och visa upp ditt utbud.",items:["Allt i Bas","Längre presentation av verksamheten","Bildgalleri med upp till 10 bilder","Egna erbjudanden och kampanjer","Evenemang i centrumkalendern","Visas före Bas-profiler i sökningen","Antal visningar av profilen varje månad"],hl:true},
  {id:"premium",name:"Premium",price:"395 kr",per:"/ månad",desc:"För dig som vill berätta historien bakom företaget.",items:["Allt i Plus","Ägarpresentation: Möt människan bakom","Roterande plats på startsidan","Med i nyhetsbrevet en gång per kvartal","Intervju och text tillsammans med oss","Full statistik: sökord, klick och jämförelse"],stats:true}
];
// Synas en gång – ingen bindning, fungerar även med gratisprofil
const ONEOFF = [
  {id:"kampanjvecka",name:"Kampanjvecka",price:"795 kr",per:"en vecka",desc:"Inför en rea, ett jubileum eller en nyhet.",items:["Banner högst upp på startsidan i sju dagar","Visas först i din kategori under veckan","Erbjudandet lyfts på din profil","Statistik över veckan när den är slut"]},
  {id:"nyhetsbrev",name:"Plats i nyhetsbrevet",price:"495 kr",per:"ett utskick",desc:"Nå alla som prenumererar på centrums nyhetsbrev.",items:["Ditt erbjudande eller din nyhet i månadens utskick","Bild, kort text och länk till din profil","Antal klick efter utskicket"]},
  {id:"evenemang",name:"Lyft ett evenemang",price:"295 kr",per:"ett evenemang",desc:"För en kväll, en lansering eller ett besök i butiken.",items:["Ditt evenemang i centrumkalendern","Markeras som utvalt på startsidan veckan innan","Länk till din profil och anmälan"]}
];
// Tillägg till valfri nivå
const ADDONS = [
  {n:"Fotografering",p:"1 500 kr",d:"Professionella bilder av butiken, utbudet och ägaren."},
  {n:"Utökad ägarpresentation",p:"995 kr",d:"Längre reportage med flera bilder, även för Plus-företag."}
];
