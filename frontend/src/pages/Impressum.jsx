export default function Impressum() {
  return (
    <div className="p-6 max-w-3xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Impressum & Datenschutzerklärung</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Angaben gemäß § 5 TMG</h2>
        <p>
          <strong>Unternehmen / Betreiber:</strong><br />
          <span>[Dein Firmenname oder dein vollständiger Name]</span><br />
          <span>[Straße und Hausnummer]</span><br />
          <span>[PLZ Ort]</span><br />
          <span>[Land]</span>
        </p>
        <p className="mt-2">
          <strong>Kontakt:</strong><br />
          Telefon: <span>[Telefonnummer]</span><br />
          E-Mail: <span>[E-Mail-Adresse]</span><br />
          Website: <span>[Webadresse]</span>
        </p>
        <p className="mt-2">
          <strong>Vertretungsberechtigt:</strong><br />
          <span>[Name der vertretungsberechtigten Person]</span>
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Haftungsausschluss</h2>
        <p>
          Die Inhalte dieser Webseite wurden mit größtmöglicher Sorgfalt erstellt. Für die
          Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine
          Gewähr. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen
          Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
          Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
          Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Urheberrecht</h2>
        <p>
          Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
          dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Die
          Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors
          bzw. Erstellers.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Datenschutzerklärung (DSGVO)</h2>
        <p>
          Der Schutz Ihrer persönlichen Daten ist uns wichtig. Personenbezogene Daten werden auf
          dieser Webseite nur im technisch notwendigen Umfang erhoben. In keinem Fall werden die
          erhobenen Daten verkauft oder aus anderen Gründen an Dritte weitergegeben.
        </p>
        <p className="mt-2">
          <strong>Verantwortlicher:</strong><br />
          <span>[Name des Datenschutzbeauftragten oder Verantwortlichen]</span><br />
          E-Mail: <span>[E-Mail-Adresse für Datenschutzanfragen]</span>
        </p>
        <p className="mt-2">
          Sie haben jederzeit das Recht auf Auskunft über die gespeicherten Daten, deren Herkunft
          und Empfänger sowie den Zweck der Speicherung. Kontaktieren Sie uns dazu bitte über die
          oben angegebenen Kontaktdaten.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Hosting & Logfiles</h2>
        <p>
          Unser Server erhebt und speichert automatisch Informationen in sogenannten Server-Logfiles,
          die Ihr Browser automatisch an uns übermittelt. Diese Daten sind: Browsertyp, verwendetes
          Betriebssystem, Referrer URL, Hostname des zugreifenden Rechners und Uhrzeit der
          Serveranfrage. Diese Daten sind nicht bestimmten Personen zuordenbar.
        </p>
      </section>

      <p className="mt-8 text-sm text-gray-500">
        Letzte Aktualisierung: {new Date().toLocaleDateString("de-DE")}
      </p>
    </div>
  );
}
