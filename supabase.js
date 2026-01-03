const { createClient } = supabase;
const SB_URL = "https://iogpnvljnhsxuzzdltpb.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZ3BudmxqbmhzeHV6emRsdHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NTk2MDYsImV4cCI6MjA4MjMzNTYwNn0.Kxy3QW1gq-J-tzUF2fxQd0l989Wr7BI2uRTbWDTNL6k";

window.sb = createClient(SB_URL, SB_KEY);

