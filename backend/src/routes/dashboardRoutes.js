const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const verifyToken = require('../middlewares/authMiddleware');

// Protegemos la ruta para que solo usuarios logueados la vean
router.use(verifyToken);

router.get('/', dashboardController.getResumen);

module.exports = router;