import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from './pages/Landing.js';
import SignUp from './pages/SignUp.js';
import SignIn from './pages/SignIn.js';
import RoomSelection from './pages/RoomSelection.js';
import Canvas from './pages/Canvas/page.js';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/room-selection" element={<RoomSelection />} />
        <Route path="/canvas/:roomId" element={<Canvas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
