import { Badge, Button, Col, Form, Row } from "react-bootstrap";
import { FaEdit, FaPlusCircle } from "react-icons/fa";
import { AuthContext } from "./auth";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Provider, ProviderInput } from "./types";
import { toast } from "react-hot-toast";

// API endpoint declared in env variable
const PIDMR_API = import.meta.env.VITE_PIDMR_API;
const PROVIDERS_ADMIN_API_ROUTE = `${PIDMR_API}/v1/admin/providers`;

function AddEditProvider({ editMode = false }: { editMode?: boolean }) {
  const navigate = useNavigate();
  const params = useParams();

  const { keycloak } = useContext(AuthContext)!;

  const [info, setInfo] = useState<ProviderInput>({
    type: "",
    name: "",
    description: "",
    example: "",
    resolution_modes: [],
    regexes: [""],
  });

  const handleRegexChange = (index: number, value: string) => {
    const updatedInfo = { ...info };
    updatedInfo.regexes[index] = value;
    setInfo(updatedInfo);
  };

  const handleRegexRemove = (index: number) => {
    const updatedInfo = { ...info };
    updatedInfo.regexes.splice(index, 1);
    setInfo(updatedInfo);
  };

  const handleRegexAdd = () => {
    const updatedRegexes = [...info.regexes, ""];
    setInfo({ ...info, regexes: updatedRegexes });
  };

  useEffect(() => {
    const handleGet = async (id: string) => {
      if (keycloak) {
        try {
          const response = await fetch(PROVIDERS_ADMIN_API_ROUTE + "/" + id, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${keycloak.token}`,
            },
          });

          if (response.ok) {
            const responseData = (await response.json()) as Provider;
            const loadedInfo = {
              ...responseData,
              resolution_modes: responseData.resolution_modes.map(
                (item) => item.mode,
              ),
            };
            console.log(loadedInfo);
            setInfo(loadedInfo);
          }
        } catch (error: unknown) {
          toast.error("Error while trying to add new provider!");
          console.error("Error:", error);
        }
      }
    };

    if (editMode && params.id) {
      handleGet(params.id);
    }
  }, [editMode, keycloak, params.id]);

  const handleSubmit = async () => {
    if (keycloak) {
      const method = editMode ? "PATCH" : "POST";
      const url = editMode
        ? PROVIDERS_ADMIN_API_ROUTE + "/" + params.id
        : PROVIDERS_ADMIN_API_ROUTE;
      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keycloak.token}`,
          },
          body: JSON.stringify(info),
        });

        if (response.ok) {
          navigate("/supported-pids");
          toast.success(
            `Provider ${editMode ? "updated" : "added"} succesfully!`,
          );
        } else {
          response.json().then((data) => {
            toast.error(
              <div>
                <strong>{`Error trying to ${
                  editMode ? "update" : "add new"
                } Provider:`}</strong>
                <br />
                <span>{data.message}</span>
              </div>,
            );
          });
        }
      } catch (error: unknown) {
        toast.error("Backend Error while trying to create a new provider");
        console.error("Error:", error);
      }
    }
  };

  const hasResolution = (mode: string) => {
    return info.resolution_modes.includes(mode);
  };

  const handleCheckBoxChange = (mode: string, checked: boolean) => {
    const inList = hasResolution(mode);
    if (inList && !checked) {
      setInfo({
        ...info,
        resolution_modes: info.resolution_modes.filter((item) => item !== mode),
      });
    } else if (!inList && checked) {
      setInfo({ ...info, resolution_modes: [...info.resolution_modes, mode] });
    }
  };

  return (
    <div className="mt-4">
      {editMode ? (
        <h5>
          <FaEdit className="me-2" /> Edit provider{" "}
          <Badge className="ms-2" bg="dark">
            {" "}
            id: {params.id}{" "}
          </Badge>
        </h5>
      ) : (
        <h5>
          <FaPlusCircle className="me-2" />
          Add new Provider
        </h5>
      )}
      <Form className="mt-4">
        <Row className="mb-3">
          <Form.Group as={Col} controlId="formProviderPidType">
            <Form.Label>PID Type:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter PID Type"
              onChange={(e) => setInfo({ ...info, type: e.target.value })}
              value={info.type}
            />
          </Form.Group>

          <Form.Group as={Col} controlId="formProviderName">
            <Form.Label>Name:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter PID Name"
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              value={info.name}
            />
          </Form.Group>
        </Row>
        <Form.Group className="mb-3" controlId="formProviderDescription">
          <Form.Label>Description:</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Enter a short description"
            onChange={(e) => setInfo({ ...info, description: e.target.value })}
            value={info.description}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formProviderRegexes">
          <Form.Label>Regexes used for identification:</Form.Label>
          {info.regexes.map((item, index) => (
            <div className="mb-2 d-flex justify-content-between" key={index}>
              <Form.Control
                type="text"
                name={`formProviderRegex_${index}`}
                value={item}
                onChange={(e) => {
                  handleRegexChange(index, e.target.value);
                }}
              />
              <Button
                className="ms-2"
                size="sm"
                variant="outline-danger"
                onClick={() => {
                  handleRegexRemove(index);
                }}
              >
                Delete
              </Button>
            </div>
          ))}

          <Button
            className="d-block"
            variant="outline-dark"
            size="sm"
            onClick={handleRegexAdd}
          >
            Add new regex
          </Button>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formProviderResolve">
          <div className="mb-2">
            <span>Select resolve modes that this provider supports:</span>
          </div>
          <div className="ms-4">
            <Form.Check
              inline
              label="Landing Page"
              name="formProviderResolve"
              type="checkbox"
              id="providerResolveLandingPage"
              checked={hasResolution("landingpage")}
              onChange={(e) => {
                handleCheckBoxChange("landingpage", e.target.checked);
              }}
            />
            <Form.Check
              inline
              label="Metadata"
              name="formProviderResolve"
              type="checkbox"
              id="providerResolveMetadata"
              checked={hasResolution("metadata")}
              onChange={(e) => {
                handleCheckBoxChange("metadata", e.target.checked);
              }}
            />
            <Form.Check
              inline
              label="Resource"
              name="formProviderResolve"
              type="checkbox"
              id="providerResolveResource"
              checked={hasResolution("resource")}
              onChange={(e) => {
                handleCheckBoxChange("resource", e.target.checked);
              }}
            />
          </div>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formProviderExample">
          <Form.Label>PID Example:</Form.Label>
          <Form.Control
            type="text"
            placeholder="Provide a valid PID as an example"
            onChange={(e) => setInfo({ ...info, example: e.target.value })}
            value={info.example}
          />
        </Form.Group>
        <Button onClick={handleSubmit}>Submit</Button>{" "}
        <Link className="btn btn-secondary ms-2" to="/supported-pids">
          Cancel
        </Link>
      </Form>
    </div>
  );
}

export default AddEditProvider;
