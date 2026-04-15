import UserNavbar from '../../components/UserNavbar';
import "../../style/user_css/About.css";
import alainIcon from '../../assets/images/alain.jpg';
import kienIcon from '../../assets/images/kien.jpg';
import ivanIcon from '../../assets/images/ivan.jpg';
import bienIcon from '../../assets/images/bien.jpg';

// developers
function About() {
  const members = [
    { photo: alainIcon, name: "Alain Zuriel Z. Marcos" },
    { photo: bienIcon,  name: "Bien Aouien Miranda" },
    { photo: kienIcon,  name: "Kien Patrick Zharvy A. Ong" },
    { photo: ivanIcon,  name: "Peter Ivan Florendo" },
  ];

  // packages and libraries used in the project
  const packages = [
    {
      label: "Dependencies (Production)",
      dotClass: "prod",
      count: 16,
      items: [
        { name: "bcrypt",           desc: "Password hashing" },
        { name: "cloudinary",       desc: "Cloud image upload/storage" },
        { name: "cookie",           desc: "Cookie parsing" },
        { name: "cookie-parser",    desc: "Cookie parsing middleware" },
        { name: "cors",             desc: "Cross-origin resource sharing" },
        { name: "dotenv",           desc: "Environment variables" },
        { name: "express",          desc: "Web framework" },
        { name: "express-session",  desc: "Session management" },
        { name: "mongoose",         desc: "MongoDB ODM" },
        { name: "multer",           desc: "File upload handling" },
        { name: "node-cron",        desc: "Scheduled task automation" },
        { name: "react",            desc: "Frontend UI library" },
        { name: "react-dom",        desc: "React DOM rendering" },
        { name: "react-router-dom", desc: "React routing" },
        { name: "streamifier",      desc: "Stream conversion utility" },
        { name: "swiper",           desc: "Touch slider/carousel" },
      ],
    },
    {
      label: "Dev Dependencies",
      dotClass: "dev",
      count: 9,
      items: [
        { name: "@eslint/js",                  desc: "ESLint JavaScript config" },
        { name: "@types/react",                desc: "React TypeScript definitions" },
        { name: "@types/react-dom",            desc: "React DOM TypeScript defs" },
        { name: "@vitejs/plugin-react",        desc: "Vite React plugin" },
        { name: "eslint",                      desc: "Code linting" },
        { name: "eslint-plugin-react-hooks",   desc: "React hooks linting" },
        { name: "eslint-plugin-react-refresh", desc: "Fast Refresh plugin" },
        { name: "globals",                     desc: "ESLint global identifiers" },
        { name: "vite",                        desc: "Build tool & dev server" },
      ],
    },
    {
      label: "External (CDN / Fonts)",
      dotClass: "cdn",
      count: 2,
      items: [
        { name: "Google Fonts", desc: "Montserrat font family" },
        { name: "Swiper CDN",   desc: "Touch slider/carousel" },
      ],
    },
    {
      label: "Built-in Node.js Modules",
      dotClass: "node",
      count: 2,
      items: [
        { name: "path",   desc: "File/directory path utilities" },
        { name: "crypto", desc: "Cryptographic functions" },
      ],
    },
  ];

  // renders
  return (
    <>
      <UserNavbar />

      <div className="about-page">

        {/* HERO */}
        <div className="about-hero">
          <h1 className="about-hero-title">What's Behind TaftLab?</h1>
        </div>

        <div className="about-content">

          {/* the dev team */}
          <div className="about-team-section">
            <div className="about-section-label">The Team</div>
            <div className="about-team-grid">
              {members.map((m) => (
                <div className="about-member-card" key={m.name}>
                  <div className="about-avatar">
                    <img src={m.photo} alt={m.name} />
                  </div>
                  <div className="about-member-name">{m.name}</div>
                  <div className="about-member-role">Developer</div>
                </div>
              ))}
            </div>
          </div>

          <div className="about-divider" />

          {/* packages */}
          <div className="about-pkg-section">
            <div className="about-section-label">NPM Packages &amp; Libraries</div>

            {packages.map((pkg) => (
              <div className="about-pkg-category" key={pkg.label}>
                <div className="about-pkg-header">
                  <div className={`about-pkg-dot ${pkg.dotClass}`} />
                  <span className="about-pkg-title">{pkg.label}</span>
                  <span className={`about-pkg-count ${pkg.dotClass}`}>
                    {pkg.count} {pkg.count === 1 ? "package" : "packages"}
                  </span>
                </div>
                <div className="about-pkg-list">
                  {pkg.items.map((item) => (
                    <div className="about-pkg-item" key={item.name}>
                      <span className={`about-pkg-name ${pkg.dotClass}`}>{item.name}</span>
                      <span className="about-pkg-desc">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}

export default About;