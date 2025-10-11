import { Eraser, Sparkles } from "lucide-react";
import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import Formdata from "form-data";
import toast from "react-hot-toast";

// Set axios base URL from environment variables
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

/**
 * RemoveBackground Component
 * - Allows users to upload an image and remove its background
 * - Sends image to backend API "/api/ai/remove-image-background"
 * - Displays the processed image after background removal
 */
const RemoveBackground = () => {
  // State variables
  const [input, setInput] = useState(null); // uploaded image file
  const [loading, setLoading] = useState(false); // API loading state
  const [content, setContent] = useState(""); // processed image URL

  const { getToken } = useAuth(); // Clerk auth hook for JWT token

  /**
   * Handle form submission
   * - Sends the uploaded image to backend for background removal
   * - Updates content state with returned image URL
   */
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new Formdata();
      formData.append("image", input);

      const { data } = await axios.post(
        "/api/ai/remove-image-background",
        formData,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setContent(data.secure_url); // set processed image
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* Left Column: Upload Form */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Background Removal</h1>
        </div>

        {/* File input */}
        <p className="mt-6 text-sm font-medium">Upload image</p>
        <input
          onChange={(e) => setInput(e.target.files[0])}
          accept="image/*"
          type="file"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />
        <p className="text-xs text-gray-500 font-light mt-1">
          Supports JPG, PNG, and other image formats
        </p>

        {/* Submit button */}
        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#F6AB41] to-[#FF4938] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Eraser className="w-5" />
          )}
          Remove background
        </button>
      </form>

      {/* Right Column: Display Processed Image */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3">
          <Eraser className="w-5 h-5 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Processed Image</h1>
        </div>

        {/* Conditional rendering: show instructions or processed image */}
        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Eraser className="w-9 h-9" />
              <p>
                Upload an image and click "Remove background" to get started
              </p>
            </div>
          </div>
        ) : (
          <img src={content} alt="Processed" className="mt-3 w-full h-full" />
        )}
      </div>
    </div>
  );
};

export default RemoveBackground;
