import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getCurrentTenantId } from '../lib/tenant';

interface BrandingSettings {
    business_name: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
}

interface BrandingContextType {
    settings: BrandingSettings;
    loading: boolean;
    refreshBranding: () => Promise<void>;
}

const defaultSettings: BrandingSettings = {
    business_name: 'Pilates Studio',
    logo_url: null,
    primary_color: '#7c3aed',
    secondary_color: '#a855f7',
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<BrandingSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            null;
    };

    const fetchBranding = async () => {
        // We always try to fetch branding based on the tenant, even if no user is logged in
        // In a single-tenant setup, this will always fetch for tenant 1.
        // In multi-tenant, it would use subdomain/query param.

        try {
            const tenantId = getCurrentTenantId();
            const { data, error } = await supabase
                .from('tenant_settings')
                .select('*')
                .eq('tenant_id', tenantId)
                .single();

            if (data && !error) {
                setSettings({
                    business_name: data.business_name,
                    logo_url: data.logo_url,
                    primary_color: data.primary_color,
                    secondary_color: data.secondary_color,
                });

                // Set CSS variables
                const root = document.documentElement;
                root.style.setProperty('--brand-primary', data.primary_color);
                root.style.setProperty('--brand-secondary', data.secondary_color);

                const primaryRgb = hexToRgb(data.primary_color);
                if (primaryRgb) root.style.setProperty('--brand-primary-rgb', primaryRgb);

                const secondaryRgb = hexToRgb(data.secondary_color);
                if (secondaryRgb) root.style.setProperty('--brand-secondary-rgb', secondaryRgb);

                // Update Page Title
                document.title = data.business_name;
            }
        } catch (err) {
            console.error('Error fetching branding:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranding();
    }, [user]);

    return (
        <BrandingContext.Provider value={{ settings, loading, refreshBranding: fetchBranding }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (!context) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
