// =============================================
// SISTEMA DE AUTENTICACIÓN - CORREGIDO
// =============================================

// Helper seguro para obtener Supabase
function getSupabase() {
    if (!window.supabase) {
        console.error('❌ Supabase no está inicializado');
        return null;
    }
    return window.supabase;
}

// =============================================
// REGISTRO DE USUARIO
// =============================================
window.registrarUsuario = async function(event) {
    event.preventDefault();
    
    const supabase = getSupabase();
    if (!supabase) {
        alert('Error de conexión. Recarga la página.');
        return;
    }
    
    // Obtener valores
    const nombre = document.getElementById('nombre')?.value?.trim();
    const telefono = document.getElementById('telefono')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const fotoFile = document.getElementById('foto')?.files[0];
    const cedulaFile = document.getElementById('cedula')?.files[0];
    
    // Validaciones
    if (!nombre || !telefono || !password) {
        alert('Todos los campos son obligatorios');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (!/^[0-9]{10,}$/.test(telefono)) {
        alert('Teléfono inválido (mínimo 10 dígitos)');
        return;
    }
    
    if (!fotoFile || !cedulaFile) {
        alert('Debes subir tu foto y cédula');
        return;
    }
    
    // Validar tamaño de archivos (máx 2MB)
    if (fotoFile.size > 2 * 1024 * 1024 || cedulaFile.size > 2 * 1024 * 1024) {
        alert('Las imágenes no deben superar los 2MB');
        return;
    }
    
    try {
        console.log('📝 Iniciando registro...');
        
        // 1. Crear usuario en Auth
        const email = `${telefono}@temp.taximoto.com`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre: nombre,
                    telefono: telefono,
                    rol: 'usuario'
                }
            }
        });
        
        if (authError) throw new Error(authError.message);
        if (!authData?.user) throw new Error('No se pudo crear el usuario');
        
        console.log('✅ Usuario creado en Auth:', authData.user.id);
        
        // 2. Subir archivos
        const timestamp = Date.now();
        const userId = authData.user.id;
        
        // Subir foto
        const fotoPath = `usuarios/${userId}/foto_${timestamp}.jpg`;
        const { error: fotoError } = await supabase.storage
            .from('fotos')
            .upload(fotoPath, fotoFile, { cacheControl: '3600' });
            
        if (fotoError) console.warn('⚠️ Error subiendo foto:', fotoError);
        
        // Subir cédula
        const cedulaPath = `usuarios/${userId}/cedula_${timestamp}.jpg`;
        const { error: cedulaError } = await supabase.storage
            .from('cedulas')
            .upload(cedulaPath, cedulaFile, { cacheControl: '3600' });
            
        if (cedulaError) console.warn('⚠️ Error subiendo cédula:', cedulaError);
        
        // Obtener URLs públicas
        const fotoUrl = fotoError ? null : supabase.storage.from('fotos').getPublicUrl(fotoPath).data.publicUrl;
        const cedulaUrl = cedulaError ? null : supabase.storage.from('cedulas').getPublicUrl(cedulaPath).data.publicUrl;
        
        // 3. Crear perfil en tabla usuarios
        const { error: dbError } = await supabase
            .from('usuarios')
            .insert({
                auth_id: authData.user.id,
                nombre: nombre,
                telefono: telefono,
                rol: 'usuario',
                foto_url: fotoUrl,
                cedula_url: cedulaUrl,
                activo: true // Usuarios normales se activan automáticamente
            });
            
        if (dbError) {
            // Si falla, intentar limpiar
            await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
            throw dbError;
        }
        
        // Guardar teléfono para recordar
        localStorage.setItem('taximoto_phone', telefono);
        
        alert('✅ Registro exitoso. Ya puedes iniciar sesión.');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        alert('Error: ' + (error.message || 'Error desconocido'));
    }
};

// =============================================
// REGISTRO DE CONDUCTOR
// =============================================
window.registrarConductor = async function(event) {
    event.preventDefault();
    
    const supabase = getSupabase();
    if (!supabase) return;
    
    // Obtener valores
    const tipo = document.getElementById('tipo')?.value;
    const nombre = document.getElementById('nombre')?.value?.trim();
    const telefono = document.getElementById('telefono')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const placa = document.getElementById('placa')?.value?.trim().toUpperCase();
    const modelo = document.getElementById('modelo')?.value?.trim();
    const color = document.getElementById('color')?.value?.trim();
    const fotoFile = document.getElementById('foto')?.files[0];
    const cedulaFile = document.getElementById('cedula')?.files[0];
    const licenciaFile = document.getElementById('licencia')?.files[0];
    
    // Validaciones básicas
    if (!nombre || !telefono || !password || !placa || !modelo || !color) {
        alert('Todos los campos son obligatorios');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (!fotoFile || !cedulaFile || !licenciaFile) {
        alert('Debes subir todos los documentos requeridos');
        return;
    }
    
    try {
        console.log('📝 Registrando conductor...');
        
        // 1. Crear usuario en Auth
        const email = `${telefono}@conductor.taximoto.com`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre: nombre,
                    telefono: telefono,
                    rol: tipo
                }
            }
        });
        
        if (authError) throw authError;
        
        // 2. Subir archivos
        const timestamp = Date.now();
        const userId = authData.user.id;
        
        // Subir foto
        const fotoPath = `conductores/${userId}/foto_${timestamp}.jpg`;
        await supabase.storage.from('fotos').upload(fotoPath, fotoFile);
        
        // Subir cédula
        const cedulaPath = `conductores/${userId}/cedula_${timestamp}.jpg`;
        await supabase.storage.from('cedulas').upload(cedulaPath, cedulaFile);
        
        // Subir licencia
        const licenciaPath = `conductores/${userId}/licencia_${timestamp}.jpg`;
        await supabase.storage.from('licencias').upload(licenciaPath, licenciaFile);
        
        // URLs públicas
        const fotoUrl = supabase.storage.from('fotos').getPublicUrl(fotoPath).data.publicUrl;
        const cedulaUrl = supabase.storage.from('cedulas').getPublicUrl(cedulaPath).data.publicUrl;
        const licenciaUrl = supabase.storage.from('licencias').getPublicUrl(licenciaPath).data.publicUrl;
        
        // 3. Crear perfil (inactivo hasta aprobación)
        const { data: usuario, error: dbError } = await supabase
            .from('usuarios')
            .insert({
                auth_id: authData.user.id,
                nombre: nombre,
                telefono: telefono,
                rol: tipo,
                foto_url: fotoUrl,
                cedula_url: cedulaUrl,
                licencia_url: licenciaUrl,
                activo: false
            })
            .select()
            .single();
            
        if (dbError) throw dbError;
        
        // 4. Crear datos de conductor
        await supabase
            .from('conductores')
            .insert({
                usuario_id: usuario.id,
                placa: placa,
                modelo: modelo,
                color: color,
                licencia_url: licenciaUrl
            });
        
        alert('✅ Registro completado. Tu cuenta está pendiente de activación.\n\nContacta al administrador: 04125278450');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
    }
};

