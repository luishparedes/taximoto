// Sistema de solicitudes de viajes

// Solicitar viaje
async function solicitarViaje(event) {
    event.preventDefault();
    
    const tipo = document.getElementById('tipo').value;
    const origen = document.getElementById('origen').value;
    const destino = document.getElementById('destino').value;
    
    try {
        const usuario = await getCurrentUser();
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
        
        alert('Viaje solicitado. Esperando conductor...');
        
        // Escuchar aceptación en tiempo real
        escucharAceptacionViaje(viaje.id);
        
    } catch (error) {
        console.error('Error al solicitar viaje:', error);
        alert('Error: ' + error.message);
    }
}

// Escuchar aceptación de viaje
function escucharAceptacionViaje(viajeId) {
    const subscription = supabase
        .channel('viajes-aceptados')
        .on('postgres_changes', 
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'viajes',
                filter: `id=eq.${viajeId}`
            },
            async (payload) => {
                if (payload.new.estado === 'aceptado') {
                    // Obtener datos del conductor
                    const { data: conductor } = await supabase
                        .from('conductores')
                        .select('*, usuarios(*)')
                        .eq('id', payload.new.conductor_id)
                        .single();
                    
                    const mensaje = `Tu conductor es ${conductor.usuarios.nombre}, ${conductor.color} ${conductor.modelo}`;
                    document.getElementById('estado-viaje').innerHTML = `
                        <div class="card">
                            <h3>${mensaje}</h3>
                            <div class="contact-buttons">
                                <a href="tel:${conductor.usuarios.telefono}" class="btn btn-call">Llamar</a>
                                <a href="https://wa.me/${conductor.usuarios.telefono}" class="btn btn-whatsapp" target="_blank">WhatsApp</a>
                            </div>
                            <button onclick="finalizarViaje('${viajeId}')" class="btn btn-primary">Viaje terminado</button>
                        </div>
                    `;
                    
                    subscription.unsubscribe();
                }
            }
        )
        .subscribe();
}

// Aceptar viaje (para conductores)
async function aceptarViaje(viajeId) {
    try {
        const usuario = await getCurrentUser();
        if (!usuario || !usuario.conductores) {
            alert('Solo conductores pueden aceptar viajes');
            return;
        }
        
        const { error } = await supabase
            .from('viajes')
            .update({
                conductor_id: usuario.conductores.id,
                estado: 'aceptado',
                aceptado_at: new Date()
            })
            .eq('id', viajeId)
            .eq('estado', 'solicitado');
            
        if (error) throw error;
        
        alert('Viaje aceptado');
        
    } catch (error) {
        console.error('Error al aceptar viaje:', error);
        alert('Error: ' + error.message);
    }
}

// Finalizar viaje
async function finalizarViaje(viajeId) {
    try {
        const { error } = await supabase
            .from('viajes')
            .update({
                estado: 'finalizado',
                finalizado_at: new Date()
            })
            .eq('id', viajeId);
            
        if (error) throw error;
        
        // Mostrar calificación
        mostrarCalificacion(viajeId);
        
    } catch (error) {
        console.error('Error al finalizar viaje:', error);
        alert('Error: ' + error.message);
    }
}

// Mostrar calificación
function mostrarCalificacion(viajeId) {
    const container = document.getElementById('calificacion-container');
    container.innerHTML = `
        <div class="card">
            <h3>Califica tu viaje</h3>
            <div class="rating" id="rating-stars">
                <span class="star" data-value="1">★</span>
                <span class="star" data-value="2">★</span>
                <span class="star" data-value="3">★</span>
                <span class="star" data-value="4">★</span>
                <span class="star" data-value="5">★</span>
            </div>
            <button onclick="enviarCalificacion('${viajeId}')" class="btn btn-primary">Enviar calificación</button>
        </div>
    `;
    
    // Event listeners para estrellas
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            const valor = this.dataset.value;
            document.querySelectorAll('.star').forEach(s => {
                s.classList.toggle('active', s.dataset.value <= valor);
            });
            window.calificacionSeleccionada = valor;
        });
    });
}

// Enviar calificación
async function enviarCalificacion(viajeId) {
    if (!window.calificacionSeleccionada) {
        alert('Selecciona una calificación');
        return;
    }
    
    try {
        const usuario = await getCurrentUser();
        
        // Obtener datos del viaje
        const { data: viaje } = await supabase
            .from('viajes')
            .select('*')
            .eq('id', viajeId)
            .single();
        
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
        
        alert('¡Gracias por calificar!');
        window.location.reload();
        
    } catch (error) {
        console.error('Error al calificar:', error);
        alert('Error: ' + error.message);
    }
}

// Escuchar nuevas solicitudes (para conductores)
function escucharSolicitudes() {
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
                mostrarNuevaSolicitud(payload.new);
            }
        )
        .subscribe();
}

// Mostrar nueva solicitud
function mostrarNuevaSolicitud(viaje) {
    const container = document.getElementById('solicitudes-container');
    container.innerHTML += `
        <div class="card" id="viaje-${viaje.id}">
            <h3>${viaje.tipo_vehiculo === 'taxi' ? '🚕 Taxi' : '🛵 Moto'}</h3>
            <p><strong>Origen:</strong> ${viaje.origen}</p>
            <p><strong>Destino:</strong> ${viaje.destino}</p>
            <button onclick="aceptarViaje('${viaje.id}')" class="btn btn-primary">Aceptar viaje</button>
        </div>
    `;
}