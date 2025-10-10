// Step 1: Import the multer library.
// Multer helps your Express backend handle file uploads (like images or documents).
import multer from "multer";

// Step 2: Set up storage configuration.
// This tells multer where and how to save uploaded files.
// Right now, it's using default settings — no custom folder or filename logic.
const storage = multer.diskStorage({});

// Step 3: Create an upload middleware using the storage settings.
// This middleware can be used in your Express routes to accept file uploads.
// Example usage: app.post("/upload", upload.single("file"), (req, res) => { ... })
export const upload = multer({ storage });
