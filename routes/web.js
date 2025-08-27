import express from 'express';
import { home } from '../controllers/homeController.js';
import { projects } from '../controllers/projectsController.js';
import { about } from '../controllers/aboutController.js';
import { contact } from '../controllers/contactController.js';

const router = express.Router();
router.get('/', home);
router.get('/projects', projects);
router.get('/about', about);
router.get('/contact', contact);

export default router;
