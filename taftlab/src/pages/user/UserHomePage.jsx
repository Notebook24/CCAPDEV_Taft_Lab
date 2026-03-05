import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';

function UserHomePage() {
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
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              fontSize: '1.8rem',
              color: '#666',
              fontWeight: 500
            }}
          >
            Carousel kinda homeless rn
          </div>

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
