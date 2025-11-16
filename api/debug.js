export default function handler(req, res) {
  return res.json({
    github_token_exists: !!process.env.GITHUB_TOKEN,
    github_token_length: process.env.GITHUB_TOKEN?.length || 0,
    github_token_first_10: process.env.GITHUB_TOKEN?.substring(0, 10) || 'MISSING',
    supabase_url_exists: !!process.env.SUPABASE_URL,
    supabase_key_exists: !!process.env.SUPABASE_ANON_KEY,
    all_env_vars: Object.keys(process.env).sort()
  })
}
