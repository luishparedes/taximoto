// Configuración de Supabase
const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HJkELm1PKc9hTB7R8DsRng_a2qqkv8z';

// Inicializar cliente de Supabase (v2) - usando la variable global 'supabase' del CDN
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable global para el usuario autenticado (perfil)
let currentUser = null;

// Función para mostrar mensajes en la UI
function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.className = `message ${type}`;
        el.style.display = 'block';
        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    }
}

// Verificar sesión al cargar cada página
document.addEventListener('DOMContentLoaded', async () => {
    await checkSession();
    // Ejecutar funciones específicas según la página
    const path = window.location.pathname;
    if (path.includes('login.html')) {
        initLogin();
    } else if (path.includes('register.html')) {
        initRegister();
    } else if (path.includes('request.html')) {
        initRequest();
    } else if (path.includes('conductor-dashboard.html')) {
        initConductorDashboard();
    } else if (path.includes('admin/dashboard.html')) {
        initAdminDashboard();
    }
});

// Verificar sesión y cargar perfil del usuario
async function checkSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
        console.error('Error obteniendo sesión:', error);
        return;
    }

    if (session) {
        // Obtener datos del usuario desde la tabla usuarios usando auth_user_id
        const { data: userData, error: userError } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();

        if (userError) {
            console.error('Error obteniendo perfil:', userError);
            // Si no hay perfil, cerramos sesión
            await supabaseClient.auth.signOut();
            window.location.href = 'login.html';
            return;
        }

        currentUser = userData;

        // Redirecciones basadas en rol y página actual
        const path = window.location.pathname;
        if (currentUser.tipo === 'admin' && !path.includes('admin/dashboard.html')) {
            window.location.href = 'admin/dashboard.html';
        } else if (currentUser.tipo.startsWith('conductor') && !path.includes('conductor-dashboard.html')) {
            window.location.href = 'conductor-dashboard.html';
        } else if (currentUser.tipo === 'usuario' && !path.includes('request.html') && !path.includes('index.html')) {
            window.location.href = 'request.html';
        } else if (currentUser.tipo === 'comercio' && !path.includes('request.html')) {
            // Por ahora comercio usa misma interfaz que usuario
            window.location.href = 'request.html';
        }
    } else {
        // No hay sesión, redirigir a login si no está en páginas públicas
        const path = window.location.pathname;
        if (!path.includes('index.html') && !path.includes('login.html') && !path.includes('register.html')) {
            window.location.href = 'login.html';
        }
    }
}

// ==================== LOGIN ====================
function initLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const telefono = document.getElementById('telefono').value.trim();
        const password = document.getElementById('password').value;

        // Crear email temporal: telefono@taximoto.app
        const email = telefono + '@taximoto.app';

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showMessage('message', 'Error: ' + error.message, 'error');
            return;
        }

        // Login exitoso, redirigirá según checkSession
        window.location.reload();
    });
}

// ==================== REGISTRO ====================
function initRegister() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const cedula = document.getElementById('cedula').value.trim();
        const tipo = document.getElementById('tipo').value;
        const password = document.getElementById('password').value;
        const acepto = document.getElementById('acepto').checked;

        if (!acepto) {
            showMessage('message', 'Debes aceptar el aviso de responsabilidad', 'error');
            return;
        }

        // Validar que el teléfono no esté ya registrado en la tabla usuarios
        const { data: existingUser, error: checkError } = await supabaseClient
            .from('usuarios')
            .select('telefono')
            .eq('telefono', telefono)
            .maybeSingle();

        if (existingUser) {
            showMessage('message', 'Este teléfono ya está registrado', 'error');
            return;
        }

        // Crear email temporal
        const email = telefono + '@taximoto.app';

        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (authError) {
            showMessage('message', 'Error en registro: ' + authError.message, 'error');
            return;
        }

        // 2. Insertar en tabla usuarios
        const { error: insertError } = await supabaseClient
            .from('usuarios')
            .insert([{
                auth_user_id: authData.user.id,
                telefono: telefono,
                nombre: nombre,
                cedula: cedula,
                tipo: tipo,
                activo: false  // Pendiente de activación
            }]);

        if (insertError) {
            // Si falla, deberíamos eliminar el usuario de auth, pero es complejo. Por ahora mostramos error.
            showMessage('message', 'Error guardando perfil. Contacta al administrador.', 'error');
            console.error(insertError);
            return;
        }

        // Mostrar mensaje de éxito
        showMessage('message', 'Tu solicitud fue enviada. El administrador se comunicará contigo por WhatsApp para enviarte un formulario con los requisitos necesarios para activar tu cuenta.', 'success');
        form.reset();
    });
}

