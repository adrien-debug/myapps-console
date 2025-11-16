// ═══════════════════════════════════════════════════════════
// API: /api/projects.js
// CRUD Operations for Projects
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // ═══════════════════════════════════════════════════════════
    // GET: Retrieve all projects
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({
        success: true,
        data: data || [],
        count: data?.length || 0
      })
    }

    // ═══════════════════════════════════════════════════════════
    // POST: Create new project
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'POST') {
      const {
        name,
        title,
        description,
        project_type = 'mobile',
        icon = '📱',
        category = 'development'
      } = req.body

      // Validate required fields
      if (!name || !title) {
        return res.status(400).json({
          success: false,
          error: 'Name and title are required'
        })
      }

      // Create project
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: name.toLowerCase().replace(/\s+/g, '-'),
            title,
            description: description || 'New project description',
            project_type,
            status: 'active',
            category,
            progress: 0,
            icon,
            content: {
              kicker: 'New Project',
              sections: [
                {
                  id: 'overview',
                  title: 'Overview',
                  content: '<p>Project overview will be added here.</p>'
                }
              ]
            }
          }
        ])
        .select()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert([
        {
          project_id: data[0].id,
          action: 'CREATE',
          description: `Project created: ${title}`,
          user_name: 'System'
        }
      ])

      return res.status(201).json({
        success: true,
        data: data[0]
      })
    }

    // ═══════════════════════════════════════════════════════════
    // PUT: Update project
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        })
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert([
        {
          project_id: id,
          action: 'UPDATE',
          description: 'Project updated',
          user_name: 'System'
        }
      ])

      return res.status(200).json({
        success: true,
        data: data[0]
      })
    }

    // ═══════════════════════════════════════════════════════════
    // DELETE: Soft delete project
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        })
      }

      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      return res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      })
    }

    // Method not allowed
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
