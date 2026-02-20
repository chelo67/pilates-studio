-- Migration: In-App Notification System

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id BIGINT REFERENCES public.tenants(id),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    link TEXT
);

-- 2. Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Notification Triggers Logic

-- Function for Class Status Changes (Cancelled/Closed)
CREATE OR REPLACE FUNCTION public.on_class_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If class is cancelled
    IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
        INSERT INTO public.notifications (tenant_id, user_id, type, title, message)
        SELECT 
            r.tenant_id, 
            r.user_id, 
            'CLASS_CANCELLED', 
            'Clase Cancelada: ' || NEW.title,
            'La clase del ' || to_char(NEW.class_date, 'DD/MM') || ' a las ' || to_char(NEW.start_time, 'HH24:MI') || ' ha sido cancelada.'
        FROM public.reservations r
        WHERE r.class_id = NEW.id AND r.status = 'active';
    
    -- If class is closed
    ELSIF (NEW.status = 'closed' AND OLD.status != 'closed') THEN
        INSERT INTO public.notifications (tenant_id, user_id, type, title, message)
        SELECT 
            r.tenant_id, 
            r.user_id, 
            'CLASS_CLOSED', 
            'Clase Cerrada: ' || NEW.title,
            'La clase del ' || to_char(NEW.class_date, 'DD/MM') || ' ya no acepta más reservas.'
        FROM public.reservations r
        WHERE r.class_id = NEW.id AND r.status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Reservation Changes (Cancellations)
CREATE OR REPLACE FUNCTION public.on_reservation_cancelled()
RETURNS TRIGGER AS $$
DECLARE
    v_class_title TEXT;
    v_user_name TEXT;
BEGIN
    IF (NEW.status = 'cancelled' AND OLD.status = 'active') THEN
        -- Get class title
        SELECT title INTO v_class_title FROM public.classes WHERE id = NEW.class_id;
        
        -- Get member name
        SELECT COALESCE(full_name, 'Un miembro') INTO v_user_name FROM public.profiles WHERE id = NEW.user_id;

        IF (auth.uid() = NEW.user_id) THEN
            -- Member cancels -> Notify Admins
            INSERT INTO public.notifications (tenant_id, user_id, type, title, message)
            SELECT 
                NEW.tenant_id, 
                p.id, 
                'RESERVATION_CANCELLED_BY_MEMBER', 
                'Reserva Cancelada: ' || v_user_name,
                v_user_name || ' canceló su lugar en la clase "' || v_class_title || '".'
            FROM public.profiles p
            WHERE p.tenant_id = NEW.tenant_id AND p.role = 'admin';
        ELSE
            -- Admin cancels -> Notify Member
            INSERT INTO public.notifications (tenant_id, user_id, type, title, message)
            VALUES (
                NEW.tenant_id,
                NEW.user_id,
                'RESERVATION_CANCELLED',
                'Reserva Cancelada',
                'Tu reserva para la clase "' || v_class_title || '" ha sido cancelada por el estudio.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for New Reservations
CREATE OR REPLACE FUNCTION public.on_reservation_created_or_updated()
RETURNS TRIGGER AS $$
DECLARE
    v_class_title TEXT;
    v_user_name TEXT;
BEGIN
    -- NEW RESERVATION (INSERT)
    IF (TG_OP = 'INSERT' AND NEW.status = 'active') THEN
        SELECT title INTO v_class_title FROM public.classes WHERE id = NEW.class_id;
        SELECT COALESCE(full_name, 'Un miembro') INTO v_user_name FROM public.profiles WHERE id = NEW.user_id;

        INSERT INTO public.notifications (tenant_id, user_id, type, title, message)
        SELECT 
            NEW.tenant_id, 
            p.id, 
            'NEW_RESERVATION', 
            'Nueva Reserva: ' || v_user_name,
            v_user_name || ' se inscribió en la clase "' || v_class_title || '".'
        FROM public.profiles p
        WHERE p.tenant_id = NEW.tenant_id AND p.role = 'admin';

    -- REACTIVATION (UPDATE cancelled -> active)
    ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status = 'cancelled') THEN
        SELECT title INTO v_class_title FROM public.classes WHERE id = NEW.class_id;
        SELECT COALESCE(full_name, 'Un miembro') INTO v_user_name FROM public.profiles WHERE id = NEW.user_id;

        INSERT INTO public.notifications (tenant_id, user_id, type, title, message)
        SELECT 
            NEW.tenant_id, 
            p.id, 
            'RESERVATION_REACTIVATED', 
            'Reserva Reactivada: ' || v_user_name,
            v_user_name || ' volvió a inscribirse en la clase "' || v_class_title || '".'
        FROM public.profiles p
        WHERE p.tenant_id = NEW.tenant_id AND p.role = 'admin';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Triggers

DROP TRIGGER IF EXISTS trigger_class_status_notification ON public.classes;
CREATE TRIGGER trigger_class_status_notification
    AFTER UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION on_class_status_change();

DROP TRIGGER IF EXISTS trigger_reservation_cancelled_notification ON public.reservations;
CREATE TRIGGER trigger_reservation_cancelled_notification
    AFTER UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION on_reservation_cancelled();

DROP TRIGGER IF EXISTS trigger_reservation_created_notification ON public.reservations;
CREATE TRIGGER trigger_reservation_created_notification
    AFTER INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION on_reservation_created_or_updated();
