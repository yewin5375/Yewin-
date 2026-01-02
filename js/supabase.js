// Supabase Connection
const SB_URL = "https://iogpnvljnhsxuzzdltpb.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZ3BudmxqbmhzeHV6emRsdHBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc1OTYwNiwiZXhwIjoyMDgyMzM1NjA2fQ.rNXHHO8PKO58ZXR4Eqzi6Bl0vzCIwH24jiwOVwbVPoc";

const sb = supabase.createClient(SB_URL, SB_KEY);
