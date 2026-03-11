// =============================================
// APP PRINCIPAL - CORREGIDA
// =============================================

// Esperar a que todo esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando TAXIMOTO...');
    
    // Esperar a que Supabase esté listo (máx 3s)
    await window.waitForSupabase?.();
    
    // Verificar sesión en páginas protegidas
    const paginasPublicas = ['index.html', 'login.html', 'register.html', 'setup-admin.html'];
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
    
    if (!paginasPublicas.includes(paginaActual)) {
        const session = await window.checkSession?.();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
    }
    
    // Inicializar según la página
    if (paginaActual === 'request.html') {
        window.initRequestPage?.();
    }
    
    if (paginaActual === 'conductor-dashboard.html') {
        window.initConductorDashboard?.();
    }
    
    if (paginaActual.includes('admin/dashboard.html')) {
        window.initAdminDashboard?.();
    }
    
    console.log('✅ App lista');
});

// Helper para esperar Supabase
window.waitForSupabase = function() {
    return new Promise(resolve => {
        if (window.supabase) {
            resolve();
            return;
        }
        
        let attempts = 0;
        const interval = setInterval(() => {
            if (window.supabase || attempts > 30) {
                clearInterval(interval);
                resolve();
            }
            attempts++;
        }, 100);
    });
};

// =============================================
// PÁGINA DE SOLICITUD
// =============================================
window.initRequestPage = function() {
    console.log('📝 Inicializando página de solicitud');
    
    const form = document.getElementById('solicitar-form');
    if (form) {
        // Remover listeners anteriores
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', window.solicitarViaje);
    }
};

// =============================================
// DASHBOARD DE CONDUCTOR
// =============================================
window.initConductorDashboard = async function() {
    console.log('🚗 Inicializando dashboard conductor');
    
    const usuario = await window.getCurrentUser();
    if (!usuario) return;
    
    // Mostrar nombre
    const nombreSpan = document.getElementById('conductor-nombre');
    if (nombreSpan) nombreSpan.textContent = usuario.nombre;
    
    // Escuchar solicitudes
    window.escucharSolicitudes();
    
    // Cargar historial
    window.cargarViajesConductor();
};

// =============================================
// DASHBOARD ADMIN
// =============================================
window.initAdminDashboard = async function() {
    console.log('👑 Inicializando dashboard admin');
    
    await window.cargarEstadisticasAdmin();
    await window.cargarPendientesAdmin();
    await window.cargarUsuariosAdmin();
};

// Cargar estadísticas
window.cargarEstadisticasAdmin = async function() {
    const supabase = window.supabase;
    if (!supabase) return;
    
    try {
        const { count: usuarios } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true })
            .eq('rol', 'usuario')
            .eq('activo', true);
            
        const { count: conductores } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true })
            .in('rol', ['taxi', 'mototaxi'])
            .eq('activo', true);
            
        const { count: viajes } = await supabase
            .from('viajes')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('total-usuarios').textContent = usuarios || 0;
        document.getElementById('total-conductores').textContent = conductores || 0;
        document.getElementById('total-viajes').textContent = viajes || 0;
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
};

// Cargar pendientes
window.cargarPendientesAdmin = async function() {
    const supabase = window.supabase;
    if (!supabase) return;
    
    try {
        const { data: pendientes, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('activo', false)
            .in('rol', ['taxi', 'mototaxi', 'comercio']);
            
        if (error) throw error;
        
        const container = document.getElementById('pendientes-container');
        if (!container) return;
        
        if (pendientes.length === 0) {
            container.innerHTML = '<p>No hay solicitudes pendientes</p>';
            return;
        }
        
        container.innerHTML = pendientes.map(user => `
            <div class="card" id="pendiente-${user.id}">
                <h3>${user.nombre}</h3>
                <p>Rol: ${user.rol === 'taxi' ? '🚕 Taxi' : user.rol === 'mototaxi' ? '🛵 Mototaxi' : '🏪 Comercio'}</p>
                <p>Teléfono: ${user.telefono}</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.activarUsuario('${user.id}')" class="btn btn-primary">Activar</button>
                    <button onclick="window.rechazarUsuario('${user.id}')" class="btn btn-secondary">Rechazar</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando pendientes:', error);
    }
};

// Activar usuario
window.activarUsuario = async function(userId) {
    if (!confirm('¿Activar este usuario?')) return;
    
    const supabase = window.supabase;
    if (!supabase) return;
    
    try {
        const { error } = await supabase
            .from('usuarios')
            .update({ activo: true })
            .eq('id', userId);
            
        if (error) throw error;
        
        alert('✅ Usuario activado');
        document.getElementById(`pendiente-${userId}`)?.remove();
        window.cargarEstadisticasAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// Rechazar usuario
window.rechazarUsuario = async function(userId) {
    if (!confirm('¿Rechazar y eliminar este usuario?')) return;
    
    const supabase = window.supabase;
    if (!supabase) return;
    
    try {
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', userId);
            
        if (error) throw error;
        
        alert('✅ Usuario rechazado');
        document.getElementById(`pendiente-${userId}`)?.remove();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// Cargar usuarios
window.cargarUsuariosAdmin = async function() {
    const supabase = window.supabase;
    if (!supabase) return;
    
    try {
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('creado_en', { ascending: false });
            
        if (error) throw error;
        
        const container = document.getElementById('usuarios-container');
        if (!container) return;
        
        container.innerHTML = usuarios.map(user => `
            <div class="card">
                <h3>${user.nombre}</h3>
                <p>Rol: ${user.rol}</p>
                <p>Tel: ${user.telefono}</p>
                <p>Estado: ${user.activo ? '✅ Activo' : '⏳ Pendiente'}</p>
                <p>Registro: ${new Date(user.creado_en).toLocaleDateString()}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
    }
};

// Función para cambiar tabs
window.showTab = function(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
};

// Función para volver al inicio
window.goHome = function() {
    window.location.href = 'index.html';
};