import logo from './logo.svg';
import TravelPage from './components/TravelPage';
import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Router>
        <TravelPage/>
      </Router>
    </div>
  );
}

export default App;
