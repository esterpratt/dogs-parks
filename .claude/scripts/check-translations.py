#!/usr/bin/env python3
import json
import os

LOCALES_DIR = os.path.join(os.path.dirname(__file__), '../../public/locales')
LANGUAGES = ['en', 'he', 'ar']

def read_translation_file(lang):
    """Read and parse translation JSON file"""
    file_path = os.path.join(LOCALES_DIR, lang, 'translation.json')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {lang} translation file: {e}")
        return None

def flatten_object(obj, prefix=''):
    """Flatten nested object to dot notation keys"""
    flattened = {}

    for key, value in obj.items():
        new_key = f"{prefix}.{key}" if prefix else key

        if isinstance(value, dict):
            flattened.update(flatten_object(value, new_key))
        else:
            flattened[new_key] = value

    return flattened

def analyze_translations():
    """Main analysis function"""
    print('Analyzing translation files...\n')

    translations = {}
    flat_translations = {}

    # Load all translation files
    for lang in LANGUAGES:
        data = read_translation_file(lang)
        if data is None:
            print(f"Failed to load {lang} translations. Aborting.\n")
            return
        translations[lang] = data
        flat_translations[lang] = flatten_object(data)

    # Get all unique keys from all languages
    all_keys = set()
    for lang in LANGUAGES:
        all_keys.update(flat_translations[lang].keys())

    # Find missing keys
    report = []

    for key in sorted(all_keys):
        missing_in_languages = []

        for lang in LANGUAGES:
            if key not in flat_translations[lang]:
                missing_in_languages.append(lang)

        if missing_in_languages:
            present_in = [l for l in LANGUAGES if l not in missing_in_languages]
            report.append({
                'key': key,
                'missingIn': missing_in_languages,
                'presentIn': present_in
            })

    # Display results
    if not report:
        print('✅ All translations are complete! No missing keys found.\n')
        return

    print(f'❌ Found {len(report)} translation key(s) with missing translations:\n')

    # Group by missing languages
    by_missing_language = {lang: [] for lang in LANGUAGES}
    for item in report:
        for lang in item['missingIn']:
            by_missing_language[lang].append(item)

    # Display grouped results
    for lang in LANGUAGES:
        if by_missing_language[lang]:
            print(f"\n━━━ Missing in {lang.upper()} ({len(by_missing_language[lang])} keys) ━━━\n")

            for item in by_missing_language[lang]:
                print(f"  Key: {item['key']}")

                # Show reference value from other languages
                if item['presentIn']:
                    ref_lang = item['presentIn'][0]
                    if ref_lang in flat_translations and item['key'] in flat_translations[ref_lang]:
                        ref_value = flat_translations[ref_lang][item['key']]
                        if isinstance(ref_value, str) and len(ref_value) > 80:
                            display_value = ref_value[:77] + '...'
                        else:
                            display_value = ref_value
                        print(f"       Reference ({ref_lang}): {json.dumps(display_value, ensure_ascii=False)}")
                print('')

    # Summary
    print('\n━━━ SUMMARY ━━━\n')
    print(f'Total unique translation keys: {len(all_keys)}')
    print(f'Keys with missing translations: {len(report)}')
    print('')

    for lang in LANGUAGES:
        missing = len(by_missing_language[lang])
        present = len(flat_translations[lang])
        coverage = (present / len(all_keys)) * 100
        print(f'  {lang.upper()}: {present}/{len(all_keys)} ({coverage:.1f}% coverage) - {missing} missing')

    print('')

if __name__ == '__main__':
    analyze_translations()
