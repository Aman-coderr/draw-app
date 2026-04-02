import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, ArrowRight, Copy, Check, Plus, LogIn } from "lucide-react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export default function RoomSelection() {
  const [roomSlug, setRoomSlug] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateRoomSlug = () => {
    const slug = "room-" + Math.random().toString(36).substring(2, 10);
    setGeneratedSlug(slug);
    setRoomSlug(slug);
    setError("");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSlug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinRoom = async () => {
    if (!roomSlug.trim()) {
      setError("Please enter or generate a room slug");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in first");
        navigate("/signin");
        return;
      }
      const response = await axios.get(
        `${backendUrl}/rooms/${roomSlug.trim()}`,
      );
      const roomId = response.data.room.id;
      if (!roomId) {
        setError("Room not found. Please check the room slug.");
        setLoading(false);
        return;
      }
      navigate(`/canvas/${roomId}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to join room. Please check the room slug.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndJoin = async () => {
    if (!generatedSlug) {
      generateRoomSlug();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in first");
        navigate("/signin");
        return;
      }
      const response = await axios.post(
        `${backendUrl}/room`,
        { name: generatedSlug },
        { headers: { token } },
      );
      const roomId = response.data.room.id;
      if (response.data.message === "Room Created") {
        navigate(`/canvas/${roomId}`);
      } else {
        setError("Failed to create room. Please try again.");
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("Room already exists. Please generate a new slug.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to create room. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-6 sm:mb-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <Pencil className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Excelidraw
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 text-center">
            Choose Your Canvas
          </h1>
          <p className="text-slate-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            Create a new room or join an existing one
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          {/* Stacks on mobile, side-by-side on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Create Room */}
            <div className="border-2 border-slate-200 rounded-xl p-4 sm:p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Plus className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                  Create New Room
                </h2>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mb-4">
                Generate a unique room slug and share it with others
              </p>

              {generatedSlug && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-slate-600 mb-1">Your Room Slug:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs sm:text-sm font-mono text-blue-700 flex-1 break-all">
                      {generatedSlug}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                      title="Copy"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateAndJoin}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading
                  ? "Processing..."
                  : generatedSlug
                    ? "Create & Join Room"
                    : "Generate Room Slug"}
                {!loading && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            {/* Join Room */}
            <div className="border-2 border-slate-200 rounded-xl p-4 sm:p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <LogIn className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                  Join Existing Room
                </h2>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mb-4">
                Enter a room slug to join a collaborative canvas
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Room Slug
                </label>
                <input
                  type="text"
                  value={roomSlug}
                  onChange={(e) => {
                    setRoomSlug(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter room slug..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? "Joining..." : "Join Room"}
                {!loading && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs sm:text-sm text-slate-600 text-center">
              <strong>Tip:</strong> Share your room slug with collaborators to
              work together in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
