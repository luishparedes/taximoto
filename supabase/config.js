// =============================================
// CONFIGURACIÓN DE SUPABASE - VERSIÓN DEFINITIVA
// =============================================

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z';

// Inicialización INMEDIATA y FORZADA (para evitar errores de carga)
(function() {
    // Verificar que la librería de Supabase esté cargada
    if (typeof supabaseJs !== 'undefined' && supabaseJs.createClient) {
        window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        console.log('✅ Supabase listo');
        window.dispatchEvent(new Event('supabase-ready'));
    } else {
        console.error('❌ La librería de Supabase no se cargó. Revisa el script en tu HTML.');
    }
})();

// Helper global para obtener Supabase de forma segura
window.getSupabase = function() {
    if (!window.supabase) {
        console.error('❌ Supabase no está inicializado');
        alert('Error de conexión. Por favor, recarga la página.');
        return null;
    }
    return window.supabase;
};