// ==================== SOLICITUD DE SERVICIO (usuario) ====================
function initRequest() {
    if (!currentUser) return;
    if (!currentUser.activo) {
        alert('Tu cuenta aún no ha sido activada por el administrador.');
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('request-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tipo_servicio = document.getElementById('tipo_servicio').value;
            const origen = document.getElementById('origen').value.trim();
            const destino = document.getElementById('destino').value.trim();

            const { error } = await supabaseClient
                .from('solicitudes')
                .insert([{
                    usuario_id: currentUser.id,
                    tipo_servicio: tipo_servicio,
                    origen: origen,
                    destino: destino,
                    estado: 'enviada'
                }]);

            if (error) {
                alert('Error al crear solicitud: ' + error.message);
            } else {
                alert('Solicitud enviada. Espera a que un conductor la acepte.');
                form.reset();
                cargarSolicitudesUsuario();
            }
        });
    }

    // Cargar solicitudes activas e historial
    cargarSolicitudesUsuario();

    // Suscripción en tiempo real a cambios en solicitudes del usuario
    const subscription = supabaseClient
        .channel('solicitudes-usuario')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'solicitudes',
            filter: `usuario_id=eq.${currentUser.id}`
        }, (payload) => {
            console.log('Cambio en solicitudes:', payload);
            cargarSolicitudesUsuario();
        })
        .subscribe();

    // Manejar cierre de sesión
    document.getElementById('logout')?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
}

async function cargarSolicitudesUsuario() {
    // Solicitudes activas (no finalizadas ni canceladas)
    const { data: activas, error } = await supabaseClient
        .from('solicitudes')
        .select('*')
        .eq('usuario_id', currentUser.id)
        .in('estado', ['enviada', 'aceptada', 'en_camino'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
    } else {
        const container = document.getElementById('solicitudes-activas');
        if (container) {
            if (activas.length === 0) {
                container.innerHTML = '<p>No tienes solicitudes activas.</p>';
            } else {
                let html = '';
                activas.forEach(s => {
                    html += `<div class="solicitud-card">
                        <p><strong>${s.tipo_servicio}</strong> de ${s.origen} a ${s.destino}</p>
                        <p>Estado: ${s.estado}</p>
                        ${s.conductor_id ? '<p>Conductor asignado. Espera notificaciones.</p>' : ''}
                    </div>`;
                });
                container.innerHTML = html;
            }
        }
    }

    // Historial (finalizadas)
    const { data: historial, error: err2 } = await supabaseClient
        .from('solicitudes')
        .select('*, calificaciones(*)')
        .eq('usuario_id', currentUser.id)
        .in('estado', ['finalizada', 'cancelada'])
        .order('created_at', { ascending: false });

    if (!err2 && document.getElementById('historial')) {
        let html = '';
        historial.forEach(s => {
            const yaCalificado = s.calificaciones && s.calificaciones.length > 0;
            html += `<div class="historial-item">
                <p><strong>${s.tipo_servicio}</strong> - ${s.estado} - ${new Date(s.created_at).toLocaleDateString()}</p>
                ${!yaCalificado && s.estado === 'finalizada' ? `<button class="btn-small" onclick="abrirModalCalificar('${s.id}')">Calificar</button>` : ''}
            </div>`;
        });
        document.getElementById('historial').innerHTML = html || '<p>No hay historial.</p>';
    }
}

// Función global para abrir modal de calificación
window.abrirModalCalificar = function(solicitudId) {
    document.getElementById('calificar-solicitud-id').value = solicitudId;
    document.getElementById('modal-calificar').style.display = 'block';
}

// Inicializar modal de calificación
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-calificar');
    if (modal) {
        const span = modal.querySelector('.close');
        span.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) modal.style.display = 'none';
        };

        const form = document.getElementById('calificar-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const solicitudId = document.getElementById('calificar-solicitud-id').value;
            const puntuacion = document.getElementById('puntuacion').value;
            const comentario = document.getElementById('comentario').value;

            // Obtener conductor_id de la solicitud
            const { data: solicitud, error: errSol } = await supabaseClient
                .from('solicitudes')
                .select('conductor_id')
                .eq('id', solicitudId)
                .single();

            if (errSol || !solicitud.conductor_id) {
                alert('Error: no se pudo identificar al conductor');
                return;
            }

            const { error } = await supabaseClient
                .from('calificaciones')
                .insert([{
                    solicitud_id: solicitudId,
                    usuario_id: currentUser.id,
                    conductor_id: solicitud.conductor_id,
                    puntuacion: parseInt(puntuacion),
                    comentario: comentario
                }]);

            if (error) {
                alert('Error al guardar calificación: ' + error.message);
            } else {
                alert('¡Gracias por calificar!');
                modal.style.display = 'none';
                cargarSolicitudesUsuario();
            }
        });
    }
});

