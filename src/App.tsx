import { useState, useEffect, ChangeEvent, MouseEvent, useMemo } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Container, Navbar } from "react-bootstrap";

import "./App.css";
import { FaBarcode } from "react-icons/fa";
import { FaHome } from "react-icons/fa";
import { FaCube } from "react-icons/fa";
import { AuthProvider, KeycloakLogout, ProtectedRoute } from "./auth";
import Navigation from "./Navigation";
import AddEditProvider from "./AddEditProvider";
import UserRole from "./UserRole";
import SupportedPids from "./SupportedPids";
import ManagedPids from "./ManagedPids";
import { Toaster } from "react-hot-toast";
import { Footer } from "./Footer";

// API endpoint declared in env variable
const PIDMR_API = import.meta.env.VITE_PIDMR_API;
// Backend references used in resolving stuff
const RESOLVE_API_ROUTE = `${PIDMR_API}/v1/metaresolvers/resolve`;
// Backend references used in resolving stuff
const IDENTIFY_API_ROUTE = `${PIDMR_API}/v1/providers/identify`;
// default debounce input timeout at 300 ms
const DEBOUNCE_TIMEOUT = 300;

// backend call to identify provider types

// resolution mode values
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

// Main layout
function App() {
  return (
    <AuthProvider>
      <div className="App">
        {/* Toaster Section for notifications */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // Define default options
            className: " ",
            duration: 2000,
            position: "top-right",
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              style: {
                background: "green",
              },
            },
            error: {
              style: {
                background: "red",
              },
            },
          }}
        />
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
            <Route path="/supported-pids" element={<SupportedPids />} />
            <Route
              path="/managed-pids"
              element={
                <ProtectedRoute routeRoles={["provider_admin", "admin"]} />
              }
            >
              <Route index element={<ManagedPids />} />
            </Route>
            <Route
              path="/managed-pids/add"
              element={
                <ProtectedRoute routeRoles={["provider_admin", "admin"]} />
              }
            >
              <Route index element={<AddEditProvider />} />
            </Route>
            <Route
              path="/managed-pids/view/:id"
              element={
                <ProtectedRoute routeRoles={["provider_admin", "admin"]} />
              }
            >
              <Route index element={<AddEditProvider editMode={2} />} />
            </Route>
            <Route
              path="/managed-pids/edit/:id"
              element={
                <ProtectedRoute routeRoles={["admin", "provider_admin"]} />
              }
            >
              <Route index element={<AddEditProvider editMode={1} />} />
            </Route>
            <Route
              path="/user-role"
              element={<ProtectedRoute routeRoles={[]} />}
            >
              <Route index element={<UserRole />} />
            </Route>
            <Route path="/logout" element={<KeycloakLogout />} />
          </Routes>
        </Container>

        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
