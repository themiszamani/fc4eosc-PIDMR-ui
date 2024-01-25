import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./auth";
import { FaEdit, FaPlusCircle, FaTrashAlt } from "react-icons/fa";
import { ApiResponse, Provider } from "./types";
import { DeleteModal } from "./DeleteModal";
import { Button } from "react-bootstrap";
import toast from "react-hot-toast";

// API endpoint declared in env variable
const PIDMR_API = import.meta.env.VITE_PIDMR_API;
// TODO: pagination support in case of a large collection of providers - keep it simple for the time being
const PROVIDERS_API_ROUTE = `${PIDMR_API}/v1/providers`;
const PROVIDERS_ADMIN_API_ROUTE = `${PIDMR_API}/v1/admin/providers`;

interface DeleteModalConfig {
  show: boolean;
  title: string;
  message: string;
  itemId: string;
  itemName: string;
}

// Component to render a simple info page about supported PIDs
function SupportedPids() {
  const { admin } = useContext(AuthContext)!;

  // provider data from backend
  const [data, setData] = useState<ApiResponse | null>(null);
  // small trigger to refetch data when deleting items
  const [triggerFetch, setTriggerFetch] = useState(true);
  // router urlparams for pagination
  const [searchParams] = useSearchParams();
  // navigate to change on pagination
  const navigate = useNavigate();

  const { keycloak } = useContext(AuthContext)!;

  const [deleteModalConfig, setDeleteModalConfig] = useState<DeleteModalConfig>(
    {
      show: false,
      title: "Delete PID Provider",
      message: "Are you sure you want to delete the following PID Provider?",
      itemId: "",
      itemName: "",
    },
  );

  const handleDeleteOpenModal = (item: Provider) => {
    setDeleteModalConfig({
      ...deleteModalConfig,
      show: true,
      itemId: item.id.toString(),
      itemName: item.name,
    });
  };

  const handleDeleteConfirmed = async (id: string) => {
    if (keycloak) {
      const url = PROVIDERS_ADMIN_API_ROUTE + "/" + id;
      try {
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keycloak.token}`,
          },
        });

        if (response.ok) {
          setDeleteModalConfig({
            ...deleteModalConfig,
            show: false,
            itemId: "",
            itemName: "",
          });
          // refresh data
          toast.success("Provider deleted!");
          setTriggerFetch(true);
        } else {
          response.json().then((data) => {
            toast.error(
              <div>
                <strong>{`Error trying to delete Provider:`}</strong>
                <br />
                <span>{data.message}</span>
              </div>,
            );
          });
        }
      } catch (error: unknown) {
        console.error("Error:", error);
      }
    }
  };

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
    setTriggerFetch(false);
  }, [searchParams, triggerFetch]);

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
              <div className="d-flex justify-content-between">
                <div>
                  <span
                    style={{ color: "black", border: "1px black solid" }}
                    className="badge badge-small bg-warning"
                  >
                    {item.type}
                  </span>
                  <strong style={{ marginLeft: "0.6rem" }}>{item.name}</strong>
                </div>
                {admin && (
                  <div>
                    <Link
                      to={`/supported-pids/edit/${item.id}`}
                      className="btn btn-sm btn-outline-dark"
                    >
                      <FaEdit /> Edit
                    </Link>
                    <Button
                      className="ms-2"
                      size="sm"
                      variant="outline-danger"
                      onClick={() => {
                        handleDeleteOpenModal(item);
                      }}
                    >
                      <FaTrashAlt /> Delete
                    </Button>
                  </div>
                )}
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
        <DeleteModal
          show={deleteModalConfig.show}
          title={deleteModalConfig.title}
          message={deleteModalConfig.message}
          itemId={deleteModalConfig.itemId}
          itemName={deleteModalConfig.itemName}
          onHide={() => {
            setDeleteModalConfig({ ...deleteModalConfig, show: false });
          }}
          onDelete={() => {
            handleDeleteConfirmed(deleteModalConfig.itemId);
          }}
        />
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
      <div className="d-flex justify-content-between">
        <div>
          <h5>Supported Pids:</h5>
        </div>
        {admin && (
          <div>
            <Link className="btn-outline-dark btn" to="/supported-pids/add">
              <FaPlusCircle /> Add new PID provider
            </Link>
          </div>
        )}
      </div>
      <ul className="list-unstyled">{providers}</ul>
      <hr />
      {pageNav}
    </div>
  );
}

export default SupportedPids;
