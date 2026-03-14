import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import "../../style/user_css/UserHomepage.css";

// Image imports
import LS_img from "../../assets/images/LS_229_indoor_1.jpg";
import GK_img from "../../assets/images/GK_304B_indoor_1.jpg";
import AG_img from "../../assets/images/AG_1904_indoor_1.jpg";
import Y_img from "../../assets/images/Y_602_indoor_1.jpg";
import V_img from "../../assets/images/V_103_indoor_3.jpg";

function UserHomePage() {
  const navigate = useNavigate();

  const buildings = [
    {
      id: 102,
      title: 'St. La Salle Hall',
      image: LS_img,
      description: "The iconic St. La Salle Hall stands as a historic symbol of the university's Lasallian heritage. Peaceful hallways and historic charm make it a favorite study spot and photo backdrop."
    },
    {
      id: 101,
      title: 'Gokongwei Hall',
      image: GK_img,
      description: "Known as the iconic tech hub of DLSU, where the College of Computer Studies thrives for innovation. Whether you're coding, brainstorming group projects, or grinding for deadlines."
    },
    {
      id: 103,
      title: 'Br. Andrew Gonzales Hall',
      image: AG_img,
      description: "Br. Andrew Gonzalez Hall is home to classrooms, lecture halls, and various academic offices. Its modern high-rise design provides a centralized learning environment where students spend their weekdays learning, meeting friends, and preparing for the college grind!"
    },
    {
      id: 105,
      title: 'Don Enrique Yuchengco Hall',
      image: Y_img,
      description: "Yuchengco Hall is where classes, org events, and big assemblies come together. Its auditorium hosts talks, programs, and performances, making it one of the most active student spaces on campus."
    },
    {
      id: 104,
      title: 'Velasco Hall',
      image: V_img,
      description: "Although Velasco Hall is the home of the Gokongwei College of Engineering, it also holds laboratory classrooms and collaborative spaces for students to learn, code, and experiment."
    }
  ];

  const handleReserve = (buildingId) => {
    navigate(`/user/reservation?building_id=${buildingId}`);
  };

  useEffect(() => {
    // Load Swiper v8 CSS from CDN (same version as original HTML)
    const swiperCSS = document.createElement('link');
    swiperCSS.rel = 'stylesheet';
    swiperCSS.href = 'https://unpkg.com/swiper@8/swiper-bundle.min.css';
    document.head.appendChild(swiperCSS);

    // Load Swiper v8 JS from CDN, then init exactly like the original script.js
    const swiperJS = document.createElement('script');
    swiperJS.src = 'https://unpkg.com/swiper@8/swiper-bundle.min.js';
    swiperJS.onload = () => {
      new window.Swiper('.tranding-slider', {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        loop: true,
        spaceBetween: 0,
        coverflowEffect: {
          rotate: 0,
          stretch: -60,
          depth: 200,
          modifier: 1.5,
          slideShadows: false,
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
      });
    };
    document.body.appendChild(swiperJS);

    return () => {
      if (document.head.contains(swiperCSS)) document.head.removeChild(swiperCSS);
      if (document.body.contains(swiperJS)) document.body.removeChild(swiperJS);
    };
  }, []);

  return (
    <div>
      <UserNavbar />

      <div className="home-sub-header">
        <h2>Ready to book a slot? Choose your building below.</h2>
        <p className="home-sub-header-subtext">Book your workspace today — at DLSU.</p>
      </div>

      <section id="tranding">
        <div className="container">

          {/* Swiper uses raw div.swiper-wrapper + div.swiper-slide — NOT the React Swiper component.
              This matches the original HTML structure that window.Swiper() expects. */}
          <div className="swiper-container tranding-slider">
            <div className="swiper-wrapper">
              {buildings.map((building, index) => (
                <div className="swiper-slide" key={index}>
                  <div className="home-card">
                    <div className="home-card-img">
                      <img src={building.image} alt={building.title} />
                    </div>
                    <div className="home-card-body">
                      <h3 className="home-card-title">{building.title}</h3>
                      <p className="home-card-desc">{building.description}</p>
                      <button
                        className="reserve-btn"
                        onClick={() => handleReserve(building.id)}
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination + nav arrows — INSIDE swiper-container, matching original HTML */}
            <div className="tranding-slider-control">
              <button className="swiper-button-prev slider-arrow">
                <span className="carousel-arrow-icon">&#8249;</span>
              </button>
              <button className="swiper-button-next slider-arrow">
                <span className="carousel-arrow-icon">&#8250;</span>
              </button>
              <div className="swiper-pagination"></div>
            </div>
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