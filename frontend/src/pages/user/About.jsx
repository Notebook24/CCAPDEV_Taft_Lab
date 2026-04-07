import UserNavbar from '../../components/UserNavbar';
import "../../style/user_css/About.css";

function About() {
  return (
    <>
      <UserNavbar />

      <div className="about-page-container">
        <div className="about-body">
          <h1 className="about-title">About TaftLab</h1>
          <p><b>Members:</b></p>
          <p>Alain Zuriel Z. Marcos</p>
          <p>Bien Aouien Miranda</p>
          <p>Kien Patrick Zharvy A. Ong</p>
          <p>Peter Ivan Florendo</p>

          <hr />
          
          <h1 className="about-title">NPM Packages and External Libraries</h1>
          
          <div className="about-desc">
            <h3>Dependencies (Production)</h3>
            <ul>
              <li><strong>bcrypt</strong> - Password hashing</li>
              <li><strong>cloudinary</strong> - Cloud image upload/storage</li>
              <li><strong>cookie</strong> - Cookie parsing</li>
              <li><strong>cookie-parser</strong> - Cookie parsing middleware</li>
              <li><strong>cors</strong> - Cross-origin resource sharing</li>
              <li><strong>dotenv</strong> - Environment variables management</li>
              <li><strong>express</strong> - Web framework</li>
              <li><strong>express-session</strong> - Session management</li>
              <li><strong>mongoose</strong> - MongoDB ODM</li>
              <li><strong>multer</strong> - File upload handling</li>
              <li><strong>node-cron</strong> - Scheduled task automation</li>
              <li><strong>react</strong> - Frontend UI library</li>
              <li><strong>react-dom</strong> - React DOM rendering</li>
              <li><strong>react-router-dom</strong> - React routing</li>
              <li><strong>streamifier</strong> - Stream conversion utility</li>
              <li><strong>swiper</strong> - Touch slider/carousel</li>
            </ul>

            <h3>Dev Dependencies</h3>
            <ul>
              <li><strong>@eslint/js</strong> - ESLint JavaScript config</li>
              <li><strong>@types/react</strong> - React TypeScript definitions</li>
              <li><strong>@types/react-dom</strong> - React DOM TypeScript definitions</li>
              <li><strong>@vitejs/plugin-react</strong> - Vite React plugin</li>
              <li><strong>eslint</strong> - Code linting</li>
              <li><strong>eslint-plugin-react-hooks</strong> - React hooks linting rules</li>
              <li><strong>eslint-plugin-react-refresh</strong> - React refresh plugin for Fast Refresh</li>
              <li><strong>globals</strong> - Global identifier list for ESLint</li>
              <li><strong>vite</strong> - Build tool and dev server</li>
            </ul>


            <h3>External Third-Party Libraries (CDN/Fonts)</h3>
            <ul>
              <li><strong>Google Fonts (Montserrat)</strong> - Font family - https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap</li>
              <li><strong>Swiper CDN</strong> - https://unpkg.com/swiper@8/swiper-bundle.min.js</li>
            </ul>

            <h3>Built-in Node.js Modules (no install needed)</h3>
            <ul>
              <li><strong>path</strong> - File/directory path utilities</li>
              <li><strong>crypto</strong> - Cryptographic functions</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default About;