import React, { Component } from "react";
import "./App.css";
import MapFetch from "./MapFetch"
class Map extends Component {
  
  constructor(props) {
    super(props);
    this.state = { apiResponse: "" };
    this.customerData = [];
  }

  async callBluefolderApi() {
    try {
      var res = await fetch("http://localhost:9000/users");
      this.customerData = await res.json();
    }
    catch (e) {
      console.log(e);
    }
  }

  componentDidMount() {
    this.callBluefolderApi();
  }

  render() {
    return (
      <div className="Map">
        <header className="Map-header">
          
          <h1 className="Map-title">Welcome to React</h1>
          <p className="Mapp-intro">HI{this.state.apiResponse}</p>
        </header>
      </div>
    )
  }
}

export default Map;