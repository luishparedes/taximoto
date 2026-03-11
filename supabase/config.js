// =============================================
// SUPABASE CONFIG - VERSIÓN CORREGIDA 2024
// =============================================

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z';

// Crear cliente
window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fix para versiones nuevas de Supabase
window.getSupabase = function() {
    return window.supabase;
};

console.log('✅ Supabase config cargado');