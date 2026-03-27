const db = require('../config/db');
const { ensureUserInDb } = require('../utils/userSync');

// POST /api/v1/civic-issues
async function createCivicIssue(req, res) {
  try {
    const { userId } = req.auth || {};
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await ensureUserInDb(userId);
    const { category, description, lat, lng, address, photoUrls } = req.body;

    if (!category) {
      return res.status(400).json({ message: 'category is required' });
    }

    const validCategories = [
      'road_damage', 'electricity', 'drainage', 'pipe_leakage',
      'garbage', 'water_supply', 'streetlight', 'other'
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: `Invalid category. Allowed: ${validCategories.join(', ')}`
      });
    }

    // Build location point if lat/lng provided
    let locationExpr = 'NULL';
    const params = [
      user.id,
      user.clerk_user_id,
      user.full_name,
      user.phone,
      category,
      description || null,
      photoUrls || null,
      address || null,
    ];

    if (lat !== undefined && lng !== undefined) {
      locationExpr = `ST_SetSRID(ST_MakePoint($9, $10), 4326)`;
      params.push(parseFloat(lng), parseFloat(lat));
    }

    const result = await db.query(
      `INSERT INTO civic_issues
        (reporter_id, clerk_reporter_id, reporter_name, reporter_phone, category, description, photo_urls, address, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${locationExpr})
       RETURNING *,
         ST_X(location::geometry) AS lng,
         ST_Y(location::geometry) AS lat`,
      params
    );

    const issue = result.rows[0];

    // Emit via Socket.IO so admin maps / other clients pick it up in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('new_civic_issue', {
        id: issue.id,
        category: issue.category,
        description: issue.description,
        reporter_name: issue.reporter_name,
        photo_urls: issue.photo_urls,
        address: issue.address,
        status: issue.status,
        location: issue.location ? {
          type: 'Point',
          coordinates: [issue.lng, issue.lat],
        } : null,
        created_at: issue.created_at,
      });
    }

    res.status(201).json(issue);
  } catch (err) {
    console.error('Error creating civic issue:', err.message, err.stack);
    res.status(500).json({ message: 'Failed to create civic issue', detail: err.message });
  }
}

// GET /api/v1/civic-issues
async function listCivicIssues(req, res) {
  try {
    const { status, category } = req.query;

    let queryText = `
      SELECT ci.*,
             ST_X(ci.location::geometry) AS lng,
             ST_Y(ci.location::geometry) AS lat,
             u.full_name AS reporter_name,
             u.phone AS reporter_phone
      FROM civic_issues ci
      LEFT JOIN users u ON u.id = ci.reporter_id
    `;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`ci.status = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`ci.category = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` ORDER BY ci.created_at DESC LIMIT 200`;

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error listing civic issues:', err);
    res.status(500).json({ message: 'Failed to list civic issues' });
  }
}

// GET /api/v1/civic-issues/:id
async function getCivicIssueById(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT ci.*,
              ST_X(ci.location::geometry) AS lng,
              ST_Y(ci.location::geometry) AS lat
       FROM civic_issues ci
       WHERE ci.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Civic issue not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching civic issue:', err);
    res.status(500).json({ message: 'Failed to fetch civic issue' });
  }
}

// PATCH /api/v1/civic-issues/:id/status
async function updateCivicIssueStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const role = req.role || 'user';

    const validStatuses = ['pending', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${validStatuses.join(', ')}`
      });
    }

    // Only admin / coordinator can update status
    if (!['admin', 'coordinator'].includes(role)) {
      return res.status(403).json({ message: 'Only admins or coordinators can update civic issue status' });
    }

    const result = await db.query(
      `UPDATE civic_issues
       SET status = $1,
           resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *,
         ST_X(location::geometry) AS lng,
         ST_Y(location::geometry) AS lat`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Civic issue not found' });
    }

    const issue = result.rows[0];

    // Emit update event
    const io = req.app.get('io');
    if (io) {
      if (status === 'resolved') {
        io.emit('civic_issue_resolved', { id: issue.id });
      } else {
        io.emit('civic_issue_updated', issue);
      }
    }

    res.json(issue);
  } catch (err) {
    console.error('Error updating civic issue status:', err);
    res.status(500).json({ message: 'Failed to update civic issue status' });
  }
}

// DELETE /api/v1/civic-issues/:id
async function deleteCivicIssue(req, res) {
  try {
    const { id } = req.params;
    const role = req.role || 'user';

    if (!['admin', 'coordinator'].includes(role)) {
      return res.status(403).json({ message: 'Only admins or coordinators can delete civic issues' });
    }

    const result = await db.query('DELETE FROM civic_issues WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Civic issue not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('civic_issue_resolved', { id });
    }

    res.json({ message: 'Civic issue deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting civic issue:', err);
    res.status(500).json({ message: 'Failed to delete civic issue' });
  }
}

module.exports = {
  createCivicIssue,
  listCivicIssues,
  getCivicIssueById,
  updateCivicIssueStatus,
  deleteCivicIssue,
};
