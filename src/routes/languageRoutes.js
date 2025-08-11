const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const upload = require('../middlewares/upload');

router.get('/', languageController.getAllLanguages);

router.get('/getAllLanguagess', languageController.getAllLanguagess);

router.get('/:id', languageController.getLanguageById);

router.post('/', upload.single('image'), languageController.createLanguage);

router.put('/:id', upload.single('image'), languageController.updateLanguage);

router.delete('/:id', languageController.deleteLanguage);

module.exports = router;
