import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';

function UserHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragCurrent, setDragCurrent] = useState(0);
  const navigate = useNavigate();

  const buildings = [
    {
      id: 102,
      title: 'St. La Salle Hall',
      image: '/assets/images/LS_229_indoor_1.jpg',
      description: 'The iconic St. La Salle Hall stands as a historic symbol of the university\'s Lasallian heritage. Peaceful hallways and historic charm make it a favorite study spot and photo backdrop.'
    },
    {
      id: 101,
      title: 'Gokongwei Hall',
      image: '/assets/images/GK_304B_indoor_1.jpg',
      description: 'Known as the iconic tech hub of DLSU, where the College of Computer Studies thrives for innovation. Whether you\'re coding, brainstorming group projects, or grinding for deadlines.'
    },
    {
      id: 103,
      title: 'Br. Andrew Gonzales Hall',
      image: '/assets/images/AG_1904_indoor_1.jpg',
      description: 'Br. Andrew Gonzalez Hall is home to classrooms, lecture halls, and various academic offices. Its modern high-rise design provides a centralized learning environment where students spend their weekdays learning, meeting friends, and preparing for the college grind!'
    },
    {
      id: 105,
      title: 'Don Enrique Yuchengco Hall',
      image: '/assets/images/Y_602_indoor_1.jpg',
      description: 'Yuchengco Hall is where classes, org events, and big assemblies come together. Its auditorium hosts talks, programs, and performances, making it one of the most active student spaces on campus.'
    },
    {
      id: 104,
      title: 'Velasco Hall',
      image: '/assets/images/V_103_indoor_3.jpg',
      description: 'Although Velasco Hall is the home of the Gokongwei College of Engineering, it also holds laboratory classrooms and collaborative spaces for students to learn, code, and experiment.'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, buildings.length - 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    setDragCurrent(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setDragCurrent(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const diff = dragStart - dragCurrent;
    const threshold = 50; // minimum drag distance to trigger slide change

    if (diff > threshold) {
      // dragged left, go to next slide
      nextSlide();
    } else if (diff < -threshold) {
      // dragged right, go to previous slide
      prevSlide();
    }
  };

  const handleWheel = (e) => {
    if (!e.shiftKey) return;
    
    e.preventDefault();
    
    // Scroll down/right = next slide, Scroll up/left = previous slide
    if (e.deltaY > 0) {
      nextSlide();
    } else if (e.deltaY < 0) {
      prevSlide();
    }
  };

  const handleReserve = (buildingId) => {
    navigate(`/user/reservation?building_id=${buildingId}`);
  };

  useEffect(() => {
    const stylesheetUrls = ['/assets/style/user_css/user_homepage.css'];

    const appendedLinks = [];
    stylesheetUrls.forEach((url) => {
      const existing = document.querySelector(`link[href="${url}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
        appendedLinks.push(link);
      }
    });

    return () => {
      appendedLinks.forEach((link) => document.head.removeChild(link));
    };
  }, []);

  return (
    <div>
      <UserNavbar />

      <div className="sub-header">
        <h2>Ready to book a slot? Choose your building below.</h2>
        <p className="sub-header-subtext">Book your workspace today — at DLSU.</p>
      </div>

      <section id="tranding">
        <div className="container">
          <div className="carousel-container" style={{ position: 'relative', marginTop: '40px', marginBottom: '40px' }}>
            {/* Navigation arrows */}
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              style={{
                position: 'absolute',
                left: '-60px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: currentSlide === 0 ? '#ccc' : '#333',
                color: 'white',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              onClick={nextSlide}
              disabled={currentSlide === buildings.length - 3}
              style={{
                position: 'absolute',
                right: '-60px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: currentSlide === buildings.length - 3 ? '#ccc' : '#333',
                color: 'white',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: currentSlide === buildings.length - 3 ? 'not-allowed' : 'pointer',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
              aria-label="Next slide"
            >
              ›
            </button>

            {/* Carousel wrapper */}
            <div style={{ overflow: 'hidden', padding: '0 40px' }} onWheel={handleWheel}>
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  display: 'flex',
                  gap: '20px',
                  transform: `translateX(calc(-${currentSlide * 320}px + ${isDragging ? dragCurrent - dragStart : 0}px))`,
                  transition: isDragging ? 'none' : 'transform 0.4s ease-in-out',
                  minWidth: '100%',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
              >
                {buildings.map((building, index) => (
                  <div
                    key={index}
                    style={{
                      flex: '0 0 300px',
                      background: '#fff',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <img
                      src={building.image}
                      alt={building.title}
                      style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ padding: '18px' }}>
                      <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.2rem', color: '#333' }}>
                        {building.title}
                      </h3>
                      <p style={{ color: '#666', lineHeight: '1.5', marginBottom: '15px', fontSize: '0.95rem', maxHeight: '80px', overflow: 'hidden' }}>
                        {building.description}
                      </p>
                      <button
                        onClick={() => handleReserve(building.id)}
                        style={{
                          background: '#000',
                          color: 'white',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          width: '100%'
                        }}
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>

          <div className="services-section">
            <h1>What is Taft Lab?</h1>
            <br />
            <br />
            <p className="services-description">
              Taft Lab provides students with access to well-equipped laboratories across campus. Our staff and systems ensure a
              seamless reservation experience, promoting safety, organization, and efficient use of resources. Explore the available
              labs and reserve the space you need to study, experiment, or collaborate with your peers.
            </p>
          </div>

          <div className="services-cards">
            <div className="analysis-card">
              <div className="analysis-icon" />
              <h2 className="analysis-title">Building Access</h2>
              <br />
              <p className="analysis-description">
                Explore our campus buildings and see which laboratories are available for your academic work. Easily find the spaces
                suited for study, experiments, or group projects.
              </p>
            </div>

            <div className="visualization-card">
              <div className="visualization-icon" />
              <h2 className="visualization-title">Lab Reservations</h2>
              <br />
              <p className="visualization-description">
                Connect with TaftLab and reserve your preferred laboratory in just a few clicks. Plan ahead, secure your spot,
                and make the most of our facilities for a productive session.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-top">
          <div className="footer-links">
            <div>
              <Link to="/user">Home</Link>
              <Link to="/user/reservation-history">My Reservations</Link>
            </div>
            <div>
              <Link to="/user/advanced-search">Advanced Search</Link>
              <Link to="/user/profile">Profile</Link>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />
        <div className="footer-bottom">
          <p className="footer-copy">© DLSU Taft Lab 2026. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default UserHomePage;