// =============================================
// REGISTRO DE COMERCIO
// =============================================
window.registrarComercio = async function(event) {
    event.preventDefault();
    
    const supabase = getSupabase();
    if (!supabase) return;
    
    const nombre_comercio = document.getElementById('nombre_comercio')?.value?.trim();
    const nombre_dueno = document.getElementById('nombre_dueno')?.value?.trim();
    const telefono = document.getElementById('telefono')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const fotoFile = document.getElementById('foto')?.files[0];
    const cedulaFile = document.getElementById('cedula')?.files[0];
    
    if (!nombre_comercio || !nombre_dueno || !telefono || !password) {
        alert('Todos los campos son obligatorios');
        return;
    }
    
    try {
        const email = `${telefono}@comercio.taximoto.com`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (authError) throw authError;
        
        // Subir archivos
        const timestamp = Date.now();
        const userId = authData.user.id;
        
        const fotoPath = `comercios/${userId}/foto_${timestamp}.jpg`;
        await supabase.storage.from('fotos').upload(fotoPath, fotoFile);
        
        const cedulaPath = `comercios/${userId}/cedula_${timestamp}.jpg`;
        await supabase.storage.from('cedulas').upload(cedulaPath, cedulaFile);
        
        const fotoUrl = supabase.storage.from('fotos').getPublicUrl(fotoPath).data.publicUrl;
        const cedulaUrl = supabase.storage.from('cedulas').getPublicUrl(cedulaPath).data.publicUrl;
        
        // Crear perfil
        const { data: usuario, error: dbError } = await supabase
            .from('usuarios')
            .insert({
                auth_id: authData.user.id,
                nombre: nombre_dueno,
                telefono: telefono,
                rol: 'comercio',
                foto_url: fotoUrl,
                cedula_url: cedulaUrl,
                activo: false
            })
            .select()
            .single();
            
        if (dbError) throw dbError;
        
        // Crear comercio
        await supabase
            .from('comercios')
            .insert({
                usuario_id: usuario.id,
                nombre_comercio: nombre_comercio,
                nombre_dueno: nombre_dueno,
                foto_url: fotoUrl
            });
        
        alert('✅ Registro completado. Tu cuenta está pendiente de activación.\n\nContacta al administrador: 04125278450');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
    }
};

// =============================================
// LOGIN
// =============================================
window.login = async function(event) {
    event.preventDefault();
    
    const supabase = getSupabase();
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
            if (error.message.includes('Invalid login')) {
                alert('Teléfono o contraseña incorrectos');
            } else {
                alert('Error: ' + error.message);
            }
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
            .maybeSingle();
        
        if (userError) {
            console.error('Error obteniendo usuario:', userError);
        }
        
        if (usuario) {
            // Verificar si está activo (excepto usuarios normales)
            if (!usuario.activo && usuario.rol !== 'usuario' && usuario.rol !== 'admin') {
                alert('⏳ Tu cuenta está pendiente de activación.\n\nContacta al administrador: 04125278450');
                await supabase.auth.signOut();
                return;
            }
            
            // Redirección
            const rutas = {
                'admin': 'admin/dashboard.html',
                'taxi': 'conductor-dashboard.html',
                'mototaxi': 'conductor-dashboard.html',
                'comercio': 'comercio-dashboard.html',
                'usuario': 'request.html'
            };
            
            window.location.href = rutas[usuario.rol] || 'request.html';
        } else {
            window.location.href = 'completar-perfil.html';
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error de conexión');
    }
};

// =============================================
// LOGOUT SEGURO
// =============================================
window.logout = async function() {
    const supabase = getSupabase();
    if (supabase) {
        await supabase.auth.signOut();
    }
    window.location.href = 'index.html';
};

// =============================================
// VERIFICAR SESIÓN
// =============================================
window.checkSession = async function() {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error checking session:', error);
        return null;
    }
};

// =============================================
// OBTENER USUARIO ACTUAL
// =============================================
window.getCurrentUser = async function() {
    const session = await window.checkSession();
    if (!session) return null;
    
    const supabase = getSupabase();
    if (!supabase) return null;
    
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', session.user.id)
        .single();
        
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    
    return data;
};

// =============================================
// TOGGLE PASSWORD
// =============================================
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
};