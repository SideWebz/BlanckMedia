const fs = require('fs');
const path = require('path');

const projectsFile = path.join(__dirname, '../data/projects.json');

const readProjects = () => {
  try {
    const data = fs.readFileSync(projectsFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeProjects = (projects) => {
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
};

// Helper function to delete a file from uploads folder
const deleteUploadedFile = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return false;
  
  // Only delete files from the uploads folder (safety check)
  if (!filePath.includes('/uploads/')) return false;
  
  // Extract filename from path like "/uploads/filename.ext"
  const filename = filePath.split('/uploads/')[1];
  if (!filename) return false;
  
  const fullPath = path.join(__dirname, '../public/uploads', filename);
  
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
  } catch (err) {
    console.error('Error deleting file:', err);
  }
  return false;
};

// Helper function to delete all images in a section
const deleteImagesInSection = (section) => {
  if (!section || !section.data) return;
  
  const data = section.data;
  
  // Delete single image fields
  if (data.image) deleteUploadedFile(data.image);
  if (data.thumbnail) deleteUploadedFile(data.thumbnail);
  
  // Delete image arrays
  if (Array.isArray(data.images)) {
    data.images.forEach(img => deleteUploadedFile(img));
  }
  
  // Delete thumbnail arrays
  if (Array.isArray(data.thumbnails)) {
    data.thumbnails.forEach(thumb => deleteUploadedFile(thumb));
  }
};

// Helper function to delete all files associated with a project
const deleteProjectFiles = (project) => {
  if (!project) return;
  
  // Delete cover image
  if (project.coverImage) {
    deleteUploadedFile(project.coverImage);
  }
  
  // Delete all images in sections
  if (Array.isArray(project.sections)) {
    project.sections.forEach(section => deleteImagesInSection(section));
  }
};

const getAllProjects = () => readProjects();

const getProjectById = (id) => {
  const projects = readProjects();
  return projects.find(p => String(p.id) === String(id));
};

const addProject = ({ title, slug, brand, coverImage, sections }) => {
  const projects = readProjects();
  const newProject = {
    id: Date.now(),
    title,
    slug: slug || String(Date.now()),
    brand: brand || '',
    coverImage: coverImage || null,
    sections: sections || [],
    createdAt: new Date().toISOString()
  };
  projects.unshift(newProject);
  writeProjects(projects);
  return newProject;
};

const updateProject = (id, updates) => {
  const projects = readProjects();
  const idx = projects.findIndex(p => String(p.id) === String(id));
  if (idx === -1) return null;
  
  const oldProject = projects[idx];
  
  // Handle image deletions if specified in updates
  if (updates.imagesToDelete && Array.isArray(updates.imagesToDelete)) {
    updates.imagesToDelete.forEach(imgPath => deleteUploadedFile(imgPath));
    delete updates.imagesToDelete; // Remove this from the actual update
  }
  
  // Merge updates, preserving existing values for fields that are empty/null
  const merged = Object.assign({}, oldProject);
  
  // For each update field, only update if provided and not empty
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined && updates[key] !== null && updates[key] !== '') {
      merged[key] = updates[key];
    }
    // If empty/null but explicitly set to preserve existing, skip
    // Otherwise let the undefined/null pass through
  });
  
  projects[idx] = merged;
  writeProjects(projects);
  return projects[idx];
};

const getProjectsByBrand = (brand) => {
  const projects = readProjects();
  return projects.filter(p => p.brand && p.brand.toLowerCase() === brand.toLowerCase());
};

const getAllBrands = () => {
  const projects = readProjects();
  const brands = new Set();
  projects.forEach(p => {
    if (p.brand) brands.add(p.brand);
  });
  return Array.from(brands).sort();
};

const deleteProject = (id) => {
  const projects = readProjects();
  const projectToDelete = projects.find(p => String(p.id) === String(id));
  
  // Delete all associated files before removing from database
  if (projectToDelete) {
    deleteProjectFiles(projectToDelete);
  }
  
  const filtered = projects.filter(p => String(p.id) !== String(id));
  writeProjects(filtered);
  return filtered;
};

const moveProjectUp = (id) => {
  const projects = readProjects();
  const idx = projects.findIndex(p => String(p.id) === String(id));
  if (idx <= 0) return projects[idx] || null;
  
  // Swap with previous
  const tmp = projects[idx - 1];
  projects[idx - 1] = projects[idx];
  projects[idx] = tmp;
  
  writeProjects(projects);
  return projects[idx - 1];
};

const moveProjectDown = (id) => {
  const projects = readProjects();
  const idx = projects.findIndex(p => String(p.id) === String(id));
  if (idx >= projects.length - 1 || idx === -1) return projects[idx] || null;
  
  // Swap with next
  const tmp = projects[idx + 1];
  projects[idx + 1] = projects[idx];
  projects[idx] = tmp;
  
  writeProjects(projects);
  return projects[idx + 1];
};

module.exports = {
  getAllProjects,
  getProjectById,
  addProject,
  updateProject,
  deleteProject,
  getProjectsByBrand,
  getAllBrands,
  moveProjectUp,
  moveProjectDown,
  deleteUploadedFile,
  deleteImagesInSection,
  deleteProjectFiles
};
