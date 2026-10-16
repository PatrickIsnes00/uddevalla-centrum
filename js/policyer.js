/* Uddevalla Centrum – policyer och villkor.
   UTKAST: texterna ska granskas innan publicering. Allt inom <mark> är platshållare som måste fyllas i.
   Varje policy visas som en egen sida: #integritet, #cookies, #villkor och #foretagsvillkor. */
"use strict";

const ORG = FILL("Föreningens namn");
const MAIL = FILL("e-postadress");

const POLICIES = {

/* ------------------------------------------------------------------ */
integritet: {
  title: "Integritetspolicy",
  intro: "Så här hanterar vi personuppgifter när du besöker webbplatsen, kontaktar oss, prenumererar på nyhetsbrevet eller har en företagsprofil.",
  body: `
<h2>1. Vem ansvarar för dina personuppgifter?</h2>
<p>${ORG}, organisationsnummer ${FILL("org.nr")}, är personuppgiftsansvarig för behandlingen av personuppgifter på uddevallacentrum${FILL(".se")}. Du når oss på ${MAIL} eller ${FILL("postadress")}.</p>

<h2>2. Vilka uppgifter samlar vi in och varför?</h2>
<div class="tablewrap"><table class="ptable">
<thead><tr><th>När</th><th>Uppgifter</th><th>Varför</th><th>Rättslig grund</th><th>Hur länge</th></tr></thead>
<tbody>
<tr><td>Du besöker webbplatsen</td><td>Inga uppgifter som kan kopplas till dig. Vi räknar besök, sökningar och klick utan cookies och utan att spara IP-adresser.</td><td>Förstå hur webbplatsen används och visa företagen statistik över sina profiler</td><td>Berättigat intresse</td><td>Statistiken är anonym och sparas i ${FILL("24 månader")}</td></tr>
<tr><td>Du kontaktar oss</td><td>Namn, e-post, ärende och meddelande</td><td>Besvara och hantera ditt ärende</td><td>Berättigat intresse</td><td>Upp till ${FILL("12 månader")} efter att ärendet är avslutat</td></tr>
<tr><td>Du tipsar om ett företag</td><td>Företagets namn och adress. Om du lämnar dina kontaktuppgifter sparas även de.</td><td>Lägga till företaget i katalogen</td><td>Berättigat intresse</td><td>Tills tipset är hanterat</td></tr>
<tr><td>Du prenumererar på nyhetsbrevet</td><td>E-postadress, och om du öppnar utskick eller klickar på länkar</td><td>Skicka nyhetsbrevet och se vilket innehåll som är intressant</td><td>Samtycke</td><td>Tills du avslutar prenumerationen</td></tr>
<tr><td>Du anmäler eller tar över en företagsprofil</td><td>Kontaktperson, e-post, telefon, företagsuppgifter, texter och bilder</td><td>Publicera och administrera profilen, kontakta dig om den och fakturera eventuella tjänster</td><td>Avtal</td><td>Så länge profilen finns, därefter enligt bokföringslagen (sju år) för fakturor</td></tr>
<tr><td>Ägarpresentation</td><td>Namn, bild, citat och berättelse om dig som företagare</td><td>Presentera människan bakom företaget på webbplatsen och i nyhetsbrevet</td><td>Samtycke</td><td>Tills du återkallar samtycket eller profilen avslutas</td></tr>
<tr><td>Företagskatalogen</td><td>Företagsnamn, adress och kategori. För enskild firma kan detta räknas som personuppgifter.</td><td>Visa besökare vilka verksamheter som finns i centrum</td><td>Berättigat intresse. Uppgifterna hämtas från offentliga källor.</td><td>Tills verksamheten upphör eller du ber oss ta bort den</td></tr>
</tbody></table></div>

<h2>3. Företag som finns med utan att själva ha anmält sig</h2>
<p>För att katalogen ska vara komplett lägger vi in verksamheter i centrum med uppgifter från offentliga källor, till exempel företagets egen webbplats och skyltning. Vi publicerar bara företagsnamn, adress och kategori. Driver du en verksamhet som finns med och vill bli borttagen, eller vill rätta uppgifterna, kontakta oss på ${MAIL} så åtgärdar vi det.</p>

<h2>4. Vilka delar vi uppgifterna med?</h2>
<p>Vi säljer aldrig personuppgifter. Vi använder följande leverantörer, som behandlar uppgifter för vår räkning enligt personuppgiftsbiträdesavtal:</p>
<ul>
<li><b>Webbhotell:</b> ${FILL("leverantör")}, lagrar webbplatsen och inskickade formulär.</li>
<li><b>E-post:</b> ${FILL("leverantör")}, för att ta emot och svara på meddelanden.</li>
<li><b>Nyhetsbrev:</b> ${FILL("t.ex. Brevo eller Mailchimp")}, för att skicka nyhetsbrevet.</li>
<li><b>Statistik:</b> ${FILL("t.ex. Plausible eller Umami")}, cookiefri och utan personuppgifter.</li>
<li><b>Ekonomi:</b> ${FILL("bokföringsprogram/redovisningsbyrå")}, för fakturering av företagstjänster.</li>
</ul>
<p>Uppgifter kan också lämnas ut om vi är skyldiga enligt lag, till exempel till Skatteverket.</p>

<h2>5. Överföring utanför EU/EES</h2>
<p>Vi strävar efter att alla uppgifter behandlas inom EU/EES. Om en leverantör behandlar uppgifter utanför EU/EES ser vi till att det finns skyddsåtgärder enligt dataskyddsförordningen, till exempel EU-kommissionens standardavtalsklausuler. ${FILL("Kontrollera för varje vald leverantör.")}</p>

<h2>6. Dina rättigheter</h2>
<p>Du har rätt att:</p>
<ul>
<li>få veta vilka uppgifter vi har om dig (registerutdrag)</li>
<li>få felaktiga uppgifter rättade</li>
<li>få uppgifter raderade när de inte längre behövs</li>
<li>begränsa eller invända mot behandling som grundar sig på berättigat intresse</li>
<li>återkalla ett samtycke när som helst, till exempel genom länken i varje nyhetsbrev</li>
<li>få ut uppgifter du själv lämnat i ett maskinläsbart format (dataportabilitet)</li>
</ul>
<p>Kontakta oss på ${MAIL}. Vi svarar inom en månad. Är du missnöjd med hur vi hanterar dina uppgifter kan du klaga hos Integritetsskyddsmyndigheten (IMY), <a href="https://www.imy.se" target="_blank" rel="noopener">imy.se</a>.</p>

<h2>7. Säkerhet</h2>
<p>Webbplatsen använder krypterad anslutning (HTTPS). Tillgången till inskickade uppgifter är begränsad till de personer i ${ORG} som behöver dem för att hantera ärenden och profiler.</p>

<h2>8. Ändringar</h2>
<p>Vi kan uppdatera policyn när webbplatsen eller lagstiftningen förändras. Den senaste versionen finns alltid på den här sidan.</p>`
},

/* ------------------------------------------------------------------ */
cookies: {
  title: "Cookies",
  intro: "Webbplatsen använder inga cookies för spårning eller marknadsföring. Därför behöver du inte godkänna något när du besöker oss.",
  body: `
<h2>Vad är cookies?</h2>
<p>Cookies är små textfiler som en webbplats sparar i din webbläsare. De kan användas för att hålla dig inloggad, men också för att följa dig mellan webbplatser. Enligt lagen om elektronisk kommunikation måste du informeras om cookies och godkänna dem som inte är nödvändiga.</p>

<h2>Cookies och liknande tekniker på webbplatsen</h2>
<div class="tablewrap"><table class="ptable">
<thead><tr><th>Vad</th><th>Typ</th><th>Syfte</th><th>Behövs samtycke?</th></tr></thead>
<tbody>
<tr><td>Besöksstatistik</td><td>Ingen cookie</td><td>Vi räknar sidvisningar, sökningar och klick med ${FILL("Plausible/Umami")}. Inga cookies sparas, inga IP-adresser lagras och du kan inte följas mellan webbplatser.</td><td>Nej</td></tr>
<tr><td>Inloggning för företagare</td><td>Nödvändig cookie</td><td>Håller dig inloggad på företagarsidorna. Tas bort när du loggar ut eller stänger webbläsaren. ${FILL("Gäller när inloggning finns.")}</td><td>Nej, den är nödvändig för tjänsten</td></tr>
<tr><td>Typsnitt</td><td>Ingen cookie</td><td>${FILL("Typsnitten hämtas i piloten från Google Fonts, vilket innebär att din IP-adress skickas till Google. Inför lansering ska typsnitten ligga på vår egen server, och då försvinner detta.")}</td><td>Nej</td></tr>
<tr><td>Karta över centrum</td><td>Ingen cookie</td><td>Kartan visas först när du klickar på ”Visa kartan”. Då hämtas kartdata från OpenFreeMap (openfreemap.org), som bygger på öppna data från OpenStreetMap. Det innebär att din IP-adress skickas till OpenFreeMap. Om du väljer ”Visa kartan direkt nästa gång” sparas det valet i din webbläsare (lokal lagring, inte en cookie) och kan raderas när som helst.</td><td>Du väljer själv genom att klicka</td></tr>
<tr><td>Vägbeskrivning</td><td>Ingen på vår webbplats</td><td>När du klickar på ”Vägbeskrivning” kommer du till Google Maps, där Googles egna villkor och cookies gäller.</td><td>Hanteras av Google</td></tr>
</tbody></table></div>

<h2>Om vi börjar använda fler cookies</h2>
<p>Om vi i framtiden lägger till till exempel videor från YouTube eller annonsmätning kommer vi att be om ditt samtycke innan sådana cookies sparas, och uppdatera den här sidan.</p>

<h2>Så rensar du cookies</h2>
<p>Du kan när som helst ta bort cookies i din webbläsares inställningar. Läs mer hos Post- och telestyrelsen, <a href="https://www.pts.se" target="_blank" rel="noopener">pts.se</a>.</p>

<h2>Kontakt</h2>
<p>Frågor om cookies? Kontakta ${ORG} på ${MAIL}.</p>`
},

/* ------------------------------------------------------------------ */
villkor: {
  title: "Användarvillkor",
  intro: "Villkor för dig som besöker och använder webbplatsen Uddevalla Centrum.",
  body: `
<h2>1. Om webbplatsen</h2>
<p>Webbplatsen drivs av ${ORG} och är en gemensam mötesplats för verksamheterna i Uddevalla centrum. Genom att använda webbplatsen godkänner du de här villkoren.</p>

<h2>2. Uppgifter om företagen</h2>
<p>Uppgifter om öppettider, erbjudanden, priser och evenemang lämnas av respektive företag. Vi gör vårt bästa för att de ska vara korrekta, men kan inte garantera att de alltid är aktuella. Kontakta gärna företaget direkt innan du besöker det. Erbjudanden gäller enligt företagets egna villkor.</p>

<h2>3. Länkar till andra webbplatser</h2>
<p>Webbplatsen länkar till företagens egna webbplatser, sociala medier och kartor. Vi ansvarar inte för innehållet på andra webbplatser.</p>

<h2>4. Det du skickar till oss</h2>
<p>När du skickar ett tips eller ett meddelande ska innehållet vara sant och inte kränka någon annan. Vi kan välja att inte publicera eller använda tips.</p>

<h2>5. Upphovsrätt</h2>
<p>Texter, bilder, logotyp och design på webbplatsen tillhör ${ORG} eller respektive företag. De får inte användas i andra sammanhang utan tillstånd.</p>

<h2>6. Ansvar</h2>
<p>Webbplatsen tillhandahålls i befintligt skick. Vi ansvarar inte för skador som uppstår på grund av fel i uppgifter, avbrott eller att webbplatsen inte är tillgänglig.</p>

<h2>7. Ändringar och tillämplig lag</h2>
<p>Vi kan uppdatera villkoren. Svensk lag gäller.</p>`
},

/* ------------------------------------------------------------------ */
foretagsvillkor: {
  title: "Villkor för företagare",
  intro: "Villkor för företag som har en profil på webbplatsen, med eller utan betalda tjänster.",
  body: `
<h2>1. Parter</h2>
<p>Villkoren gäller mellan ${ORG}, org.nr ${FILL("org.nr")} (”vi”), och det företag som anmäler sig eller tar över en profil (”företaget”).</p>

<h2>2. Vem kan ha en profil?</h2>
<p>Verksamheter med fysisk adress inom ${FILL("den beslutade centrumgränsen, se karta")} kan få en profil. Vi granskar varje anmälan innan den publiceras och kan neka en anmälan om verksamheten inte ligger inom centrumgränsen eller strider mot villkoren.</p>

<h2>3. Grundprofil</h2>
<p>Grundprofilen (Bas) är kostnadsfri och utan bindningstid. Företaget kan när som helst be oss ta bort profilen.</p>

<h2>4. Månadsabonnemang</h2>
<ul>
<li>Plus och Premium betalas per månad enligt den prislista som gäller när avtalet tecknas. Alla priser anges exklusive moms.</li>
<li>Fakturering sker ${FILL("månadsvis/kvartalsvis i förskott")} med ${FILL("30")} dagars betalningsvillkor.</li>
<li>Abonnemanget löper tills vidare och kan sägas upp när som helst. Uppsägningen gäller från ${FILL("nästa månadsskifte")}. Redan betald period återbetalas inte.</li>
<li>Uppgradering gäller direkt. Nedgradering gäller från nästa period.</li>
<li>Vid utebliven betalning kan vi efter påminnelse ändra profilen till Bas.</li>
</ul>

<h2>5. Engångstjänster</h2>
<p>Kampanjvecka, plats i nyhetsbrevet, lyft av evenemang och tillägg som fotografering betalas per tillfälle. Bokningen är bindande när vi har bekräftat den. Avbokning senast ${FILL("sju")} dagar före publicering är kostnadsfri. Därefter debiteras ${FILL("hela/halva")} priset.</p>

<h2>6. Innehåll i profilen</h2>
<ul>
<li>Företaget ansvarar för att uppgifter, texter, erbjudanden och bilder är korrekta och följer lagen, till exempel marknadsföringslagen och prisinformationslagen.</li>
<li>Företaget intygar att det har rätt att använda bilderna det laddar upp och att personer som syns på bilderna har gett sitt samtycke.</li>
<li>Företaget ger ${ORG} rätt att publicera innehållet på webbplatsen, i nyhetsbrevet och i centrumets sociala kanaler så länge profilen finns.</li>
<li>Vi får ta bort eller ändra innehåll som är felaktigt, kränkande, vilseledande eller som strider mot villkoren.</li>
</ul>

<h2>7. Ägarpresentation</h2>
<p>Ägarpresentationen publiceras bara med samtycke från personen som presenteras. Personen godkänner texten och bilden före publicering och kan när som helst återkalla sitt samtycke, och då tar vi bort presentationen.</p>

<h2>8. Statistik</h2>
<p>Företag med Plus eller Premium får statistik över sin egen profil. Statistiken är anonym och visar inga uppgifter om enskilda besökare. Företaget får inte ta del av andra företags statistik. Siffrorna är vägledande och vi garanterar inte en viss mängd besökare.</p>

<h2>9. Konto och inloggning</h2>
<p>Företaget ansvarar för att inloggningsuppgifterna förvaras säkert och meddelar oss direkt om de kan ha hamnat hos någon obehörig. ${FILL("Gäller när inloggning finns.")}</p>

<h2>10. Ansvarsbegränsning</h2>
<p>Vi ansvarar inte för indirekta skador, utebliven vinst eller avbrott på webbplatsen. Vårt sammanlagda ansvar är begränsat till det belopp företaget har betalat de senaste tolv månaderna.</p>

<h2>11. Personuppgifter</h2>
<p>Hur vi hanterar personuppgifter om kontaktpersoner och ägare beskrivs i vår <a href="#integritet">integritetspolicy</a>.</p>

<h2>12. Ändringar av villkor och priser</h2>
<p>Vi meddelar ändringar av villkor eller priser via e-post minst ${FILL("30")} dagar innan de börjar gälla. Företaget kan då säga upp abonnemanget innan ändringen träder i kraft.</p>

<h2>13. Tvister</h2>
<p>Svensk lag gäller. Tvister ska i första hand lösas genom samtal och i andra hand av allmän domstol.</p>`
}
};
