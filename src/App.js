import React from 'react'
import './App.css';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';

class App extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <div className="App">
        <DisplayArea></DisplayArea>
        <MainToolbar></MainToolbar>
      </div>
    );
  }
}

export default App;
