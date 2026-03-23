// backend/src/routes/saas.routes.js
const express = require('express');
const router = express.Router();
const saasController = require('../controllers/saas.controller'); 

// RUTAS DE PLANES (existentes)
router.get('/planes', saasController.getPlanes);
router.post('/planes', saasController.createPlan);
router.put('/planes/:id', saasController.updatePlan);
router.delete('/planes/:id', saasController.deletePlan);

// RUTAS DE SUSCRIPCIONES (existentes)
router.get('/suscripciones', saasController.getSuscripciones);
router.post('/suscripciones/:id/recordatorio', saasController.enviarRecordatorioPago);
router.post('/suscripciones/asignar', saasController.asignarPlanSuscripcion);
router.put('/suscripciones/:id', saasController.updateSuscripcion);
router.delete('/suscripciones/:id', saasController.deleteSuscripcion);

module.exports = router;