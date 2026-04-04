import { useState, useNavigate } from "react";
import axios from "axios";
function AuthPage({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await axios.post(`${backendUrl}/signup`, {
          username,
          email,
          password,
        });
        alert("Sign Up Successful");
        setIsSignUp(false);
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        const res = await axios.post(`${backendUrl}/signin`, {
          email,
          password,
        });
        alert("Sign In Successful");
        localStorage.setItem("token", res.data.token);
        onAuthSuccess();
      }
    } catch (err) {
      setError("Failed: " + (err.response?.data?.message || err.message));
      setUsername("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-blue-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-96 space-y-4 relative"
      >
        <h2 className="text-2xl font-bold">
          {" "}
          {isSignUp ? "Sign Up" : "Sign In"}{" "}
        </h2>
        {isSignUp && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-64 bg-white text-black placeholder-gray-600"
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-64 bg-white text-black placeholder-gray-600"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-64 bg-white text-black placeholder-gray-600"
          required
        />
        {error && <p> Error </p>}
        <button type="submit" className="w-full bg-purple-500 p-2 rounded">
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
        <p
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-red-500 cursor-pointer hover:underline"
        >
          {isSignUp ? "Already Have an  account? Login" : "No account? Sign Up"}
        </p>
      </form>
    </div>
  );
}
export default AuthPage;
