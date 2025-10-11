// ===============================
// Creations Controller
// Handles fetching, publishing, and liking creations
// ===============================

import sql from "../configs/db.js"; // SQL client for database operations

/**
 * Fetch all creations by the authenticated user.
 * Ordered by most recent first.
 */
export const getUserCreations = async (req, res) => {
  try {
    const { userId } = req.auth(); // Get user ID from auth middleware

    // Fetch user's creations from DB
    const creations = await sql`
      SELECT * FROM creations
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    res.json({ success: true, creations });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/**
 * Fetch all published creations.
 * Ordered by most recent first.
 */
export const getPublishedCreations = async (req, res) => {
  try {
    // Fetch creations marked as published
    const creations = await sql`
      SELECT * FROM creations
      WHERE publish = true
      ORDER BY created_at DESC
    `;

    res.json({ success: true, creations });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/**
 * Toggle like/unlike for a creation by the authenticated user.
 * Adds or removes the user's ID from the creation's likes array.
 */
export const toggleLikeCreation = async (req, res) => {
  try {
    const { userId } = req.auth(); // Authenticated user's ID
    const { id } = req.body; // Creation ID

    // Fetch the creation by ID
    const [creation] = await sql`SELECT * FROM creations WHERE id = ${id}`;
    if (!creation) {
      return res.json({ success: false, message: "Creation not found" });
    }

    const currentLikes = creation.likes;
    const userIdStr = userId.toString();
    let updatedLikes, message;

    // Add or remove user from likes array
    if (currentLikes.includes(userIdStr)) {
      updatedLikes = currentLikes.filter((user) => user !== userIdStr);
      message = "Creation Unliked";
    } else {
      updatedLikes = [...currentLikes, userIdStr];
      message = "Creation Liked";
    }

    // Convert JS array to PostgreSQL text[] format
    const formattedArray = `{${updatedLikes.join(",")}}`;

    // Update likes in DB
    await sql`UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${id}`;

    res.json({ success: true, message });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
