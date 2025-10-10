// Import the SQL client configured to connect to the database
import sql from "../configs/db.js";

/**
 * Fetches all creations made by the authenticated user.
 * Returns them in descending order of creation time.
 */
export const getUserCreations = async (req, res) => {
  try {
    // Extract the authenticated user's ID from the request
    const { userId } = req.auth();

    // Query the database for creations by this user, ordered by most recent
    const creations =
      await sql`SELECT * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`;

    // Respond with the list of creations
    res.json({ success: true, creations });
  } catch (error) {
    // Handle any errors during the query
    res.json({ success: false, message: error.message });
  }
};

/**
 * Fetches all creations that have been published.
 * Returns them in descending order of creation time.
 */
export const getPublishedCreations = async (req, res) => {
  try {
    // Query the database for published creations
    const creations =
      await sql`SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`;

    // Respond with the list of published creations
    res.json({ success: true, creations });
  } catch (error) {
    // Handle any errors during the query
    res.json({ success: false, message: error.message });
  }
};

/**
 * Toggles the like status of a creation for the authenticated user.
 * Adds or removes the user's ID from the creation's likes array.
 */
export const toggleLikeCreation = async (req, res) => {
  try {
    // Extract the authenticated user's ID and the creation ID from the request
    const { userId } = req.auth();
    const { id } = req.body;

    // Fetch the creation by ID
    const [creation] = await sql`SELECT * FROM creations WHERE id = ${id}`;
    if (!creation) {
      // If the creation doesn't exist, return an error
      return res.json({ success: false, message: "Creation not found" });
    }

    // Convert the user ID to string for comparison
    const currentLikes = creation.likes;
    const userIdStr = userId.toString();
    let updatedLikes;
    let message;

    // Check if the user has already liked the creation
    if (currentLikes.includes(userIdStr)) {
      // If liked, remove the user from the likes array
      updatedLikes = currentLikes.filter((user) => user !== userIdStr);
      message = "Creation Unliked";
    } else {
      // If not liked, add the user to the likes array
      updatedLikes = [...currentLikes, userIdStr];
      message = "Creation Liked";
    }

    // Format the updated likes array for PostgreSQL text[] type
    const formattedArray = `{${updatedLikes.join(",")}}`;

    // Update the creation's likes in the database
    await sql`UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${id}`;

    // Respond with the updated status
    res.json({ success: true, message });
  } catch (error) {
    // Handle any errors during the update
    res.json({ success: false, message: error.message });
  }
};
