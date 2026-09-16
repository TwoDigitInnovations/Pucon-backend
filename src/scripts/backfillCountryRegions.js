const mongoose = require('mongoose');
require('dotenv').config();
require('../config/db');
const Country = require('../models/Country');

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

async function backfill() {
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  await mongoose.connect(process.env.MONGO_URI);

  const regionFor = {};
  for (const [region, names] of Object.entries(REGION_BY_NAME)) {
    names.forEach((n) => { regionFor[n.trim().toLowerCase()] = region; });
  }

  const countries = await Country.find({});
  let changed = 0;
  for (const c of countries) {
    const region = regionFor[String(c.country_name).trim().toLowerCase()];
    if (!region) {
      console.log(`?  no mapping: ${c.country_name} (${c._id})`);
      continue;
    }
    if (c.region === region || (c.region && !force)) continue;
    console.log(`${apply ? 'set' : 'would set'}: ${c.country_name} -> ${region}`);
    if (apply) await Country.updateOne({ _id: c._id }, { $set: { region } });
    changed++;
  }

  console.log(`${changed} comuna(s) ${apply ? 'updated' : 'to update (dry run, pass --apply)'}`);
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
