const { pool } = require('../config/db'); // 🔥 CORREGIDO: Importamos pool

// ==========================================
// CONTROLADORES DE PLANES
// ==========================================
const getPlanes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM planes WHERE estado = true');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los planes.' });
    }
};

const createPlan = async (req, res) => {
    const { nombre, precio, limite_sucursales, caracteristicas } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO planes (nombre, precio, limite_sucursales, caracteristicas) VALUES ($1, $2, $3, $4) RETURNING id',
            [nombre, precio, limite_sucursales, caracteristicas]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Plan creado exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el plan.' });
    }
};

const updatePlan = async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, limite_sucursales, caracteristicas } = req.body;
    try {
        await pool.query(
            'UPDATE planes SET nombre = $1, precio = $2, limite_sucursales = $3, caracteristicas = $4 WHERE id = $5',
            [nombre, precio, limite_sucursales, caracteristicas, id]
        );
        res.json({ message: 'Plan actualizado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el plan.' });
    }
};

const deletePlan = async (req, res) => {
    const { id } = req.params;
    try {
        // Borrado lógico: Solo ocultamos el plan
        await pool.query('UPDATE planes SET estado = false WHERE id = $1', [id]);
        res.json({ message: 'Plan eliminado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el plan.' });
    }
};

// ==========================================
// CONTROLADORES DE SUSCRIPCIONES
// ==========================================
const getSuscripciones = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id, 
                s.monto, 
                s.estado, 
                s.proximo_pago,
                e.nombre AS empresa, 
                e.ruc,
                p.nombre AS plan_nombre
            FROM suscripciones s
            JOIN empresas e ON s.empresa_id = e.id
            JOIN planes p ON s.plan_id = p.id
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las suscripciones.' });
    }
};

const enviarRecordatorioPago = async (req, res) => {
    const { id } = req.params; 
    try {
        // Asumiendo que tu tabla empresas tiene un campo admin_email o email
        // Si tu columna se llama distinto (ej. correo), cámbiala abajo
        const query = `
            SELECT e.admin_email, e.nombre, s.monto, s.proximo_pago 
            FROM suscripciones s
            JOIN empresas e ON s.empresa_id = e.id
            WHERE s.id = $1
        `;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Suscripción no encontrada.' });
        }

        const data = result.rows[0];

        // Aquí conectarás tu servicio de correos en el futuro
        console.log(`📧 Simulación: Correo enviado a ${data.admin_email}`);
        
        res.json({ message: 'Recordatorio enviado con éxito al cliente.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al enviar el recordatorio.' });
    }
};

// ✨ NUEVA FUNCIÓN: Enlazar una suscripción a un negocio existente ✨
const asignarPlanSuscripcion = async (req, res) => {
    // monto debe ser parseFloat() en el frontend o aquí
    const { empresa_id, plan_id, monto, proximo_pago } = req.body;
    
    // Validación básica de campos
    if (!empresa_id || !plan_id || !monto || !proximo_pago) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        // 1. Verificar que la empresa exista y no tenga ya una suscripción activa
        const checkEmpresa = await pool.query('SELECT id FROM empresas WHERE id = $1', [empresa_id]);
        if (checkEmpresa.rows.length === 0) {
            return res.status(404).json({ error: 'La empresa inquilina no existe.' });
        }

        const checkSubExistente = await pool.query("SELECT id FROM suscripciones WHERE empresa_id = $1 AND estado = 'Al Día'", [empresa_id]);
        if (checkSubExistente.rows.length > 0) {
            return res.status(400).json({ error: 'Esta empresa ya tiene una suscripción activa.' });
        }

        // 2. Crear el registro en la tabla 'suscripciones'
        const insertQuery = `
            INSERT INTO suscripciones (empresa_id, plan_id, monto, estado, proximo_pago)
            VALUES ($1, $2, $3, 'Al Día', $4) RETURNING id
        `;
        const result = await pool.query(insertQuery, [empresa_id, plan_id, monto, proximo_pago]);
        
        res.status(201).json({ id: result.rows[0].id, message: 'Plan de pago asignado correctamente.' });

    } catch (error) {
        console.error("Error al asignar plan:", error);
        res.status(500).json({ error: 'Error interno del servidor al asignar el plan.' });
    }
};

// ✨ NUEVO: Actualizar estado, fecha o monto de una suscripción
const updateSuscripcion = async (req, res) => {
    const { id } = req.params;
    const { estado, proximo_pago, monto } = req.body;
    try {
        await pool.query(
            'UPDATE suscripciones SET estado = $1, proximo_pago = $2, monto = $3 WHERE id = $4',
            [estado, proximo_pago, monto, id]
        );
        res.json({ message: 'Suscripción actualizada correctamente.' });
    } catch (error) {
        console.error("Error al actualizar suscripción:", error);
        res.status(500).json({ error: 'Error al actualizar la suscripción.' });
    }
};

// ✨ NUEVO: Eliminar una suscripción
const deleteSuscripcion = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM suscripciones WHERE id = $1', [id]);
        res.json({ message: 'Suscripción eliminada correctamente.' });
    } catch (error) {
        console.error("Error al eliminar suscripción:", error);
        res.status(500).json({ error: 'Error al eliminar la suscripción.' });
    }
};

module.exports = {
    getPlanes,
    createPlan,
    updatePlan,
    deletePlan,
    getSuscripciones,
    enviarRecordatorioPago,
    asignarPlanSuscripcion,
    updateSuscripcion, 
    deleteSuscripcion
};