// DO NOT create Supabase client at module scope here.
// Keep this as a browser-only shim to avoid "supabaseKey is required" during prerender.
export { supabaseBrowser as supabase } from './supabase-browser';
