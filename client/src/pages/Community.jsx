import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Heart } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// Set axios base URL from environment variables
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

/**
 * Community Component
 * - Displays all published creations from users
 * - Users can like/unlike creations
 * - Requires authentication via Clerk
 */
const Community = () => {
  const [creations, setCreations] = useState([]); // stores all published creations
  const [loading, setLoading] = useState(true); // loading state
  const { user } = useUser(); // current logged-in user
  const { getToken } = useAuth(); // function to get JWT token

  /**
   * Fetch all published creations from backend
   * - Sends auth token in headers
   * - Updates 'creations' state on success
   */
  const fetchCreations = async () => {
    try {
      const { data } = await axios.get("/api/user/get-published-creations", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setCreations(data.creations);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  /**
   * Toggle like/unlike on a creation
   * - Sends creation ID to backend
   * - Refreshes creations on success
   */
  const imageLikeToggle = async (id) => {
    try {
      const { data } = await axios.post(
        "/api/user/toggle-like-creation",
        { id },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        toast.success(data.message);
        await fetchCreations(); // refresh creations to reflect updated likes
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch creations when component mounts and user is available
  useEffect(() => {
    if (user) {
      fetchCreations();
    }
  }, []);

  // Loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="w-10 h-10 my-1 rounded-full border-3 border-[#5044e5] border-t-transparent animate-spin"></span>
      </div>
    );
  }

  // Main render: display creations
  return (
    <div className="flex-1 h-full flex flex-col gap-4 p-6">
      Creations
      <div className="bg-white h-full w-full rounded-xl overflow-y-scroll">
        {creations.map((creation, index) => (
          <div
            key={index}
            className="relative group inline-block pl-3 pt-3 w-full sm:max-w-1/2 lg:max-w-1/4"
          >
            {/* Display creation image */}
            <img
              src={creation.content}
              alt=""
              className="w-full h-full object-cover rounded-lg"
            />

            {/* Overlay with prompt and like button */}
            <div className="absolute bottom-0 top-0 right-0 left-3 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-gradient-to-b from-transparent to-black/80 text-white rounded-lg">
              {/* Show prompt on hover */}
              <p className="text-sm hidden group-hover:block">
                {creation.prompt}
              </p>

              {/* Like button */}
              <div className="flex gap-1 items-center">
                <p>{creation.likes.length}</p>
                <Heart
                  onClick={() => imageLikeToggle(creation.id)}
                  className={`min-w-5 h-5 hover:scale-110 cursor-pointer ${
                    creation.likes.includes(user.id)
                      ? "fill-red-500 text-red-600"
                      : "text-white"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Community;
