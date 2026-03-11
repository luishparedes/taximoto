// =============================================
// SUPABASE CONFIG - VERSIÓN QUE SÍ FUNCIONA
// =============================================

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z';

// ESPERAR a que la librería cargue
document.addEventListener('DOMContentLoaded', function() {
    if (typeof supabaseJs !== 'undefined') {
        window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase listo');
        
        // Probar que funciona
        if (window.supabase && window.supabase.auth) {
            console.log('✅ Auth disponible');
        } else {
            console.log('❌ Auth no disponible');
        }
    } else {
        console.error('❌ supabaseJs no está definido');
    }
});

// Helper para obtener Supabase
window.getSupabase = function() {
    return window.supabase;
};