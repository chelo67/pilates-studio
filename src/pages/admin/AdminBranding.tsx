import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { getCurrentTenantId } from '../../lib/tenant';
import { useBranding } from '../../contexts/BrandingContext';
import { Save, Upload, Building2 } from 'lucide-react';

const AdminBranding = () => {
    const { toast } = useToast();
    const { settings, refreshBranding } = useBranding();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        business_name: settings.business_name,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        logo_url: settings.logo_url,
    });

    useEffect(() => {
        setFormData({
            business_name: settings.business_name,
            primary_color: settings.primary_color,
            secondary_color: settings.secondary_color,
            logo_url: settings.logo_url,
        });
    }, [settings]);

    // Comprime la imagen usando Canvas y la devuelve como base64
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Máximo 400px de ancho manteniendo proporción
                    const MAX_WIDTH = 400;
                    const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;

                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Comprimir a JPEG con calidad 0.85 (o PNG si es transparente)
                    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                    const quality = file.type === 'image/png' ? undefined : 0.85;
                    const base64 = canvas.toDataURL(mimeType, quality);
                    resolve(base64);
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamaño (5MB máximo antes de comprimir)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('El archivo es demasiado grande. Máximo 5MB.');
            return;
        }

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten archivos de imagen (PNG, JPG, etc.).');
            return;
        }

        setLoading(true);
        try {
            const compressed = await compressImage(file);
            setFormData(prev => ({ ...prev, logo_url: compressed }));
            toast.success('Logo cargado y optimizado ✓ — Guardá los cambios para confirmar.');
        } catch {
            toast.error('Error al procesar la imagen. Probá con otro archivo.');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tenantId = getCurrentTenantId();
            const { error } = await supabase
                .from('tenant_settings')
                .upsert({
                    tenant_id: tenantId,
                    business_name: formData.business_name,
                    primary_color: formData.primary_color,
                    secondary_color: formData.secondary_color,
                    logo_url: formData.logo_url,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            toast.success('Branding actualizado exitosamente');
            await refreshBranding();
        } catch (error: any) {
            toast.error('Error al actualizar branding: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="branding-container">
            <div className="dash-section-header">
                <h2 className="dash-section-title">Personalización de Marca</h2>
            </div>

            <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <form onSubmit={handleSave} className="dash-card" style={{ padding: '2rem' }}>
                    <div className="dash-form-group">
                        <label className="dash-form-label">Nombre del Centro</label>
                        <div style={{ position: 'relative' }}>
                            <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="text"
                                className="dash-form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.business_name}
                                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="dash-form-row">
                        <div className="dash-form-group">
                            <label className="dash-form-label">Color Primario</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="color"
                                    className="dash-form-input"
                                    style={{ width: '50px', padding: '2px', height: '40px' }}
                                    value={formData.primary_color}
                                    onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                                />
                                <input
                                    type="text"
                                    className="dash-form-input"
                                    value={formData.primary_color}
                                    onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                        <div className="dash-form-group">
                            <label className="dash-form-label">Color Secundario</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="color"
                                    className="dash-form-input"
                                    style={{ width: '50px', padding: '2px', height: '40px' }}
                                    value={formData.secondary_color}
                                    onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                                />
                                <input
                                    type="text"
                                    className="dash-form-input"
                                    value={formData.secondary_color}
                                    onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="dash-form-group" style={{ marginTop: '1rem' }}>
                        <label className="dash-form-label">Logo del Centro</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {formData.logo_url ? (
                                <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <img src={formData.logo_url} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            ) : (
                                <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={24} style={{ opacity: 0.2 }} />
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <input
                                    type="file"
                                    id="logo-upload"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className="dash-btn-ghost"
                                    style={{ width: 'auto', padding: '0.5rem 1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Upload size={16} />
                                    {formData.logo_url ? 'Cambiar Logo' : 'Subir Logo'}
                                </label>
                                <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>PNG, JPG recomendados. Máx 2MB.</p>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="dash-btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </form>

                <div className="preview-section">
                    <label className="dash-form-label">Vista Previa</label>
                    <div className="dash-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>

                        {/* Fake Navbar Preview */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {formData.logo_url ? (
                                    <img src={formData.logo_url} alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ width: '30px', height: '30px', background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})`, borderRadius: '6px' }}></div>
                                )}
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>{formData.business_name}</span>
                            </div>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                        </div>

                        {/* Button Previews */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{
                                padding: '0.6rem 1.2rem',
                                background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})`,
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: '#fff',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                boxShadow: `0 4px 15px ${formData.primary_color}44`
                            }}>
                                Botón Primario
                            </button>
                            <button style={{
                                padding: '0.6rem 1.2rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${formData.primary_color}44`,
                                borderRadius: '0.5rem',
                                color: formData.primary_color,
                                fontWeight: '600',
                                fontSize: '0.8rem'
                            }}>
                                Botón Outline
                            </button>
                        </div>

                        {/* Card Preview */}
                        <div style={{ borderLeft: `4px solid ${formData.primary_color}`, background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0 0.5rem 0.5rem 0' }}>
                            <p style={{ fontSize: '0.85rem', color: '#fff', margin: '0 0 4px 0' }}>Notificación de Ejemplo</p>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Este es el aspecto que tendrán tus elementos con el color seleccionado.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBranding;
