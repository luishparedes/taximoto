// =============================================
// CONFIGURACIÓN DE SUPABASE - VERSIÓN CORREGIDA
// =============================================

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z';

// Verificar que la librería existe
if (typeof supabaseJs === 'undefined' || !supabaseJs.createClient) {
    console.error('❌ La librería de Supabase no está cargada. Verifica que el script esté en tu HTML');
    document.addEventListener('DOMContentLoaded', function() {
        alert('Error: La librería de Supabase no cargó. Recarga la página o contacta al administrador.');
    });
} else {
    // Inicializar Supabase
    window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
    console.log('✅ Supabase inicializado correctamente');
    window.dispatchEvent(new Event('supabase-ready'));
}

// Helper para obtener Supabase
window.getSupabase = function() {
    if (!window.supabase) {
        console.error('❌ Supabase no está disponible');
        return null;
    }
    return window.supabase;
};