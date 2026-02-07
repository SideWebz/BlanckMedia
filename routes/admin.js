const express = require('express');
const router = express.Router();
const { getAllUsers, addUser, deleteUser, findUserByUsername, isUserAdmin, getUserById } = require('../utils/userManager');
const bcrypt = require('bcryptjs');
const { getAllProjects, getProjectById, addProject, updateProject, deleteProject, getProjectsByBrand, getAllBrands, moveProjectUp, moveProjectDown } = require('../utils/projectManager');
const { getAllSlots, updateSlot, getHeader, updateHeader, isValidVideoUrl } = require('../utils/homePageManager');
// multer will be required at runtime if installed
let multer;
try { multer = require('multer'); } catch (e) { multer = null; }

// configure multer storage if available
let uploadMiddleware = null;
let multerStorage = null;
if (multer) {
  const path = require('path');
  multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
      const fs = require('fs');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const ext = file.originalname.split('.').pop();
      const name = Date.now() + '-' + Math.random().toString(36).substring(2,8) + '.' + ext;
      cb(null, name);
    }
  });
  uploadMiddleware = multer({ 
    storage: multerStorage,
    limits: { 
      fileSize: 5 * 1024 * 1024, // 5MB max file size
      fieldSize: 5 * 1024 * 1024
    }
  });
}

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/admin/login');
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/admin/login');
  }
  
  if (isUserAdmin(req.session.userId)) {
    return next();
  }
  
  // Non-admin user trying to access admin-only resource
  res.status(403).render('error', { layout: 'admin', message: 'Access Denied: Admin privileges required' });
};

// Login page - GET
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { layout: 'admin' });
});

// Login - POST
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if user exists in database
  const user = findUserByUsername(username);

  if (!user) {
    return res.render('admin/login', { layout: 'admin', error: 'Invalid credentials' });
  }

  // Compare password with stored hash
  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (isMatch) {
      req.session.userId = user.id;
      req.session.username = username;
      req.session.firstName = user.firstName;
      req.session.lastName = user.lastName;
      return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { layout: 'admin', error: 'Invalid credentials' });
  });
});

// Dashboard - protected route
router.get('/dashboard', isAuthenticated, (req, res) => {
  const userIsAdmin = isUserAdmin(req.session.userId);
  res.render('admin/dashboard', { 
    layout: 'admin',
    username: req.session.username,
    isAdmin: userIsAdmin
  });
});

// Users Management - GET
router.get('/users', isAdmin, (req, res) => {
  const users = getAllUsers();
  res.render('admin/users', {
    layout: 'admin',
    username: req.session.username,
    users: users
  });
});

// Add User - POST
router.post('/users/add', isAdmin, (req, res) => {
  const { username, firstName, lastName, password, isAdmin: adminFlag } = req.body;

  if (!username || !firstName || !lastName || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if username already exists
  const existingUser = findUserByUsername(username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  addUser(username, firstName, lastName, password, adminFlag === 'true' || adminFlag === true, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error creating user' });
    }
    res.json({ success: true, user });
  });
});

// Delete User - POST
router.post('/users/delete/:id', isAdmin, (req, res) => {
  const userId = req.params.id;
  deleteUser(userId);
  res.json({ success: true });
});

// Projects - list
router.get('/projects', isAuthenticated, (req, res) => {
  const projects = getAllProjects();
  res.render('admin/projects', {
    layout: 'admin',
    username: req.session.username,
    projects
  });
});

// Projects - new form
router.get('/projects/new', isAuthenticated, (req, res) => {
  const brands = getAllBrands();
  res.render('admin/project_form', {
    layout: 'admin',
    username: req.session.username,
    project: null,
    brands
  });
});

// Projects - add
router.post('/projects/add', isAuthenticated, (req, res) => {
  const { title, slug, brand, coverImage, sections } = req.body;
  let parsedSections = [];
  try {
    parsedSections = sections ? JSON.parse(sections) : [];
  } catch (e) {
    return res.status(400).json({ error: 'Invalid sections data' });
  }

  const proj = addProject({ title, slug, brand, coverImage, sections: parsedSections });
  res.json({ success: true, project: proj });
});

// Projects - delete
router.post('/projects/delete/:id', isAuthenticated, (req, res) => {
  const id = req.params.id;
  deleteProject(id);
  res.json({ success: true });
});

