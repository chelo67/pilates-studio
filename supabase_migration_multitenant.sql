-- Migration: Add multi-tenancy support

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default tenant
INSERT INTO tenants (id, name, slug) 
VALUES (1, 'Default Pilates Studio', 'default')
ON CONFLICT (id) DO NOTHING;

-- 3. Add tenant_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id);
UPDATE profiles SET tenant_id = 1 WHERE tenant_id IS NULL;
-- ALTER TABLE profiles ALTER COLUMN tenant_id SET NOT NULL; -- Releasing this after ensuring all are set

-- 4. Add tenant_id to classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id);
UPDATE classes SET tenant_id = 1 WHERE tenant_id IS NULL;
-- ALTER TABLE classes ALTER COLUMN tenant_id SET NOT NULL;

-- 5. Add tenant_id to memberships
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id);
UPDATE memberships SET tenant_id = 1 WHERE tenant_id IS NULL;
-- ALTER TABLE memberships ALTER COLUMN tenant_id SET NOT NULL;

-- 6. Add tenant_id to reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id);
UPDATE reservations SET tenant_id = 1 WHERE tenant_id IS NULL;
-- ALTER TABLE reservations ALTER COLUMN tenant_id SET NOT NULL;

-- 7. Update RLS policies to be tenant-aware
-- We need to drop existing policies and recreate them with tenant checks.

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by same-tenant users" ON profiles
    FOR SELECT USING (
        tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles in same tenant" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles AS admin_p 
            WHERE admin_p.id = auth.uid() 
            AND admin_p.role = 'admin' 
            AND admin_p.tenant_id = profiles.tenant_id
        )
    );

-- Classes
DROP POLICY IF EXISTS "Classes are viewable by everyone" ON classes;
CREATE POLICY "Classes are viewable by same-tenant users" ON classes
    FOR SELECT USING (
        tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can insert classes" ON classes;
CREATE POLICY "Admins can insert classes in same tenant" ON classes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.tenant_id = tenant_id
        )
    );

-- Reservations
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
CREATE POLICY "Admins can view all reservations in same tenant" ON reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.tenant_id = reservations.tenant_id
        )
    );

-- (Other policies would follow similar patterns)
