import { Router } from 'express';
import { TopicController } from '../controllers/TopicController';
import { 
  authenticate, 
  canCreateTopics, 
  canUpdateTopics, 
  canDeleteTopics, 
  canViewTopics,
  canModifyTopicHierarchy,
  asyncHandler 
} from '../middleware';

const router = Router();
const topicController = new TopicController();

// Public routes (with optional authentication)
router.get('/search', asyncHandler(topicController.searchTopics));

// Protected routes (require authentication)
router.use(authenticate);

// GET routes
router.get('/', canViewTopics, asyncHandler(topicController.getAllTopics));
router.get('/root', canViewTopics, asyncHandler(topicController.getRootTopics));
router.get('/roots', canViewTopics, asyncHandler(topicController.getRootTopics));
router.get('/stats', canViewTopics, asyncHandler(topicController.getTopicStats));
router.get('/path', canViewTopics, asyncHandler(topicController.getShortestPath));
router.get('/:id', canViewTopics, asyncHandler(topicController.getTopicById));
router.get('/:id/hierarchy', canViewTopics, asyncHandler(topicController.getTopicHierarchy));
router.get('/:id/children', canViewTopics, asyncHandler(topicController.getTopicChildren));
router.get('/:id/versions', canViewTopics, asyncHandler(topicController.getTopicVersions));
router.get('/:id/versions/:version', canViewTopics, asyncHandler(topicController.getTopicVersion));
router.get('/:id/recursive', canViewTopics, asyncHandler(topicController.getTopicHierarchy));

// POST routes
router.post('/', canCreateTopics, asyncHandler(topicController.createTopic));
router.post('/find-path', canViewTopics, asyncHandler(topicController.findShortestPath));

// PUT routes
router.put('/:id', canUpdateTopics, asyncHandler(topicController.updateTopic));
router.put('/:id/move', canModifyTopicHierarchy, asyncHandler(topicController.moveTopic));
router.post('/:id/revert/:version', canUpdateTopics, asyncHandler(topicController.revertTopicVersion));

// DELETE routes
router.delete('/:id', canDeleteTopics, asyncHandler(topicController.deleteTopic));

export default router;
