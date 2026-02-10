const sectionsContainer = document.getElementById('sectionsContainer');
const sectionsInput = document.getElementById('sectionsInput');
const coverImageFile = document.getElementById('coverImageFile');
const coverImageInput = document.getElementById('coverImage');
const projectIdInput = document.getElementById('projectId');
const imagesToDeleteInput = document.getElementById('imagesToDelete');

let sections = [];
let imagesToDelete = [];
let isEditMode = false;

// Detect if we're in edit mode
if (projectIdInput && projectIdInput.value) {
  isEditMode = true;
}

// Helper function to remove cover image
window.removeCoverImage = function() {
  const currentImage = coverImageInput.value;
  if (currentImage) {
    imagesToDelete.push(currentImage);
    coverImageInput.value = '';
    // Update the display
    const displayDiv = document.querySelector('[id*="cover"]').parentElement.querySelector('.alert-info');
    if (displayDiv) {
      displayDiv.style.display = 'none';
    }
  }
};

// Handle cover image upload
if (coverImageFile) {
  coverImageFile.addEventListener('change', function() {
    if (this.files[0]) {
      // If in edit mode and there's an old image, mark it for deletion
      if (isEditMode && coverImageInput.value && !imagesToDelete.includes(coverImageInput.value)) {
        imagesToDelete.push(coverImageInput.value);
      }
      uploadFileToServer(this.files[0]).then(url => {
        coverImageInput.value = url;
      }).catch(() => alert('Cover image upload failed'));
    }
  });
}

function addSection() {
  const type = document.getElementById('sectionType').value;
  const id = Date.now();
  const section = { id, type, data: {} };

  switch(type) {
    case 'VideoText':
      section.data = { video: '', text: '', thumbnail: '' };
      break;
    case 'CollageHeader':
      section.data = { images: [], text: '' };
      break;
    case 'Reels':
      section.data = { videos: ['', '', '', ''], thumbnails: ['', '', '', ''] };
      break;
    case 'WebVideos':
      section.data = { videos: ['', '', '', '', '', ''] };
      break;
    case 'Results':
      section.data = { image: '', text: '' };
      break;
    case 'Collage':
      section.data = { images: [] };
      break;
    case 'TextSection':
      section.data = { text: '' };
      break;
  }

  sections.push(section);
  renderSections();
}

