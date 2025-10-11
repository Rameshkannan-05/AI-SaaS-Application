import React, { useEffect, useState } from "react";
import { Gem, Sparkles } from "lucide-react";
import { Protect, useAuth } from "@clerk/clerk-react";
import CreationItem from "../components/CreationItem";
import axios from "axios";
import toast from "react-hot-toast";

// Set axios base URL from environment variables
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

/**
 * Dashboard Component
 * - Shows user-specific dashboard
 * - Displays total creations, active plan, and recent creations
 * - Requires authentication via Clerk
 */
const Dashboard = () => {
  const [creations, setCreations] = useState([]); // stores user's creations
  const [loading, setLoading] = useState(true); // loading state
  const { getToken } = useAuth(); // function to get JWT token

  /**
   * Fetch logged-in user's creations from backend
   */
  const getDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/user/get-user-creations", {
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

  // Fetch dashboard data when component mounts
  useEffect(() => {
    getDashboardData();
  }, []);

  return (
    <div className="h-full overflow-y-scroll p-6">
      {/* Cards Section */}
      <div className="flex justify-start gap-4 flex-wrap">
        {/* Total Creations Card */}
        <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200">
          <div className="text-slate-600">
            <p className="text-sm">Total Creations</p>
            <h2 className="text-xl font-semibold">{creations.length}</h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center">
            <Sparkles className="w-5 mt-2 text-white" />
          </div>
        </div>

        {/* Active Plan Card */}
        <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200">
          <div className="text-slate-600">
            <p className="text-sm">Active Plan</p>
            <h2 className="text-xl font-semibold">
              {/* Show premium if user has plan, else fallback to Free */}
              <Protect plan="premium" fallback="Free">
                Premium
              </Protect>
            </h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center">
            <Gem className="w-5 text-white mt-2" />
          </div>
        </div>
      </div>

      {/* Loading spinner */}
      {loading ? (
        <div className="flex justify-center items-center h-3/4">
          <div className="w-10 h-10 my-1 rounded-full border-3 border-[#5044e5] border-t-transparent animate-spin"></div>
        </div>
      ) : (
        // Recent Creations Section
        <div className="space-y-3">
          <p className="mt-6 mb-4">Recent Creations</p>

          {/* Map over user's creations and render each */}
          {creations.map((item) => (
            <CreationItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
