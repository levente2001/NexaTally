import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Admin from "./pages/admin";
import Termekek from "./pages/termekek";
import Raktarkeszlet from "./pages/raktarkeszlet";

import "./App.css";
import "./styles/mobile-pos.css";

function App() {
  return (
    <Router>
      <div className="App">
        {/*<h1>Városkút ivó</h1>*/}
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/admin">
            <Admin />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/signup">
            <Signup />
          </Route>
          <Route path="/termekek">
            <Termekek />
          </Route>
          <Route path="/raktar">
            <Raktarkeszlet />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
