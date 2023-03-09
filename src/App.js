import { useState } from 'react';
import { Routes, Route, Link } from "react-router-dom"
import {Container, Nav, Navbar } from 'react-bootstrap';
import logo from './logo.svg';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


// Component to render the metaresolver page
function Main() {
  const [pid, setPid] = useState("ark:/13030/tf5p30086k")
  const [redirect, setRedirect] = useState(true)

  let jump_url = "https://hdl.handle.net/21.T11999/METARESOLVER@" + pid
  if (!redirect) {
    jump_url = jump_url + "?noredirect"
  }

  return (
    <div className="page-center">
      <div className="resolve-panel">

        {/* Intro icons and text */}
        <h1 className="text-large">🏷️ ➜ 📦</h1>
        <p>The FC4EOSC Metaresolver resolves individual handles from various providers</p>
        
        {/* Pid input box */}
        <input type="text" className="form-control" style={{ 'max-width': '600px' }} id="input-pid" 
        value={pid} onChange={(evt) => { setPid(evt.target.value) }} />
      
        {/* Redirect check button */}
        <div class="mt-1 mb-2 text-start">
          <input className="form-check-input" type="checkbox" value="" id="checkRedirect"
            defaultChecked={!redirect} onChange={() => { setRedirect(!redirect) }}
          />
          {" "}
          <label className="form-check-label mr-2" for="checkRedirect">
            No redirect to url 
          </label>
        </div>

        {/* Resolve button */}
        <a className="btn btn-lg btn-primary" href={jump_url} target="_blank" rel="noreferrer">Resolve ➜</a>
      
      </div>
    </div>
  )

}

// Component to render a simple info page about supported PIDs
function SupportedPIDS() {

  return (
    <div className="mt-5">
      <h5>Supported Pids</h5>
      <ul>
        <li>ARK</li>
      </ul>
    </div>
  )

}

// Main layout
function App() {

  return (
    <div className="App">
      {/* Main Navigation bar */}
      <Navbar variant="light" expand="lg" className="main-nav shadow-sm">
        <Container>
          
          {/* Branding logos */}
          <Navbar.Brand href="/">
            <img
              src={logo}
              height="40"
              className="d-inline-block align-top"
              alt="FAIRCORE4EOSC Pid Metaresolver"
            />
          </Navbar.Brand>

          {/* Hamburger button */}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          {/* Collapsible part that holds navigation links */}
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/"><strong>Metaresolver</strong></Nav.Link>
              <Nav.Link as={Link} to="/supported-pids"><strong>Supported PIDs</strong></Nav.Link>
            </Nav>
          </Navbar.Collapse>

        </Container>
      </Navbar>

      {/* Main content container - Renders views based on routes */}
      <Container>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="supported-pids" element={<SupportedPIDS />} />
        </Routes>
      </Container>

    </div>
  );
}

export default App;
