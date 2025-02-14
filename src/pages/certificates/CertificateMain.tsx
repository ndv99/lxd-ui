import React, { FC } from "react";
import { Row, Col, Button } from "@canonical/react-components";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "context/auth";
import Loader from "components/Loader";

const CertificateMain: FC = () => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  if (isAuthLoading) {
    return <Loader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/ui" replace={true} />;
  }

  return (
    <main className="l-main">
      <div className="p-strip">
        <Row className="certificate-main">
          <Col size={12}>
            <h1>LXD UI</h1>
            <p>
              A valid certificate is needed to access the UI from your browser.
            </p>
            <Button
              appearance="positive"
              onClick={() => navigate("/ui/certificates/generate")}
            >
              Setup certificates
            </Button>
          </Col>
        </Row>
      </div>
    </main>
  );
};

export default CertificateMain;
