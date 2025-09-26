import { Router } from 'express';
import { ResourceController } from '../controllers/ResourceController';
import { 
  authenticate, 
  canCreateTopics, 
  canUpdateTopics, 
  canDeleteTopics, 
  canViewTopics,
  requireAdmin,
  asyncHandler 
} from '../middleware';

const router = Router();
const resourceController = new ResourceController();

// Public routes (with optional authentication)
router.get('/search', asyncHandler(resourceController.searchResources));

// Protected routes (require authentication)
router.use(authenticate);

// GET routes
router.get('/', canViewTopics, asyncHandler(resourceController.getAllResources));
router.get('/stats', canViewTopics, asyncHandler(resourceController.getResourceStats));
router.get('/duplicates', requireAdmin, asyncHandler(resourceController.findDuplicateResources));
router.get('/type/:type', canViewTopics, asyncHandler(resourceController.getResourcesByType));
router.get('/topic/:topicId', canViewTopics, asyncHandler(resourceController.getResourcesByTopic));
router.get('/:id', canViewTopics, asyncHandler(resourceController.getResourceById));

// POST routes
router.post('/', canCreateTopics, asyncHandler(resourceController.createResource));
router.post('/video', canCreateTopics, asyncHandler(resourceController.createVideoResource));
router.post('/article', canCreateTopics, asyncHandler(resourceController.createArticleResource));
router.post('/pdf', canCreateTopics, asyncHandler(resourceController.createPdfResource));
router.post('/auto', canCreateTopics, asyncHandler(resourceController.createResourceWithAutoType));
router.post('/bulk', canCreateTopics, asyncHandler(resourceController.bulkCreateResources));
router.post('/validate-url', canViewTopics, asyncHandler(resourceController.validateResourceUrl));
router.post('/cleanup-orphaned', requireAdmin, asyncHandler(resourceController.cleanupOrphanedResources));

// PUT routes
router.put('/:id', canUpdateTopics, asyncHandler(resourceController.updateResource));
router.put('/move', canUpdateTopics, asyncHandler(resourceController.moveResources));

// DELETE routes
router.delete('/:id', canDeleteTopics, asyncHandler(resourceController.deleteResource));

export default router;
