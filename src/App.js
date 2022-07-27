import React from 'react';
import './App.css';
import { DatePicker } from './_assets/DatePicker'

function onChange( timestamp ) {
  console.log( timestamp );
}

function App() {
  return (
    <div className="App">
        <label>Pick a date:&nbsp;</label>
        <DatePicker setValue={ onChange }/>
    </div>
  );
}

export default App;