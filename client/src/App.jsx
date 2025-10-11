import React from "react";
import { Routes, Route } from "react-router-dom";

// Import all pages
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import WriteArticle from "./pages/WriteArticle";
import BlogTitles from "./pages/BlogTitles";
import GenerateImages from "./pages/GenerateImages";
import RemoveBackground from "./pages/RemoveBackground";
import RemoveObject from "./pages/RemoveObject";
import ReviewResume from "./pages/ReviewResume";
import Community from "./pages/Community";

// Toaster for notifications
import { Toaster } from "react-hot-toast";

/**
 * App Component
 * - Main entry point of the React application
 * - Sets up all routes for the application
 * - Wraps AI-related pages inside Layout for sidebar and navigation
 */
const App = () => {
  return (
    <div>
      {/* Toaster for global notifications */}
      <Toaster />

      {/* Routes configuration */}
      <Routes>
        {/* Public Route: Home page */}
        <Route path="/" element={<Home />} />

        {/* Protected / Layout Routes */}
        <Route path="/ai" element={<Layout />}>
          {/* Default dashboard page */}
          <Route index element={<Dashboard />} />

          {/* AI Tools */}
          <Route path="write-article" element={<WriteArticle />} />
          <Route path="blog-titles" element={<BlogTitles />} />
          <Route path="generate-images" element={<GenerateImages />} />
          <Route path="remove-background" element={<RemoveBackground />} />
          <Route path="remove-object" element={<RemoveObject />} />
          <Route path="review-resume" element={<ReviewResume />} />

          {/* Community Page */}
          <Route path="community" element={<Community />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
