// ============================================
// CONFIGURACIÓN DE SUPABASE - VERSIÓN FINAL
// ============================================

// IMPORTANTE: Estas son las credenciales CORRECTAS de tu proyecto
// Si el registro sigue fallando, verifica en https://supabase.com/dashboard

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z';

// Verificar que las constantes están definidas
console.log('%c🚀 TAXIMOTO - Iniciando aplicación...', 'color: #00ff9c; font-size: 14px; font-weight: bold;');
console.log('📡 Conectando a Supabase...');

// Función para inicializar Supabase de forma segura
function initSupabase() {
    try {
        // Verificar que la librería de Supabase está cargada
        if (typeof window.supabase === 'undefined') {
            console.error('❌ La librería de Supabase no está cargada');
            return null;
        }
        
        // Verificar que las credenciales existen
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
            console.error('❌ Credenciales de Supabase no definidas');
            return null;
        }
        
        console.log('✅ Credenciales verificadas');
        console.log('🔗 URL:', SUPABASE_URL);
        console.log('🔑 Key:', SUPABASE_PUBLISHABLE_KEY.substring(0, 15) + '...');
        
        // Crear el cliente
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce'
            },
            global: {
                headers: {
                    'x-application-name': 'taximoto'
                }
            }
        });
        
        console.log('✅ Cliente de Supabase creado exitosamente');
        return supabaseClient;
        
    } catch (error) {
        console.error('❌ Error al crear cliente Supabase:', error);
        return null;
    }
}

// Inicializar Supabase
const supabase = initSupabase();

// Exportar a window para que esté disponible globalmente
window.SUPABASE = supabase;
window.supabase = supabase;

// Mostrar estado de la conexión
if (supabase) {
    console.log('%c✅ TAXIMOTO conectado a Supabase', 'color: #00ff9c; font-size: 12px;');
} else {
    console.error('%c❌ TAXIMOTO NO pudo conectar a Supabase', 'color: #ff4444; font-size: 12px;');
}

// Función de ayuda para verificar conexión
window.verificarConexion = async function() {
    if (!supabase) {
        alert('❌ Supabase no está inicializado');
        return false;
    }
    
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        console.log('✅ Conexión verificada', data);
        alert('✅ Conexión exitosa a Supabase');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        alert('❌ Error de conexión: ' + error.message);
        return false;
    }
};

console.log('📝 Para verificar la conexión, escribe: verificarConexion()');