// =============================================
// SOLICITUDES DE VIAJES - CORREGIDO
// =============================================

function getSupabase() {
    return window.supabase;
}

// =============================================
// SOLICITAR VIAJE
// =============================================
window.solicitarViaje = async function(event) {
    event.preventDefault();
    
    const supabase = getSupabase();
    if (!supabase) {
        alert('Error de conexión');
        return;
    }
    
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
        
        // Crear viaje
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
        
        // Limpiar formulario
        document.getElementById('solicitar-form')?.reset();
        
        // Mostrar mensaje de espera
        const estadoDiv = document.getElementById('estado-viaje');
        if (estadoDiv) {
            estadoDiv.innerHTML = `
                <div class="card">
                    <h3>⏳ Buscando conductor...</h3>
                    <p>Viaje solicitado. Espera a que un conductor acepte.</p>
                </div>
            `;
        }
        
        // Escuchar aceptación
        if (viaje?.id) {
            window.escucharAceptacionViaje(viaje.id);
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + (error.message || 'No se pudo crear el viaje'));
    }
};

// =============================================
// ESCUCHAR ACEPTACIÓN DE VIAJE
// =============================================
window.escucharAceptacionViaje = function(viajeId) {
    const supabase = getSupabase();
    if (!supabase) return;
    
    const channel = supabase
        .channel('viaje-' + viajeId)
        .on('postgres_changes', 
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'viajes',
                filter: `id=eq.${viajeId}`
            },
            async (payload) => {
                if (payload.new.estado === 'aceptado' && payload.new.conductor_id) {
                    try {
                        // Obtener datos del conductor
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
                                    <div style="display: flex; gap: 10px; margin: 15px 0;">
                                        <a href="tel:${conductor.telefono}" class="btn btn-primary" style="flex: 1;">📞 Llamar</a>
                                        <a href="https://wa.me/${conductor.telefono}" class="btn btn-secondary" style="flex: 1;" target="_blank">💬 WhatsApp</a>
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

// =============================================
// ACEPTAR VIAJE (Conductor)
// =============================================
window.aceptarViaje = async function(viajeId) {
    const supabase = getSupabase();
    if (!supabase) return;
    
    try {
        const usuario = await window.getCurrentUser();
        if (!usuario) {
            alert('Debes iniciar sesión');
            return;
        }
        
        if (!['taxi', 'mototaxi'].includes(usuario.rol)) {
            alert('Solo conductores pueden aceptar viajes');
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
        
        // Ocultar la solicitud
        const elemento = document.getElementById(`viaje-${viajeId}`);
        if (elemento) elemento.remove();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
};

// =============================================
// FINALIZAR VIAJE
// =============================================
window.finalizarViaje = async function(viajeId) {
    const supabase = getSupabase();
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
        
        // Mostrar calificación
        window.mostrarCalificacion(viajeId);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
};

// =============================================
// MOSTRAR CALIFICACIÓN
// =============================================
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
    
    // Event listeners para estrellas
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

// =============================================
// ENVIAR CALIFICACIÓN
// =============================================
window.enviarCalificacion = async function(viajeId) {
    const supabase = getSupabase();
    if (!supabase) return;
    
    if (!window.calificacionSeleccionada) {
        alert('Selecciona una calificación');
        return;
    }
    
    try {
        const usuario = await window.getCurrentUser();
        if (!usuario) return;
        
        // Obtener datos del viaje
        const { data: viaje, error: viajeError } = await supabase
            .from('viajes')
            .select('conductor_id')
            .eq('id', viajeId)
            .single();
            
        if (viajeError) throw viajeError;
        
        // Guardar calificación
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
        
        // Limpiar
        const container = document.getElementById('calificacion-container');
        if (container) container.innerHTML = '';
        
        const estadoDiv = document.getElementById('estado-viaje');
        if (estadoDiv) estadoDiv.innerHTML = '';
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
};

// =============================================
// ESCUCHAR SOLICITUDES (Conductores)
// =============================================
window.escucharSolicitudes = function() {
    const supabase = getSupabase();
    if (!supabase) return;
    
    supabase
        .channel('nuevos-viajes')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'viajes',
                filter: 'estado=eq.solicitado'
            },
            (payload) => {
                window.mostrarNuevaSolicitud(payload.new);
            }
        )
        .subscribe();
};

// =============================================
// MOSTRAR NUEVA SOLICITUD
// =============================================
window.mostrarNuevaSolicitud = function(viaje) {
    const container = document.getElementById('solicitudes-container');
    if (!container) return;
    
    const icono = viaje.tipo_vehiculo === 'taxi' ? '🚕' : '🛵';
    const tipoTexto = viaje.tipo_vehiculo === 'taxi' ? 'Taxi' : 'Mototaxi';
    
    container.innerHTML += `
        <div class="card" id="viaje-${viaje.id}">
            <h3>${icono} Solicitud de ${tipoTexto}</h3>
            <p><strong>📍 Origen:</strong> ${viaje.origen}</p>
            <p><strong>🎯 Destino:</strong> ${viaje.destino}</p>
            <p><small>Solicitado: ${new Date(viaje.creado_en).toLocaleTimeString()}</small></p>
            <button onclick="window.aceptarViaje('${viaje.id}')" class="btn btn-primary">✅ Aceptar viaje</button>
        </div>
    `;
};

// =============================================
// CARGAR VIAJES DEL CONDUCTOR
// =============================================
window.cargarViajesConductor = async function() {
    const supabase = getSupabase();
    if (!supabase) return;
    
    try {
        const usuario = await window.getCurrentUser();
        if (!usuario) return;
        
        const { data: viajes, error } = await supabase
            .from('viajes')
            .select(`
                *,
                usuarios!viajes_usuario_id_fkey (nombre, telefono)
            `)
            .eq('conductor_id', usuario.id)
            .order('creado_en', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        const container = document.getElementById('historial-container');
        if (!container) return;
        
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