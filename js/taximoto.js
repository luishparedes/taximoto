// js/taximoto.js

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWNvem1semd2aXhhb3BzaXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjY1NTYsImV4cCI6MjA4ODc0MjU1Nn0.oCdHd4mPEMMhctsCNcviXLFuwrDuLSym5raTmTtUtGQ';

// 1. Inicializar cliente Supabase
let supabaseInstance;
if (typeof supabase !== 'undefined') {
    supabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('La librería Supabase no está cargada.');
}

// 2. Función global para obtener el cliente
window.getSupabase = function() {
    return supabaseInstance;
};

// 3. INTEGRACIÓN DE TIEMPO REAL (Refresco automático y Sonido)
// Este bloque se ejecuta solo cuando la página termina de cargar
document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.getSupabase();
    
    if (supabase) {
        console.log("Sistema Realtime activado. Esperando cambios...");

        supabase
            .channel('cambios-solicitudes')
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'solicitudes' }, 
                (payload) => {
                    console.log('Cambio detectado en solicitudes:', payload);

                    // Si alguien creó una solicitud nueva (INSERT), suena la alerta
                    if (payload.eventType === 'INSERT') {
                        reproducirAlertaSonora();
                    }

                    // Esperamos 1 segundo para que la base de datos procese y refrescamos la app
                    // Esto evita que tengas que darle a F5 manualmente
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            )
            .subscribe();
    }
});

// 4. Función para la alerta sonora
function reproducirAlertaSonora() {
    // Usamos un sonido de alerta profesional (puedes cambiar este link por un .mp3 propio)
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audio.play().catch(error => {
        console.log("El sonido no sonará hasta que hagas clic una vez en cualquier parte de la pantalla (regla del navegador).");
    });
}