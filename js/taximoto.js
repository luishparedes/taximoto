// js/taximoto.js

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWNvem1semd2aXhhb3BzaXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjY1NTYsImV4cCI6MjA4ODc0MjU1Nn0.oCdHd4mPEMMhctsCNcviXLFuwrDuLSym5raTmTtUtGQ'; // (dejé igual tu key real, puedes mantenerla)

// 1. Inicializar cliente Supabase (MEJORADO)
let supabaseInstance;

if (typeof supabase !== 'undefined') {
    supabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,        // 🔥 mantiene sesión
            autoRefreshToken: true,      // 🔥 renueva token
            detectSessionInUrl: true     // 🔥 detecta sesión en móviles
        }
    });
} else {
    console.error('La librería Supabase no está cargada.');
}

// 2. Función global para obtener el cliente
window.getSupabase = function() {
    return supabaseInstance;
};


// 3. SISTEMA REALTIME (solicitudes y notificaciones)
document.addEventListener('DOMContentLoaded', async () => {

    const supabase = window.getSupabase();

    if (!supabase) return;

    console.log("Sistema Realtime activado...");

    // 🔥 Verificar sesión (NUEVO - MUY IMPORTANTE)
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        console.log("✅ Sesión activa:", session.user.email);
    } else {
        console.log("⚠️ No hay sesión activa");
    }

    // Escuchar cambios en solicitudes
    supabase
    .channel('cambios-solicitudes')
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes' },
        (payload) => {

            console.log('Cambio detectado en solicitudes:', payload);

            // Sonido cuando llega nueva solicitud
            if (payload.eventType === 'INSERT') {
                reproducirAlertaSonora();
            }

            // 🔥 Evitar recargas infinitas (mejora)
            if (document.visibilityState === 'visible') {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }

        }
    )
    .subscribe();


    // Escuchar notificaciones en tiempo real
    supabase
    .channel('notificaciones-usuario')
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'notificaciones'
        },
        (payload) => {

            console.log('Nueva notificación:', payload);

            if(payload.new?.mensaje){
                alert(payload.new.mensaje);
            }

            reproducirAlertaSonora();

        }
    )
    .subscribe();

});


// 4. Función sonido alerta
function reproducirAlertaSonora() {

    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

    audio.play().catch(() => {
        console.log("El sonido se activará cuando el usuario interactúe con la página.");
    });

}


// 5. SISTEMA FAVORITOS
window.agregarFavorito = async function(conductorId) {

    const supabase = window.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert("Debes iniciar sesión.");
        return;
    }

    const { error } = await supabase
    .from('favoritos')
    .insert({
        usuario_id: user.id,
        conductor_id: conductorId
    });

    if (error) {
        console.error(error);
        alert("No se pudo agregar a favoritos.");
    } else {
        alert("⭐ Conductor agregado a favoritos.");
    }

};


// 6. SISTEMA CALIFICACIONES
window.calificarConductor = async function(servicioId, conductorId, puntuacion, comentario) {

    const supabase = window.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert("Debes iniciar sesión.");
        return;
    }

    const { error } = await supabase
    .from('calificaciones')
    .insert({
        servicio_id: servicioId,
        usuario_id: user.id,
        conductor_id: conductorId,
        puntuacion: puntuacion,
        comentario: comentario
    });

    if (error) {
        console.error(error);
        alert("No se pudo registrar la calificación.");
    } else {
        alert("⭐ Gracias por tu calificación.");
    }

};