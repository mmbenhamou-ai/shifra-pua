#!/usr/bin/env node

// Préflight de configuration avant déploiement prod
// Vérifie la présence des variables d'environnement critiques.

// FEATURES permet d'activer / désactiver des blocs de fonctionnalités.
// Profil MVP recommandé : cron + webhooks ON, push + Google Maps OFF.
const FEATURES = {
  ENABLE_CRON: true,
  ENABLE_WEBHOOKS: true,
  ENABLE_PUSH: false,
  ENABLE_GOOGLE_MAPS: false,
};

// Overrides via variables d'environnement (ENABLE_CRON=0/1, etc.) ou PREVIEW_FEATURES_JSON.
try {
  if (process.env.PREVIEW_FEATURES_JSON) {
    const parsed = JSON.parse(process.env.PREVIEW_FEATURES_JSON);
    for (const key of Object.keys(FEATURES)) {
      if (Object.prototype.hasOwnProperty.call(parsed, key)) {
        FEATURES[key] = Boolean(parsed[key]);
      }
    }
  }
} catch {
  // ignore JSON errors, keep defaults
}

for (const key of Object.keys(FEATURES)) {
  const envOverride = process.env[key];
  if (envOverride === '0') FEATURES[key] = false;
  if (envOverride === '1') FEATURES[key] = true;
}

const LEVEL1_ALWAYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const LEVEL1_COND = [
  { name: 'SUPABASE_SERVICE_ROLE_KEY', feature: 'ENABLE_CRON' }, // et plus largement backend-only, mais ici groupé avec cron/webhooks
  { name: 'SUPABASE_SERVICE_ROLE_KEY', feature: 'ENABLE_WEBHOOKS' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', feature: 'ENABLE_PUSH' },
  { name: 'WEBHOOK_SECRET', feature: 'ENABLE_WEBHOOKS' },
  { name: 'CRON_SECRET', feature: 'ENABLE_CRON' },
];

const LEVEL2_VARS = [
  // Push notifications
  { name: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', feature: 'ENABLE_PUSH' },
  { name: 'VAPID_PRIVATE_KEY', feature: 'ENABLE_PUSH' },
  { name: 'VAPID_SUBJECT', feature: 'ENABLE_PUSH' },
  // Observabilité
  { name: 'NEXT_PUBLIC_SENTRY_DSN', feature: null },
  // n8n webhooks
  { name: 'N8N_UNCOVERED_WEBHOOK', feature: 'ENABLE_WEBHOOKS' },
  { name: 'N8N_SHABBAT_RECAP_WEBHOOK', feature: 'ENABLE_WEBHOOKS' },
];

const LEVEL3_VARS = [
  { name: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', feature: 'ENABLE_GOOGLE_MAPS' },
];

const missingLevel1 = [];
const missingLevel2 = [];
const missingLevel3 = [];

console.log('=== Préflight configuration Shifra & Pua (Phase 6) ===');
console.log('NODE_ENV =', process.env.NODE_ENV || '(non défini)');
console.log('FEATURES =', FEATURES);
console.log('');

// LEVEL 1 — GO-LIVE MINIMUM
console.log('Niveau 1 (obligatoire pour GO-LIVE) :');
for (const name of LEVEL1_ALWAYS) {
  const value = process.env[name];
  if (!value) {
    console.log(`- ${name}: MISSING`);
    missingLevel1.push(name);
  } else {
    console.log(`- ${name}: OK`);
  }
}

for (const entry of LEVEL1_COND) {
  if (!FEATURES[entry.feature]) continue;
  const value = process.env[entry.name];
  if (!value) {
    console.log(`- ${entry.name} (requis car ${entry.feature}=true): MISSING`);
    missingLevel1.push(entry.name);
  } else {
    console.log(`- ${entry.name}: OK`);
  }
}

// LEVEL 2 — recommandé / warnings
console.log('\nNiveau 2 (recommandé, warnings) :');
for (const entry of LEVEL2_VARS) {
  if (entry.feature && !FEATURES[entry.feature]) {
    console.log(`- ${entry.name}: ignoré (feature ${entry.feature}=false)`);
    continue;
  }
  const value = process.env[entry.name];
  if (!value) {
    console.log(`- ${entry.name}: WARN (absent)`);
    missingLevel2.push(entry.name);
  } else {
    console.log(`- ${entry.name}: OK`);
  }
}

// LEVEL 3 — optionnel / info
console.log('\nNiveau 3 (optionnel, info) :');
for (const entry of LEVEL3_VARS) {
  if (entry.feature && !FEATURES[entry.feature]) {
    console.log(`- ${entry.name}: ignoré (feature ${entry.feature}=false)`);
    continue;
  }
  const value = process.env[entry.name];
  if (!value) {
    console.log(`- ${entry.name}: INFO (absent)`);
    missingLevel3.push(entry.name);
  } else {
    console.log(`- ${entry.name}: OK`);
  }
}

console.log('\nRésumé préflight :');
console.log('- Manquantes niveau 1 (FAIL si non vide) :', missingLevel1.length ? missingLevel1 : 'aucune');
console.log('- Manquantes niveau 2 (WARN)           :', missingLevel2.length ? missingLevel2 : 'aucune');
console.log('- Manquantes niveau 3 (INFO)           :', missingLevel3.length ? missingLevel3 : 'aucune');

if (missingLevel1.length > 0) {
  console.error('\n❌ Préflight échoué — corriger les variables de niveau 1 avant déploiement.');
  process.exit(1);
}

console.log('\n✅ Préflight réussi — toutes les variables de niveau 1 sont présentes.');
process.exit(0);
