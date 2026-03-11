ALTER TABLE categorias 
ADD COLUMN IF NOT EXISTS estado BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE productos ADD COLUMN descripcion TEXT;
ALTER TABLE productos ADD COLUMN imagen VARCHAR(255);

-- Cambiar el límite de la columna imagen para que acepte URLs largas
ALTER TABLE productos ALTER COLUMN imagen TYPE TEXT;

-- (Opcional) Si el problema fuera la descripción, también la aseguramos:
ALTER TABLE productos ALTER COLUMN descripcion TYPE TEXT;

ALTER TABLE logs_actividad ADD COLUMN tabla_afectada VARCHAR(100);

SELECT * FROM inventario;

-- 1. Agregar campos útiles a la tabla PROVEEDORES
ALTER TABLE public.proveedores ADD COLUMN email VARCHAR(100);
ALTER TABLE public.proveedores ADD COLUMN direccion TEXT;
ALTER TABLE public.proveedores ADD COLUMN estado BOOLEAN DEFAULT true;

-- 2. Agregar campos útiles a la tabla COMPRAS (Para guardar el número de factura y posibles anulaciones)
ALTER TABLE public.compras ADD COLUMN comprobante VARCHAR(50);
ALTER TABLE public.compras ADD COLUMN estado VARCHAR(20) DEFAULT 'COMPLETADO';

ALTER TABLE logs_actividad ADD COLUMN registro_id INTEGER NULL;