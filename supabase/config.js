// =============================================
// SUPABASE CONFIG - VERSIÓN CORREGIDA
// =============================================

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z';

// Crear cliente inmediatamente
window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase listo', window.supabase ? 'OK' : 'ERROR');