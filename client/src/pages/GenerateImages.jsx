import React, { useState } from "react";
import { Sparkles, Image } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

// Set axios base URL from environment variables
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

/**
 * GenerateImages Component
 * - Allows users to generate AI-based images
 * - Users can select image style, enter description, and optionally make it public
 * - Uses backend API "/api/ai/generate-image"
 */
const GenerateImages = () => {
  // Available image styles
  const imageStyle = [
    "Realistic",
    "Ghibli style",
    "Anime style",
    "Cartoon style",
    "Fantasy style",
    "3D style",
    "Portrait style",
  ];

  // State variables
  const [selectedImageStyle, setSelectedImageStyle] = useState("Realistic"); // currently selected style
  const [input, setInput] = useState(""); // image description
  const [publish, setPublish] = useState(false); // public/private toggle
  const [loading, setLoading] = useState(false); // API loading state
  const [content, setContent] = useState(""); // generated image URL

  const { getToken } = useAuth(); // Clerk auth hook to get JWT token

  /**
   * Handle form submission
   * - Sends request to backend to generate image
   * - Updates content state with returned image URL
   */
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const prompt = `Generate an image of ${input} in the style ${selectedImageStyle}`;

      const { data } = await axios.post(
        "/api/ai/generate-image",
        { prompt, publish },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setContent(data.secure_url); // set generated image
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
      {/* Left Column: Input form */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>

        {/* Image description input */}
        <p className="mt-6 text-sm font-medium">Describe Your Image</p>
        <textarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          rows={4}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="Describe what you want to see in the image..."
          required
        />

        {/* Image style selection */}
        <p className="mt-4 text-sm font-medium">Style</p>
        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {imageStyle.map((item) => (
            <span
              onClick={() => setSelectedImageStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                selectedImageStyle === item
                  ? "bg-green-50 text-green-700"
                  : "text-gray-500 border-gray-300"
              } `}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Public toggle */}
        <div className="my-6 flex items-center gap-2">
          <label className="relative cursor-pointer">
            <input
              type="checkbox"
              onChange={(e) => setPublish(e.target.checked)}
              checked={publish}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition"></div>
            <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
          </label>
          <p className="text-sm">Make this image Public</p>
        </div>

        {/* Submit button */}
        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#04FF50] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Image className="w-5" />
          )}
          Generate image
        </button>
      </form>

      {/* Right Column: Display generated image */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">Generated Images</h1>
        </div>

        {/* Conditional rendering: show instructions or generated image */}
        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Image className="w-9 h-9" />
              <p>Enter a topic and click "Generate image" to get started</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 h-full">
            <img src={content} alt="Generated" className="w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateImages;
