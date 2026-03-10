// js/requests.js
// Módulo para gestionar solicitudes de viaje con Supabase
import { supabase } from '../supabase/config.js'
import { getSesionActual } from './auth.js'

class TaximotoRequests {
    
    // Crear una nueva solicitud de viaje
    async createRequest(requestData) {
        try {
            const sesion = await getSesionActual()
            if (!sesion) {
                return { success: false, error: 'Debes iniciar sesión para solicitar un viaje' }
            }

            // Validar datos
            if (!requestData.vehicle_type || !requestData.origin_address || !requestData.destination_address) {
                return { success: false, error: 'Faltan datos obligatorios' }
            }
            
            // Crear objeto de solicitud para Supabase
            const newRequest = {
                client_id: sesion.user.id,
                vehicle_type: requestData.vehicle_type,
                origin_address: requestData.origin_address,
                destination_address: requestData.destination_address,
                notes: requestData.notes || '',
                status: 'searching'
            }
            
            const { data, error } = await supabase
                .from('requests')
                .insert([newRequest])
                .select()
                .single()
            
            if (error) throw error
            
            return { success: true, request: data }
            
        } catch (error) {
            console.error('Error al crear solicitud:', error)
            return { success: false, error: error.message }
        }
    }
    
    // Asignar conductor a una solicitud
    async assignDriver(requestId, driverId) {
        try {
            const { data, error } = await supabase
                .from('requests')
                .update({ 
                    driver_id: driverId, 
                    status: 'assigned',
                    updated_at: new Date()
                })
                .eq('id', requestId)
                .select(`
                    *,
                    driver:profiles!requests_driver_id_fkey (
                        full_name, phone, vehicle_brand, vehicle_model, 
                        vehicle_color, license_plate, driver_type
                    )
                `)
                .single()
            
            if (error) throw error
            
            return { success: true, request: data }
            
        } catch (error) {
            console.error('Error al asignar conductor:', error)
            return { success: false, error: error.message }
        }
    }
    
    // Completar viaje
    async completeRequest(requestId) {
        try {
            const { error } = await supabase
                .from('requests')
                .update({ status: 'completed', updated_at: new Date() })
                .eq('id', requestId)
            
            if (error) throw error
            
            return { success: true }
            
        } catch (error) {
            console.error('Error al completar viaje:', error)
            return { success: false, error: error.message }
        }
    }
    
    // Cancelar solicitud
    async cancelRequest(requestId) {
        try {
            const { error } = await supabase
                .from('requests')
                .update({ status: 'cancelled', updated_at: new Date() })
                .eq('id', requestId)
            
            if (error) throw error
            
            return { success: true }
            
        } catch (error) {
            console.error('Error al cancelar viaje:', error)
            return { success: false, error: error.message }
        }
    }
    
    // Obtener solicitudes activas del usuario actual (cliente)
    async getMyActiveRequests() {
        const sesion = await getSesionActual()
        if (!sesion) return []
        
        const { data, error } = await supabase
            .from('requests')
            .select(`
                *,
                driver:profiles!requests_driver_id_fkey (
                    full_name, phone, vehicle_brand, vehicle_model, 
                    vehicle_color, license_plate
                )
            `)
            .eq('client_id', sesion.user.id)
            .in('status', ['searching', 'assigned'])
            .order('created_at', { ascending: false })
        
        if (error) {
            console.error('Error al obtener solicitudes activas:', error)
            return []
        }
        return data || []
    }
    
    // Obtener solicitudes asignadas a un conductor
    async getDriverActiveRequests(driverId) {
        const { data, error } = await supabase
            .from('requests')
            .select(`
                *,
                client:profiles!requests_client_id_fkey (
                    full_name, phone
                )
            `)
            .eq('driver_id', driverId)
            .in('status', ['assigned'])
            .order('created_at', { ascending: false })
        
        if (error) {
            console.error('Error al obtener solicitudes del conductor:', error)
            return []
        }
        return data || []
    }
    
    // Buscar conductores disponibles (en tiempo real)
    async findAvailableDrivers(vehicleType) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'driver')
            .eq('status', 'active')
            .eq('driver_type', vehicleType)
        
        if (error) {
            console.error('Error al buscar conductores:', error)
            return []
        }
        return data || []
    }
    
    // Suscribirse a cambios en una solicitud (para tiempo real)
    subscribeToRequest(requestId, callback) {
        return supabase
            .channel(`request-${requestId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'requests', filter: `id=eq.${requestId}` },
                (payload) => callback(payload.new)
            )
            .subscribe()
    }
}

// Crear instancia global
const requests = new TaximotoRequests()
window.requests = requests
export default requests