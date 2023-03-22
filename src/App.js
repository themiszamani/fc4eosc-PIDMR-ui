import { useState } from 'react';
import { Routes, Route, Link } from "react-router-dom"
import { Container, Nav, Navbar } from 'react-bootstrap';
import logo from './logo.svg';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import logoDOI from './logoDOI.png'
import logoARK from './logoARK.png'
import logoARXIV from './logoARXIV.png'
import logoEPIC from './logoEPIC.png'
import logoSWH from './logoSWH.png'

// Backend references used in resolving stuff
const PROXY = "https://hdl.handle.net/";
const TEMPLATE_DEFAULT = "21.T11999/METARESOLVER@";
const TEMPLATE_SWH = "21.T11973/MR@";




// Generate jump urls per fixed case

// this is the default jump using the designated proxy and default template
const jumpDefault = function (pid) {
  return PROXY + TEMPLATE_DEFAULT + pid;
}

// this is a slightly modified jump in case of swh pids using another template
const jumpShw = function (pid) {
  return PROXY + TEMPLATE_SWH + pid;
}

// this is a slightly modifed jump in case of epic handles using just the proxy and the pid
const jumpEpic = function (pid) {
  return PROXY +  pid;
}

// this is a slightly modified jump in case of dois using just the proxy and the pid
// but removing the doi: prefix from the pid
const jumpDoi = function (pid) {
  return PROXY + pid.slice(4);
}

// Dictionary of identifiers - each one with validation regex and an example
const IDENTIFIERS = {
  'ark': {
    regex: /^(a|A)(r|R)(k|K):(?:\/\d{5,9})+\/[a-zA-Z\d]+(-[a-zA-Z\d]+)*$/,
    example: 'ark:/13030/tf5p30086k',
    logo: logoARK,
    jump: jumpDefault
  },
  'arxiv': {
    regex: /^(a|A)(r|R)(X|x)(i|I)(v|V):\d{2}((9|0)[1-9]|1[0-2])\.\d{4,5}(v\d+)?$/,
    example: 'arxiv:1512.00135',
    logo: logoARXIV,
    jump: jumpDefault
  },
  'arxiv.old': {
    regex: /^(a|A)(r|R)(X|x)(i|I)(v|V):(astro-ph|cond-mat|gr-qc|hep-ex|hep-lat|hep-ph|hep-th|math-ph|nlin|nucl-ex|nucl-th|physics|quant-ph|math|CoRR|q-bio|q-fin|stat|eess|econ)(\.[A-Z][A-Z])?\/\d{2}(0[1-9]|1[0-2])\d+(v\d+)?$/,
    regexPart: /^(a|A)(r|R)(X|x)(i|I)(v|V):[a-z]/,
    example: 'arXiv:math.RT/0309136',
    logo: logoARXIV,
    jump: jumpDefault
  },
  'swh': {
    regex: /^(s|S)(w|W)(h|H):[1-9]:(cnt|dir|rel|rev|snp):[0-9a-f]+(;(origin|visit|anchor|path|lines)=\S+)*$/,
    example: 'swh:1:cnt:94a9ed024d3859793618152ea559a168bbcbb5e2',
    logo: logoSWH,
    jump: jumpShw
  },
  'doi': {
    regex: /^(d|D)(o|O)(i|I):10\.\d+\/.+$/,
    example: 'doi:10.3352/jeehp.2013.10.3',
    logo: logoDOI,
    jump: jumpDoi
  },
  'epic': {
    regex: /^21\.T?\d+\/.+$/,
    example: '21.T11148/f5e68cc7718a6af2a96c',
    logo: logoEPIC,
    jump: jumpEpic
  },
  'epic.old': {
    regex: /^\d{5,5}\/.+$/,
    regexPart: /^\d/,
    example: '11500/ATHENA-0000-0000-2401-6',
    logo: logoEPIC,
    jump: jumpEpic
  }
};

// Provide an initial state object for the ui 
function initResult() {
  return {
    valid: false,
    pidType: "unknown",
    jumpUrl: '#'
  };
}


