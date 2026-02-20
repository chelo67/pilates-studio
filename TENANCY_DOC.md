# Documentación Multi-tenancy

Se ha implementado una arquitectura multi-tenant utilizando el campo `tenant_id`. Actualmente el sistema opera con un tenant por defecto (`tenant_id = 1`), pero está preparado para escalar.

## Cambios en Base de Datos

### Tablas Afectadas
- `tenants`: Nueva tabla para gestionar organizaciones.
- `profiles`: Agregado `tenant_id` y RLS actualizado.
- `classes`: `tenant_id` (BIGINT) y RLS actualizado.
- `memberships`: `tenant_id` (BIGINT) y RLS actualizado.
- `reservations`: `tenant_id` (BIGINT) y RLS actualizado.
- `instructors`: `tenant_id` (BIGINT) y RLS actualizado.

### RLS (Row Level Security)
Se ha implementado aislamiento a nivel de base de datos.
Un usuario solo puede ver/modificar registros cuyo `tenant_id` coincida con el de su perfil.
Función helper en SQL: `get_auth_tenant_id()`.

## Cambios en Frontend

### Helper de Tenant
Ubicado en `src/lib/tenant.ts`.
- `getCurrentTenantId()`: Devuelve `1` (estático por ahora).
- `withTenant(data)`: Helper para inyectar el `tenant_id` en objetos de creación.

### Puntos de Filtrado Aplicados
Se ha agregado `.eq('tenant_id', getCurrentTenantId())` en los siguientes componentes:

1. **AdminMembers.tsx**
   - Fetch de miembros.
   - Cambio de estado (update).
2. **AddMemberModal.tsx**
   - Registro de nuevos usuarios (vía metadata de Auth).
3. **AdminClassList.tsx**
   - Listado de clases.
   - Eliminación de clases.
4. **AdminReservations.tsx**
   - Filtro de clases por fecha.
   - Listado de reservas por clase.
   - Cancelación de reservas.
5. **CreateClassModal.tsx**
   - Creación de nuevas clases (inyección automática).
6. **AdminOverview.tsx**
   - Conteos estadísticos (Miembros, Clases, Reservas).
   - Listado de reservas recientes.
7. **AdminCalendar.tsx**
   - Indicadores de puntos en el calendario.
   - Detalle de clases por día.
8. **ClassReservationsModal.tsx**
   - Detalle de inscritos.
   - Cancelación de reserva desde el modal.
9. **Schedule.tsx (Miembros)**
   - Indicadores del mes.
   - Clases disponibles por día.
   - Creación de reserva.
   - Cancelación de reserva.
10. **MyReservations.tsx (Miembros)**
    - Historial de reservas propias.
    - Cancelación.

## Instructor Entity (Refactored)

The `instructors` entity has been introduced to replace plain-text instructor names in classes.

### Changes:
1. **New Table**: `instructors`
   - `id`: UUID (PK)
   - `tenant_id`: BIGINT (FK)
   - `name`: TEXT
   - `email`: TEXT (Optional)
   - `phone`: TEXT (Optional)
   - `active`: BOOLEAN
2. **Class Link**: `classes.instructor_id` added as FK to `instructors.id`.
3. **Data Isolation**: Each tenant manages their own list of instructors.
4. **RLS**: Policies ensure instructors are only visible and manageable within their tenant.

### Frontend Integration:
- **Admin**: New "Instructores" tab in the dashboard for full CRUD.
- **Class Creation**: Modal updated to fetch instructors and allow inline creation.
- **Display**: All class views now join with the `instructors` table to display the name.

## Pruebas de Verificación (Basic Test Plan)

1. **Verificación de Inserción**: Crear un miembro o clase y verificar en la tabla de Supabase que el `tenant_id` sea `1`.
2. **Verificación de Aislamiento (SQL)**: 
   - Cambiar manualmente el `tenant_id` de un registro a `2`.
   - Verificar que desaparece del dashboard (Admin y Miembro).
3. **Verificación de Registro**: Registrar un nuevo miembro desde el Admin y comprobar que su perfil se crea con `tenant_id = 1`.

## Futuro (Resolución Dinámica)
Para activar múltiples tenants, simplemente se debe modificar `getCurrentTenantId()` en `src/lib/tenant.ts` para que resuelva el ID basado en:
- Subdominio (ej: `tenant1.myapp.com`).
- Dominio personalizado.
- Atributo del usuario logueado.
