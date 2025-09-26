// Export all middleware
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler,
  databaseErrorHandler,
  rateLimitErrorHandler,
  corsErrorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  handleGracefulShutdown,
  ErrorBoundary
} from './errorHandler';

export {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireRole,
  requireAdmin,
  requireEditorOrAdmin,
  customAuthorize,
  requireOwnershipOrAdmin,
  authorizeAction,
  canCreateTopics,
  canUpdateTopics,
  canDeleteTopics,
  canViewTopics,
  canModifyTopicHierarchy,
  canManageUsers,
  roleBasedRateLimit
} from './auth';