// ==================== CONDUCTOR DASHBOARD ====================
function initConductorDashboard() {
    if (!currentUser) return;
    if (!currentUser.activo) {
        alert('Tu cuenta no está activada.');
        window.location.href = 'index.html';
        return;
    }

    cargarSolicitudesDisponibles();
    cargarServiciosActivosConductor();
    cargarHistorialConductor();

    // Suscripciones en tiempo real
    const channel = supabaseClient.channel('conductor-channel')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'solicitudes',
            filter: `estado=eq.enviada`
        }, () => {
            cargarSolicitudesDisponibles();
        })
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'solicitudes',
            filter: `conductor_id=eq.${currentUser.id}`
        }, () => {
            cargarServiciosActivosConductor();
            cargarHistorialConductor();
        })
        .subscribe();

    document.getElementById('logout')?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
}

async function cargarSolicitudesDisponibles() {
    const { data, error } = await supabaseClient
        .from('solicitudes')
        .select('*, usuario:usuario_id(nombre, telefono)')
        .eq('estado', 'enviada')
        .order('created_at', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById('solicitudes-disponibles');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p>No hay solicitudes disponibles.</p>';
        return;
    }

    let html = '';
    data.forEach(s => {
        html += `<div class="solicitud-card">
            <p><strong>${s.tipo_servicio}</strong> de ${s.origen} a ${s.destino}</p>
            <p>Usuario: ${s.usuario.nombre} (${s.usuario.telefono})</p>
            <button class="btn-small" onclick="aceptarSolicitud('${s.id}')">Aceptar</button>
        </div>`;
    });
    container.innerHTML = html;
}

// Función global para aceptar solicitud
window.aceptarSolicitud = async function(solicitudId) {
    if (!confirm('¿Aceptar esta solicitud?')) return;

    const { error } = await supabaseClient
        .from('solicitudes')
        .update({ 
            conductor_id: currentUser.id, 
            estado: 'aceptada' 
        })
        .eq('id', solicitudId)
        .eq('estado', 'enviada'); // Solo si sigue enviada

    if (error) {
        alert('Error al aceptar: ' + error.message);
    } else {
        alert('Solicitud aceptada');
        cargarSolicitudesDisponibles();
        cargarServiciosActivosConductor();
    }
}

