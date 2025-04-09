import { Container } from "react-bootstrap";
import Header from "./Header";
import Routes from "./Routes";
import { Footer } from "./Footer";

const Content = () => {
  return (
    <>
      <Header />
      <Container>
        <Routes />
      </Container>
      <Footer />
    </>
  );
};

export default Content;
