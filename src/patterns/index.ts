// Export Factory patterns
export {
  EntityFactory,
  TopicVersionFactory,
  ResourceFactory,
  UserFactory
} from './factory/EntityFactory';

// Export Strategy patterns
export {
  IPermissionStrategy,
  AdminPermissionStrategy,
  EditorPermissionStrategy,
  ViewerPermissionStrategy,
  PermissionContext,
  PermissionContextFactory
} from './strategy/PermissionStrategy';

// Export Composite patterns
export {
  TopicComponent,
  TopicLeaf,
  TopicComposite,
  TopicVisitor,
  TopicPrintVisitor,
  TopicCountVisitor,
  TopicSearchVisitor,
  TopicComponentFactory
} from './composite/TopicComposite';
