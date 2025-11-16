// ═══════════════════════════════════════════════════════════
// API: /api/comments.js
// CRUD Operations for Comments
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // ═══════════════════════════════════════════════════════════
    // GET: Retrieve comments for a project
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'GET') {
      const { project_id } = req.query

      if (!project_id) {
        return res.status(400).json({
          success: false,
          error: 'project_id is required'
        })
      }

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', project_id)
        .order('created_at', { ascending: true })

      if (error) throw error

      return res.status(200).json({
        success: true,
        data: data || [],
        count: data?.length || 0
      })
    }

    // ═══════════════════════════════════════════════════════════
    // POST: Create new comment
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'POST') {
      const { project_id, author, text } = req.body

      if (!project_id || !author || !text) {
        return res.status(400).json({
          success: false,
          error: 'project_id, author, and text are required'
        })
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([{ project_id, author, text }])
        .select()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert([
        {
          project_id,
          action: 'COMMENT',
          description: `${author} commented`,
          user_name: author
        }
      ])

      return res.status(201).json({
        success: true,
        data: data[0]
      })
    }

    // ═══════════════════════════════════════════════════════════
    // DELETE: Delete comment
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Comment ID is required'
        })
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
