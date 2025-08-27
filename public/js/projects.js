document.addEventListener('DOMContentLoaded', () => {
  const videoModal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');

  // Luister naar clicks op de hele container (image + overlay)
  document.querySelectorAll('.position-relative').forEach(container => {
    container.addEventListener('click', () => {
      const thumb = container.querySelector('.video-thumb');
      if (!thumb) return;
      const videoSrc = thumb.getAttribute('data-video');
      modalVideo.querySelector('source').src = videoSrc;
      modalVideo.load();
      new bootstrap.Modal(videoModal).show();
    });
  });

  // Stop video bij sluiten modal
  videoModal.addEventListener('hidden.bs.modal', () => {
    modalVideo.pause();
    modalVideo.currentTime = 0;
  });
});
