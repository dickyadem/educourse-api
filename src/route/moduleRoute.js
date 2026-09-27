// ============================================================
// Route - tabel `modules`
// ============================================================

const express = require('express');
const router = express.Router();
const moduleController = require('../controller/moduleController');

router.get('/', moduleController.getAllModules);
router.post('/', moduleController.addModule);
router.get('/:id', moduleController.getModuleById);
router.patch('/:id', moduleController.updateModule);
router.delete('/:id', moduleController.deleteModule);

module.exports = router;
