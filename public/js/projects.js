document.addEventListener('DOMContentLoaded', () => {
  const videoModal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');

  document.querySelectorAll('.video-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
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
