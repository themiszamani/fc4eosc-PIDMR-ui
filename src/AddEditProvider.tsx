import { Badge, Button, Col, Form, Modal, Row } from "react-bootstrap";
import { FaEdit, FaInfoCircle, FaPlusCircle } from "react-icons/fa";
import { AuthContext } from "./auth";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Provider, ProviderInput } from "./types";
import { toast } from "react-hot-toast";
import { AddEditProviderInfo } from "./InfoText";

// API endpoint declared in env variable
const PIDMR_API = import.meta.env.VITE_PIDMR_API;
const PROVIDERS_ADMIN_API_ROUTE = `${PIDMR_API}/v2/admin/providers`;
const PROVIDERS_ADMIN_API_ROUTE_V1 = `${PIDMR_API}/v1/admin/providers`;

interface DeleteModalConfig {
  show: boolean;
  title: string;
  message: string;
  itemId: string;
  itemName: string;
}

function AddEditProvider({ editMode = 0 }: { editMode?: number }) {
  const navigate = useNavigate();
  const params = useParams();
  const [thisID, setThisID] = useState<string | undefined>();

  const { keycloak } = useContext(AuthContext)!;

  const [info, setInfo] = useState<ProviderInput>({
    user_id: "",
    status: "",
    type: "",
    name: "",
    description: "",
    example: "",
    relies_on_dois: false,
    resolution_modes: [],
    regexes: [""],
  });

  const [deleteModalConfig, setDeleteModalConfig] = useState<DeleteModalConfig>(
    {
      show: false,
      title: "Delete PID Provider",
      message: "Are you sure you want to delete the following PID Provider ",
      itemId: "",
      itemName: "",
    },
  );

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
          const response = await fetch(
            PROVIDERS_ADMIN_API_ROUTE_V1 + "/" + id,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${keycloak.token}`,
              },
            },
          );

          if (response.ok) {
            const responseData = (await response.json()) as Provider;
            const loadedInfo = {
              ...responseData,
              resolution_modes: responseData.resolution_modes.map((item) => ({
                name: item.name,
                mode: item.mode,
                endpoint: item.endpoint || "",
              })),
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
      setThisID(params.id);
    }
  }, [editMode, keycloak, params.id]);

  const handleSubmit = async () => {
    if (keycloak) {
      console.log(info);

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
          navigate("/managed-pids");
          toast.success(
            `Provider ${editMode ? "updated" : "added"} successfully!`,
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
    return info.resolution_modes.some((item) => item.mode === mode);
  };

  const handleCheckBoxChange = (mode: string, checked: boolean) => {
    if (checked) {
      setInfo({
        ...info,
        resolution_modes: [
          ...info.resolution_modes,
          { name: "", mode, endpoint: "" },
        ],
      });
    } else {
      setInfo({
        ...info,
        resolution_modes: info.resolution_modes.filter(
          (item) => item.mode !== mode,
        ),
      });
    }
  };

  const handleEndpointChange = (mode: string, endpoint: string) => {
    const updatedModes = info.resolution_modes.map((item) =>
      item.mode === mode ? { ...item, endpoint } : item,
    );
    setInfo({ ...info, resolution_modes: updatedModes });
  };

  const handleReliesOnDoisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo({ ...info, relies_on_dois: e.target.checked });
  };

  const handleDeleteOpenModal = (
    infoID: string | undefined,
    infoName: string,
  ) => {
    if (infoID) {
      setDeleteModalConfig({
        ...deleteModalConfig,
        show: true,
        itemId: infoID,
        itemName: infoName,
      });
    } else {
      toast.error("Invalid ID for deletion.");
    }
  };

  const handleDelete = async () => {
    if (keycloak) {
      try {
        const response = await fetch(
          `${PROVIDERS_ADMIN_API_ROUTE_V1}/${deleteModalConfig.itemId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${keycloak.token}`,
            },
          },
        );

        if (response.ok) {
          setDeleteModalConfig({
            ...deleteModalConfig,
            show: false,
          });
          navigate("/managed-pids");
          toast.success("Provider deleted successfully!");
        } else {
          response.json().then((data) => {
            toast.error(
              <div>
                <strong>Error trying to delete Provider:</strong>
                <br />
                <span>{data.message}</span>
              </div>,
            );
          });
        }
      } catch (error: unknown) {
        toast.error("Error while trying to delete provider");
        console.error("Error:", error);
      }
    }
  };

  const handleDeleteCloseModal = () => {
    setDeleteModalConfig({
      ...deleteModalConfig,
      show: false,
    });
  };

  return (
    <div className="mt-4">
      {editMode == 1 ? (
        <h5>
          <FaEdit className="me-2" /> Edit provider{" "}
          <Badge className="ms-2" bg="dark">
            {" "}
            id: {params.id}{" "}
          </Badge>
        </h5>
      ) : editMode == 0 ? (
        <h5>
          <FaPlusCircle className="me-2" />
          Add new Provider
        </h5>
      ) : (
        <h5>
          <FaInfoCircle className="me-2" /> Provider Details <br />
          <Badge className="mt-2" bg="dark">
            {" "}
            id: {params.id}{" "}
          </Badge>
          {info.status === "APPROVED" ? (
            <>
              <Badge className="ms-2" bg="success">
                {" "}
                Status: Approved
              </Badge>
              <Badge className="ms-2" bg="success">
                {" "}
                Approved By: {info.user_id}
              </Badge>
            </>
          ) : (
            <Badge className="ms-2" bg="warning">
              {" "}
              Status: Pending
            </Badge>
          )}
        </h5>
      )}

      <Form>
        {editMode == 2 ? (
          <div className="d-flex justify-content-end">
            <Button
              className="me-1"
              variant="outline-success"
              onClick={() =>
                (window.location.href = `/managed-pids/edit/${params.id}`)
              }
            >
              Edit PID
            </Button>
            <Button
              className="me-1"
              variant="outline-danger"
              onClick={() => handleDeleteOpenModal(thisID, info.name)}
            >
              Delete PID
            </Button>
          </div>
        ) : (
          ""
        )}
        <fieldset disabled={editMode === 2}>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formProviderPidType">
              <Form.Label>PID Type</Form.Label>
              <span className="info-icon">
                {" "}
                i
                <span className="info-text">
                  {AddEditProviderInfo.type.info}
                </span>
              </span>
              <Form.Control
                type="text"
                placeholder="Enter PID Type"
                onChange={(e) => setInfo({ ...info, type: e.target.value })}
                value={info.type}
              />
            </Form.Group>

            <Form.Group as={Col} controlId="formProviderName">
              <Form.Label>Name</Form.Label>
              <span className="info-icon">
                {" "}
                i
                <span className="info-text">
                  {AddEditProviderInfo.name.info}
                </span>
              </span>
              <Form.Control
                type="text"
                placeholder="Enter PID Name"
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                value={info.name}
              />
            </Form.Group>
          </Row>
          <Form.Group className="mb-3" controlId="formProviderDescription">
            <Form.Label>Description</Form.Label>
            <span className="info-icon">
              {" "}
              i
              <span className="info-text">
                {AddEditProviderInfo.description.info}
              </span>
            </span>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Enter a short description"
              onChange={(e) =>
                setInfo({ ...info, description: e.target.value })
              }
              value={info.description}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formProviderRegexes">
            <Form.Label>Regexes used for identification</Form.Label>
            <span className="info-icon">
              {" "}
              i
              <span className="info-text">
                {AddEditProviderInfo.regexes.info}
              </span>
            </span>
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
          <Form.Group className="mb-3" controlId="formProviderDois">
            <div className="mb-2">
              <span>Select if relies on DOIs</span>
              <span className="info-icon">
                {" "}
                i
                <span className="info-text">
                  {AddEditProviderInfo.relies_on_dois.info}
                </span>
              </span>
            </div>
            <div className="ms-4">
              <Form.Check
                inline
                label="Relies on dois"
                name="formProviderDois"
                type="checkbox"
                id="providerResolveDois"
                checked={info.relies_on_dois}
                onChange={handleReliesOnDoisChange}
              />
            </div>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formProviderResolve">
            <div className="mb-2">
              <span>Select resolve modes that this provider supports</span>
              <span className="info-icon">
                {" "}
                i
                <span className="info-text">
                  {AddEditProviderInfo.modes.info}
                </span>
              </span>
            </div>
            <div className="ms-4">
              {["landingpage", "metadata", "resource"].map((mode) => (
                <div key={mode} className="mb-2 row">
                  <div className="col-2">
                    <Form.Check
                      inline
                      label={mode.charAt(0).toUpperCase() + mode.slice(1)}
                      name="formProviderResolve"
                      type="checkbox"
                      id={`providerResolve${
                        mode.charAt(0).toUpperCase() + mode.slice(1)
                      }`}
                      checked={hasResolution(mode)}
                      onChange={(e) => {
                        handleCheckBoxChange(mode, e.target.checked);
                      }}
                      className="mb-3"
                    />
                  </div>
                  {hasResolution(mode) && (
                    <div className="col-10">
                      <Form.Control
                        type="text"
                        placeholder={`Enter ${mode} endpoint url`}
                        value={
                          info.resolution_modes.find(
                            (item) => item.mode === mode,
                          )?.endpoint || ""
                        }
                        onChange={(e) =>
                          handleEndpointChange(mode, e.target.value)
                        }
                        className="m-0"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formProviderExample">
            <Form.Label>PID Example</Form.Label>
            <span className="info-icon">
              {" "}
              i
              <span className="info-text">
                {AddEditProviderInfo.example.info}
              </span>
            </span>
            <Form.Control
              type="text"
              placeholder="Provide a valid PID as an example"
              onChange={(e) => setInfo({ ...info, example: e.target.value })}
              value={info.example}
            />
          </Form.Group>
        </fieldset>
        {editMode !== 2 && (
          <>
            <Button onClick={handleSubmit}>Submit</Button>{" "}
          </>
        )}
        <Link className="btn btn-secondary ms-2" to="/managed-pids">
          {editMode === 2 ? "Back" : "Cancel"}
        </Link>
      </Form>

      <Modal show={deleteModalConfig.show} onHide={handleDeleteCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{deleteModalConfig.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteModalConfig.message}{" "}
          <strong>{deleteModalConfig.itemName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteCloseModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AddEditProvider;
