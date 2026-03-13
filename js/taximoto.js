// js/taximoto.js

const SUPABASE_URL = 'https://kamcozmlzgvixaopsiqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWNvem1semd2aXhhb3BzaXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjY1NTYsImV4cCI6MjA4ODc0MjU1Nn0.oCdHd4mPEMMhctsCNcviXLFuwrDuLSym5raTmTtUtGQ';

// Inicializar cliente Supabase
let supabaseInstance;
if (typeof supabase !== 'undefined') {
    supabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('La librería Supabase no está cargada.');
}

// Función global para obtener el cliente
window.getSupabase = function() {
    return supabaseInstance;
};