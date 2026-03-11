// =============================================
// TAXIMOTO - CÓDIGO UNIFICADO Y OPTIMIZADO
// =============================================

// =============================================
// VERIFICACIÓN DE SUPABASE AL INICIAR
// =============================================
console.log('🔍 Verificando Supabase...');
if (!window.supabase) {
    console.error('❌ window.supabase no existe');
} else {
    console.log('✅ window.supabase existe');
}

// --- FUNCIONES GLOBALES DE AYUDA ---

// Esperar a que Supabase esté listo
window.waitForSupabase = function() {
    return new Promise(resolve => {
        if (window.supabase && window.supabase.auth) {
            resolve();
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 50;
        const interval = setInterval(() => {
            attempts++;
            if (window.supabase && window.supabase.auth) {
                clearInterval(interval);
                console.log('✅ Supabase listo después de', attempts, 'intentos');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.error('❌ Supabase no disponible después de', maxAttempts, 'intentos');
                alert('Error de conexión. Recarga la página.');
                resolve();
            }
        }, 100);
    });
};

// Obtener usuario actual desde la base de datos
window.getCurrentUser = async function() {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return null;

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) return null;

        const { data: user, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

        if (userError) {
            console.error('Error obteniendo usuario:', userError);
            return null;
        }
        return user;
    } catch (error) {
        console.error('Error en getCurrentUser:', error);
        return null;
    }
};

// Verificar si hay sesión activa
window.checkSession = async function() {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

// Cerrar sesión
window.logout = async function() {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (supabase) {
        await supabase.auth.signOut();
    }
    window.location.href = 'index.html';
};

// Volver al inicio
window.goHome = function() {
    window.location.href = 'index.html';
};

// --- REGISTRO SIMPLIFICADO (SIN IMÁGENES) ---
window.registrarUsuario = async function(event) {
    event.preventDefault();

    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) {
        alert('Error de conexión. Intenta de nuevo.');
        return;
    }

    // Obtener valores del formulario
    const nombre = document.getElementById('nombre')?.value?.trim();
    const telefono = document.getElementById('telefono')?.value?.trim();
    const cedula = document.getElementById('cedula')?.value?.trim();
    const password = document.getElementById('password')?.value;

    // Validaciones simples
    if (!nombre || !telefono || !cedula || !password) {
        alert('❌ Todos los campos son obligatorios');
        return;
    }
    if (password.length < 6) {
        alert('❌ La contraseña debe tener al menos 6 caracteres');
        return;
    }

    try {
        console.log('📝 Registrando usuario...');
        
        // 1. Crear usuario en Supabase Auth
        const email = `${telefono}@temp.taximoto.com`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { 
                    nombre: nombre, 
                    telefono: telefono 
                }
            }
        });

        if (authError) throw new Error(authError.message);
        if (!authData?.user) throw new Error('No se pudo crear el usuario');

        console.log('✅ Usuario creado en Auth:', authData.user.id);

        // 2. Guardar perfil en la tabla 'usuarios'
        const { error: dbError } = await supabase
            .from('usuarios')
            .insert({
                auth_id: authData.user.id,
                nombre: nombre,
                telefono: telefono,
                cedula: cedula,
                rol: 'usuario',
                activo: true
            });

        if (dbError) {
            console.error('Error en DB:', dbError);
            // Intentar eliminar el usuario de Auth
            await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
            throw dbError;
        }

        // 3. Mostrar mensaje de éxito y redirigir
        alert('✅ ¡Registro exitoso! Ahora puedes iniciar sesión.');
        window.location.href = 'login.html';

    } catch (error) {
        console.error('❌ Error en registro:', error);
        alert('Error: ' + (error.message || 'Error desconocido. Verifica que las tablas existan en Supabase.'));
    }
};

