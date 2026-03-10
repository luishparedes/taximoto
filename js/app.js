// js/app.js
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const loadingScreen = document.getElementById('loading-screen');
        const appContent = document.getElementById('app');
        
        if (loadingScreen && appContent) {
            loadingScreen.style.display = 'none';
            appContent.style.display = 'block';
        }
    }, 1000);
    
    console.log('✅ Taximoto iniciado correctamente');
});

window.showError = function(message) {
    alert('Error: ' + message);
};

window.showSuccess = function(message) {
    alert('Éxito: ' + message);
};