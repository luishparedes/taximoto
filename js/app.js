// js/app.js
// Archivo principal de JavaScript para Taximoto

// Esperamos a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // Mostrar la aplicación después de una pequeña pausa (simula carga)
    setTimeout(function() {
        const loadingScreen = document.getElementById('loading-screen');
        const appContent = document.getElementById('app');
        
        if (loadingScreen && appContent) {
            loadingScreen.style.display = 'none';
            appContent.style.display = 'block';
        }
    }, 1000); // 1 segundo de carga
    
    // Detectar qué página estamos visitando para marcar el menú activo
    highlightActiveMenu();
    
    // Configurar todos los botones y formularios
    setupEventListeners();
    
    console.log('✅ Taximoto iniciado correctamente');
});

// Función para marcar el elemento del menú activo según la página
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    });
}

// Función para configurar event listeners globales
function setupEventListeners() {
    // Proteger contra clics en enlaces rotos (para desarrollo)
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Si el enlace es un "#" o javascript:void(0)
            if (href === '#' || href === 'javascript:void(0)') {
                e.preventDefault();
                console.log('🔗 Enlace no implementado aún:', href);
                alert('Esta función estará disponible próximamente.');
            }
            
            // Si el enlace no existe o está vacío
            if (!href || href === '') {
                e.preventDefault();
            }
        });
    });
}

// Función para mostrar mensajes de error (útil para toda la app)
window.showError = function(message, elementId = 'error-message') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    } else {
        alert('Error: ' + message);
    }
};

// Función para mostrar mensajes de éxito
window.showSuccess = function(message, elementId = 'success-message') {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.add('show');
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            successElement.classList.remove('show');
        }, 5000);
    } else {
        alert('Éxito: ' + message);
    }
};

// Función para validar email (formato básico)
window.validateEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

// Función para sanitizar texto (protección contra XSS)
window.sanitizeText = function(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Función para verificar si el usuario está logueado
window.isUserLoggedIn = function() {
    const session = localStorage.getItem('taximoto_session');
    return session ? JSON.parse(session) : null;
};

// Función para cerrar sesión
window.logout = function() {
    localStorage.removeItem('taximoto_session');
    window.location.href = 'index.html';
};