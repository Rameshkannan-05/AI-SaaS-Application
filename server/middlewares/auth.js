import { clerkClient } from "@clerk/express";

// ===============================
// Auth Middleware
// Checks user's plan and tracks free usage for free users
// ===============================

export const auth = async (req, res, next) => {
  try {
    // Get authenticated user's ID and plan checker from Clerk
    const { userId, has } = await req.auth(); // req.auth() comes from clerkMiddleware()

    // Check if the user has a premium plan
    const hasPremiumPlan = await has({ plan: "premium" });

    // Fetch full user details from Clerk
    const user = await clerkClient.users.getUser(userId);

    // If user is free and already has free usage metadata, attach it to req
    if (!hasPremiumPlan && user.privateMetadata.free_usage) {
      req.free_usage = user.privateMetadata.free_usage;
    } else {
      // If premium or no free usage recorded, initialize it to 0
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: 0 },
      });
      req.free_usage = 0;
    }

    // Attach plan info to request for later use in controllers
    req.plan = hasPremiumPlan ? "premium" : "free";

    next(); // Continue to next middleware/controller
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
