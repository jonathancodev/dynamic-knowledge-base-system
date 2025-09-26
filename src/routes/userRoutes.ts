import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { 
  authenticate, 
  canManageUsers,
  requireAdmin,
  asyncHandler 
} from '../middleware';

const router = Router();
const userController = new UserController();

// Public routes (no authentication required)
router.post('/register', asyncHandler(userController.registerUser));
router.post('/login', asyncHandler(userController.loginUser));

// Protected routes (require authentication)
router.use(authenticate);

// Current user routes (no additional permissions needed)
router.get('/me', asyncHandler(userController.getCurrentUser));
router.put('/me', asyncHandler(userController.updateCurrentUser));
router.get('/me/permissions', asyncHandler(userController.getUserPermissions));

// Admin-only routes
router.get('/', requireAdmin, asyncHandler(userController.getAllUsers));
router.get('/search', requireAdmin, asyncHandler(userController.searchUsers));
router.get('/stats', requireAdmin, asyncHandler(userController.getUserStats));
router.get('/role/:role', requireAdmin, asyncHandler(userController.getUsersByRole));

// User management routes (admin only)
router.post('/', canManageUsers, asyncHandler(userController.createUser));
router.post('/admin', canManageUsers, asyncHandler(userController.createAdmin));
router.post('/editor', canManageUsers, asyncHandler(userController.createEditor));
router.post('/viewer', canManageUsers, asyncHandler(userController.createViewer));

// Individual user routes
router.get('/:id', requireAdmin, asyncHandler(userController.getUserById));
router.put('/:id', canManageUsers, asyncHandler(userController.updateUser));
router.put('/:id/role', canManageUsers, asyncHandler(userController.changeUserRole));
router.delete('/:id', canManageUsers, asyncHandler(userController.deleteUser));
router.post('/:id/validate-action', requireAdmin, asyncHandler(userController.validateUserAction));
router.get('/:id/permissions', requireAdmin, asyncHandler(userController.getUserPermissions));

export default router;
