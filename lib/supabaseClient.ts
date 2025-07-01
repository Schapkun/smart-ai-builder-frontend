import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://rybezhoovslkutsugzvv.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5YmV6aG9vdnNsa3V0c3VnenZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMjMwNDgsImV4cCI6MjA2NDc5OTA0OH0.JihNgpfEygljiszxH7wYD1NKW6smmg17rgP1fJcMxBA"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
