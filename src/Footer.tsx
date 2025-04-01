import { FaBook, FaCalendar, FaGithub } from "react-icons/fa";
import packageJson from "../package.json";
import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import logoGrnet from "@/assets/logo-grnet.png";
import logoGwdg from "@/assets/logo-gwdg.svg";
import logoOpenaire from "@/assets/logo-openaire.png";
import logoINRIA from "@/assets/logo-inria.svg";
import logoUNHEL from "@/assets/logo_UnHel.png";
import logoCSC from "@/assets/logo-CSC.png";

function Footer() {
  // tag build information on footer
  const buildDate = import.meta.env.VITE_APP_BUILD_DATE;
  const buildCommitHash = import.meta.env.VITE_APP_BUILD_COMMIT_HASH;
  const buildCommitURL = import.meta.env.VITE_APP_BUILD_COMMIT_URL;
  const linksGithub = import.meta.env.VITE_PIDMR_GITHUB;
  const linksDocs = import.meta.env.VITE_PIDMR_DOCS;

  return (
    <footer className="border-top">
      <Container className="text-left">
        <Row className="mt-4">
          <Col sm>
            <h6>About</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/about/cookies">Cookies Policy</Link>
              </li>
              <li>
                <Link to="/about/acceptable-use">Acceptable Use Policy</Link>
              </li>
              <li>
                <Link to="/about/terms">Terms of Use</Link>
              </li>
              <li>
                <Link to="/about/privacy">Privacy Statement</Link>
              </li>
              <li>
                <Link to="/about/disclaimer">Disclaimer</Link>
              </li>
            </ul>
          </Col>
          <Col sm>
            <h6>Development</h6>
            <ul className="list-unstyled">
              {linksGithub && (
                <li>
                  <FaGithub color="grey" className="me-2" />
                  <a href={linksGithub} target="_blank" rel="noreferrer">
                    Github
                  </a>
                </li>
              )}
              {linksDocs && (
                <li>
                  <FaBook color="grey" className="me-2" />
                  <a href={linksDocs} target="_blank" rel="noreferrer">
                    Documentation
                  </a>
                </li>
              )}
            </ul>
          </Col>
          <Col sm>
            <h6>Partners</h6>
            <a href="https://www.grnet.gr/en" target="_blank" rel="noreferrer">
              <img className="pidmr-logo-sm" src={logoGrnet} alt="GRNET" />
            </a>
            <a href="https://www.gwdg.de/" target="_blank" rel="noreferrer">
              <img className="pidmr-logo-sm" src={logoGwdg} alt="GWDG" />
            </a>
            <br />
            <a href="https://www.openaire.eu/" target="_blank" rel="noreferrer">
              <img
                className="pidmr-logo-xsm"
                src={logoOpenaire}
                alt="OPENAIRE"
              />
            </a>
            <a href="https://www.csc.fi/en" target="_blank" rel="noreferrer">
              <img className="pidmr-logo-sm" src={logoCSC} alt="CSC" />
            </a>
            <a href="https://www.inria.fr/en" target="_blank" rel="noreferrer">
              <img
                className="pidmr-logo-sm"
                src={logoINRIA}
                alt="Institut national de recherche en sciences et technologies du numérique"
              />
            </a>
            <a
              href="https://www.helsinki.fi/en"
              target="_blank"
              rel="noreferrer"
            >
              <img
                className="pidmr-logo-xsm"
                src={logoUNHEL}
                alt="University of Helsinki"
              />
            </a>
          </Col>
        </Row>
        <div className="text-center">
          <small className="text-muted">
            <span>
              Version: <strong>{packageJson.version}</strong>
            </span>
            {buildCommitHash && (
              <span style={{ marginLeft: "0.6rem" }}>
                Commit:{" "}
                <a
                  className="text-muted cat-hash-link"
                  target="_blank"
                  rel="noreferrer"
                  href={buildCommitURL}
                >
                  {buildCommitHash}
                </a>
              </span>
            )}
            {buildDate && (
              <span style={{ marginLeft: "0.6rem" }}>
                <FaCalendar />: {buildDate}
              </span>
            )}
          </small>
        </div>
      </Container>
    </footer>
  );
}

export { Footer };
