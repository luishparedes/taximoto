// Sistema de autenticación

// Función para registrar usuario normal
async function registrarUsuario(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const password = document.getElementById('password').value;
    const fotoFile = document.getElementById('foto').files[0];
    const cedulaFile = document.getElementById('cedula').files[0];
    
    try {
        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: `${telefono}@taximoto.com`, // Usamos teléfono como email único
            password: password,
            phone: telefono
        });
        
        if (authError) throw authError;
        
        // 2. Subir foto
        const fotoPath = `usuarios/${authData.user.id}/foto.jpg`;
        const { error: fotoError } = await supabase.storage
            .from('fotos')
            .upload(fotoPath, fotoFile);
            
        if (fotoError) throw fotoError;
        
        // 3. Subir cédula
        const cedulaPath = `usuarios/${authData.user.id}/cedula.jpg`;
        const { error: cedulaError } = await supabase.storage
            .from('cedulas')
            .upload(cedulaPath, cedulaFile);
            
        if (cedulaError) throw cedulaError;
        
        // 4. Obtener URLs públicas
        const fotoUrl = supabase.storage.from('fotos').getPublicUrl(fotoPath).data.publicUrl;
        const cedulaUrl = supabase.storage.from('cedulas').getPublicUrl(cedulaPath).data.publicUrl;
        
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
                activo: true // Usuarios normales se activan automáticamente
            });
            
        if (dbError) throw dbError;
        
        alert('Registro exitoso. Ya puedes iniciar sesión.');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Error en registro:', error);
        alert('Error en el registro: ' + error.message);
    }
}

// Función para registrar conductor
async function registrarConductor(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const password = document.getElementById('password').value;
    const tipo = document.getElementById('tipo').value;
    const placa = document.getElementById('placa').value;
    const modelo = document.getElementById('modelo').value;
    const color = document.getElementById('color').value;
    const fotoFile = document.getElementById('foto').files[0];
    const cedulaFile = document.getElementById('cedula').files[0];
    const licenciaFile = document.getElementById('licencia').files[0];
    
    try {
        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: `${telefono}@taximoto.com`,
            password: password,
            phone: telefono
        });
        
        if (authError) throw authError;
        
        // 2. Subir archivos
        const fotoPath = `conductores/${authData.user.id}/foto.jpg`;
        const cedulaPath = `conductores/${authData.user.id}/cedula.jpg`;
        const licenciaPath = `conductores/${authData.user.id}/licencia.jpg`;
        
        await supabase.storage.from('fotos').upload(fotoPath, fotoFile);
        await supabase.storage.from('cedulas').upload(cedulaPath, cedulaFile);
        await supabase.storage.from('licencias').upload(licenciaPath, licenciaFile);
        
        const fotoUrl = supabase.storage.from('fotos').getPublicUrl(fotoPath).data.publicUrl;
        const cedulaUrl = supabase.storage.from('cedulas').getPublicUrl(cedulaPath).data.publicUrl;
        const licenciaUrl = supabase.storage.from('licencias').getPublicUrl(licenciaPath).data.publicUrl;
        
        // 3. Crear usuario
        const { data: usuarioData, error: dbError } = await supabase
            .from('usuarios')
            .insert({
                auth_id: authData.user.id,
                nombre: nombre,
                telefono: telefono,
                rol: tipo,
                foto_url: fotoUrl,
                cedula_url: cedulaUrl,
                activo: false
            })
            .select()
            .single();
            
        if (dbError) throw dbError;
        
        // 4. Crear registro en conductores
        const { error: conductorError } = await supabase
            .from('conductores')
            .insert({
                usuario_id: usuarioData.id,
                tipo_vehiculo: tipo,
                licencia_url: licenciaUrl,
                placa: placa,
                modelo: modelo,
                color: color
            });
            
        if (conductorError) throw conductorError;
        
        alert('Registro exitoso. Tu cuenta está pendiente de activación. Comunícate con el administrador: 04125278450');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Error en registro conductor:', error);
        alert('Error en el registro: ' + error.message);
    }
}

// Función para registrar comercio
async function registrarComercio(event) {
    event.preventDefault();
    
    const nombre_comercio = document.getElementById('nombre_comercio').value;
    const telefono = document.getElementById('telefono').value;
    const password = document.getElementById('password').value;
    const nombre_dueno = document.getElementById('nombre_dueno').value;
    const fotoFile = document.getElementById('foto').files[0];
    const cedulaFile = document.getElementById('cedula').files[0];
    
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: `${telefono}@taximoto.com`,
            password: password,
            phone: telefono
        });
        
        if (authError) throw authError;
        
        const fotoPath = `comercios/${authData.user.id}/foto.jpg`;
        const cedulaPath = `comercios/${authData.user.id}/cedula.jpg`;
        
        await supabase.storage.from('fotos').upload(fotoPath, fotoFile);
        await supabase.storage.from('cedulas').upload(cedulaPath, cedulaFile);
        
        const fotoUrl = supabase.storage.from('fotos').getPublicUrl(fotoPath).data.publicUrl;
        const cedulaUrl = supabase.storage.from('cedulas').getPublicUrl(cedulaPath).data.publicUrl;
        
        const { data: usuarioData, error: dbError } = await supabase
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
        
        const { error: comercioError } = await supabase
            .from('comercios')
            .insert({
                usuario_id: usuarioData.id,
                nombre_comercio: nombre_comercio
            });
            
        if (comercioError) throw comercioError;
        
        alert('Registro exitoso. Tu cuenta está pendiente de activación. Comunícate con el administrador: 04125278450');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Error en registro comercio:', error);
        alert('Error en el registro: ' + error.message);
    }
}

// Función de login
async function login(event) {
    event.preventDefault();
    
    const telefono = document.getElementById('telefono').value;
    const password = document.getElementById('password').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: `${telefono}@taximoto.com`,
            password: password
        });
        
        if (error) throw error;
        
        // Verificar si está activo
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_id', data.user.id)
            .single();
            
        if (!usuario.activo && usuario.rol !== 'usuario') {
            alert('Tu cuenta está pendiente de activación. Comunícate con el administrador: 04125278450');
            await supabase.auth.signOut();
            return;
        }
        
        // Redirigir según rol
        switch(usuario.rol) {
            case 'admin':
                window.location.href = 'admin/dashboard.html';
                break;
            case 'taxi':
            case 'mototaxi':
                window.location.href = 'conductor-dashboard.html';
                break;
            case 'comercio':
                window.location.href = 'comercio-dashboard.html';
                break;
            default:
                window.location.href = 'request.html';
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        alert('Error en login: ' + error.message);
    }
}

// Función de logout
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// Verificar sesión actual
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Obtener usuario actual con datos
async function getCurrentUser() {
    const session = await checkSession();
    if (!session) return null;
    
    const { data: usuario } = await supabase
        .from('usuarios')
        .select('*, conductores(*), comercios(*)')
        .eq('auth_id', session.user.id)
        .single();
        
    return usuario;
}