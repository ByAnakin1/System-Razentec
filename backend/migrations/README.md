# Migraciones y Seed de Base de Datos

## 1. Ejecutar migración de Seguridad, Roles y Auditoría

Conectar a PostgreSQL/Supabase y ejecutar el contenido de `001_seguridad_roles_auditoria.sql`:

```bash
psql $DATABASE_URL -f migrations/001_seguridad_roles_auditoria.sql
```

O desde **Supabase SQL Editor**, copiar y ejecutar el contenido del archivo.

## 2. Crear usuarios de prueba (después de la migración)

```bash
npm run seed:usuarios
```

Crea/actualiza:
- **admin@razentec.com** – Administrador con todas las categorías
- **supervisor_ver@razentec.com** – Inventario + Ventas, sin Modificador
- **supervisor_mod@razentec.com** – Inventario + Ventas + Modificador
- **vendedor@razentec.com** – Solo Ventas

Todos con contraseña: `123456`
