// js/taximoto.js

// Inicialización de Supabase
const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWNvem1semd2aXhhb3BzaXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjY1NTYsImV4cCI6MjA4ODc0MjU1Nn0.oCdHd4mPEMMhctsCNcviXLFuwrDuLSym5raTmTtUtGQ';

// Verificar que la librería se cargó correctamente
if (typeof supabase === 'undefined') {
    console.error('La librería Supabase no se cargó. Revisa el CDN.');
} else {
    var supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Función global para obtener el cliente
function getSupabase() {
    return supabaseClient;
}

// Manejo de autenticación
async function register(email, password, nombre, apellido, telefono, tipo) {
    const supabase = getSupabase();
    // 1. Registrar usuario en auth
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    const user = data.user;
    // 2. Actualizar perfil con datos adicionales
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ nombre, apellido, telefono, tipo })
        .eq('id', user.id);
    if (updateError) throw updateError;
    return user;
}

async function login(email, password) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

async function logout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// Verificar sesión y redirigir según perfil/estado
async function checkSession() {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // Si no está logueado y la página no es pública (index, login, register), redirigir a login
        const publicPages = ['index.html', 'login.html', 'register.html'];
        const currentPage = window.location.pathname.split('/').pop();
        if (!publicPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
        return null;
    }
    // Obtener perfil
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    if (error) {
        console.error('Error al obtener perfil', error);
        return null;
    }
    // Verificar si es admin (rol)
    const { data: roleData } = await supabase
        .from('roles')
        .select('rol')
        .eq('user_id', user.id)
        .maybeSingle();
    const isAdmin = roleData?.rol === 'admin';
    // Redirecciones basadas en tipo de página
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'admin/dashboard.html' && !isAdmin) {
        window.location.href = '../index.html';
    }
    if (currentPage === 'conductor-dashboard.html' && !['taxi','mototaxi','comercio'].includes(profile.tipo)) {
        window.location.href = 'index.html';
    }
    if (currentPage === 'request.html' && profile.tipo !== 'usuario') {
        // Solo usuarios pueden pedir servicios
        window.location.href = 'index.html';
    }
    // Verificar estado activo/inactivo
    if (profile.estado === 'inactivo' && currentPage !== 'index.html' && currentPage !== 'login.html' && currentPage !== 'register.html') {
        // Mostrar mensaje en cualquier página interna (menos admin) de que está inactivo
        if (!isAdmin) {
            alert('Tu cuenta está en proceso de verificación. Contacta al administrador.');
            window.location.href = 'index.html';
        }
    }
    return { user, profile, isAdmin };
}

