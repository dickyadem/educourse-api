// ============================================================
// Route - tabel `materials`
// ============================================================

const express = require('express');
const router = express.Router();
const materialController = require('../controller/materialController');

router.get('/', materialController.getAllMaterials);
router.post('/', materialController.addMaterial);
router.get('/:id', materialController.getMaterialById);
router.patch('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);

module.exports = router;