// --- INICIO DE SESIÓN ---
window.login = async function(event) {
    event.preventDefault();

    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) {
        alert('Error de conexión');
        return;
    }

    const telefono = document.getElementById('telefono')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const remember = document.getElementById('remember')?.checked || false;

    if (!telefono || !password) {
        alert('Teléfono y contraseña son obligatorios');
        return;
    }

    try {
        const email = `${telefono}@temp.taximoto.com`;
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            alert(error.message.includes('Invalid login') 
                ? 'Teléfono o contraseña incorrectos' 
                : 'Error: ' + error.message);
            return;
        }

        if (remember) {
            localStorage.setItem('taximoto_phone', telefono);
        }

        // Obtener datos del usuario
        const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_id', data.user.id)
            .single();

        if (userError) {
            console.error('Error obteniendo usuario:', userError);
            await supabase.auth.signOut();
            alert('Error al cargar tu perfil. Contacta al administrador.');
            return;
        }

        // Redirección según rol
        if (usuario.rol === 'admin') {
            window.location.href = 'admin/dashboard.html';
            return;
        }

        if (usuario.rol === 'taxi' || usuario.rol === 'mototaxi') {
            if (!usuario.activo) {
                alert('⏳ Tu cuenta de conductor está pendiente de activación.\n\nContacta al administrador: 0412-5278450');
                await supabase.auth.signOut();
                return;
            }
            window.location.href = 'conductor-dashboard.html';
            return;
        }

        window.location.href = 'request.html';

    } catch (error) {
        console.error('❌ Error en login:', error);
        alert('Error de conexión');
    }
};

// --- FUNCIONES PARA SOLICITUDES DE VIAJE ---
window.solicitarViaje = async function(event) {
    event.preventDefault();

    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;

    const tipo = document.getElementById('tipo')?.value;
    const origen = document.getElementById('origen')?.value?.trim();
    const destino = document.getElementById('destino')?.value?.trim();

    if (!tipo || !origen || !destino) {
        alert('Todos los campos son obligatorios');
        return;
    }

    try {
        const usuario = await window.getCurrentUser();
        if (!usuario) {
            alert('Debes iniciar sesión');
            window.location.href = 'login.html';
            return;
        }

        const { data: viaje, error } = await supabase
            .from('viajes')
            .insert({
                usuario_id: usuario.id,
                tipo_vehiculo: tipo,
                origen: origen,
                destino: destino,
                estado: 'solicitado'
            })
            .select()
            .single();

        if (error) throw error;

        alert('✅ Viaje solicitado. Esperando conductor...');
        document.getElementById('solicitar-form')?.reset();

        const estadoDiv = document.getElementById('estado-viaje');
        if (estadoDiv) {
            estadoDiv.innerHTML = `<div class="card"><h3>⏳ Buscando conductor...</h3><p>Espera a que un conductor acepte.</p></div>`;
        }

        if (viaje?.id) {
            window.escucharAceptacionViaje(viaje.id);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + (error.message || 'No se pudo crear el viaje'));
    }
};

// Escuchar aceptación de viaje
window.escucharAceptacionViaje = function(viajeId) {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;

    const channel = supabase
        .channel('viaje-usuario-' + viajeId)
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'viajes', filter: `id=eq.${viajeId}` },
            async (payload) => {
                if (payload.new.estado === 'aceptado' && payload.new.conductor_id) {
                    try {
                        const { data: conductor, error } = await supabase
                            .from('usuarios')
                            .select('nombre, telefono')
                            .eq('id', payload.new.conductor_id)
                            .single();

                        if (error) throw error;

                        const estadoDiv = document.getElementById('estado-viaje');
                        if (estadoDiv) {
                            estadoDiv.innerHTML = `
                                <div class="card">
                                    <h3>✅ Conductor asignado</h3>
                                    <p><strong>${conductor.nombre}</strong></p>
                                    <div class="contact-buttons">
                                        <a href="tel:${conductor.telefono}" class="btn btn-primary" style="flex:1;">📞 Llamar</a>
                                        <a href="https://wa.me/${conductor.telefono}" class="btn btn-secondary" style="flex:1;" target="_blank">💬 Mensaje</a>
                                    </div>
                                    <button onclick="window.finalizarViaje('${viajeId}')" class="btn btn-primary">✅ Viaje terminado</button>
                                </div>
                            `;
                        }
                        channel.unsubscribe();
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }
            }
        )
        .subscribe();
};