// --- Lógica específica por página ---
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    // Verificar sesión en todas las páginas excepto las públicas
    await checkSession();

    if (path.includes('register.html')) {
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const nombre = document.getElementById('nombre').value;
            const apellido = document.getElementById('apellido').value;
            const telefono = document.getElementById('telefono').value;
            const tipo = document.getElementById('tipo').value;
            try {
                await register(email, password, nombre, apellido, telefono, tipo);
                alert('Registro exitoso. Tu cuenta está inactiva. El administrador la activará pronto.');
                window.location.href = 'login.html';
            } catch (err) {
                alert('Error: ' + err.message);
            }
        });
    }

    if (path.includes('login.html')) {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                await login(email, password);
                // Redirigir según perfil
                const { profile, isAdmin } = await checkSession(); // ya redirige internamente, pero podemos forzar
                if (isAdmin) window.location.href = 'admin/dashboard.html';
                else if (['taxi','mototaxi','comercio'].includes(profile.tipo)) window.location.href = 'conductor-dashboard.html';
                else window.location.href = 'index.html';
            } catch (err) {
                alert('Credenciales inválidas: ' + err.message);
            }
        });

        document.getElementById('forgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Contacta al administrador al 04125278450 para recuperar acceso.');
        });
    }

    if (path.includes('request.html')) {
        const tipo = document.getElementById('tipoServicio').value;
        if (!tipo) window.location.href = 'index.html';

        document.getElementById('requestForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const supabase = getSupabase();
            const { data: { user } } = await supabase.auth.getUser();
            const origen = document.getElementById('origen').value;
            const destino = document.getElementById('destino').value;
            const { error } = await supabase.from('solicitudes').insert({
                usuario_id: user.id,
                tipo_servicio: tipo,
                origen,
                destino,
                estado: 'enviada'
            });
            if (error) alert('Error al crear solicitud: ' + error.message);
            else {
                alert('Solicitud enviada. Espera a que un conductor acepte.');
                // Redirigir a pantalla de seguimiento (podría ser otra página, pero por ahora index)
                window.location.href = 'index.html';
            }
        });
    }

    if (path.includes('conductor-dashboard.html')) {
        // Cargar solicitudes disponibles y suscribirse a nuevas
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('tipo').eq('id', user.id).single();

        // Obtener solicitudes enviadas del tipo correspondiente
        async function loadAvailableRequests() {
            const { data, error } = await supabase
                .from('solicitudes')
                .select('*')
                .eq('tipo_servicio', profile.tipo)
                .eq('estado', 'enviada')
                .order('created_at', { ascending: false });
            if (error) console.error(error);
            else renderRequests(data);
        }

        function renderRequests(requests) {
            const container = document.getElementById('solicitudesDisponibles');
            container.innerHTML = '';
            requests.forEach(req => {
                const card = document.createElement('div');
                card.className = 'solicitud-card';
                card.innerHTML = `
                    <p><strong>Origen:</strong> ${req.origen}</p>
                    <p><strong>Destino:</strong> ${req.destino}</p>
                    <button class="btn btn-primary aceptar" data-id="${req.id}">Aceptar</button>
                `;
                container.appendChild(card);
            });
            document.querySelectorAll('.aceptar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const solicitudId = e.target.dataset.id;
                    const { error } = await supabase
                        .from('solicitudes')
                        .update({ estado: 'aceptada', conductor_id: user.id, accepted_at: new Date() })
                        .eq('id', solicitudId);
                    if (error) alert('Error: ' + error.message);
                    else {
                        // Crear notificación para el usuario
                        await supabase.from('notificaciones').insert({
                            user_id: req.usuario_id,
                            mensaje: 'Tu solicitud fue aceptada por un conductor. Está en camino.'
                        });
                        loadAvailableRequests();
                    }
                });
            });
        }

        // Suscripción en tiempo real
        const subscription = supabase
            .channel('solicitudes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'solicitudes', filter: `tipo_servicio=eq.${profile.tipo}` }, payload => {
                // Nueva solicitud, recargar
                loadAvailableRequests();
            })
            .subscribe();

        loadAvailableRequests();

        // Cargar servicios activos (aceptados por este conductor y no finalizados)
        async function loadActiveServices() {
            const { data, error } = await supabase
                .from('solicitudes')
                .select('*')
                .eq('conductor_id', user.id)
                .in('estado', ['aceptada', 'conductor_en_camino']);
            if (error) console.error(error);
            else renderActiveServices(data);
        }

        function renderActiveServices(services) {
            const container = document.getElementById('misServicios');
            container.innerHTML = '';
            services.forEach(svc => {
                const card = document.createElement('div');
                card.className = 'solicitud-card';
                card.innerHTML = `
                    <p><strong>Cliente:</strong> (ID: ${svc.usuario_id})</p>
                    <p><strong>Origen:</strong> ${svc.origen}</p>
                    <p><strong>Destino:</strong> ${svc.destino}</p>
                    <p><strong>Estado:</strong> ${svc.estado}</p>
                    ${svc.estado === 'aceptada' ? '<button class="btn btn-secondary iniciar">Iniciar viaje</button>' : ''}
                    ${svc.estado === 'conductor_en_camino' ? '<button class="btn btn-secondary finalizar">Finalizar</button>' : ''}
                `;
                container.appendChild(card);
            });
        }

        loadActiveServices();
    }

    if (path.includes('admin/dashboard.html')) {
        // Solo admin puede ver esto
        const supabase = getSupabase();
        // Verificar admin otra vez
        const { isAdmin } = await checkSession();
        if (!isAdmin) return;

        document.getElementById('verUsuarios').addEventListener('click', async () => {
            const { data, error } = await supabase.from('profiles').select('*').order('created_at');
            if (error) alert(error.message);
            else {
                let html = '<h3>Usuarios</h3><table border="1" style="width:100%"><tr><th>Email</th><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Acción</th></tr>';
                data.forEach(u => {
                    html += `<tr>
                        <td>${u.email}</td>
                        <td>${u.nombre} ${u.apellido}</td>
                        <td>${u.tipo}</td>
                        <td>${u.estado}</td>
                        <td>
                            <button class="activar" data-id="${u.id}" data-estado="${u.estado}">
                                ${u.estado === 'inactivo' ? 'Activar' : 'Desactivar'}
                            </button>
                        </td>
                    </tr>`;
                });
                html += '</table>';
                document.getElementById('adminContent').innerHTML = html;

                document.querySelectorAll('.activar').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = e.target.dataset.id;
                        const nuevoEstado = e.target.dataset.estado === 'inactivo' ? 'activo' : 'inactivo';
                        const { error } = await supabase.from('profiles').update({ estado: nuevoEstado }).eq('id', id);
                        if (error) alert(error.message);
                        else e.target.closest('tr').querySelector('td:nth-child(4)').innerText = nuevoEstado;
                    });
                });
            }
        });
    }
});