// this where validation takes place - returns a validation result
function validate(pid) {

  // prep the validation result
  let result = initResult();
  // grab the prefix
  let prefix = pid.substring(0, pid.indexOf(":"));

  // try to identify and validate
  // handle pids that have prefix
  if (prefix) {
    // lowercase the prefix to easily match validators dictionary keys
    prefix = prefix.toLowerCase();
    let provider = IDENTIFIERS[prefix];
    // if provider indeed in identifiers
    if (provider) {
      // check if its valid
      result.pidType = prefix;
      result.valid = provider.regex.test(pid);
      // if arxiv and still not valid check if its old format
      if (!result.valid && prefix === 'arxiv') {
        // if first item after prefix is a letter try to check old arxiv
        provider = IDENTIFIERS['arxiv.old']
        // check if first part looks like arxiv.old using small regex
        if (provider.regexPart.test(pid)) {
          result.pidType = 'arxiv.old';
          result.valid = provider.regex.test(pid);
        }
      }
    }

    // handle pids with no prefix - epic handles
  } else {
    // check if its a new epic handle
    if (pid.length > 0 && pid.startsWith("21.".slice(0,pid.length))) {
      result.pidType = "epic";
      result.valid = IDENTIFIERS["epic"].regex.test(pid);
    } else if (IDENTIFIERS["epic.old"].regexPart.test(pid)) {
      result.pidType = "epic.old";
      result.valid = IDENTIFIERS["epic.old"].regex.test(pid);
    } 
  }

  // if result is valid try to generate the jump url
  if (result.valid) {
    result.jumpUrl = IDENTIFIERS[result.pidType].jump(pid);
  }

  return result;

}

// Component to render the metaresolver page
function Main() {
  const [pid, setPid] = useState("");
  const [redirect, setRedirect] = useState(true);
  const [result, setResult] = useState(initResult());

  function handleChange(event) {
    let pid = event.target.value.trim();
    // set pid value
    setPid(pid);
    // calculate and set Validation result
    setResult(validate(pid));
  }

  function handleGrabEg(event) {
    let pid = event.target.dataset.example;
    setPid(pid);
    setResult(validate(pid));
  }

  // Handle tooltip message
  let tooltip = null;
  // if pid empty prompt user to enter something
  if (!result.pidType || result.pidType === "unknown") {
    tooltip = (
      <div style={{ color: 'grey' }}>
        <strong>Please enter a valid Pid</strong>
        <br/>
        <em>Supported formats: ark, arXiv, swh, doi, epic handle</em>
      </div>
    )
  } else {
    tooltip = (
      <div>
        <strong>Format: </strong>
        <span>{result.pidType + " "}</span>
        <img height="20px" src={IDENTIFIERS[result.pidType].logo} alt={result.pidType}/>
        <span className="mx-2">-</span>
        <strong>Valid:</strong>
        <span>{result.valid ? "✅" : "❌"}</span>
        <br/>
        {!result.valid && <em style={{ color: 'grey' }}>
          {"example: "}
          <span className="fillin"
                data-example = {IDENTIFIERS[result.pidType].example}
                onClick={(event) => {handleGrabEg(event)}}>
            {IDENTIFIERS[result.pidType].example}
          </span>
        </em>
        }
      </div>
    )
  }



  return (
    <div className="page-center">
      <div className="resolve-panel">

        {/* Intro icons and text */}
        <h1 className="text-large">🏷️ ➜ 📦</h1>
        <p>The FC4EOSC Metaresolver resolves individual handles from various providers</p>

        {/* Pid input box */}
        <input type="text" className="form-control" style={{ 'maxWidth': '600px' }} id="input-pid" 
          value={pid} onChange={(event) => { handleChange(event) }} autoComplete="off" />
        <div className="info">
        {tooltip}
        </div>
        

        {/* Redirect check button */}
        <div className="mt-1 mb-2 text-start">
          <input className="form-check-input" type="checkbox" value="" id="checkRedirect"
            defaultChecked={!redirect} onChange={() => { setRedirect(!redirect) }}
          />
          {" "}
          <label className="form-check-label mr-2" htmlFor="checkRedirect">
            No redirect to url
          </label>
        </div>

        {/* Resolve button */}
        <a className={"btn btn-lg btn-primary " + (result.valid ? '' : 'disabled')} href={redirect ? result.jumpUrl : result.jumpUrl + "?noredirect"} target="_blank" rel="noreferrer">Resolve ➜</a>

      </div>
    </div>
  )

}

// Component to render a simple info page about supported PIDs
function SupportedPIDS() {

  return (
    <div className="mt-5">
      <h5>Supported Pids:</h5>
      <ul>
        <li>
          ARK <small>
                <a className="text-decoration-none" 
                   href="https://arks.org/">ⓘ</a>
              </small>
        </li>
        <li>arxiv <small><a className="text-decoration-none" href="https://info.arxiv.org/help/arxiv_identifier.html">ⓘ</a></small></li>
        <li>DOI <small><a className="text-decoration-none" href="https://www.doi.org/the-identifier/what-is-a-doi/">ⓘ</a></small></li>
        <li>ePIC handles <small><a className="text-decoration-none" href="http://www.pidconsortium.net/?page_id=1060">ⓘ</a></small></li>
        <li>SWH (Software Heritage) <small><a className="text-decoration-none" href="https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html">ⓘ</a></small></li>
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