// Aceptar viaje (Conductor)
window.aceptarViaje = async function(viajeId) {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;

    try {
        const usuario = await window.getCurrentUser();
        if (!usuario || !(usuario.rol === 'taxi' || usuario.rol === 'mototaxi')) {
            alert('No tienes permiso para aceptar viajes');
            return;
        }
        if (!usuario.activo) {
            alert('Tu cuenta no está activada');
            return;
        }

        const { error } = await supabase
            .from('viajes')
            .update({ 
                conductor_id: usuario.id, 
                estado: 'aceptado', 
                aceptado_en: new Date().toISOString() 
            })
            .eq('id', viajeId)
            .eq('estado', 'solicitado');

        if (error) throw error;

        alert('✅ Viaje aceptado');
        const elemento = document.getElementById(`viaje-${viajeId}`);
        if (elemento) elemento.remove();

    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
};

// Finalizar viaje
window.finalizarViaje = async function(viajeId) {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('viajes')
            .update({ 
                estado: 'finalizado', 
                finalizado_en: new Date().toISOString() 
            })
            .eq('id', viajeId);

        if (error) throw error;
        window.mostrarCalificacion(viajeId);

    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
};

// Mostrar calificación
window.mostrarCalificacion = function(viajeId) {
    const container = document.getElementById('calificacion-container');
    if (!container) return;

    container.innerHTML = `
        <div class="card">
            <h3>⭐ Califica tu viaje</h3>
            <div class="rating" style="display: flex; gap: 10px; justify-content: center; margin: 20px 0; font-size: 30px;">
                <span class="star" data-value="1" style="cursor: pointer;">☆</span>
                <span class="star" data-value="2" style="cursor: pointer;">☆</span>
                <span class="star" data-value="3" style="cursor: pointer;">☆</span>
                <span class="star" data-value="4" style="cursor: pointer;">☆</span>
                <span class="star" data-value="5" style="cursor: pointer;">☆</span>
            </div>
            <button onclick="window.enviarCalificacion('${viajeId}')" class="btn btn-primary">Enviar calificación</button>
        </div>
    `;

    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            const valor = parseInt(this.dataset.value);
            document.querySelectorAll('.star').forEach((s, index) => {
                s.textContent = index < valor ? '★' : '☆';
            });
            window.calificacionSeleccionada = valor;
        });
    });
};

// Enviar calificación
window.enviarCalificacion = async function(viajeId) {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;
    
    if (!window.calificacionSeleccionada) {
        alert('Selecciona una calificación');
        return;
    }

    try {
        const usuario = await window.getCurrentUser();
        if (!usuario) return;

        const { data: viaje, error: viajeError } = await supabase
            .from('viajes')
            .select('conductor_id')
            .eq('id', viajeId)
            .single();
        if (viajeError) throw viajeError;

        const { error } = await supabase
            .from('calificaciones')
            .insert({ 
                viaje_id: viajeId, 
                conductor_id: viaje.conductor_id, 
                usuario_id: usuario.id, 
                calificacion: window.calificacionSeleccionada 
            });

        if (error) throw error;

        alert('✅ ¡Gracias por calificar!');
        document.getElementById('calificacion-container').innerHTML = '';
        document.getElementById('estado-viaje').innerHTML = '';

    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
};

// --- FUNCIONES PARA CONDUCTOR DASHBOARD ---
window.initConductorDashboard = async function() {
    console.log('🚗 Inicializando dashboard conductor');
    const usuario = await window.getCurrentUser();
    if (!usuario) return;

    const nombreSpan = document.getElementById('conductor-nombre');
    if (nombreSpan) nombreSpan.textContent = usuario.nombre;

    window.escucharSolicitudes();
    window.cargarViajesConductor();
};

window.escucharSolicitudes = function() {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;

    supabase
        .channel('nuevos-viajes-conductor')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'viajes', filter: 'estado=eq.solicitado' },
            (payload) => { window.mostrarNuevaSolicitud(payload.new); }
        )
        .subscribe();
};

