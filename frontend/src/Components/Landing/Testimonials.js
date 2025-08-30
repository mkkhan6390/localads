import { Container, Row, Col, Card } from 'react-bootstrap';

function Testimonials() {
  const testimonials = [
    {
      name: "John Smith",
      role: "Marketing Director",
      company: "Tech Solutions",
      content: "LocalAds has transformed our advertising strategy. We've seen a 300% increase in engagement."
    },
    {
      name: "Sarah Johnson",
      role: "Small Business Owner",
      company: "Fashion Boutique",
      content: "The platform is incredibly easy to use and the results have been amazing for our business."
    },
    {
      name: "Mike Brown",
      role: "CEO",
      company: "StartUp Inc",
      content: "The best advertising platform we've used. The ROI has been exceptional."
    }
  ];

  return (
    <div id="testimonials" className="py-5 bg-light">
      <Container>
        <h2 className="text-center mb-5">What Our Clients Say</h2>
        <Row>
          {testimonials.map((testimonial, index) => (
            <Col md={4} key={index} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Text className="mb-4">"{testimonial.content}"</Card.Text>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                         style={{ width: 50, height: 50 }}>
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ms-3">
                      <h6 className="mb-0">{testimonial.name}</h6>
                      <small className="text-muted">
                        {testimonial.role}, {testimonial.company}
                      </small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}

export default Testimonials;