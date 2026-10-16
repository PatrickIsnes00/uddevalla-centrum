/* Uddevalla Centrum – kategorier, företag och exempelprofiler.
   Lägg till, ändra eller ta bort företag här. Inget annat behöver ändras. */
"use strict";

/* ---------- Kategorier ---------- */
const CATS = {
  rest:  {name:"Restauranger & barer", short:"Restaurang", group:"ata",  icon:"rest",   bg:"#cfe7fa", fg:"#1f6fae"},
  pizza: {name:"Pizzerior & snabbmat", short:"Pizzeria & snabbmat", group:"ata", icon:"pizza", bg:"#ffdccf", fg:"#c8502c"},
  cafe:  {name:"Caféer & konditorier", short:"Café", group:"ata",  icon:"cafe",   bg:"#fbe6c4", fg:"#a5651d"},
  godis: {name:"Godis & kiosker", short:"Godis & kiosk", group:"ata", icon:"godis", bg:"#ffd9eb", fg:"#bd3a7b"},
  mode:  {name:"Kläder & mode", short:"Kläder & mode", group:"butik", icon:"mode", bg:"#dfe4ff", fg:"#4757c0"},
  acc:   {name:"Skor, accessoarer & optik", short:"Skor & accessoarer", group:"butik", icon:"acc", bg:"#f7e1d0", fg:"#9c552a"},
  spec:  {name:"Böcker, blommor & specialbutiker", short:"Specialbutik", group:"butik", icon:"spec", bg:"#d5f2dd", fg:"#2b8550"},
  mat:   {name:"Matbutiker & livsmedel", short:"Livsmedel", group:"butik", icon:"mat", bg:"#eaf5c6", fg:"#62800f"},
  beauty:{name:"Frisör, skönhet & hälsa", short:"Skönhet & hälsa", group:"skon", icon:"beauty", bg:"#f0dff8", fg:"#8746ad"},
  upplev:{name:"Upplevelser & hotell", short:"Upplevelse", group:"ovr", icon:"upplev", bg:"#cff1ef", fg:"#1c8580"}
};
const tint = c => `--bgc:${c.bg};--fgc:${c.fg}`;
const GROUPS = [
  {id:"alla", name:"Alla", icon:null},
  {id:"ata", name:"Äta & dricka", icon:"rest"},
  {id:"butik", name:"Butiker", icon:"acc"},
  {id:"skon", name:"Skönhet & hälsa", icon:"beauty"},
  {id:"ovr", name:"Upplev & övrigt", icon:"upplev"}
];

/* ---------- Företag ----------
   n=namn, a=adress, c=kategori, t=typ, v=verifieringsnotis, nw=nytt förslag (ej i ursprungslistan), tier=demo-nivå,
   geo=[latitud, longitud] för kartan (från OpenStreetMap), ga=1 om läget är ungefärligt (bara gatan hittades) */
