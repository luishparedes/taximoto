// Sistema de autenticación - VERSIÓN CORREGIDA

// ESPERAR a que cargue el DOM y Supabase
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Auth.js cargado');
    
    // Verificar que supabase existe
    if (typeof supabase === 'undefined' && typeof window.SUPABASE !== 'undefined') {
        window.supabase = window.SUPABASE;
    }
});

// Función para registrar usuario normal
async function registrarUsuario(event) {
    event.preventDefault();
    
    console.log('📝 Iniciando registro...');
    
    // Verificar que supabase existe
    if (typeof supabase === 'undefined' && typeof window.SUPABASE !== 'undefined') {
        window.supabase = window.SUPABASE;
    }
    
    if (typeof supabase === 'undefined') {
        alert('Error de conexión: Supabase no está disponible');
        console.error('❌ supabase no está definido');
        return;
    }
    
    // Verificar reCAPTCHA
    if (typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) {
        const recaptchaResponse = grecaptcha.getResponse();
        if (!recaptchaResponse) {
            alert('Por favor, verifica que no eres un robot');
            return;
        }
    }
    
    // Obtener valores
    const nombre = document.getElementById('nombre')?.value;
    const telefono = document.getElementById('telefono')?.value;
    const password = document.getElementById('password')?.value;
    const fotoFile = document.getElementById('foto')?.files[0];
    const cedulaFile = document.getElementById('cedula')?.files[0];
    
    // Validaciones
    if (!nombre || !telefono || !password || !fotoFile || !cedulaFile) {
        alert('Todos los campos son obligatorios');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (telefono.length < 10) {
        alert('El teléfono debe tener al menos 10 dígitos');
        return;
    }
    
    try {
        console.log('1. Creando usuario en Auth...');
        
        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: `${telefono}@taximoto.com`,
            password: password,
            options: {
                data: {
                    nombre: nombre,
                    telefono: telefono
                }
            }
        });
        
        if (authError) {
            console.error('❌ Error Auth:', authError);
            throw new Error(authError.message);
        }
        
        if (!authData || !authData.user) {
            throw new Error('No se pudo crear el usuario');
        }
        
        console.log('✅ Usuario creado en Auth:', authData.user.id);
        
        // 2. Subir foto
        console.log('2. Subiendo foto...');
        const fotoNombre = `usuarios/${authData.user.id}/foto_${Date.now()}.jpg`;
        const { error: fotoError } = await supabase.storage
            .from('fotos')
            .upload(fotoNombre, fotoFile);
            
        if (fotoError) {
            console.error('❌ Error subiendo foto:', fotoError);
            throw fotoError;
        }
        
        // 3. Subir cédula
        console.log('3. Subiendo cédula...');
        const cedulaNombre = `usuarios/${authData.user.id}/cedula_${Date.now()}.jpg`;
        const { error: cedulaError } = await supabase.storage
            .from('cedulas')
            .upload(cedulaNombre, cedulaFile);
            
        if (cedulaError) {
            console.error('❌ Error subiendo cédula:', cedulaError);
            throw cedulaError;
        }
        
        // 4. Obtener URLs
        const fotoUrl = supabase.storage.from('fotos').getPublicUrl(fotoNombre).data.publicUrl;
        const cedulaUrl = supabase.storage.from('cedulas').getPublicUrl(cedulaNombre).data.publicUrl;
        
        console.log('4. Guardando en base de datos...');
        
        // 5. Crear registro en tabla usuarios
        const { error: dbError } = await supabase
            .from('usuarios')
            .insert({
                auth_id: authData.user.id,
                nombre: nombre,
                telefono: telefono,
                rol: 'usuario',
                foto_url: fotoUrl,
                cedula_url: cedulaUrl,
                activo: true
            });
            
        if (dbError) {
            console.error('❌ Error DB:', dbError);
            throw dbError;
        }
        
        // Guardar teléfono para recordar
        try {
            localStorage.setItem('taximoto_phone', telefono);
        } catch (e) {
            console.warn('No se pudo guardar en localStorage');
        }
        
        console.log('✅ Registro completado exitosamente');
        alert('✅ Registro exitoso. Ya puedes iniciar sesión.');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        alert('Error en el registro: ' + (error.message || 'Error desconocido'));
    }
}

// Función de login mejorada
async function login(event) {
    event.preventDefault();
    
    console.log('🔑 Iniciando sesión...');
    
    const telefono = document.getElementById('telefono')?.value;
    const password = document.getElementById('password')?.value;
    const remember = document.getElementById('remember')?.checked || false;
    
    if (!telefono || !password) {
        alert('Teléfono y contraseña son obligatorios');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: `${telefono}@taximoto.com`,
            password: password
        });
        
        if (error) {
            console.error('❌ Error login:', error);
            throw error;
        }
        
        if (remember) {
            try {
                localStorage.setItem('taximoto_phone', telefono);
            } catch (e) {}
        }
        
        console.log('✅ Login exitoso');
        
        // Obtener datos del usuario
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_id', data.user.id)
            .single();
        
        // Redirigir según rol
        if (usuario) {
            if (!usuario.activo && !['usuario', 'admin'].includes(usuario.rol)) {
                alert('Tu cuenta está pendiente de activación');
                await supabase.auth.signOut();
                return;
            }
            
            // Redirección
            const redirecciones = {
                'admin': 'admin/dashboard.html',
                'taxi': 'conductor-dashboard.html',
                'mototaxi': 'conductor-dashboard.html',
                'comercio': 'comercio-dashboard.html',
                'usuario': 'request.html'
            };
            
            window.location.href = redirecciones[usuario.rol] || 'request.html';
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + (error.message || 'Credenciales incorrectas'));
    }
}

// Función para volver al inicio (fácil de usar)
function goHome() {
    window.location.href = 'index.html';
}

// Logout
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// Verificar sesión
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Función para mostrar/ocultar contraseña (global)
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        const toggle = event.target;
        if (toggle) {
            toggle.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
        }
    }
};