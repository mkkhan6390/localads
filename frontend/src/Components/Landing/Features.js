import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaGlobe, FaChartLine, FaUsers, FaCog } from 'react-icons/fa';

function Features() {
  const features = [
    {
      icon: <FaGlobe size={40} />,
      title: "Wide Network",
      description: "Access thousands of premium apps and websites for your advertisements"
    },
    {
      icon: <FaChartLine size={40} />,
      title: "Real-time Analytics",
      description: "Track performance and optimize your campaigns with detailed insights"
    },
    {
      icon: <FaUsers size={40} />,
      title: "Target Audience",
      description: "Reach your ideal customers with precise targeting options"
    },
    {
      icon: <FaCog size={40} />,
      title: "Easy Management",
      description: "Simple and intuitive tools to manage your advertising campaigns"
    }
  ];

  return (
    <div id="features" className="py-5">
      <Container>
        <h2 className="text-center mb-5">Why Choose LocalAds?</h2>
        <Row>
          {features.map((feature, index) => (
            <Col md={6} lg={3} key={index} className="mb-4">
              <Card className="border-0 text-center h-100 shadow-sm">
                <Card.Body>
                  <div className="text-primary mb-3">
                    {feature.icon}
                  </div>
                  <Card.Title>{feature.title}</Card.Title>
                  <Card.Text>{feature.description}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}

export default Features;