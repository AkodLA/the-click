import Link from "next/link";

export const metadata = { title: "Prat for bedrifter og kommuner" };

const CUSTOMERS = [
  {
    icon: "🏫",
    who: "Skoler og barnehager",
    what: "Tolk i hverdagsmøter, så ingen barn må tolke for foreldrene sine. Oppfyller tolkeloven § 4 i det daglige.",
    price: "Per skole, fast månedspris",
  },
  {
    icon: "📦",
    who: "Lager og logistikk",
    what: "Nye ansatte får opplæring på eget språk, rett fra lagerets egne rutiner. Lederen ser alt på norsk.",
    price: "Per aktiv ansatt",
  },
  {
    icon: "🤖",
    who: "Roboter og egne apper",
    what: "Samme tolk som API. En servicerobot eller kiosk sender lyd inn og får tale tilbake på riktig språk.",
    price: "Per minutt tale",
  },
];

export default function BedriftPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="display text-2xl font-extrabold text-gran">
        prat
      </Link>
      <h1 className="mt-8 text-5xl font-extrabold leading-[1.05]">Én tolk. Overalt der folk ikke forstår hverandre.</h1>
      <p className="mt-4 max-w-[60ch] text-lg text-ink-soft">
        Privatpersoner lærer gratis. Kommuner og bedrifter betaler for tolken, og hver tolket samtale gjør den ansatte
        eller forelderen litt mer selvstendig neste gang.
      </p>

      <ul className="mt-10 space-y-4">
        {CUSTOMERS.map((c) => (
          <li key={c.who} className="flex gap-4 rounded-3xl bg-sheet p-6">
            <span className="text-4xl" aria-hidden>
              {c.icon}
            </span>
            <div>
              <h2 className="text-xl font-bold">{c.who}</h2>
              <p className="mt-1">{c.what}</p>
              <p className="mt-2 text-sm font-bold text-ink-soft">{c.price}</p>
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Se det i bruk</h2>
        <p className="mt-1 text-ink-soft">Lager-assistenten vi bygde for Holio kjører på samme stemmemotor.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/lager" className="rounded-2xl bg-gran px-5 py-3 font-bold text-white">
            Åpne lager-assistenten
          </Link>
          <Link href="/leder" className="rounded-2xl bg-sheet px-5 py-3 font-bold">
            Lederens skjerm
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Tolk-API (planlagt)</h2>
        <p className="mt-1 text-ink-soft">Én nøkkel per kunde. Lyd går aldri til lagring.</p>
        <pre className="mt-4 overflow-x-auto rounded-3xl bg-ink p-5 text-sm leading-relaxed text-gran-soft">
{`POST /v1/interpret
Authorization: Bearer prat_live_…

{
  "from": "no",
  "to": "so",
  "audio": "<base64>",
  "context": "parent_meeting"
}

→ { "text": "…", "audio": "<base64>", "save_phrases": true }`}
        </pre>
      </section>

      <p className="mt-10 text-sm text-ink-soft">Priser er en hypotese vi tester med de første kundene.</p>
    </div>
  );
}
