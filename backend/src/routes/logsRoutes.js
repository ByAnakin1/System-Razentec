const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');
const verifyToken = require('../middlewares/authMiddleware');
const { audit } = require('../middlewares/auditMiddleware');

router.use(verifyToken);

router.get('/', audit('GET', '/logs', 'logs_actividad'), logsController.listar);

module.exports = router;