// Projects - move up
router.post('/projects/move-up/:id', isAuthenticated, (req, res) => {
  const id = req.params.id;
  const project = moveProjectUp(id);
  res.json({ success: true, project });
});

// Projects - move down
router.post('/projects/move-down/:id', isAuthenticated, (req, res) => {
  const id = req.params.id;
  const project = moveProjectDown(id);
  res.json({ success: true, project });
});

// Upload base64 file (simple, no external deps)
router.post('/upload-base64', isAuthenticated, express.json({ limit: '10mb' }), (req, res) => {
  const { filename, data } = req.body;
  if (!filename || !data) return res.status(400).json({ error: 'Invalid upload' });

  const uploadsDir = require('path').join(__dirname, '..', 'public', 'uploads');
  const fs = require('fs');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const ext = filename.split('.').pop();
  const name = Date.now() + '-' + Math.random().toString(36).substring(2,8) + '.' + ext;
  const filePath = require('path').join(uploadsDir, name);

  // data is expected like: data:image/png;base64,AAAA
  const parts = data.split(',');
  const b64 = parts.length > 1 ? parts[1] : parts[0];
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync(filePath, buf);

  const urlPath = '/uploads/' + name;
  res.json({ success: true, url: urlPath });
});

// Multer multipart upload endpoint (if multer is installed)
// Apply custom limits for this specific route
const uploadLimitMiddleware = multer && multerStorage ? multer({ 
  storage: multerStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    fieldSize: 10 * 1024 * 1024
  }
}).single('file') : null;

router.post('/upload', isAuthenticated, (req, res) => {
  if (!uploadLimitMiddleware) return res.status(500).json({ error: 'Multer not installed' });
  uploadLimitMiddleware(req, res, function(err) {
    if (err) return res.status(500).json({ error: 'Upload failed: ' + err.message });
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const urlPath = '/uploads/' + req.file.filename;
    res.json({ success: true, url: urlPath });
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.send('Error logging out');
    res.redirect('/');
  });
});

// Home Page Management - GET
router.get('/home', isAuthenticated, (req, res) => {
  const header = getHeader();
  const slots = getAllSlots();
  const projects = getAllProjects();
  res.render('admin/home', {
    layout: 'admin',
    username: req.session.username,
    header: header,
    slots: slots,
    projects: projects
  });
});

// Home Page Slot Update - POST
router.post('/home/slot/:id', isAuthenticated, (req, res) => {
  const slotId = req.params.id;
  const { type, image_path, video_url, projectId } = req.body;

  // Validate input
  if (!type || (type !== 'image' && type !== 'video')) {
    return res.status(400).json({ error: 'Invalid type. Must be "image" or "video"' });
  }

  if (type === 'image' && !image_path) {
    return res.status(400).json({ error: 'Image path is required for image type' });
  }

  if (type === 'video') {
    if (!video_url) {
      return res.status(400).json({ error: 'Video URL is required for video type' });
    }
    if (!isValidVideoUrl(video_url)) {
      return res.status(400).json({ error: 'Invalid video URL. Must be a valid video file (.mp4, .webm, .mov)' });
    }
  }

  const updates = {
    type: type,
    image_path: type === 'image' ? image_path : null,
    video_url: type === 'video' ? video_url : null,
    projectId: projectId || null
  };

  const slot = updateSlot(slotId, updates);
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found' });
  }

  res.json({ success: true, slot });
});

// Home Page Header Update - POST
router.post('/home/header', isAuthenticated, (req, res) => {
  const { type, image_path, video_url } = req.body;

  // Validate input
  if (!type || (type !== 'image' && type !== 'video')) {
    return res.status(400).json({ error: 'Invalid type. Must be "image" or "video"' });
  }

  if (type === 'image' && !image_path) {
    return res.status(400).json({ error: 'Image path is required for image type' });
  }

  if (type === 'video') {
    if (!video_url) {
      return res.status(400).json({ error: 'Video URL is required for video type' });
    }
    if (!isValidVideoUrl(video_url)) {
      return res.status(400).json({ error: 'Invalid video URL. Must be a valid video file (.mp4, .webm, .mov)' });
    }
  }

  const updates = {
    type: type,
    image_path: type === 'image' ? image_path : null,
    video_url: type === 'video' ? video_url : null
  };

  const header = updateHeader(updates);
  res.json({ success: true, header });
});

module.exports = router;