function renderSections() {
  sectionsContainer.innerHTML = '';
  sections.forEach((s, idx) => {
    const el = document.createElement('div');
    el.className = 'card bg-dark text-white mb-3';
    el.dataset.id = s.id;

    let inner = `<div class="card-header d-flex justify-content-between align-items-center"><strong>${s.type}</strong> <button type="button" class="btn btn-sm btn-danger" onclick="removeSection(${s.id})">Remove</button></div><div class="card-body">`;

    if (s.type === 'VideoText') {
      inner += `<div class="mb-3"><label class="form-label">Video URL</label><input type="text" class="form-control" placeholder="YouTube, Vimeo, etc." value="${escapeHTML(s.data.video || '')}" onchange="updateSectionField(${s.id}, 'video', this.value)"></div>`;
      inner += `<div class="mb-3"><label class="form-label">Video Thumbnail / Poster Image (optional)</label><input type="file" accept="image/*" class="form-control" onchange="uploadSectionFile(${s.id}, this.files[0], 'thumbnail')"></div>`;
      inner += `${s.data.thumbnail ? `<p class="alert alert-success py-2 mb-3">✓ Thumbnail uploaded <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="removeImageFromSection(${s.id}, 'thumbnail')">Remove</button></p>` : ''}`;
      inner += `<div class="mb-3"><label class="form-label">Text</label><textarea class="form-control" rows="4" onchange="updateSectionField(${s.id}, 'text', this.value)">${escapeHTML(s.data.text || '')}</textarea></div>`;
    }

    if (s.type === 'CollageHeader') {
      inner += `<div class="mb-3"><label class="form-label">Images (6-10 images, upload)</label><input type="file" accept="image/*" multiple class="form-control" onchange="uploadMultipleSectionFiles(${s.id}, this.files)"></div>`;
      inner += `${s.data.images.length > 0 ? `<p class="alert alert-success py-2 mb-3">✓ ${s.data.images.length} images uploaded</p>` : ''}`;
      if (s.data.images.length > 0) {
        inner += `<div class="mb-3">`;
        s.data.images.forEach((img, idx) => {
          inner += `<div class="d-flex align-items-center justify-content-between mb-2"><small>${img}</small><button type="button" class="btn btn-sm btn-outline-danger" onclick="removeImageFromArray(${s.id}, 'images', ${idx})">Remove</button></div>`;
        });
        inner += `</div>`;
      }
      inner += `<div class="mb-3"><label class="form-label">Brand Text</label><textarea class="form-control" rows="4" onchange="updateSectionField(${s.id}, 'text', this.value)">${escapeHTML(s.data.text || '')}</textarea></div>`;
    }

    if (s.type === 'Reels') {
      inner += `<div class="mb-3"><label class="form-label">Video Links (3-4 vertical video links, e.g., TikTok, Instagram Reels)</label>`;
      for (let i = 0; i < 4; i++) {
        inner += `<input type="text" class="form-control mb-2" placeholder="Video ${i+1} URL" value="${escapeHTML(s.data.videos[i] || '')}" onchange="updateVideoField(${s.id}, ${i}, this.value)">`;
      }
      inner += `</div>`;
      inner += `<div class="mb-3"><label class="form-label">Video Thumbnails / Poster Images (optional)</label><p class="text-muted mb-2">Upload thumbnail images for each video</p>`;
      for (let i = 0; i < 4; i++) {
        inner += `<div class="mb-2">`;
        inner += `<label class="form-label mb-1">Thumbnail ${i+1}</label>`;
        inner += `<input type="file" accept="image/*" class="form-control" onchange="uploadReelThumbnail(${s.id}, ${i}, this.files[0])">`;
        inner += `${s.data.thumbnails && s.data.thumbnails[i] ? `<p class="alert alert-success py-1 mt-1 mb-0">✓ Uploaded <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="removeImageFromArray(${s.id}, 'thumbnails', ${i})">Remove</button></p>` : ''}`;
        inner += `</div>`;
      }
      inner += `</div>`;
    }

    if (s.type === 'WebVideos') {
      inner += `<div class="mb-3"><label class="form-label">Video Links (3-6 horizontal videos, 3 per row)</label>`;
      for (let i = 0; i < 6; i++) {
        inner += `<input type="text" class="form-control mb-2" placeholder="Video ${i+1} URL" value="${escapeHTML(s.data.videos[i] || '')}" onchange="updateVideoField(${s.id}, ${i}, this.value)">`;
      }
      inner += `</div>`;
    }

    if (s.type === 'Results') {
      inner += `<div class="mb-3"><label class="form-label">Image (upload)</label><input type="file" accept="image/*" class="form-control" onchange="uploadSectionFile(${s.id}, this.files[0], 'image')"></div>`;
      inner += `${s.data.image ? `<p class="alert alert-success py-2 mb-3">✓ Image: ${s.data.image} <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="removeImageFromSection(${s.id}, 'image')">Remove</button></p>` : ''}`;
      inner += `<div class="mb-3"><label class="form-label">Text</label><textarea class="form-control" rows="4" onchange="updateSectionField(${s.id}, 'text', this.value)">${escapeHTML(s.data.text || '')}</textarea></div>`;
    }

    if (s.type === 'Collage') {
      inner += `<div class="mb-3"><label class="form-label">Images (6-10 images, upload)</label><input type="file" accept="image/*" multiple class="form-control" onchange="uploadMultipleSectionFiles(${s.id}, this.files)"></div>`;
      inner += `${s.data.images.length > 0 ? `<p class="alert alert-success py-2">✓ ${s.data.images.length} images uploaded</p>` : ''}`;
      if (s.data.images.length > 0) {
        inner += `<div class="mb-3">`;
        s.data.images.forEach((img, idx) => {
          inner += `<div class="d-flex align-items-center justify-content-between mb-2"><small>${img}</small><button type="button" class="btn btn-sm btn-outline-danger" onclick="removeImageFromArray(${s.id}, 'images', ${idx})">Remove</button></div>`;
        });
        inner += `</div>`;
      }
    }

    if (s.type === 'TextSection') {
      inner += `<div class="mb-3"><label class="form-label">Text Content</label><textarea class="form-control" rows="6" onchange="updateSectionField(${s.id}, 'text', this.value)">${escapeHTML(s.data.text || '')}</textarea></div>`;
    }

    inner += `<div class="mt-3 d-flex gap-2"><button type="button" class="btn btn-sm btn-outline-light" onclick="moveUp(${s.id})">↑ Move Up</button><button type="button" class="btn btn-sm btn-outline-light" onclick="moveDown(${s.id})">↓ Move Down</button></div></div>`;

    el.innerHTML = inner;
    sectionsContainer.appendChild(el);
  });

  sectionsInput.value = JSON.stringify(sections.map(s => ({ type: s.type, data: s.data })));
}

function updateSectionField(id, field, value) {
  const s = sections.find(x => x.id === id);
  if (!s) return;
  s.data[field] = value;
  sectionsInput.value = JSON.stringify(sections.map(s => ({ type: s.type, data: s.data })));
}

function updateVideoField(id, index, value) {
  const s = sections.find(x => x.id === id);
  if (!s) return;
  s.data.videos[index] = value;
  sectionsInput.value = JSON.stringify(sections.map(s => ({ type: s.type, data: s.data })));
}

