var TrandingSlider = new Swiper('.tranding-slider', {
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: 'auto',
  loop: true,
  spaceBetween: 0,
  coverflowEffect: {
    rotate: 0,
    stretch: -60,   // increase negative value for more overlap
    depth: 200,     // larger depth gives 3D effect
    modifier: 1.5,  // increases overlap effect
    slideShadows: false
  },
  pagination: { el: '.swiper-pagination', clickable: true },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
});


// Logout confirmation popup with hover effects and larger size
document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.querySelector('nav ul li a[href="login.html"]');

  if (!logoutLink) return;

  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();

    if (document.querySelector(".logout-popup")) return;

    const overlay = document.createElement("div");
    overlay.classList.add("logout-popup-overlay");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.2)";
    overlay.style.zIndex = "1000";

    const popup = document.createElement("div");
    popup.classList.add("logout-popup");
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.background = "#ffffff";
    popup.style.border = "3px solid black";
    popup.style.padding = "20px";
    popup.style.borderRadius = "8px";
    popup.style.zIndex = "1001";
    popup.style.minWidth = "500px";
    popup.style.minHeight = "220px";
    popup.style.textAlign = "center";
    popup.style.fontFamily = "Montserrat, sans-serif";
    popup.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
    popup.style.display = "flex";
    popup.style.justifyContent = "center";
    popup.style.flexDirection = "column";
    popup.style.gap = "20px";

    popup.innerHTML = `
      <h3 style="margin-bottom:20px; color:#333;">Are you sure you want to log out?</h3>
      <div style="display:flex; justify-content:center; gap:15px;">
        <button class="confirm-logout" style="
          background:black; 
          color:white; 
          border:none; 
          padding: 10px 0px; 
          border-radius:5px; 
          font-weight:bold;
          cursor:pointer;
          width: 125px;
          transition: background 0.2s ease;
        ">Confirm</button>
        <button class="cancel-logout" style="
          background:#28a745; 
          color:white; 
          border:none; 
          padding: 10px 0px; 
          border-radius:5px; 
          font-weight:bold;
          cursor:pointer;
          width: 125px;
          transition: background 0.2s ease;
        ">Back</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    const confirmBtn = popup.querySelector(".confirm-logout");
    const cancelBtn = popup.querySelector(".cancel-logout");

    confirmBtn.addEventListener("mouseenter", () => {
      confirmBtn.style.background = "#333";
    });
    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.background = "black";
    });

    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = "#4cd964";
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = "#28a745";
    });

    cancelBtn.addEventListener("click", () => {
      popup.remove();
      overlay.remove();
    });

    confirmBtn.addEventListener("click", () => {
      window.location.href = logoutLink.href;
    });

    overlay.addEventListener("click", () => {
      popup.remove();
      overlay.remove();
    });
  });
});


