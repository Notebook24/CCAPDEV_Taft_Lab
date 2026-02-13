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


