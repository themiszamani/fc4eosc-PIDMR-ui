import { Dropdown, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "./assets/logo.svg";
import { AuthContext } from "./auth";
import { useContext } from "react";
import { FaCog, FaSignOutAlt, FaUser } from "react-icons/fa";

function Navigation() {
  const { authenticated, userid } = useContext(AuthContext)!;

  const trimUserid = (id: string): string => {
    let res: string;
    if (id.includes("@")) {
      res =
        id.substring(0, 6) + "..." + id.substring(id.indexOf("@"), id.length);
    } else {
      res = id.substring(0, 6) + "...";
    }
    return res;
  };

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
          <Link to="/managed-pids" className="btn btn-primary my-2">
            Login
          </Link>
        )}
        {authenticated && (
          <>
            <Dropdown>
              <Dropdown.Toggle variant="primary" id="dropdown-basic">
                <FaUser /> {trimUserid(userid)}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/managed-pids">
                  <FaCog className="me-2" />
                  Manage PIDs
                </Dropdown.Item>
                <hr />
                <Dropdown.Item as={Link} to="/logout">
                  <FaSignOutAlt className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </>
        )}
      </Navbar.Collapse>
    </>
  );
}

export default Navigation;
