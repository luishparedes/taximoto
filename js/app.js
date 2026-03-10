// Archivo principal de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión en páginas protegidas
    const paginasPublicas = ['login.html', 'register.html', 'index.html', 'setup-admin.html'];
    const paginaActual = window.location.pathname.split('/').pop();
    
    if (!paginasPublicas.includes(paginaActual)) {
        const session = await checkSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
    }
    
    // Inicializar componentes según la página
    if (paginaActual === 'request.html') {
        initRequestPage();
    }
    
    if (paginaActual.includes('dashboard.html')) {
        initDashboard();
    }
});

// Inicializar página de solicitud
function initRequestPage() {
    document.getElementById('solicitar-form')?.addEventListener('submit', solicitarViaje);
}

// Inicializar dashboard
async function initDashboard() {
    const usuario = await getCurrentUser();
    
    if (usuario.rol === 'admin') {
        cargarDashboardAdmin();
    } else if (usuario.rol === 'taxi' || usuario.rol === 'mototaxi') {
        escucharSolicitudes();
        cargarViajesConductor();
    } else if (usuario.rol === 'comercio') {
        initComercio();
    }
}

// Cargar dashboard admin
async function cargarDashboardAdmin() {
    // Cargar estadísticas
    const { data: usuarios } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
    const { data: viajes } = await supabase.from('viajes').select('*', { count: 'exact', head: true });
    const { data: conductores } = await supabase.from('conductores').select('*', { count: 'exact', head: true });
    
    document.getElementById('total-usuarios').textContent = usuarios.length;
    document.getElementById('total-viajes').textContent = viajes.length;
    document.getElementById('total-conductores').textContent = conductores.length;
    
    // Cargar pendientes
    cargarPendientes();
}

// Cargar pendientes para admin
async function cargarPendientes() {
    const { data: pendientes } = await supabase
        .from('usuarios')
        .select('*')
        .eq('activo', false)
        .in('rol', ['taxi', 'mototaxi', 'comercio']);
        
    const container = document.getElementById('pendientes-container');
    pendientes.forEach(user => {
        container.innerHTML += `
            <div class="card">
                <h3>${user.nombre}</h3>
                <p>Rol: ${user.rol}</p>
                <p>Teléfono: ${user.telefono}</p>
                <button onclick="activarUsuario('${user.id}')" class="btn btn-primary">Activar</button>
                <button onclick="rechazarUsuario('${user.id}')" class="btn btn-secondary">Rechazar</button>
            </div>
        `;
    });
}

// Activar usuario
window.activarUsuario = async function(userId) {
    const { error } = await supabase
        .from('usuarios')
        .update({ activo: true })
        .eq('id', userId);
        
    if (error) {
        alert('Error al activar: ' + error.message);
    } else {
        alert('Usuario activado');
        window.location.reload();
    }
};

// Función global para finalizar viaje
window.finalizarViaje = finalizarViaje;

// Mostrar aviso legal en todas las páginas
function mostrarAvisoLegal() {
    const footer = document.createElement('div');
    footer.className = 'legal-notice';
    footer.innerHTML = 'TAXIMOTO solo conecta conductores con usuarios. No se hace responsable por pagos, accidentes, daños o conflictos.';
    document.body.appendChild(footer);
}

// Llamar después de que cargue el DOM
document.addEventListener('DOMContentLoaded', mostrarAvisoLegal);