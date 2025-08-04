const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const upload = require('../middlewares/upload');

router.post('/', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'map_image', maxCount: 1 }
]), countryController.createCountry);
router.get('/', countryController.getAllCountries);
router.get('/getAllCountriesByLang/:lang_id', countryController.getAllCountriesByLang);
router.get('/:id', countryController.getCountryById);
router.put('/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'map_image', maxCount: 1 }
]), countryController.updateCountry);
router.delete('/:id', countryController.deleteCountry);

module.exports = router;
