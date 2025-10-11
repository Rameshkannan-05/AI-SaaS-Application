import { Scissors, Sparkles } from "lucide-react";
import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import Formdata from "form-data";
import toast from "react-hot-toast";

// Set axios base URL from environment variables
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

/**
 * RemoveObject Component
 * - Allows users to remove a single object from an uploaded image
 * - Sends image and object name to backend API "/api/ai/remove-image-object"
 * - Displays the processed image with the object removed
 */
const RemoveObject = () => {
  // State variables
  const [input, setInput] = useState(null); // uploaded image file
  const [object, setObject] = useState(""); // object name to remove
  const [loading, setLoading] = useState(false); // API loading state
  const [content, setContent] = useState(""); // processed image URL

  const { getToken } = useAuth(); // Clerk auth hook for JWT token

  /**
   * Handle form submission
   * - Validates object name (only one word)
   * - Sends image and object to backend for processing
   * - Updates content state with returned image URL
   */
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate single object name
      if (object.split(" ").length > 1) {
        return toast.error("Please enter only one object name");
      }

      const formData = new Formdata();
      formData.append("image", input);
      formData.append("object", object);

      const { data } = await axios.post(
        "/api/ai/remove-image-object",
        formData,
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setContent(data.imageUrl); // set processed image
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
          <Sparkles className="w-6 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Object Removal</h1>
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

        {/* Object name input */}
        <p className="mt-6 text-sm font-medium">
          Describe object name to remove
        </p>
        <textarea
          onChange={(e) => setObject(e.target.value)}
          value={object}
          rows={4}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="e.g., watch or spoon , Only single object name"
          required
        />

        {/* Submit button */}
        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Scissors className="w-5" />
          )}
          Remove object
        </button>
      </form>

      {/* Right Column: Display Processed Image */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3">
          <Scissors className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Processed Image</h1>
        </div>

        {/* Conditional rendering: show instructions or processed image */}
        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Scissors className="w-9 h-9" />
              <p>Upload an image and click "Remove object" to get started</p>
            </div>
          </div>
        ) : (
          <img src={content} alt="Processed" className="mt-3 w-full h-full" />
        )}
      </div>
    </div>
  );
};

export default RemoveObject;
