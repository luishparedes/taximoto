// supabase/config.js
// Configuración de Supabase para Taximoto

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Las claves de Supabase (SON PÚBLICAS Y SEGURAS PARA EL CLIENTE)
const supabaseUrl = 'https://zzpytqixsvxeoyqonsul.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cHl0cWl4c3Z4ZW95cW9uc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1OTU5MTAsImV4cCI6MjA1NzE3MTkxMH0.dxJkF_nj2NhIvFaKyiWgiQ_PAx5ZQLZ'

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Configuración de Supabase cargada')