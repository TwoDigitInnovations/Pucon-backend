// Moves cities from the old free-text `region` field to the Region collection.
//
// For each city without region_id, the region name comes from its legacy `region` text,
// or from REGION_BY_NAME when that text is empty. A Region is created (once) per
// language + name, then the city's region_id is set. Safe to run more than once.
const mongoose = require('mongoose');
require('dotenv').config();
require('../config/db'); // applies the DNS fallback needed for mongodb+srv lookups
const Region = require('../models/Region');

const REGION_BY_NAME = {
  'Los Ríos': ['Panguipulli', 'Liquiñe', 'Coñaripe'],
  'La Araucanía': [
    'Pucón', 'Caburgua', 'Angol', 'Carahue', 'Cholchol', 'Collipulli', 'Cunco',
    'Curacautín', 'Curarrehue', 'Ercilla', 'Freire', 'Galvarino', 'Gorbea',
    'Lautaro', 'Licán Ray', 'Loncoche', 'Lonquimay', 'Los Sauces', 'Lumaco',
    'Melipeuco', 'Nueva Imperial', 'Padre Las Casas', 'Puerto Saavedra', 'Purén',
    'Temuco', 'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Villarrica', 'Perquenco',
    'Pitrufquén', 'Renaico', 'Traiguén', 'Victoria',
  ],
};

async function migrate() {
  const apply = process.argv.includes('--apply');
  const unsetLegacy = process.argv.includes('--unset-legacy');
  await mongoose.connect(process.env.MONGO_URI);

  const regionForCity = {};
  for (const [region, names] of Object.entries(REGION_BY_NAME)) {
    names.forEach((n) => { regionForCity[n.trim().toLowerCase()] = region; });
  }

  // Raw collection access: the legacy `region` field is no longer in the Country schema
  const countries = mongoose.connection.db.collection('countries');
  const pending = await countries.find({ $or: [{ region_id: null }, { region_id: { $exists: false } }] }).toArray();

  const regionCache = {};
  let created = 0;
  let linked = 0;

  for (const city of pending) {
    const name = (city.region && String(city.region).trim())
      || regionForCity[String(city.country_name).trim().toLowerCase()];
    if (!name) {
      console.log(`?  no region for: ${city.country_name} (${city._id})`);
      continue;
    }
    if (!city.language_id) {
      console.log(`?  no language for: ${city.country_name} (${city._id})`);
      continue;
    }

    const key = `${city.language_id}|${name.toLowerCase()}`;
    if (!regionCache[key]) {
      let region = await Region.findOne({
        language_id: city.language_id,
        region_name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
      if (!region) {
        console.log(`${apply ? 'create' : 'would create'} region: ${name} (language ${city.language_id})`);
        created++;
        if (apply) region = await Region.create({ language_id: city.language_id, region_name: name });
      }
      regionCache[key] = region ? region._id : `new:${key}`;
    }

    console.log(`${apply ? 'link' : 'would link'}: ${city.country_name} -> ${name}`);
    if (apply) {
      await countries.updateOne({ _id: city._id }, { $set: { region_id: regionCache[key] } });
    }
    linked++;
  }

  if (apply && unsetLegacy) {
    const res = await countries.updateMany({ region: { $exists: true } }, { $unset: { region: '' } });
    console.log(`removed legacy region text from ${res.modifiedCount} city(ies)`);
  }

  console.log(`${created} region(s) ${apply ? 'created' : 'to create'}, ${linked} city(ies) ${apply ? 'linked' : 'to link'}${apply ? '' : ' (dry run, pass --apply)'}`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
