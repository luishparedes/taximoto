// =============================================
// CONFIGURACIÓN DE SUPABASE - CORREGIDA
// =============================================

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z'; // ESTA DEBE SER LA ANON KEY REAL

// Inicialización segura
(function() {
    // Esperar a que el SDK esté disponible
    function initSupabase() {
        if (typeof supabaseJs !== 'undefined') {
            window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            });
            console.log('✅ Supabase inicializado correctamente');
            window.dispatchEvent(new Event('supabase-ready'));
            return true;
        }
        return false;
    }

    // Intentar inicializar inmediatamente
    if (!initSupabase()) {
        // Si no está listo, esperar a que cargue el script
        window.addEventListener('load', function() {
            if (!window.supabase) {
                initSupabase();
            }
        });
    }

    // Fallback: verificar cada 100ms por 3 segundos
    let attempts = 0;
    const interval = setInterval(function() {
        if (window.supabase || attempts > 30) {
            clearInterval(interval);
            return;
        }
        if (typeof supabaseJs !== 'undefined' && !window.supabase) {
            window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase inicializado (delay)');
            window.dispatchEvent(new Event('supabase-ready'));
        }
        attempts++;
    }, 100);
})();