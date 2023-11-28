import { Dropdown, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "./assets/logo.svg";
import { AuthContext } from "./auth";
import { useContext } from "react";
import { FaUser } from "react-icons/fa";

function Navigation() {
  const { authenticated, userid } = useContext(AuthContext)!;

  return (
    <>
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
        {/* login button */}
        {!authenticated && (
          <Link to="/login" className="btn btn-primary my-2">
            Login
          </Link>
        )}
        {authenticated && (
          <>
            <Dropdown>
              <Dropdown.Toggle variant="primary" id="dropdown-basic">
                <FaUser /> {userid}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/admin">
                  Admin Panel
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/logout">
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            {/* <Link to="/profile" className="my-2 btn btn-success dropdown-toggle">
                  <span><FaUser /> {trimProfileID(userProfile.id)}</span>
              </Link> */}
          </>
        )}
      </Navbar.Collapse>
    </>
  );
}

export default Navigation;