async function cargarServiciosActivosConductor() {
    const { data, error } = await supabaseClient
        .from('solicitudes')
        .select('*, usuario:usuario_id(nombre, telefono)')
        .eq('conductor_id', currentUser.id)
        .in('estado', ['aceptada', 'en_camino'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById('mis-servicios');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p>No tienes servicios activos.</p>';
        return;
    }

    let html = '';
    data.forEach(s => {
        html += `<div class="servicio-card">
            <p><strong>${s.tipo_servicio}</strong> de ${s.origen} a ${s.destino}</p>
            <p>Usuario: ${s.usuario.nombre} - ${s.usuario.telefono}</p>
            <p>Estado: ${s.estado}</p>
            <button class="btn-small" onclick="cambiarEstadoServicio('${s.id}', 'en_camino')">En camino</button>
            <button class="btn-small" onclick="cambiarEstadoServicio('${s.id}', 'finalizada')">Finalizar</button>
            <button class="btn-small" onclick="contactarWhatsApp('${s.usuario.telefono}')">WhatsApp</button>
            <button class="btn-small" onclick="contactarLlamada('${s.usuario.telefono}')">Llamar</button>
        </div>`;
    });
    container.innerHTML = html;
}

async function cargarHistorialConductor() {
    const { data, error } = await supabaseClient
        .from('solicitudes')
        .select('*')
        .eq('conductor_id', currentUser.id)
        .in('estado', ['finalizada', 'cancelada'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById('historial');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p>No hay historial.</p>';
        return;
    }

    let html = '';
    data.forEach(s => {
        html += `<div>${s.tipo_servicio} - ${s.estado} - ${new Date(s.created_at).toLocaleDateString()}</div>`;
    });
    container.innerHTML = html;
}

window.cambiarEstadoServicio = async function(solicitudId, nuevoEstado) {
    const { error } = await supabaseClient
        .from('solicitudes')
        .update({ estado: nuevoEstado })
        .eq('id', solicitudId)
        .eq('conductor_id', currentUser.id);

    if (error) {
        alert('Error: ' + error.message);
    } else {
        cargarServiciosActivosConductor();
        cargarHistorialConductor();
    }
}

window.contactarWhatsApp = function(telefono) {
    // Eliminar espacios y formato, dejar solo números
    const numero = telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${numero}`, '_blank');
}

window.contactarLlamada = function(telefono) {
    window.location.href = `tel:${telefono}`;
}

// ==================== ADMIN DASHBOARD ====================
async function initAdminDashboard() {
    if (!currentUser || currentUser.tipo !== 'admin') {
        alert('Acceso no autorizado');
        window.location.href = '../index.html';
        return;
    }

    cargarUsuariosPendientes();
    cargarUsuariosActivos();

    // Suscripción a cambios en usuarios
    supabaseClient
        .channel('admin-users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => {
            cargarUsuariosPendientes();
            cargarUsuariosActivos();
        })
        .subscribe();

    document.getElementById('logout')?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = '../index.html';
    });
}

async function cargarUsuariosPendientes() {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('activo', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const tbody = document.querySelector('#tabla-pendientes tbody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay usuarios pendientes</td></tr>';
        return;
    }

    let html = '';
    data.forEach(u => {
        html += `<tr>
            <td>${u.nombre}</td>
            <td>${u.telefono}</td>
            <td>${u.cedula}</td>
            <td>${u.tipo}</td>
            <td>
                <button class="btn-small" onclick="activarUsuario('${u.id}')">Activar</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

async function cargarUsuariosActivos() {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const tbody = document.querySelector('#tabla-activos tbody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No hay usuarios activos</td></tr>';
        return;
    }

    let html = '';
    data.forEach(u => {
        html += `<tr>
            <td>${u.nombre}</td>
            <td>${u.telefono}</td>
            <td>${u.cedula}</td>
            <td>${u.tipo}</td>
            <td>${u.activo ? 'Sí' : 'No'}</td>
            <td>
                <button class="btn-small" onclick="desactivarUsuario('${u.id}')">Desactivar</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// Funciones globales para admin
window.activarUsuario = async function(usuarioId) {
    const { error } = await supabaseClient
        .from('usuarios')
        .update({ activo: true })
        .eq('id', usuarioId);

    if (error) {
        alert('Error: ' + error.message);
    }
}

window.desactivarUsuario = async function(usuarioId) {
    const { error } = await supabaseClient
        .from('usuarios')
        .update({ activo: false })
        .eq('id', usuarioId);

    if (error) {
        alert('Error: ' + error.message);
    }
}