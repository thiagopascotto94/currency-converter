import React from 'react';
import logo from './logo.svg';
import './App.css';

import Conversor from './components/Conversor';

function App() {
  return (
    <div className="App">
      <Conversor moedaA="USD" moedaB="BRL"/>
    </div>
  );
}

export default App;
