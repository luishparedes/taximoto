// =============================================
// CONFIGURACIÓN DE SUPABASE - VERSIÓN ESTABLE
// =============================================

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z';

// Inicialización INMEDIATA y FORZADA
(function() {
    // 1. Crear cliente inmediatamente
    if (typeof supabaseJs !== 'undefined') {
        window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        console.log('✅ Supabase listo');
        window.dispatchEvent(new Event('supabase-ready'));
        return;
    }
    
    // 2. Si el SDK no cargó, esperar
    window.addEventListener('load', function() {
        if (typeof supabaseJs !== 'undefined' && !window.supabase) {
            window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase listo (load)');
            window.dispatchEvent(new Event('supabase-ready'));
        }
    });
})();

// 3. EXPORTACIÓN GLOBAL (MUY IMPORTANTE)
window.getSupabase = function() {
    return window.supabase;
};