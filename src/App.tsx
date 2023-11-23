import { useState, useEffect, ChangeEvent, MouseEvent, useMemo } from "react";
import {
  Routes,
  Route,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { Container, Navbar } from "react-bootstrap";

import "./App.css";
import { FaBarcode } from "react-icons/fa";
import { FaHome } from "react-icons/fa";
import { FaCube } from "react-icons/fa";
import { AuthProvider, KeycloakLogout, ProtectedRoute } from "./auth";
import AdminPanel from "./AdminPanel";
import Navigation from "./Navigation";

// API endpoint declared in env variable
const PIDMR_API = import.meta.env.VITE_PIDMR_API;
// TODO: pagination support in case of a large collection of providers - keep it simple for the time being
const PROVIDERS_API_ROUTE = `${PIDMR_API}/v1/providers`;
// Backend references used in resolving stuff
const RESOLVE_API_ROUTE = `${PIDMR_API}/v1/metaresolvers/resolve`;
// Backend references used in resolving stuff
const IDENTIFY_API_ROUTE = `${PIDMR_API}/v1/providers/identify`;
// default debounce input timeout at 300 ms
const DEBOUNCE_TIMEOUT = 300;

// backend call to identify provider types

// resolution mode valus
enum ResolutionModes {
  LandingPage = "landingpage",
  Metadata = "metadata",
  Resource = "resource",
}

// identify status values
enum IdStatus {
  Valid = "VALID",
  Invalid = "INVALID",
  Incomplete = "AMBIGUOUS",
  None = "",
}

// backend identify response schema
type IdResponse = {
  status: IdStatus;
  type: string;
  example: string;
  resolution_modes: IdResponseResolutionMode[];
};

type IdResponseResolutionMode = {
  mode: string;
  name: string;
};

// generate resolve urls given resolve mode and pid
function generateResolveURL(
  resolutionMode: ResolutionModes,
  pid: string,
): string {
  return `${RESOLVE_API_ROUTE}?pidMode=${resolutionMode}&redirect=true&pid=${pid}`;
}

// Provide an initial state object for the ui
function initResult(): IdResponse {
  return {
    type: "",
    status: IdStatus.None,
    example: "",
    resolution_modes: [],
  };
}

// Component to render the metaresolver page
function Main() {
  const [pid, setPid] = useState("");
  const [result, setResult] = useState(initResult());

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const pid = event.target.value.trim();
    // set pid value
    setPid(pid);
  }

  useEffect(() => {
    // debounce input so the backend is called after a given timeout since user stopped typing
    const debounceProcessInput = setTimeout(async () => {
      if (pid) {
        try {
          // Make a request to your backend API
          const response = await fetch(`${IDENTIFY_API_ROUTE}?text=${pid}`);
          if (!response.ok) {
            throw new Error("Failed to fetch data");
          }
          // Assuming the response is in JSON format
          const data: IdResponse = await response.json();
          // Update state with the fetched data
          setResult(data);
        } catch (error) {
          console.log(error);
        } finally {
          console.log("done");
        }
      } else {
        setResult(initResult());
      }
    }, DEBOUNCE_TIMEOUT);

    return () => clearTimeout(debounceProcessInput);
  }, [pid]);

  // when user clicks on a provider example use it as an input value
  function handleGrabEg(event: MouseEvent) {
    const pid = (event.target as HTMLElement).dataset.example;
    setPid(pid || "");
  }

  // Handle tooltip message
  let tooltip = null;
  const resolutionModes: string[] = useMemo(() => {
    return result.resolution_modes.map((x) => x.mode);
  }, [result.resolution_modes]);
  // if pid empty prompt user to enter something
  if (result.type === "") {
    tooltip = (
      <div style={{ color: "grey" }}>
        <strong>Please enter a valid Pid</strong>
        <br />
        <em>
          supported pids: ark, arXiv, swh, doi, urn:nbn{" "}
          <Link to="/supported-pids"> and more...</Link>
        </em>
      </div>
    );
  } else {
    tooltip = (
      <div>
        <strong>Format: </strong>
        <span>{result.type + " "}</span>
        <span className="mx-2">-</span>
        <strong>Valid:</strong>
        <span>{result.status === IdStatus.Valid ? "✅" : "❌"}</span>
        <br />
        {result.status === IdStatus.Incomplete && (
          <em style={{ color: "grey" }}>
            {"example: "}
            <span
              className="fillin"
              data-example={result.example}
              onClick={(event) => {
                handleGrabEg(event);
              }}
            >
              {result.example}
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
        <strong className="text-muted" style={{ fontSize: "1.2rem" }}>
          resolve:{" "}
        </strong>{" "}
        <a
          className={`resolve-btn btn btn-lg btn-primary mr-2 ${
            resolutionModes.includes(ResolutionModes.LandingPage) &&
            result.status === IdStatus.Valid
              ? ""
              : "disabled"
          }`}
          href={generateResolveURL(ResolutionModes.LandingPage, pid)}
          target="_blank"
          rel="noreferrer"
        >
          <FaHome className="btn-ico" /> Landing Page
        </a>{" "}
        <a
          className={`resolve-btn btn btn-lg btn-primary ${
            resolutionModes.includes(ResolutionModes.Metadata) &&
            result.status === IdStatus.Valid
              ? ""
              : "disabled"
          }`}
          href={generateResolveURL(ResolutionModes.Metadata, pid)}
          target="_blank"
          rel="noreferrer"
        >
          <FaBarcode className="btn-ico" /> Metadata
        </a>{" "}
        <a
          className={`resolve-btn btn btn-lg btn-primary ${
            resolutionModes.includes(ResolutionModes.Resource) &&
            result.status === IdStatus.Valid
              ? ""
              : "disabled"
          }`}
          href={generateResolveURL(ResolutionModes.Resource, pid)}
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
          PROVIDERS_API_ROUTE + "?size=" + size + "&page=" + page,
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
            value={searchParams.get("size") || "20"}
            id="per-page"
            onChange={handleChangeSize}
          >
            <option value="5">5</option>
            <option value="20">20</option>
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
    <AuthProvider>
      <div className="App">
        {/* Main Navigation bar */}
        <Navbar variant="light" expand="lg" className="main-nav shadow-sm">
          <Container>
            <Navigation />
          </Container>
        </Navbar>

        {/* Main content container - Renders views based on routes */}
        <Container>
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="supported-pids" element={<SupportedPIDS />} />
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<AdminPanel />} />
            </Route>
            <Route path="/login" element={<ProtectedRoute />}>
              <Route index element={<AdminPanel />} />
            </Route>
            <Route path="/logout" element={<KeycloakLogout />} />
          </Routes>
        </Container>
      </div>
    </AuthProvider>
  );
}

export default App;