window.mostrarNuevaSolicitud = function(viaje) {
    const container = document.getElementById('solicitudes-container');
    if (!container) return;
    
    const icono = viaje.tipo_vehiculo === 'taxi' ? '🚕' : '🛵';
    const tipoTexto = viaje.tipo_vehiculo === 'taxi' ? 'Taxi' : 'Mototaxi';

    const solicitudHTML = `
        <div class="card" id="viaje-${viaje.id}">
            <h3>${icono} Solicitud de ${tipoTexto}</h3>
            <p><strong>📍 Origen:</strong> ${viaje.origen}</p>
            <p><strong>🎯 Destino:</strong> ${viaje.destino}</p>
            <p><small>${new Date(viaje.creado_en).toLocaleTimeString()}</small></p>
            <button onclick="window.aceptarViaje('${viaje.id}')" class="btn btn-primary">✅ Aceptar viaje</button>
        </div>
    `;
    
    container.innerHTML = solicitudHTML + container.innerHTML;
};

window.cargarViajesConductor = async function() {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;
    
    try {
        const usuario = await window.getCurrentUser();
        if (!usuario) return;

        const { data: viajes, error } = await supabase
            .from('viajes')
            .select(`*, usuarios!viajes_usuario_id_fkey (nombre, telefono)`)
            .eq('conductor_id', usuario.id)
            .order('creado_en', { ascending: false })
            .limit(10);

        if (error) throw error;

        const container = document.getElementById('historial-container');
        if (!container) return;
        
        container.innerHTML = '';

        if (viajes.length === 0) {
            container.innerHTML = '<p>No hay viajes realizados</p>';
            return;
        }

        viajes.forEach(viaje => {
            const fecha = new Date(viaje.creado_en).toLocaleDateString();
            const estado = viaje.estado === 'finalizado' ? '✅ Completado' : '⏳ ' + viaje.estado;
            container.innerHTML += `
                <div class="card">
                    <div style="display: flex; justify-content: space-between;">
                        <span>${fecha}</span>
                        <span>${estado}</span>
                    </div>
                    <p><strong>Cliente:</strong> ${viaje.usuarios?.nombre}</p>
                    <p><strong>Origen:</strong> ${viaje.origen}</p>
                    <p><strong>Destino:</strong> ${viaje.destino}</p>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error:', error);
    }
};

// --- FUNCIONES PARA ADMIN DASHBOARD ---
window.initAdminDashboard = async function() {
    console.log('👑 Inicializando dashboard admin');
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;

    const usuario = await window.getCurrentUser();
    if (!usuario || usuario.telefono !== '04125278450') {
        alert('⛔ Acceso denegado. Solo el administrador puede entrar aquí.');
        window.location.href = '../index.html';
        return;
    }

    await window.cargarEstadisticasAdmin();
    await window.cargarPendientesAdmin();
    await window.cargarListadosAdmin();
};

window.cargarEstadisticasAdmin = async function() {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;
    
    try {
        const { count: usuarios } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true })
            .eq('rol', 'usuario');
            
        const { count: conductores } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true })
            .in('rol', ['taxi', 'mototaxi']);
            
        const { count: viajes } = await supabase
            .from('viajes')
            .select('*', { count: 'exact', head: true });

        document.getElementById('total-usuarios').textContent = usuarios || 0;
        document.getElementById('total-conductores').textContent = conductores || 0;
        document.getElementById('total-viajes').textContent = viajes || 0;
    } catch (error) { 
        console.error('Error estadísticas:', error); 
    }
};

window.cargarPendientesAdmin = async function() {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;
    
    try {
        const { data: pendientes, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('activo', false)
            .in('rol', ['taxi', 'mototaxi']);

        if (error) throw error;
        
        const container = document.getElementById('pendientes-container');
        if (!container) return;

        if (pendientes.length === 0) {
            container.innerHTML = '<p>✅ No hay solicitudes pendientes</p>';
            return;
        }

        container.innerHTML = pendientes.map(user => `
            <div class="card" id="pendiente-${user.id}">
                <h3>${user.nombre}</h3>
                <p>Rol: ${user.rol === 'taxi' ? '🚕 Taxi' : '🛵 Mototaxi'}</p>
                <p>Tel: ${user.telefono}</p>
                <p>Cédula: ${user.cedula}</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.activarUsuario('${user.id}')" class="btn btn-primary">✅ Activar</button>
                    <button onclick="window.rechazarUsuario('${user.id}')" class="btn btn-secondary">❌ Rechazar</button>
                </div>
            </div>
        `).join('');
    } catch (error) { 
        console.error('Error pendientes:', error); 
    }
};

window.activarUsuario = async function(userId) {
    if (!confirm('¿Activar este conductor?')) return;
    
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;
    
    try {
        const { error } = await supabase
            .from('usuarios')
            .update({ activo: true })
            .eq('id', userId);
            
        if (error) throw error;
        
        alert('✅ Conductor activado');
        document.getElementById(`pendiente-${userId}`)?.remove();
        window.cargarEstadisticasAdmin();
    } catch (error) { 
        alert('Error: ' + error.message); 
    }
};

window.rechazarUsuario = async function(userId) {
    if (!confirm('¿Rechazar y eliminar este conductor?')) return;
    
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;
    
    try {
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', userId);
            
        if (error) throw error;
        
        alert('✅ Conductor rechazado');
        document.getElementById(`pendiente-${userId}`)?.remove();
    } catch (error) { 
        alert('Error: ' + error.message); 
    }
};

window.cargarListadosAdmin = async function() {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    if (!supabase) return;
    
    try {
        // Usuarios activos
        const { data: usuarios } = await supabase
            .from('usuarios')
            .select('*')
            .eq('rol', 'usuario')
            .order('creado_en', { ascending: false });
            
        const usuariosContainer = document.getElementById('usuarios-container');
        if (usuariosContainer) {
            usuariosContainer.innerHTML = usuarios?.map(u => 
                `<div class="card"><h3>${u.nombre}</h3><p>Tel: ${u.telefono}</p></div>`
            ).join('') || '<p>No hay usuarios</p>';
        }

        // Conductores activos
        const { data: conductores } = await supabase
            .from('usuarios')
            .select('*')
            .in('rol', ['taxi', 'mototaxi'])
            .eq('activo', true);
            
        const conductoresContainer = document.getElementById('conductores-container');
        if (conductoresContainer) {
            conductoresContainer.innerHTML = conductores?.map(c => 
                `<div class="card"><h3>${c.nombre}</h3><p>${c.rol === 'taxi' ? '🚕 Taxi' : '🛵 Mototaxi'}</p><p>Tel: ${c.telefono}</p></div>`
            ).join('') || '<p>No hay conductores activos</p>';
        }

        // Viajes recientes
        const { data: viajes } = await supabase
            .from('viajes')
            .select('*, usuarios!viajes_usuario_id_fkey(nombre)')
            .order('creado_en', { ascending: false })
            .limit(20);
            
        const viajesContainer = document.getElementById('viajes-container');
        if (viajesContainer) {
            viajesContainer.innerHTML = viajes?.map(v => `
                <div class="card">
                    <p><strong>Usuario:</strong> ${v.usuarios?.nombre}</p>
                    <p><strong>Tipo:</strong> ${v.tipo_vehiculo}</p>
                    <p><strong>Estado:</strong> ${v.estado}</p>
                    <p><strong>Fecha:</strong> ${new Date(v.creado_en).toLocaleString()}</p>
                </div>
            `).join('') || '<p>No hay viajes</p>';
        }
    } catch (error) { 
        console.error('Error listados:', error); 
    }
};

// Función para cambiar tabs
window.showTab = function(tabId, event) {
    if (event) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
    }
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
};

// --- INICIALIZACIÓN GLOBAL ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando TAXIMOTO...');
    
    // Esperar a que Supabase esté listo
    await window.waitForSupabase();

    const paginasPublicas = ['index.html', 'login.html', 'register.html'];
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';

    // Protección de páginas privadas
    if (!paginasPublicas.includes(paginaActual)) {
        const session = await window.checkSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Inicializar según la página
    if (paginaActual === 'conductor-dashboard.html') {
        window.initConductorDashboard();
    }
    if (paginaActual === 'admin/dashboard.html') {
        window.initAdminDashboard();
    }

    console.log('✅ App lista');
});