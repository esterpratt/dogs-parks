const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../../public/locales');
const LANGUAGES = ['en', 'he', 'ar'];

// Read and parse JSON files
function readTranslationFile(lang) {
  const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${lang} translation file:`, error.message);
    return null;
  }
}

// Flatten nested object to dot notation keys
function flattenObject(obj, prefix = '') {
  const flattened = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
}

// Main analysis
function analyzeTranslations() {
  console.log('Analyzing translation files...\n');

  const translations = {};
  const flatTranslations = {};

  // Load all translation files
  for (const lang of LANGUAGES) {
    const data = readTranslationFile(lang);
    if (!data) {
      console.error(`Failed to load ${lang} translations. Aborting.\n`);
      return;
    }
    translations[lang] = data;
    flatTranslations[lang] = flattenObject(data);
  }

  // Get all unique keys from all languages
  const allKeys = new Set();
  for (const lang of LANGUAGES) {
    Object.keys(flatTranslations[lang]).forEach(key => allKeys.add(key));
  }

  // Find missing keys
  const missingKeys = {};
  const report = [];

  for (const key of Array.from(allKeys).sort()) {
    const missingInLanguages = [];

    for (const lang of LANGUAGES) {
      if (!(key in flatTranslations[lang])) {
        missingInLanguages.push(lang);
      }
    }

    if (missingInLanguages.length > 0) {
      missingKeys[key] = missingInLanguages;
      report.push({
        key,
        missingIn: missingInLanguages,
        presentIn: LANGUAGES.filter(l => !missingInLanguages.includes(l))
      });
    }
  }

  // Display results
  if (report.length === 0) {
    console.log('✅ All translations are complete! No missing keys found.\n');
    return;
  }

  console.log(`❌ Found ${report.length} translation key(s) with missing translations:\n`);

  // Group by missing languages
  const byMissingLanguage = {};
  for (const item of report) {
    for (const lang of item.missingIn) {
      if (!byMissingLanguage[lang]) {
        byMissingLanguage[lang] = [];
      }
      byMissingLanguage[lang].push(item);
    }
  }

  // Display grouped results
  for (const lang of LANGUAGES) {
    if (byMissingLanguage[lang]) {
      console.log(`\n━━━ Missing in ${lang.toUpperCase()} (${byMissingLanguage[lang].length} keys) ━━━\n`);

      for (const item of byMissingLanguage[lang]) {
        console.log(`  Key: ${item.key}`);

        // Show reference value from other languages
        const refLang = item.presentIn[0];
        if (refLang && flatTranslations[refLang][item.key]) {
          const refValue = flatTranslations[refLang][item.key];
          const displayValue = typeof refValue === 'string' && refValue.length > 80
            ? refValue.substring(0, 77) + '...'
            : refValue;
          console.log(`       Reference (${refLang}): ${JSON.stringify(displayValue)}`);
        }
        console.log('');
      }
    }
  }

  // Summary
  console.log('\n━━━ SUMMARY ━━━\n');
  console.log(`Total unique translation keys: ${allKeys.size}`);
  console.log(`Keys with missing translations: ${report.length}`);
  console.log('');

  for (const lang of LANGUAGES) {
    const missing = byMissingLanguage[lang] ? byMissingLanguage[lang].length : 0;
    const present = Object.keys(flatTranslations[lang]).length;
    const coverage = ((present / allKeys.size) * 100).toFixed(1);
    console.log(`  ${lang.toUpperCase()}: ${present}/${allKeys.size} (${coverage}% coverage) - ${missing} missing`);
  }

  console.log('');
}

// Run analysis
analyzeTranslations();
