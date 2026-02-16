import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Chat from './components/Chat/Chat';
import Simulator from './components/Simulator/Simulator';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <h1>🔥 Beacon-S</h1>
          <div className="nav-links">
            <Link to="/chat">Beacon-Chat</Link>
            <Link to="/simulator">Beacon-Sim</Link>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/simulator" element={<Simulator />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div className="home">
      <h2>Secure Ad-Hoc Communication Suite</h2>
      <p>Choose a module to begin:</p>
      <div className="home-cards">
        <Link to="/chat" className="card">
          <h3>💬 Beacon-Chat</h3>
          <p>P2P encrypted messaging for disaster response</p>
        </Link>
        <Link to="/simulator" className="card">
          <h3>🌐 Beacon-Sim</h3>
          <p>Interactive network simulation dashboard</p>
        </Link>
      </div>
    </div>
  );
}

export default App;
