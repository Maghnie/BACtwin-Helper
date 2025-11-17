export default function Lizenz() {
  return (
    <div className="p-6 max-w-3xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Lizenzbedingungen</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">MIT License</h2>
        <p>
          Copyright (c) {new Date().getFullYear()} Jürgen Langstein
        </p>
        <p className="mt-4">
          Hiermit wird unentgeltlich jeder Person, die eine Kopie dieser
          Software und der zugehörigen Dokumentationen (die „Software“)
          erhält, die Erlaubnis erteilt, die Software uneingeschränkt zu
          nutzen, einschließlich ohne Einschränkung der Rechte zur Nutzung,
          zum Kopieren, Ändern, Zusammenführen, Veröffentlichen, Verteilen,
          Unterlizenzieren und/oder zum Verkaufen von Kopien der Software,
          und Personen, denen die Software zur Verfügung gestellt wird,
          diese Rechte zu gewähren, unter den folgenden Bedingungen:
        </p>
        <p className="mt-2">
          Der obige Urheberrechtshinweis und dieser Erlaubnishinweis sind in
          allen Kopien oder wesentlichen Teilen der Software beizulegen.
        </p>
        <p className="mt-2">
          DIE SOFTWARE WIRD OHNE JEDE AUSDRÜCKLICHE ODER IMPLIZIERTE GARANTIE
          BEREITGESTELLT, EINSCHLIESSLICH DER GARANTIE DER MARKTREIFE, DER
          EIGNUNG FÜR EINEN BESTIMMTEN ZWECK UND DER NICHTVERLETZUNG. IN
          KEINEM FALL SIND DIE AUTOREN ODER COPYRIGHTINHABER FÜR ANSPRÜCHE,
          SCHÄDEN ODER SONSTIGE HAFTUNGEN VERANTWORTLICH, OB IN EINEM
          VERTRAGSVERHÄLTNIS, EINER UNERLAUBTEN HANDLUNG ODER ANDERWEITIG,
          DIE AUS DER SOFTWARE ODER DER VERWENDUNG ODER SONSTIGEN GESCHÄFTEN
          MIT DER SOFTWARE ENTSTEHEN.
        </p>
      </section>

      <p className="mt-8 text-sm text-gray-500">
        Letzte Aktualisierung:{" "}
        {new Date().toLocaleDateString("de-DE")}
      </p>

      {/* --- Buy Me a Coffee Button --- */}
      <div className="mt-8 text-center">
        <p className="mb-2 text-gray-700">
          Wenn dir dieses Projekt gefällt, kannst du mich gerne unterstützen:
        </p>
        <a
          href="https://buymeacoffee.com/bacnet4iot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee"
            className="h-10 mx-auto rounded shadow hover:opacity-90 transition"
          />
        </a>
      </div>
    </div>
  );
}
