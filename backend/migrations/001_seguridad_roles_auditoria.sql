-- =====================================================
-- Migración: Seguridad, Roles y Auditoría (Dev 1)
-- Sistema Razentec ERP - GM Ingenieros S.A.C.
-- =====================================================

-- 1. Agregar columnas de RBAC a usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'Empleado' CHECK (rol IN ('Administrador', 'Supervisor', 'Empleado')),
ADD COLUMN IF NOT EXISTS categorias JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN usuarios.rol IS 'Rol: Administrador, Supervisor o Empleado';
COMMENT ON COLUMN usuarios.categorias IS 'Tarjetas de Acceso: Inventario, Ventas, Compras, Clientes, Proveedores, Usuarios, Modificador';

-- 2. Crear tabla de logs de actividad (Auditoría)
CREATE TABLE IF NOT EXISTS logs_actividad (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  accion VARCHAR(10) NOT NULL,  -- GET, POST, PUT, DELETE
  modulo VARCHAR(100),          -- Ruta o módulo visitado (ej: /productos, /usuarios)
  tabla_afectada VARCHAR(80),   -- Tabla de BD afectada (productos, categorias, etc.)
  registro_id INTEGER,          -- ID del registro afectado (opcional)
  detalles JSONB DEFAULT '{}',  -- Datos adicionales (antes/después, IP, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_empresa ON logs_actividad(empresa_id);
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_actividad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs_actividad(created_at DESC);

-- 3. Actualizar usuario admin de prueba a Administrador con todos los permisos
UPDATE usuarios 
SET rol = 'Administrador', 
    categorias = '["Inventario", "Ventas", "Compras", "Clientes", "Proveedores", "Usuarios", "Modificador"]'::jsonb
WHERE email = 'admin@razentec.com';
