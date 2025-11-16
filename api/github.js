// API: /api/github.js - GitHub Integration
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN

  if (!GITHUB_TOKEN) {
    return res.status(500).json({
      success: false,
      error: 'GitHub token not configured'
    })
  }

  try {
    const { action, repo, owner } = req.query

    // GET USER REPOS
    if (action === 'repos') {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        return res.status(response.status).json({
          success: false,
          error: `GitHub API error: ${error.message || response.statusText}`
        })
      }

      const repos = await response.json()

      if (!Array.isArray(repos)) {
        return res.status(500).json({
          success: false,
          error: 'Invalid response from GitHub API',
          debug: typeof repos
        })
      }

      return res.status(200).json({
        success: true,
        data: repos.map(repo => ({
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          updated_at: repo.updated_at
        })),
        count: repos.length
      })
    }

    // GET REPO FILES
    if (action === 'files' && owner && repo) {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      const data = await response.json()

      return res.status(200).json({
        success: true,
        data: data.tree,
        count: data.tree?.length || 0
      })
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action'
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
