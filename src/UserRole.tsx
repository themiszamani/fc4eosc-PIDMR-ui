import { Button, Col, Form, Row } from "react-bootstrap";
import { FaPlusCircle } from "react-icons/fa";
import { AuthContext } from "./auth";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { PromotionRequestInfo } from "./InfoText";

// API endpoint declared in env variable
const PIDMR_API = import.meta.env.VITE_PIDMR_API;
const PROMOTE_USER_ROLE_API_ROUTE = `${PIDMR_API}/v1/users/promote-user-role`;

function RequestRolePromotion() {
  const navigate = useNavigate();
  const { keycloak } = useContext(AuthContext)!;

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    role: "provider_admin",
    description: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const { name, surname, email, role, description } = formData;
    if (!name || !surname || !email || !role || !description) {
      toast.error("All fields are required.");
      return false;
    }
    if (!validateEmail(email)) {
      toast.error("Invalid email format.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (keycloak) {
      try {
        const response = await fetch(PROMOTE_USER_ROLE_API_ROUTE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keycloak.token}`,
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          navigate("/logout");
          toast.success("Role promotion request submitted successfully!");
        } else {
          const errorData = await response.json();
          toast.error(
            <div>
              <strong>Error submitting request:</strong>
              <br />
              <span>{errorData.message}</span>
            </div>,
          );
        }
      } catch (error: unknown) {
        toast.error("Backend Error while trying to submit the request");
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className="mt-4">
      <h5>
        <FaPlusCircle className="me-2" />
        Request Role Promotion
      </h5>
      <Form className="mt-4">
        <Row className="mb-3">
          <Form.Group as={Col} controlId="formUserName">
            <Form.Label>
              {PromotionRequestInfo.name.label}
              <span className="info-icon">
                {" "}
                i
                <span className="info-text">
                  {PromotionRequestInfo.name.info}
                </span>
              </span>
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
              placeholder="Enter your name"
              onChange={handleInputChange}
              value={formData.name}
            />
          </Form.Group>

          <Form.Group as={Col} controlId="formUserSurname">
            <Form.Label>
              {PromotionRequestInfo.surname.label}
              <span className="info-icon">
                {" "}
                i
                <span className="info-text">
                  {PromotionRequestInfo.surname.info}
                </span>
              </span>
            </Form.Label>
            <Form.Control
              type="text"
              name="surname"
              placeholder="Enter your surname"
              onChange={handleInputChange}
              value={formData.surname}
            />
          </Form.Group>
        </Row>
        <Form.Group className="mb-3" controlId="formUserEmail">
          <Form.Label>
            {PromotionRequestInfo.email.label}
            <span className="info-icon">
              {" "}
              i
              <span className="info-text">
                {PromotionRequestInfo.email.info}
              </span>
            </span>
          </Form.Label>
          <Form.Control
            type="email"
            name="email"
            placeholder="Enter your email"
            onChange={handleInputChange}
            value={formData.email}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formUserRole">
          <Form.Control
            hidden
            name="role"
            onChange={handleInputChange}
            value={formData.role}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formUserDescription">
          <Form.Label>
            {PromotionRequestInfo.description.label}
            <span className="info-icon">
              {" "}
              i
              <span className="info-text">
                {PromotionRequestInfo.description.info}
              </span>
            </span>
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            placeholder="Enter a short description"
            onChange={handleInputChange}
            value={formData.description}
          />
        </Form.Group>
        <Button onClick={handleSubmit}>Submit</Button>
        <Button
          variant="secondary"
          className="ms-2"
          onClick={() => navigate("/logout")}
        >
          Cancel
        </Button>
      </Form>
    </div>
  );
}

export default RequestRolePromotion;
