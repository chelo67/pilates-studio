/**
 * Multi-tenant helper.
 * Currently returns a static tenant_id = 1.
 * Ready to be replaced by dynamic resolution (subdomain, etc.) in the future.
 */

export const getCurrentTenantId = (): number => {
    return 1;
};

/**
 * Ensures tenant_id is included in create/update payloads.
 */
export const withTenant = <T extends object>(data: T): T & { tenant_id: number } => {
    return {
        ...data,
        tenant_id: getCurrentTenantId(),
    };
};
