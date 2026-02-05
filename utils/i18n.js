const translations = {
  de: {
    // API messages
    "Categories fetched successfully": "Kategorien erfolgreich geladen",

    // Category names
    "Individual Therapy": "Einzeltherapie",
    "Couples Therapy": "Paartherapie",
    "Executive Coaching": "Executive Coaching",

    // Types
    "1-on-1": "Einzelgespräch",
    "Group": "Gruppe",

    // ===== FULL GERMAN ABOUT THERAPY =====
    aboutTherapy: {
      "Individual Therapy": `
        <h2><strong>Überblick</strong></h2>
        <p>Aus psychodynamischer Sicht sind wir so, wie wir sind, aufgrund der Wirkung,
        die andere Menschen auf uns hatten. Nachhaltige Veränderung entsteht durch
        Beziehungserfahrungen.</p>

        <p>Diese Therapieform geht über reine Symptomlinderung hinaus und unterstützt
        das emotionale Wachstum, das ein erfülltes Leben ermöglicht.</p>

        <p>Die Einzeltherapie kann hilfreich sein bei Angst, Stress, Depression,
        Selbstwertproblemen, Beziehungsschwierigkeiten oder Lebenskrisen.</p>

        <p><strong>Was diese Therapie unterstützt:</strong></p>
        <ul>
          <li>Emotionale Klarheit und Stabilität</li>
          <li>Gesunde Beziehungen</li>
          <li>Stabiles Selbstwertgefühl</li>
          <li>Tieferes Selbstverständnis</li>
        </ul>
      `,

      "Couples Therapy": `
        <h2><strong>Paartherapie – Überblick</strong></h2>
        <p>Psychodynamische Paartherapie hilft Paaren, wieder Verbindung herzustellen
        und festgefahrene Beziehungsmuster zu verstehen.</p>

        <p>Der Fokus liegt auf unbewussten Dynamiken, emotionalen Bedürfnissen und
        Beziehungserfahrungen, die Konflikte beeinflussen.</p>

        <p><strong>Geeignet bei:</strong></p>
        <ul>
          <li>Wiederkehrenden Konflikten</li>
          <li>Emotionaler Distanz</li>
          <li>Vertrauensbrüchen</li>
          <li>Lebensveränderungen</li>
        </ul>

        <p>Ziel ist eine tiefere, sichere und authentische Beziehung.</p>
      `,

      "Executive Coaching": `
        <h2><strong>Executive Coaching – Überblick</strong></h2>
        <p>Dieses Coaching richtet sich an Führungskräfte und Unternehmer:innen,
        die Leistung, mentale Gesundheit und persönliche Entwicklung verbinden möchten.</p>

        <p><strong>Schwerpunkte:</strong></p>
        <ul>
          <li>Führungsrolle und Autoritätsentwicklung</li>
          <li>Stress- und Burnout-Prävention</li>
          <li>Emotionale Intelligenz</li>
          <li>Klare Entscheidungsfindung</li>
        </ul>

        <p>Ein geschützter Raum zur Reflexion, Klarheit und nachhaltigem Erfolg.</p>
      `
    }
  }
};

// Simple translator
exports.t = (key, lang = "en") => {
  if (lang === "en") return key;
  return translations[lang]?.[key] || key;
};

// Get German aboutTherapy
exports.getGermanAboutTherapy = (category, lang = "en") => {
  if (lang !== "de") return null;
  return translations.de.aboutTherapy[category] || null;
};
