// Configuración de Supabase - CORREGIDA
const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';  // ¡CORREGIDO!
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z';

// Inicializar cliente de Supabase con opciones adicionales
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Verificar que supabase se cargó correctamente
console.log('✅ Supabase configurado correctamente');

// Configuración global
window.SUPABASE = supabase;