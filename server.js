require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { engine } = require('express-handlebars');

const app = express();
const PORT = process.env.PORT || 3576;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Expose session user info to templates (firstName, lastName)
app.use((req, res, next) => {
  res.locals.username = req.session ? req.session.username : null;
  res.locals.firstName = req.session ? req.session.firstName : null;
  res.locals.lastName = req.session ? req.session.lastName : null;
  next();
});

// View engine setup
app.engine('handlebars', engine({ 
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    formatDate: (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('nl-NL', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    },
    eq: function(a, b) { return a === b; },
    getCoverImage: (project) => {
      if (project.coverImage) return project.coverImage;
      if (project.sections && project.sections.length > 0) {
        const firstSection = project.sections[0];
        if (firstSection.data) {
          if (firstSection.data.image) return firstSection.data.image;
          if (Array.isArray(firstSection.data.images) && firstSection.data.images.length > 0) return firstSection.data.images[0];
        }
      }
      return '/uploads/placeholder.jpg';
    },
    renderSection: (section) => {
      if (!section || !section.type) return '';
      const h = require('handlebars');
      const data = section.data || {};

      switch(section.type) {
       case 'VideoText':
  let videoUrl = data.video || '';
  let videoHtml = '';
  const posterAttr = data.thumbnail ? `poster="${h.escapeExpression(data.thumbnail)}"` : '';
  
  // Check if it's a direct video file (mp4, webm, etc.)
  if (videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.mov')) {
    videoHtml = `<video width="100%" playsinline preload="metadata" id="videoframe" ${posterAttr}><source src="${h.escapeExpression(videoUrl)}" type="video/mp4"></video>`;
  } else {
    // It's an embed URL (iframe)
    videoHtml = `<iframe id="videoframe" src="${h.escapeExpression(videoUrl)}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width: 100%; height: 100%;"></iframe>`;
  }
  
  return new h.SafeString(`
    <section class="proj-video-text">
      <div class="proj-video-text-wrapper">
        ${videoHtml}
        <div class="video-play-button" onclick="playVideoText(this)"></div>
      </div>
      <p class="section-text">${h.escapeExpression(data.text || '')}</p>
    </section>
    <script>
      function playVideoText(btn) {
        const wrapper = btn.closest('.proj-video-text-wrapper');
        const v = wrapper ? wrapper.querySelector('#videoframe') : null;
        const playBtn = wrapper ? wrapper.querySelector('.video-play-button') : null;
        
        if (!playBtn || !v) return;
        
        // Hide play button immediately with multiple methods for cross-browser compatibility
        playBtn.classList.add('hidden');
        playBtn.style.display = 'none';
        playBtn.style.visibility = 'hidden';
        playBtn.style.pointerEvents = 'none';
        
        if (v.tagName === 'VIDEO') {
          // It's a video element
          v.controls = true;
          
          // Add event listener to ensure button stays hidden during playback
          const ensureHidden = () => {
            playBtn.classList.add('hidden');
            playBtn.style.display = 'none';
            playBtn.style.visibility = 'hidden';
            playBtn.style.pointerEvents = 'none';
          };
          
          // Listen for play and playing events with cross-browser support
          v.addEventListener('play', ensureHidden, false);
          v.addEventListener('playing', ensureHidden, false);
          v.addEventListener('loadstart', ensureHidden, false);
          
          // Attempt to play
          const playPromise = v.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.log('Video play error:', error);
              // If play fails, re-show the button
              playBtn.classList.remove('hidden');
              playBtn.style.display = 'flex';
              playBtn.style.visibility = 'visible';
              playBtn.style.pointerEvents = 'auto';
            });
          }
        } else if (v.tagName === 'IFRAME') {
          // It's an iframe - enable pointer events for interaction
          v.style.pointerEvents = 'auto';
          // Button stays hidden as user can interact directly with iframe
        }
      }
    </script>
  `);


        case 'CollageHeader':
          const cheaderImgs = Array.isArray(data.images) ? data.images : [];
          const imgCount = cheaderImgs.length;
          let cheaderGridClass = 'collage-grid';
          if (imgCount >= 6 && imgCount <= 10) cheaderGridClass = `collage-grid collage-grid-${imgCount}`;
          
          const cheaderGrid = cheaderImgs.map((u, idx) => `<div class="collage-item collage-item-${idx + 1}"><img src="${h.escapeExpression(u)}" alt=""/></div>`).join('');
          return new h.SafeString(`<section class="proj-collage-header"><div class="${cheaderGridClass}">${cheaderGrid}</div><p class="section-text">${h.escapeExpression(data.text || '')}</p></section>`);

case 'Reels':
  const reels = (data.videos || []).filter(v=>v);
  const thumbnails = data.thumbnails || [];
  const reelsHtml = reels.map((u, idx) => {
    const posterAttr = thumbnails[idx] ? `poster="${h.escapeExpression(thumbnails[idx])}"` : '';
    return `
    <div class="reel" id="reel-${idx}">
      <video 
        id="video-${idx}"
        src="${h.escapeExpression(u)}" 
        playsinline
        preload="metadata"
        ${posterAttr}
      ></video>
      <div class="reel-play-button" onclick="playReel(${idx})"></div>
    </div>
  `;
  }).join('');
  
  return new h.SafeString(`
    <section class="proj-reels">
      <h2 class="reels-title">REELS</h2>
      <div class="reels-grid reels-count-${reels.length}">${reelsHtml}</div>
    </section>
    <script>
      function playReel(idx) {
        const video = document.getElementById('video-' + idx);
        const reelContainer = document.getElementById('reel-' + idx);
        const playBtn = reelContainer ? reelContainer.querySelector('.reel-play-button') : null;
        
        if (!video || !playBtn) return;
        
        // Hide play button immediately with multiple methods for cross-browser compatibility
        playBtn.classList.add('hidden');
        playBtn.style.display = 'none';
        playBtn.style.visibility = 'hidden';
        playBtn.style.pointerEvents = 'none';
        
        // Show controls
        video.controls = true;
        
        // Add event listeners to ensure button stays hidden during playback
        const ensureHidden = () => {
          playBtn.classList.add('hidden');
          playBtn.style.display = 'none';
          playBtn.style.visibility = 'hidden';
          playBtn.style.pointerEvents = 'none';
        };
        
        // Listen for play events with cross-browser support
        video.addEventListener('play', ensureHidden, false);
        video.addEventListener('playing', ensureHidden, false);
        video.addEventListener('loadstart', ensureHidden, false);
        
        // Attempt to play
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Video play error:', error);
            // If play fails, re-show the button
            playBtn.classList.remove('hidden');
            playBtn.style.display = 'flex';
            playBtn.style.visibility = 'visible';
            playBtn.style.pointerEvents = 'auto';
          });
        }
      }
    </script>
  `);

  
case 'WebVideos':
  const webvids = (data.videos || []).filter(v=>v);
  const webvidsHtml = webvids.map(u => 
    `<div class="webvideo">
      <video autoplay loop muted playsinline>
        <source src="${h.escapeExpression(u)}" type="video/mp4">
      </video>
    </div>`
  ).join('');
  return new h.SafeString(`<section class="proj-webvideos"><div class="webvideos-grid">${webvidsHtml}</div></section>`);


        case 'Results':
  return new h.SafeString(`
    <section class="proj-results">
      <h2 class="results-title">RESULTS</h2>
      <div class="results-content">
        <div class="results-image">
          <img src="${h.escapeExpression(data.image || '')}" alt=""/>
        </div>
        <p class="section-text">${h.escapeExpression(data.text || '')}</p>
      </div>
    </section>
  `);

        case 'Collage':
          const collageImgs = Array.isArray(data.images) ? data.images : [];
          const collageCount = collageImgs.length;
          let collageGridClass = 'collage-grid';
          if (collageCount >= 6 && collageCount <= 10) collageGridClass = `collage-grid collage-grid-${collageCount}`;
          
          const collageGridHtml = collageImgs.map((u, idx) => `<div class="collage-item collage-item-${idx + 1}"><img src="${h.escapeExpression(u)}" alt=""/></div>`).join('');
          return new h.SafeString(`<section class="proj-collage"><div class="${collageGridClass}">${collageGridHtml}</div></section>`);

        case 'TextSection':
          return new h.SafeString(`<section class="proj-text-section"><div class="text-section-content"><p class="section-text">${h.escapeExpression(data.text || '')}</p></div></section>`);

        default:
          return '';
      }
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { layout: 'main' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { layout: 'main', message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
