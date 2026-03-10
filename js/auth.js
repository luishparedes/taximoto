// js/auth.js
// Autenticación con Supabase para Taximoto

import { supabase } from '../supabase/config.js'

// ============================================
// REGISTRO DE USUARIOS
// ============================================
export async function registrarUsuario(datos) {
    try {
        console.log('Registrando usuario:', datos.email)
        
        // 1. Registrar en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: datos.email,
            password: datos.password
        })
        
        if (authError) throw new Error(authError.message)
        if (!authData.user) throw new Error('No se pudo crear el usuario')
        
        console.log('✅ Usuario creado en Auth:', authData.user.id)
        
        // 2. Guardar perfil en la tabla profiles
        const perfil = {
            id: authData.user.id,
            email: datos.email,
            full_name: datos.fullname,
            phone: datos.phone,
            role: datos.role || 'client',
            status: datos.role === 'driver' ? 'pending' : 'active',
            driver_type: datos.driverType || null,
            sector: datos.sector || 'centro',
            id_number: datos.cedula || null,
            vehicle_brand: datos.vehicleBrand || null,
            vehicle_model: datos.vehicleModel || null,
            vehicle_year: datos.vehicleYear || null,
            vehicle_color: datos.vehicleColor || null,
            license_plate: datos.licensePlate ? datos.licensePlate.toUpperCase() : null
        }
        
        const { error: perfilError } = await supabase
            .from('profiles')
            .insert([perfil])
        
        if (perfilError) {
            console.error('Error al guardar perfil:', perfilError)
            // Si falla el perfil, deberíamos limpiar el auth? Por ahora, lanzamos error.
            throw new Error('Error al guardar perfil: ' + perfilError.message)
        }
        
        console.log('✅ Perfil guardado en profiles')
        
        return { 
            success: true, 
            message: datos.role === 'driver' 
                ? 'Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.'
                : 'Registro exitoso. Bienvenido a Taximoto!'
        }
        
    } catch (error) {
        console.error('Error en registro:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// INICIO DE SESIÓN
// ============================================
export async function iniciarSesion(email, password) {
    try {
        console.log('Iniciando sesión:', email)
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (error) throw new Error(error.message)
        
        console.log('✅ Login exitoso, usuario:', data.user.id)
        
        // Obtener perfil completo
        const { data: perfil, error: perfilError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
        
        if (perfilError) {
            console.warn('No se pudo cargar el perfil:', perfilError)
            // Aún así, el usuario puede haber iniciado sesión, pero no tenemos su perfil.
            // Devolvemos la sesión básica.
             return { 
                success: true, 
                user: { ...data.user },
                role: 'client' // Default role
            }
        }
        
        // Verificar estado (para conductores pendientes)
        if (perfil && perfil.role === 'driver' && perfil.status === 'pending') {
            // Cerramos sesión porque está pendiente
            await supabase.auth.signOut()
            return { 
                success: false, 
                error: 'Tu cuenta de conductor está pendiente de aprobación por el administrador.'
            }
        }
        
        return { 
            success: true, 
            user: { ...data.user, ...perfil },
            role: perfil?.role || 'client'
        }
        
    } catch (error) {
        console.error('Error en login:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// CERRAR SESIÓN
// ============================================
export async function cerrarSesion() {
    console.log('Cerrando sesión...')
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Error al cerrar sesión:', error)
    }
    window.location.href = 'index.html'
}

// ============================================
// OBTENER SESIÓN ACTUAL
// ============================================
export async function getSesionActual() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        if (!session) return null
        
        // Obtener perfil completo
        const { data: perfil, error: perfilError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
        
        if (perfilError && perfilError.code !== 'PGRST116') { // PGRST116 es "no se encontró ninguna fila"
            console.error('Error al obtener perfil:', perfilError)
        }
        
        return {
            user: { ...session.user, ...(perfil || {}) },
            session: session
        }
        
    } catch (error) {
        console.error('Error:', error)
        return null
    }
}

// ============================================
// VERIFICAR SI ES ADMIN
// ============================================
export async function esAdmin() {
    const sesion = await getSesionActual()
    return sesion?.user?.role === 'admin'
}

// ============================================
// CERRAR SESIÓN (versión para HTML - global)
// ============================================
window.cerrarSesion = cerrarSesion