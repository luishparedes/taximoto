// =============================================
// SUPABASE CONFIG - VERSIÓN QUE SÍ FUNCIONA
// =============================================

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWNvem1semd2aXhhb3BzaXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjY1NTYsImV4cCI6MjA4ODc0MjU1Nn0.oCdHd4mPEMMhctsCNcviXLFuwrDuLSym5raTmTtUtGQ';

// ESPERAR a que la librería cargue
document.addEventListener('DOMContentLoaded', function() {
    if (typeof supabaseJs !== 'undefined') {
        window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase listo');
        
        // Probar que funciona
        if (window.supabase && window.supabase.auth) {
            console.log('✅ Auth disponible');
        } else {
            console.log('❌ Auth no disponible');
        }
    } else {
        console.error('❌ supabaseJs no está definido');
    }
});

// Helper para obtener Supabase
window.getSupabase = function() {
    return window.supabase;
};