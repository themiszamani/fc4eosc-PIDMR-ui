import { useState, useEffect, ChangeEvent, MouseEvent } from "react";
import {
  Routes,
  Route,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { Container, Nav, Navbar } from "react-bootstrap";

import "./App.css";
import logo from "./assets/logo.svg";
import logoDOI from "./assets/logoDOI.png";
import logoARK from "./assets/logoARK.png";
import logoARXIV from "./assets/logoARXIV.png";
import logoEPIC from "./assets/logoEPIC.png";
import logoSWH from "./assets/logoSWH.png";
import logoNBNDE from "./assets/logoNBNDE.png";
import logoNBNFI from "./assets/logoNBNFI.png";
import logoZenodo from "./assets/logoZenodo.svg";
import { FaBarcode } from "react-icons/fa";
import { FaHome } from "react-icons/fa";
import { FaCube } from "react-icons/fa";

type JumpURLS = {
  landing: string;
  metadata: string;
  resource: string;
};

type EntryPID = {
  valid: boolean;
  pidType: string;
  jumpURLs: JumpURLS;
  landing: boolean;
  metadata: boolean;
  resource: boolean;
};

type Identifier = {
  regex: RegExp | null;
  regexPart?: RegExp;
  example: string | null;
  logo: string | null;
  landing: boolean;
  metadata: boolean;
  resource: boolean;
};

type Identifiers = { [key: string]: Identifier };
const PIDMR_API = import.meta.env.VITE_PIDMR_API;
// TODO: pagination support in case of a large collection of providers - keep it simple for the time being
const PROVIDERS_URL = `${PIDMR_API}/v1/providers`;

// Backend references used in resolving stuff
const RESOLVE_URL = `${PIDMR_API}/v1/metaresolvers/resolve`;

// this is the default jump using the designated proxy and default template
const jumpDefault = function (pid: string) {
  return {
    landing: RESOLVE_URL + "?pidMode=landingpage&redirect=true&pid=" + pid,
    metadata: RESOLVE_URL + "?pidMode=metadata&redirect=true&pid=" + pid,
    resource: RESOLVE_URL + "?pidMode=resource&redirect=true&pid=" + pid,
  };
};

// Dictionary of identifiers - each one with validation regex and an example
const IDENTIFIERS: Identifiers = {
  urn: {
    example: null,
    regex: null,
    logo: null,
    landing: false,
    metadata: false,
    resource: false,
  },
  "urn:nbn:de": {
    regex:
      /^[U,u][R,r][N,n]:[N,n][B,b][N,n]:[D,d][E,e][a-z0-9()+,\-.:=@;$_!*'%/?#]+$/,
    example: "urn:nbn:de:hbz:6-85659524771",
    regexPart: /^[U,u][R,r][N,n]:[N,n][B,b][N,n]:[D,d][E,e]/,
    logo: logoNBNDE,
    landing: true,
    metadata: true,
    resource: true,
  },
  "urn:nbn:fi": {
    regex:
      /^[U,u][R,r][N,n]:[N,n][B,b][N,n]:[F,f][I,i][a-z0-9()+,\-.:=@;$_!*'%/?#]+$/,
    example: "urn:nbn:fi-fe2021080942632",
    regexPart: /^[U,u][R,r][N,n]:[N,n][B,b][N,n]:[F,f][I,i]/,
    logo: logoNBNFI,
    landing: true,
    metadata: false,
    resource: false,
  },
  ark: {
    regex: /^(a|A)(r|R)(k|K):(?:\/\d{5,9})+\/[a-zA-Z\d]+(-[a-zA-Z\d]+)*$/,
    example: "ark:/13030/tf5p30086k",
    logo: logoARK,
    landing: true,
    metadata: true,
    resource: false,
  },
  arxiv: {
    regex:
      /^(a|A)(r|R)(X|x)(i|I)(v|V):\d{2}((9|0)[1-9]|1[0-2])\.\d{4,5}(v\d+)?$/,
    example: "arxiv:1512.00135",
    logo: logoARXIV,
    landing: true,
    metadata: true,
    resource: true,
  },
  "arxiv.old": {
    regex:
      /^(a|A)(r|R)(X|x)(i|I)(v|V):(astro-ph|cond-mat|gr-qc|hep-ex|hep-lat|hep-ph|hep-th|math-ph|nlin|nucl-ex|nucl-th|physics|quant-ph|math|CoRR|q-bio|q-fin|stat|eess|econ)(\.[A-Z][A-Z])?\/\d{2}(0[1-9]|1[0-2])\d+(v\d+)?$/,
    regexPart: /^(a|A)(r|R)(X|x)(i|I)(v|V):[a-z]/,
    example: "arXiv:math.RT/0309136",
    logo: logoARXIV,
    landing: true,
    metadata: true,
    resource: true,
  },
  swh: {
    regex:
      /^(s|S)(w|W)(h|H):[1-9]:(cnt|dir|rel|rev|snp):[0-9a-f]+(;(origin|visit|anchor|path|lines)=\S+)*$/,
    example: "swh:1:cnt:94a9ed024d3859793618152ea559a168bbcbb5e2",
    logo: logoSWH,
    landing: true,
    metadata: true,
    resource: true,
  },
  doi: {
    regex: /^(d|D)(o|O)(i|I):10\.\d+\/.+$/,
    example: "doi:10.3352/jeehp.2013.10.3",
    logo: logoDOI,
    landing: true,
    metadata: false,
    resource: false,
  },
  epic: {
    regex: /^21\.T?\d+\/.+$/,
    example: "21.T11148/f5e68cc7718a6af2a96c",
    logo: logoEPIC,
    landing: true,
    metadata: true,
    resource: false,
  },
  "epic.old": {
    regex: /^\d{5,5}\/.+$/,
    regexPart: /^\d/,
    example: "11500/ATHENA-0000-0000-2401-6",
    logo: logoEPIC,
    landing: true,
    metadata: true,
    resource: false,
  },
  zenodo: {
    regex: /^10.5281\/zenodo.([0-9]{7})+$/,
    regexPart: /^\d/,
    example: "10.5281/zenodo.8056361",
    logo: logoZenodo,
    landing: true,
    metadata: true,
    resource: true,
  },
};

// Provide an initial state object for the ui
function initResult() {
  return {
    valid: false,
    pidType: "unknown",
    jumpURLs: {
      landing: "#",
      metadata: "#",
      resource: "#",
    },
    landing: false,
    metadata: false,
    resource: false,
  };
}

// this where validation takes place - returns a validation result
function validate(pid: string) {
  // prep the validation result
  const result: EntryPID = initResult();
  // grab the prefix
  let prefix = pid.substring(0, pid.indexOf(":"));

  // try to identify and validate
  // handle pids that have prefix
  if (prefix) {
    // lowercase the prefix to easily match validators dictionary keys
    prefix = prefix.toLowerCase();
    // check if prefix is an urn

    let provider: Identifier = IDENTIFIERS[prefix];
    // if provider indeed in identifiers
    if (provider) {
      // check first if its urn

      // check if its valid
      result.pidType = prefix;
      if (result.pidType === "urn") {
        for (const urnType of ["urn:nbn:de", "urn:nbn:fi"]) {
          // if first item after prefix is a letter try to check old arxiv
          provider = IDENTIFIERS[urnType];
          // check if first part looks like arxiv.old using small regex
          if (provider.regexPart?.test(pid)) {
            result.pidType = urnType;
            result.valid = provider.regex?.test(pid) || false;
            break;
          }
        }
      } else {
        result.valid = provider.regex?.test(pid) || false;
        // if arxiv and still not valid check if its old format
        if (!result.valid && prefix === "arxiv") {
          // if first item after prefix is a letter try to check old arxiv
          provider = IDENTIFIERS["arxiv.old"];
          // check if first part looks like arxiv.old using small regex
          if (provider.regexPart?.test(pid)) {
            result.pidType = "arxiv.old";
            result.valid = provider.regex?.test(pid) || false;
          }
        }
      }
    }

    // handle pids with no prefix - epic handles
  } else {
    //check if it is zenodo
    if (pid.length > 0 && pid.startsWith("10.5281".slice(0, pid.length))) {
      result.pidType = "zenodo";
      result.valid = IDENTIFIERS["zenodo"].regex?.test(pid) || false;
      // check if its a new epic handle
    } else if (pid.length > 0 && pid.startsWith("21.".slice(0, pid.length))) {
      result.pidType = "epic";
      result.valid = IDENTIFIERS["epic"].regex?.test(pid) || false;
    } else if (IDENTIFIERS["epic.old"].regexPart?.test(pid)) {
      result.pidType = "epic.old";
      result.valid = IDENTIFIERS["epic.old"].regex?.test(pid) || false;
    }
  }

  // if result is valid try to generate the jump url
  if (result.valid) {
    result.jumpURLs = jumpDefault(pid);
    result.landing = IDENTIFIERS[result.pidType].landing;
    result.metadata = IDENTIFIERS[result.pidType].metadata;
    result.resource = IDENTIFIERS[result.pidType].resource;
  } else {
    result.jumpURLs = {
      landing: "#",
      metadata: "#",
      resource: "#",
    };
    result.landing = false;
    result.metadata = false;
    result.resource = false;
  }

  return result;
}

// Component to render the metaresolver page
function Main() {
  const [pid, setPid] = useState("");
  const [result, setResult] = useState(initResult());

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const pid = event.target.value.trim();
    // set pid value
    setPid(pid);
    // calculate and set Validation result
    setResult(validate(pid));
  }

  function handleGrabEg(event: MouseEvent) {
    const pid = (event.target as HTMLElement).dataset.example;
    setPid(pid || "");
    setResult(validate(pid || ""));
  }

  // Handle tooltip message
  let tooltip = null;
  // if pid empty prompt user to enter something
  if (!result.pidType || result.pidType === "unknown") {
    tooltip = (
      <div style={{ color: "grey" }}>
        <strong>Please enter a valid Pid</strong>
        <br />
        <em>Supported formats: ark, arXiv, swh, doi, epic handle, urn:nbn</em>
      </div>
    );
  } else if (result.pidType === "urn") {
    tooltip = (
      <div style={{ color: "grey" }}>
        <strong>Please enter a valid urn:nbn:de or urn:nbn:fe pid</strong>
        <br />
        {"examples: "}
        <span
          className="fillin"
          data-example={IDENTIFIERS["urn:nbn:de"].example}
          onClick={(event) => {
            handleGrabEg(event);
          }}
        >
          {IDENTIFIERS["urn:nbn:de"].example}
        </span>
        <br />
        <span
          className="fillin"
          data-example={IDENTIFIERS["urn:nbn:fi"].example}
          onClick={(event) => {
            handleGrabEg(event);
          }}
        >
          {IDENTIFIERS["urn:nbn:fi"].example}
        </span>
      </div>
    );
  } else {
    tooltip = (
      <div>
        <strong>Format: </strong>
        <span>{result.pidType + " "}</span>
        {IDENTIFIERS[result.pidType].logo && (
          <img
            height="20px"
            src={IDENTIFIERS[result.pidType].logo || ""}
            alt={result.pidType}
          />
        )}
        <span className="mx-2">-</span>
        <strong>Valid:</strong>
        <span>{result.valid ? "✅" : "❌"}</span>
        <br />
        {!result.valid && (
          <em style={{ color: "grey" }}>
            {"example: "}
            <span
              className="fillin"
              data-example={IDENTIFIERS[result.pidType].example}
              onClick={(event) => {
                handleGrabEg(event);
              }}
            >
              {IDENTIFIERS[result.pidType].example}
            </span>
          </em>
        )}
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="resolve-panel">
        {/* Intro icons and text */}
        <h1 className="text-large">🏷️ ➜ 📦</h1>
        <p>
          The FC4EOSC Metaresolver resolves individual handles from various
          providers
        </p>
        {/* Pid input box */}
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: "600px" }}
          id="input-pid"
          value={pid}
          onChange={(event) => {
            handleChange(event);
          }}
          autoComplete="off"
        />
        <div className="info">{tooltip}</div>
        <br />
        {/* Resolve button */}
        <strong
          className={result.valid ? "" : "text-muted"}
          style={{ fontSize: "1.2rem" }}
        >
          resolve:{" "}
        </strong>{" "}
        <a
          className={
            "resolve-btn btn btn-lg btn-primary mr-2 " +
            (result.landing ? "" : "disabled")
          }
          href={result.jumpURLs.landing}
          target="_blank"
          rel="noreferrer"
        >
          <FaHome className="btn-ico" /> Landing Page
        </a>{" "}
        <a
          className={
            "resolve-btn btn btn-lg btn-primary " +
            (result.metadata ? "" : "disabled")
          }
          href={result.jumpURLs.metadata}
          target="_blank"
          rel="noreferrer"
        >
          <FaBarcode className="btn-ico" /> Metadata
        </a>{" "}
        <a
          className={
            "resolve-btn btn btn-lg btn-primary " +
            (result.resource ? "" : "disabled")
          }
          href={result.jumpURLs.resource}
          target="_blank"
          rel="noreferrer"
        >
          <FaCube className="btn-ico" /> Resource
        </a>
      </div>
    </div>
  );
}

// Types for supported PIDS view
type ApiResponse = {
  size_of_page: number;
  number_of_page: number;
  total_elements: number;
  total_pages: number;
  content: Provider[];
  links: ApiResponseLink[];
};

type ApiResponseLink = {
  href: string;
  rel: string;
};

type Provider = {
  id: number;
  type: string;
  name: string;
  description: string;
  resolution_modes: ResolutionMode[];
  regexes: RegExp[];
};

type ResolutionMode = {
  mode: string;
  name: string;
};

// Component to render a simple info page about supported PIDs
function SupportedPIDS() {
  // provider data from backend
  const [data, setData] = useState<ApiResponse | null>(null);
  // router urlparams for pagination
  const [searchParams] = useSearchParams();
  // navigate to change on pagination
  const navigate = useNavigate();

  function handleChangeSize(evt: { target: { value: string } }) {
    // navigate to the same page but with new url parameter for size and go to first page
    navigate("./?size=" + evt.target.value + "&page=1");
  }

  useEffect(() => {
    // parse the page & size url params
    let page = parseInt(searchParams.get("page") || "");
    let size = parseInt(searchParams.get("size") || "");

    // if no page given assume first
    if (!page) {
      page = 1;
    }

    // if no size given or size too big assume 20 and start at first page
    if (!size || size > 100) {
      size = 20;
      page = 1;
    }

    // fetch the data from the api
    const fetchData = async () => {
      try {
        const response = await fetch(
          PROVIDERS_URL + "?size=" + size + "&page=" + page,
        );
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [searchParams]);

  // prepare the list of supported providers
  const providers: React.ReactNode[] = [];

  // prep the page navigation element
  let pageNav = null;
  // prep the element that holds the page next, prev controls
  let pageFlip = null;

  const pageSize = parseInt(searchParams.get("size") || "");

  // if data is fetched and content exists do
  if (data && data.content) {
    // for each provider in data prepare its view
    for (const item of data.content) {
      // prep the supported modes element for the provider
      const actions = [];
      for (const actionItem of item.resolution_modes) {
        actions.push(
          <span
            className="badge badge-small bg-secondary mx-1"
            key={actionItem.mode}
          >
            {actionItem.name}
          </span>,
        );
      }
      // push to the provider list the element view of a provider
      // the provider is rendered as a card with
      // provider name and prefix in the card-header
      // provider description in the card-body
      // provider supported modes in the card-footer
      providers.push(
        <li key={item.type} className="m-4">
          <div className="card">
            <div className="card-header">
              <div className="d-flex">
                <span
                  style={{ color: "black", border: "1px black solid" }}
                  className="badge badge-small bg-warning"
                >
                  {item.type}
                </span>
                <strong style={{ marginLeft: "0.6rem" }}>{item.name}</strong>
              </div>
            </div>
            <div className="card-body">{item.description}</div>
            {actions.length > 0 && (
              <div className="card-footer">
                <div className="d-flex justify-content-end">
                  <small className="text-secondary mx-2">modes:</small>
                  {actions}
                </div>
              </div>
            )}
          </div>
        </li>,
      );
    }

    // if links exist render the page flip element
    if (data.links && data.links.length > 0) {
      const start = (data.number_of_page - 1) * pageSize;
      const end = start + data.content.length;

      pageFlip = (
        <div className="d-flex justify-content-between">
          <div>
            {start > 0 && (
              <>
                <Link
                  className="btn btn-primary btn-sm mx-2"
                  to={"./?size=" + pageSize + "&page=1"}
                >
                  First
                </Link>
                <Link
                  className="btn  btn-primary btn-sm mx-2"
                  to={
                    "./?size=" + pageSize + "&page=" + (data.number_of_page - 1)
                  }
                >
                  ← Prev
                </Link>
              </>
            )}
            <span className="mx-4">
              <strong>{start + 1}</strong> to <strong>{end}</strong> out of{" "}
              <strong>{data.total_elements}</strong>
            </span>
            {end < data.total_elements && (
              <>
                <Link
                  to={
                    "./?size=" + pageSize + "&page=" + (data.number_of_page + 1)
                  }
                  className="btn  btn-primary btn-sm mx-2"
                >
                  Next →
                </Link>
                <Link
                  to={"./?size=" + pageSize + "&page=" + data.total_pages}
                  className="btn  btn-primary btn-sm mx-2"
                >
                  Last
                </Link>
              </>
            )}
          </div>
        </div>
      );
    }

    // here render the page navigation footer
    pageNav = (
      <div className="d-flex justify-content-between">
        <div></div>
        {/* This is the optional element to flip between pages */}
        {pageFlip}
        {/* This is the element to select page size */}
        <div>
          <span className="mx-1">results per page: </span>
          <select
            name="per-page"
            value="20"
            id="per-page"
            onChange={handleChangeSize}
          >
            <option value="5">5</option>∂<option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="my-5">
      <h5>Supported Pids:</h5>
      <ul className="list-unstyled">{providers}</ul>
      <hr />
      {pageNav}
    </div>
  );
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
              <Nav.Link as={Link} to="/">
                <strong>Metaresolver</strong>
              </Nav.Link>
              <Nav.Link as={Link} to="/supported-pids">
                <strong>Supported PIDs</strong>
              </Nav.Link>
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