const CHECK_AREA = "Kontrollera att adressen ligger inom centrumgränsen.";
const NEW = "Nytt förslag – fanns inte i ursprungslistan. Verifiera läge och status.";
const RAW = [
  // Restauranger
  {n:"Restaurang KOCH",a:"Kochska gränden 2",c:"rest",tier:"plus",v:"Stod två gånger i listan (KOCH / Koch) – sammanslagen till en.",geo:[58.349375,11.933496]},
  {n:"Meatings",a:"Norra Drottninggatan 26",c:"rest",geo:[58.351621,11.934846]},
  {n:"Kerstin på torget",a:"Kungsgatan 25",c:"rest",geo:[58.349402,11.938131]},
  {n:"Pinchos",a:"Trädgårdsgatan 3",c:"rest",geo:[58.349633,11.9379],ga:1},
  {n:"Krog & Co",a:"Kålgårdsbergsgatan 8",c:"rest",geo:[58.349525,11.936002],ga:1},
  {n:"Mortens Krog",a:"Kungsgatan 17",c:"rest",geo:[58.349547,11.935074],ga:1},
  {n:"O'Learys",c:"rest",t:"Sportbar & restaurang"},
  {n:"Danny's Kök & Bar",c:"rest"},
  {n:"Restaurang Pingvin",a:"Norra Drottninggatan 16",c:"rest",geo:[58.352017,11.934752],ga:1},
  {n:"Indian Masala",a:"Norra Drottninggatan 14",c:"rest",t:"Indisk restaurang",geo:[58.350715,11.934555]},
  {n:"Everest Masala",c:"rest",t:"Indisk/nepalesisk restaurang",v:"Kontrollera om detta är samma verksamhet som Indian Masala."},
  {n:"Fuyuu",c:"rest"},
  {n:"Mamma Sushi",c:"rest",t:"Sushi"},
  {n:"Min Min Sushi",c:"rest",t:"Sushi"},
  {n:"Sushiro",c:"rest",t:"Sushi"},
  {n:"Aroi Modern & Traditional Asian Food",c:"rest",t:"Asiatisk restaurang"},
  {n:"Phaya Thai 2.0",c:"rest",t:"Thailändsk restaurang"},
  {n:"Thai Palace",c:"rest",t:"Thailändsk restaurang"},
  {n:"Que Pasa",c:"rest"},
  {n:"Orientköket",c:"rest"},
  {n:"Falafel King",c:"rest",t:"Falafel",v:"Namnet behöver verifieras: Falafel King eller Falafel Kingdom."},
  {n:"Eat by Carlia",c:"rest",t:"Hotellrestaurang"},
  {n:"Pub 1803",c:"rest",t:"Pub & bar",nw:1},
  // Pizzerior & snabbmat
  {n:"Ristorante Napoli",a:"Norrtullsgatan 3",c:"pizza",geo:[58.352007,11.933818],ga:1},
  {n:"Pizzeria Papillon",a:"Södra Drottninggatan 41",c:"pizza",geo:[58.345129,11.933009],ga:1},
  {n:"Pizzeria Milano",a:"Lagerbergsgatan 28",c:"pizza",geo:[58.350708,11.94273]},
  {n:"Pizzeria Italia",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria Oregano",a:"Södra Drottninggatan 14",c:"pizza",geo:[58.346263,11.933025]},
  {n:"Rhodos Pizzeria",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria Gustav",c:"pizza",v:CHECK_AREA},
  {n:"Lyckopizzerian",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria Express",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria Tre Kronor",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria Prima Dona",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria Bella",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria Beroia",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria DaLa",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria Matakuten",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria Roma",c:"pizza",v:CHECK_AREA},
  {n:"Pizzeria TI AMO",c:"pizza",v:CHECK_AREA},
  {n:"Mio Mondo",c:"pizza"},
  {n:"Subway",c:"pizza",t:"Smörgåsar"},
  {n:"Wing It!",c:"pizza",t:"Kycklingvingar"},
  // Caféer
  {n:"Espresso House",a:"Norra Drottninggatan 5",c:"cafe",geo:[58.349807,11.933705]},
  {n:"Lejas Café",a:"Kungstorget 1",c:"cafe",tier:"premium",geo:[58.349065,11.939003]},
  {n:"Youmi Café",c:"cafe"},
  {n:"Coffee Roomer",a:"Kochska gränden 4",c:"cafe",geo:[58.349144,11.933473]},
  {n:"RÅG",a:"Kilbäcksgatan 23",c:"cafe",t:"Bageri & café",geo:[58.349814,11.941847],ga:1},
  {n:"Cactuz",c:"cafe"},
  {n:"Wienerkonditoriet",c:"cafe",t:"Konditori"},
  {n:"Einars konditori",c:"cafe",t:"Konditori"},
  {n:"Centralens Café & Konditori",c:"cafe",t:"Café & konditori"},
  {n:"Kajkanten",c:"cafe"},
  {n:"Dagnys Musikcafé",c:"cafe",t:"Musikcafé"},
  {n:"Köket Café & Restaurang",c:"cafe"},
  {n:"Konditori Snäckan",c:"cafe",t:"Konditori",nw:1},
  // Godis & kiosker
  {n:"Sött och Salt",a:"Kungsgatan 2",c:"godis",geo:[58.349651,11.932498]},
  {n:"Hemmakväll",c:"godis"},
  {n:"Anders Tobak & Spel",c:"godis",t:"Tobak & spel"},
  {n:"Roy's Tobak",c:"godis",t:"Tobak & kiosk"},
  {n:"Chocko Prins",c:"godis",t:"Choklad & godis"},
  // Matbutiker
  {n:"Willys Uddevalla C",c:"mat"},
  {n:"Uddevalla Orienthall",c:"mat",v:"Adressuppgifterna skiljer sig mellan kataloger och behöver verifieras."},
  {n:"ICA Kvantum Uddevalla",c:"mat",v:CHECK_AREA},
  {n:"ICA Supermarket Spara",c:"mat"},
  {n:"Tempo Jacobs",c:"mat"},
  {n:"Lidl",c:"mat",v:CHECK_AREA},
  // Mode
  {n:"Look & Like Mode",a:"Kungsgatan 17",c:"mode",geo:[58.349547,11.935074],ga:1},
  {n:"Soul4men",a:"Kungsgatan 20",c:"mode",t:"Herrmode",geo:[58.349302,11.937169]},
  {n:"Standard Herrkläder",a:"Kungsgatan 23",c:"mode",t:"Herrmode",geo:[58.349547,11.935074],ga:1},
  {n:"Harmonix",a:"Kungsgatan",c:"mode"},
  {n:"Foam Fashion",a:"Norra Drottninggatan",c:"mode"},
  {n:"Somewear and Friends",a:"Kungsgatan",c:"mode"},
  {n:"Everywear – Somewear",c:"mode",v:"Kontrollera om detta är samma butik som Somewear and Friends."},
  {n:"Elizabeths Design & Sömnad",c:"mode",t:"Design & sömnad"},
  {n:"Pimpa Hemma",c:"mode",t:"Tyger & sybehör"},
  {n:"Boogiekidz",c:"mode",t:"Barnkläder",v:"Kontrollera aktuell adress och verksamhetsstatus."},
  {n:"Soul",c:"mode",t:"Klädbutik",nw:1},
  {n:"Gittans Under",c:"mode",t:"Underkläder",nw:1},
  {n:"Cotton Blue",c:"mode",t:"Dammode",nw:1},
  // Accessoarer
  {n:"Sko-Karlsson",c:"acc",t:"Skor"},
  {n:"Väsk-Nilsson",c:"acc",t:"Väskor"},
  {n:"Golden House",c:"acc",t:"Smycken"},
  {n:"J.A. Bokström",c:"acc",t:"Smycken & ur",v:"Verifiera utbud."},
  {n:"Einar Andersson Ur & Optik",c:"acc",t:"Ur & optik"},
  {n:"Arne & Urbans Optik",c:"acc",t:"Optik"},
  {n:"Uddevalla Optik",c:"acc",t:"Optik"},
  {n:"Synsam Uddevalla Centrum",c:"acc",t:"Optik"},
  {n:"Synoptik",c:"acc",t:"Optik"},
  {n:"Optiker Liljelood",c:"acc",t:"Optik"},
  // Specialbutiker
  {n:"Hallmans Bokhandel",a:"Kungsgatan 4",c:"spec",t:"Bokhandel",tier:"plus",geo:[58.349628,11.932782]},
  {n:"Nordbergs Antikvariat",a:"Södra Hamngatan 14",c:"spec",t:"Antikvariat",geo:[58.348348,11.93662],ga:1},
  {n:"Janssons Musik",a:"Södra Hamngatan 18",c:"spec",t:"Musikbutik",geo:[58.348267,11.936731]},
  {n:"Viola Blommor",a:"Kochska gränden 1",c:"spec",t:"Blommor",tier:"premium",geo:[58.349188,11.933223]},
  {n:"Floristverkstaden i Uddevalla",c:"spec",t:"Blommor"},
  {n:"Hälsokraft",c:"spec",t:"Hälsokost"},
  {n:"Kicks",c:"spec",t:"Skönhetsprodukter"},
  {n:"Hemtex",c:"spec",t:"Hemtextil"},
  {n:"Normal",c:"spec",t:"Lågprisbutik"},
  {n:"Phonet",c:"spec",t:"Mobiltillbehör & reparation"},
  {n:"Magical House",c:"spec"},
  {n:"Partaj",c:"spec",t:"Fest & dekoration"},
  {n:"Andreasson Musik",c:"spec",t:"Musikbutik",v:"Verifiera aktuell adress och om butiken fortfarande finns i centrum."},
  {n:"R.Å Design",c:"spec",t:"Inredning, design & återbruk",nw:1},
  {n:"Pingstkyrkans Second Hand",c:"spec",t:"Second hand",nw:1},
  {n:"Antik-Harrys",c:"spec",t:"Antikt & samlarobjekt",nw:1},
  {n:"Da Capo Second Hand & Hantverk",c:"spec",t:"Second hand & hantverk",nw:1},
  // Skönhet
  {n:"Klippverket Uddevalla",c:"beauty",t:"Frisör"},
  {n:"Hair by Hamodi",c:"beauty",t:"Frisör"},
  {n:"Anas Barbershop",c:"beauty",t:"Barberare"},
  {n:"Salong 3D",c:"beauty",t:"Frisör"},
  {n:"Salong Munken",c:"beauty",t:"Frisör"},
  {n:"Xose Salong",c:"beauty",t:"Frisör"},
  {n:"Dima's Hair Design",c:"beauty",t:"Frisör"},
  {n:"Stålklangs Dam & Herrfrisör",c:"beauty",t:"Frisör"},
  {n:"City Salongen",c:"beauty",t:"Frisör"},
  {n:"Salong Medina",c:"beauty",t:"Frisör"},
  {n:"Heaven Nails",c:"beauty",t:"Naglar"},
  {n:"Diva Beauty",c:"beauty",t:"Skönhetssalong"},
  {n:"Nagelspecialisten",c:"beauty",t:"Naglar"},
  {n:"Viktoriasalongen",c:"beauty",t:"Frisör"},
  {n:"Anna Hudvårdsstudio",c:"beauty",t:"Hudvård"},
  {n:"Uddevalla Massage & Ryggskola",c:"beauty",t:"Massage"},
  // Upplev
  {n:"Bohusläns museum",c:"upplev",t:"Museum",nw:1},
  {n:"Quality Hotel Carlia",c:"upplev",t:"Hotell",nw:1}
];

const slug = s => s.toLowerCase().replace(/[åä]/g,"a").replace(/ö/g,"o").replace(/é/g,"e").replace(/&/g,"och").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
/* ---------- Bra att veta ----------
   Symboler som företagen kan välja för sin profil. Används i "fakta" nedan och som filter i katalogen. */
const FACTS = {
  ute:     {l:"Uteservering",      i:"sun"},
  vego:    {l:"Vegetariskt",       i:"leaf"},
  rullstol:{l:"Rullstolsanpassat", i:"access"},
  barn:    {l:"Barnvänligt",       i:"child"},
  hund:    {l:"Hundvänligt",       i:"paw"},
  boka:    {l:"Bokning",           i:"cal"},
  present: {l:"Presentkort",       i:"gift"},
  wifi:    {l:"Wifi",              i:"wifi"},
  kort:    {l:"Kortbetalning",     i:"card"},
  swish:   {l:"Swish",             i:"pay"}
};

/* ---------- Detaljer som företagen fyller i själva ----------
   utbud  = vad de säljer eller erbjuder (visas på profilen och är sökbart)
   fakta  = koder från FACTS ovan
   oppet  = öppettider måndag–söndag, t.ex. "10-18" eller "10:30-14". Tom sträng = stängt.
   avvik  = avvikande öppettider vissa datum, t.ex. {"2026-12-24":"10-13", "2026-12-25":""}
   upd    = när uppgifterna senast uppdaterades (år-månad)
   tel, web, boka = telefon, webbplats och bokningslänk när företaget fyllt i dem
   I piloten är detta exempeluppgifter. */
const DETALJER = {
  "viola-blommor":        {utbud:["Buketter","Bröllopsbinderi","Begravningsbinderi","Krukväxter","Presenter","Leverans i centrum"], fakta:["present","rullstol","kort","swish"], oppet:["10-18","10-18","10-18","10-18","10-18","10-15",""], avvik:{"2026-12-24":"9-13","2026-12-25":""}, upd:"2026-09"},
  "lejas-cafe":           {utbud:["Hembakat","Kaffe och te","Smörgåsar","Soppa till lunch","Glutenfria alternativ","Tårtor på beställning"], fakta:["ute","vego","barn","hund","rullstol","wifi","kort","swish"], oppet:["8-18","8-18","8-18","8-18","8-18","9-17","10-16"], upd:"2026-10"},
  "restaurang-koch":      {utbud:["Dagens lunch","À la carte","Vinbar","Privata sällskap","Catering"], fakta:["boka","vego","ute","rullstol","kort"], oppet:["11-22","11-22","11-22","11-23","11-23","16-23",""], upd:"2026-08"},
  "hallmans-bokhandel":   {utbud:["Skönlitteratur","Barnböcker","Papper och kontor","Pussel och spel","Presentinslagning","Beställning av böcker"], fakta:["present","barn","rullstol","kort","swish"], oppet:["10-18","10-18","10-18","10-18","10-18","10-16","12-16"], upd:"2026-09"},
  "kerstin-pa-torget":    {utbud:["Dagens lunch","Husmanskost","Fika","Uteservering vid torget"], fakta:["ute","vego","barn","kort","swish"], oppet:["10-17","10-17","10-17","10-17","10-17","10-16",""], upd:"2026-09"},
  "mortens-krog":         {utbud:["Dagens lunch","À la carte","Pub","Sport på storbild"], fakta:["boka","ute","kort"], oppet:["11-23","11-23","11-23","11-23","11-23","12-23","13-21"], upd:"2026-07"},
  "indian-masala":        {utbud:["Indisk lunchbuffé","Vegetariska rätter","Tandoori","Avhämtning"], fakta:["vego","barn","kort","swish"], oppet:["11-21","11-21","11-21","11-21","11-21","12-21","12-20"], upd:"2026-09"},
  "meatings":             {utbud:["Hamburgare","Grillat","Dagens lunch","Vegoburgare"], fakta:["vego","ute","barn","kort"], oppet:["11-21","11-21","11-21","11-21","11-22","12-22","12-20"], upd:"2026-08"},
  "restaurang-pingvin":   {utbud:["Dagens lunch","Pizza","Sallader"], fakta:["vego","barn","kort","swish"], oppet:["10:30-20","10:30-20","10:30-20","10:30-20","10:30-21","12-21","12-20"], upd:"2026-06"},
  "espresso-house":       {utbud:["Kaffe","Te","Smoothies","Bakverk","Smörgåsar"], fakta:["vego","wifi","rullstol","kort"], oppet:["7-19","7-19","7-19","7-19","7-19","9-18","10-17"], upd:"2026-09"},
  "coffee-roomer":        {utbud:["Specialkaffe","Bakverk","Kaffebönor att köpa med hem"], fakta:["hund","wifi","kort","swish"], oppet:["8-17","8-17","8-17","8-17","8-17","9-16",""], upd:"2026-10"},
  "rag":                  {utbud:["Surdegsbröd","Bullar och bakverk","Frukost","Smörgåsar"], fakta:["vego","barn","kort","swish"], oppet:["7-17","7-17","7-17","7-17","7-17","8-15",""], upd:"2026-09"},
  "sott-och-salt":        {utbud:["Lösgodis","Choklad","Lakrits","Presentkorgar"], fakta:["present","barn","kort","swish"], oppet:["10-19","10-19","10-19","10-19","10-19","10-17","11-16"], upd:"2026-08"},
  "janssons-musik":       {utbud:["Gitarrer","Noter","Strängar och tillbehör","Reparation av instrument"], fakta:["kort","swish"], oppet:["10-18","10-18","10-18","10-18","10-18","10-14",""], upd:"2026-05"},
  "look-och-like-mode":   {utbud:["Dammode","Accessoarer","Skor","Presenter"], fakta:["present","kort","swish"], oppet:["10-18","10-18","10-18","10-18","10-18","10-15",""], upd:"2026-09"},
  "soul4men":             {utbud:["Herrkläder","Kostym","Skor","Accessoarer"], fakta:["present","kort","swish"], oppet:["10-18","10-18","10-18","10-18","10-18","10-15",""], upd:"2026-08"},
  "klippverket-uddevalla":{utbud:["Klippning","Färgning","Skäggtrimning","Barnklippning"], fakta:["boka","barn","kort","swish"], oppet:["9-18","9-18","9-18","9-19","9-18","9-14",""], upd:"2026-09"},
  "anas-barbershop":      {utbud:["Herrklippning","Skäggtrimning","Rakning med kniv"], fakta:["boka","kort","swish"], oppet:["10-19","10-19","10-19","10-19","10-19","10-16",""], upd:"2026-10"},
  "nordbergs-antikvariat":{utbud:["Begagnade böcker","Samlarböcker","Vinylskivor","Gamla kartor"], fakta:["kort","swish"], oppet:["11-17","11-17","11-17","11-17","11-17","11-14",""], upd:"2026-04"}
};

const BIZ = RAW.map(b => { const id = slug(b.n); return Object.assign({tier:"gratis"}, b, {id}, DETALJER[id]||{}); });
const byId = Object.fromEntries(BIZ.map(b=>[b.id,b]));

/* ---------- Exempelprofiler (Plus/Premium-demo) ---------- */
const PROFILES = {
  "viola-blommor": {
    tagline:"Blommor och personliga arrangemang",
    quote:"Vi vill att varje kund ska känna sig välkommen och hitta något som gör dagen lite bättre.",
    role:"Ägare, Viola Blommor",
    story:"Här berättar ägaren med egna ord hur butiken startade, vad som gör den speciell och varför centrum är rätt plats. Texten skrivs av företagaren själv eller tillsammans med centrumföreningen vid en intervju.",
    pres:"Blomsterbutik mitt i centrum med buketter, arrangemang för fest och vardag, och hjälp med blommor till bröllop och begravning."
  },
  "lejas-cafe": {
    tagline:"En plats för fika och en paus",
    quote:"Det bästa med centrum är närheten till människorna. Här känner jag mina kunder.",
    role:"Ägare, Lejas Café",
    story:"Ägarpresentationen är Premium-nivåns kärna: en bild, ett citat och en kort berättelse om människan bakom verksamheten. Den roterar på startsidan och kan lyftas i nyhetsbrevet.",
    pres:"Café vid Kungstorget med hembakat, luncher och en plats att stanna upp en stund mitt i stan."
  },
  "restaurang-koch": {
    tagline:"Mat och restaurangupplevelser",
    pres:"Restaurang i Kochska gränden. Här beskriver företaget sin meny, sina specialiteter och vad som gör stället unikt."
  },
  "hallmans-bokhandel": {
    tagline:"Böcker och inspiration",
    pres:"Bokhandel på Kungsgatan med skönlitteratur, barnböcker, papper och presenter. Här kan företaget lyfta boktips och författarbesök."
  }
};
const FEATURED = ["viola-blommor","lejas-cafe"];
