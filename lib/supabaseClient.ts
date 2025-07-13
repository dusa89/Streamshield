import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gyydymiquugsgzyyehkh.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWR5bWlxdXVnc2d6eXllaGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjQ3OTMsImV4cCI6MjA2NjIwMDc5M30.aNSqoPLTZPEIGTmDqDiIgm6qWy99YAohCC_ZgRfdmto";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