function removeSection(id) {
  const section = sections.find(x => x.id === id);
  if (section) {
    // Mark all images in this section for deletion
    if (section.data.image) imagesToDelete.push(section.data.image);
    if (section.data.thumbnail) imagesToDelete.push(section.data.thumbnail);
    if (Array.isArray(section.data.images)) {
      section.data.images.forEach(img => {
        if (img && !imagesToDelete.includes(img)) imagesToDelete.push(img);
      });
    }
    if (Array.isArray(section.data.thumbnails)) {
      section.data.thumbnails.forEach(thumb => {
        if (thumb && !imagesToDelete.includes(thumb)) imagesToDelete.push(thumb);
      });
    }
  }
  sections = sections.filter(s => s.id !== id);
  renderSections();
}

function removeImageFromSection(sectionId, field) {
  const section = sections.find(x => x.id === sectionId);
  if (section && section.data[field]) {
    imagesToDelete.push(section.data[field]);
    section.data[field] = '';
    renderSections();
  }
}

function removeImageFromArray(sectionId, field, index) {
  const section = sections.find(x => x.id === sectionId);
  if (section && Array.isArray(section.data[field])) {
    const img = section.data[field][index];
    if (img && !imagesToDelete.includes(img)) {
      imagesToDelete.push(img);
    }
    section.data[field].splice(index, 1);
    renderSections();
  }
}

function moveUp(id) {
  const idx = sections.findIndex(s => s.id === id);
  if (idx > 0) {
    const tmp = sections[idx - 1];
    sections[idx - 1] = sections[idx];
    sections[idx] = tmp;
    renderSections();
  }
}

function moveDown(id) {
  const idx = sections.findIndex(s => s.id === id);
  if (idx < sections.length - 1) {
    const tmp = sections[idx + 1];
    sections[idx + 1] = sections[idx];
    sections[idx] = tmp;
    renderSections();
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s];
  });
}

async function uploadFileToServer(file) {
  if (!file) return null;
  // Prefer multipart upload to /admin/upload (multer)
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/admin/upload', { method: 'POST', body: fd });
    const j = await res.json();
    if (res.ok && j.url) return j.url;
  } catch (err) {
    // fallback to base64 endpoint
  }

  // fallback: base64 encode
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const data = reader.result; // data:...base64
      try {
        const res = await fetch('/admin/upload-base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data })
        });
        const j = await res.json();
        if (res.ok && j.url) resolve(j.url);
        else reject(j.error || 'Upload failed');
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject('read error');
    reader.readAsDataURL(file);
  });
}

function uploadSectionFile(sectionId, file, field) {
  if (!file) return;
  uploadFileToServer(file).then(url => {
    updateSectionField(sectionId, field, url);
    renderSections();
  }).catch(err => alert('Upload failed'));
}

function uploadMultipleSectionFiles(sectionId, files) {
  if (!files || files.length === 0) return;
  const promises = Array.from(files).map(f => uploadFileToServer(f));
  Promise.all(promises).then(urls => {
    const s = sections.find(x => x.id === sectionId);
    if (!s) return;
    s.data.images = urls;
    renderSections();
  }).catch(() => alert('One or more uploads failed'));
}

function uploadReelThumbnail(sectionId, index, file) {
  if (!file) return;
  uploadFileToServer(file).then(url => {
    const s = sections.find(x => x.id === sectionId);
    if (!s) return;
    if (!Array.isArray(s.data.thumbnails)) s.data.thumbnails = [];
    s.data.thumbnails[index] = url;
    renderSections();
  }).catch(err => alert('Thumbnail upload failed'));
}

// Submit handler
const projectForm = document.getElementById('projectForm');
if (projectForm) {
  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const slug = document.getElementById('slug').value;
    const brand = document.getElementById('brand').value;
    const coverImage = document.getElementById('coverImage').value || null;
    const visible = document.getElementById('visibleCheck').checked ? true : false;

    if (!brand) return alert('Brand is required');

    sectionsInput.value = JSON.stringify(sections.map(s => ({ type: s.type, data: s.data })));
    imagesToDeleteInput.value = JSON.stringify(imagesToDelete);

    const body = { title, slug, brand, coverImage, sections: sectionsInput.value, imagesToDelete, visible };
    
    try {
      const projectId = projectIdInput.value;
      const endpoint = projectId ? `/admin/projects/${projectId}/update` : '/admin/projects/add';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = '/admin/projects';
      } else {
        alert(data.error || 'Error saving project');
      }
    } catch (err) { alert('Error saving project'); }
  });
}

// Initialize form if editing
if (isEditMode) {
  // Sections will be loaded from the server-rendered form
  // Parse the existing sections from the hidden input
  let existingSectionsStr = sectionsInput.value;
  
  // Decode HTML entities
  if (existingSectionsStr) {
    existingSectionsStr = existingSectionsStr
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'");
  }
  
  console.log('Decoded sectionsInput.value:', existingSectionsStr);
  if (existingSectionsStr) {
    try {
      const parsed = JSON.parse(existingSectionsStr);
      sections = parsed.map((s, idx) => ({
        id: Date.now() + idx, // Generate new IDs for runtime
        type: s.type,
        data: s.data || {}
      }));
      renderSections();
    } catch (e) {
      console.error('Error parsing sections:', e);
      console.error('Failed string was:', existingSectionsStr);
    }
  }
}
