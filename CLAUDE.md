# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LazyCloset is an Angular 19 single-page application for digital closet management with AI-powered features. The app uses Supabase for backend services (PostgreSQL database, authentication, and file storage) and integrates with Remove.bg API for background removal.

## Development Commands

### Installation
```bash
# Install all dependencies (root + frontend)
npm run install:all

# Or install separately
npm install
cd frontend && npm install
```

### Running the Application
```bash
# Start development server (runs on http://localhost:4200)
npm start

# Or from frontend directory
cd frontend && npm start
```

### Building
```bash
# Production build (outputs to frontend/dist/frontend/browser)
npm run build

# Development build with watch mode
cd frontend && npm run watch
```

### Testing
```bash
# Run unit tests
npm test

# Or from frontend directory
cd frontend && npm test
```

## Environment Configuration

The application uses a Node.js script (`frontend/scripts/generate-env.js`) to generate environment files from `.env` at build/run time. This script runs automatically before `ng serve` and `ng build`.

### Required Environment Variables
Create a `.env` file in the project root with:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
REMOVE_BG_API_KEY=your_remove_bg_api_key  # Optional
```

The script generates:
- `frontend/src/environments/environment.ts` (development)
- `frontend/src/environments/environment.prod.ts` (production)

**Important**: Never manually edit the generated environment files. Always modify the `.env` file and regenerate.

## Architecture

### Architectural Pattern: Clean Architecture with Repository Pattern

The codebase follows clean architecture principles with clear separation of concerns:

**Core Layer** (`app/core/`):
- `repositories/`: Repository interfaces defining data access contracts (e.g., `ClothingRepository`)
- `services/`: Application services that orchestrate business logic (e.g., `ClothingApplicationService`)
- `guards/`: Route guards for authentication (`auth.guard.ts`, `guest.guard.ts`)

**Infrastructure Layer** (`app/infrastructure/`):
- `repositories/`: Concrete implementations of repository interfaces (e.g., `SupabaseClothingRepository`)
- Handles external service integrations (Supabase, Remove.bg)

**Domain Layer** (`app/shared/models/domain/`):
- Domain entities (e.g., `ClothingItemEntity`, `UploadFileEntity`)
- Value objects and business rules
- Domain models should be framework-agnostic

**Application Layer** (`app/core/services/`):
- Application services coordinate between repositories and UI
- DTOs for data transfer (`app/shared/models/dtos/`)
- Result types for consistent error handling

**Presentation Layer** (`app/features/`):
- Feature modules organized by domain area:
  - `auth/`: Login and registration
  - `closet/`: Main closet view and item management
  - `upload/`: Image upload functionality
  - `outfit-display/`: Outfit viewing and generation

### Key Architectural Decisions

1. **Repository Pattern**: All data access goes through repository interfaces. Swap implementations (e.g., Supabase → Firebase) by providing a different repository implementation without changing application services.

2. **Result Type Pattern**: All repository and service methods return `Observable<Result<T>>` for consistent error handling. Use `ResultUtils.isSuccess()` and `ResultUtils.failureFromError()` for error handling.

3. **State Management**: Uses RxJS `BehaviorSubject` for state management (see `ClothingApplicationService.clothingItems$`). Services expose observables for components to subscribe to.

4. **Environment Generation**: The build process dynamically generates environment files from root `.env` to support deployment platforms like Vercel that don't support Angular environment variables natively.

5. **Database Schema**:
   - Primary table: `clothing_items` (user clothing inventory)
   - Secondary table: `outfits` (saved outfit combinations)
   - Storage bucket: `clothing-images` (image files)
   - Authentication: Supabase Auth with email/password
   - RLS (Row Level Security) should be enabled on tables

### Service Dependencies

- `SupabaseService`: Core service for Supabase client, auth state, and database access
- `ClothingService`: Legacy service (consider migrating usage to `ClothingApplicationService`)
- `ClothingApplicationService`: Modern application service using repository pattern
- `BackgroundRemovalService`: Remove.bg API integration
- `ColorDetectionService`: Client-side color detection from images
- `ConfigService`: Loads configuration from environment files

### Component Architecture

- **Non-standalone components**: All components use `standalone: false` (configured in `angular.json` schematics)
- **Change Detection**: Consider using `OnPush` strategy for performance
- **Styling**: SCSS with BEM methodology
- **Material Design**: UI built with Angular Material components

Looking at your CLAUDE.md file, you should add a **"Code Standards & Design Guidelines"** section right after the "Architecture" section and before "Deployment". This will help maintain consistency as your project grows. Here's what to add:

```markdown
## Code Standards & Design Guidelines

### UI/UX Design System

**Color Palette**:
- Primary: Define your primary brand color (e.g., `#3f51b5`)
- Secondary: Define secondary color
- Success/Error/Warning: Use Material Design semantic colors
- Background: `#fafafa` (light mode), consider dark mode support
- Text: Maintain WCAG AA contrast ratios (4.5:1 minimum)

**Spacing & Layout**:
- Use 8px grid system (8, 16, 24, 32, 40, 48, 56, 64)
- Consistent padding: Cards (24px), Containers (16px mobile, 24px desktop)
- Maximum content width: 1200px for readability
- Responsive breakpoints: Follow Angular Material breakpoints

**Typography**:
- Headers: Use Material Typography scale (h1-h6)
- Body text: 14px base, 1.5 line-height
- Use `mat-typography` class on body element

### Component Development Guidelines

**Component Structure**:
```typescript
// Follow this order in component files:
// 1. Imports
// 2. Component decorator
// 3. Public properties (inputs/outputs)
// 4. Private properties
// 5. Constructor (dependency injection only)
// 6. Lifecycle hooks (in order: OnInit, AfterViewInit, OnDestroy)
// 7. Public methods
// 8. Private methods
```

**Component Best Practices**:
- Keep components under 200 lines (extract logic to services)
- One component per file
- Use descriptive, action-based method names (`handleItemClick` not `click`)
- Unsubscribe from observables in `ngOnDestroy` using `takeUntil` pattern
- Prefer async pipe over manual subscriptions in templates
- Use trackBy functions for *ngFor with large lists

**Naming Conventions**:
- Components: PascalCase with Component suffix (`ClosetViewComponent`)
- Services: PascalCase with Service suffix (`ClothingApplicationService`)
- Observables: camelCase with $ suffix (`clothingItems$`)
- Private members: underscore prefix (`_subscription`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- Interfaces/Types: PascalCase with descriptive names (avoid 'I' prefix)

### State Management Patterns

**Observable State**:
```typescript
// Prefer this pattern for service state:
private readonly _items$ = new BehaviorSubject<ClothingItem[]>([]);
public readonly items$ = this._items$.asObservable();
```

**Component State**:
- Use signals for simple local state (Angular 17+)
- Use RxJS for async operations and complex state
- Avoid nested subscriptions (use higher-order operators: switchMap, mergeMap)

### Error Handling & User Feedback

**Error Display**:
- Use Material Snackbar for transient messages (3-5 second duration)
- Use inline error messages for form validation
- Show empty states with helpful actions (not just "No items")
- Provide retry mechanisms for failed operations

**Loading States**:
- Show skeleton screens for initial loads
- Use Material progress bars/spinners for actions
- Disable interactive elements during async operations
- Implement optimistic updates where appropriate

### Form Guidelines

**Validation**:
- Client-side validation for immediate feedback
- Server-side validation for security
- Show errors on blur or submit (not on typing)
- Use Angular Reactive Forms with custom validators

**Form Patterns**:
```typescript
// Consistent form setup:
form = this.fb.group({
  field: ['', [Validators.required, customValidator]],
});

// Consistent error handling:
getErrorMessage(fieldName: string): string {
  const control = this.form.get(fieldName);
  if (control?.hasError('required')) return `${fieldName} is required`;
  // ... other error cases
}
```

### Performance Guidelines

**Image Optimization**:
- Lazy load images below the fold
- Use `loading="lazy"` attribute
- Implement virtual scrolling for large lists
- Compress images before upload (max 1920px width)
- Use WebP format when possible

**Change Detection**:
- Use OnPush strategy for presentational components
- Avoid function calls in templates
- Use pure pipes for data transformation
- Memoize expensive computations

### Accessibility (a11y)

**Requirements**:
- All interactive elements must be keyboard accessible
- Provide aria-labels for icon-only buttons
- Maintain logical tab order
- Use semantic HTML elements
- Test with screen readers (NVDA/JAWS)
- Support browser zoom up to 200%

### Documentation Standards

**Code Comments**:
```typescript
/**
 * Service responsible for managing clothing items.
 * Handles CRUD operations and state management.
 */

// Use JSDoc for public APIs
/**
 * Uploads a clothing item image and creates a database entry
 * @param file - The image file to upload
 * @param metadata - Additional item metadata
 * @returns Observable<Result<ClothingItem>>
 */
```

**TODO Comments**:
```typescript
// TODO: [Priority: High/Medium/Low] Brief description
// TODO: [High] Implement pagination for large closets
```

### Testing Requirements

**Coverage Goals**:
- Services: 80% minimum coverage
- Utilities: 100% coverage
- Components: Focus on behavior, not implementation
- E2E: Critical user paths (auth, upload, view)

**Test Structure**:
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should handle success case', () => {});
    it('should handle error case', () => {});
    it('should handle edge case', () => {});
  });
});
```

### Git Commit Conventions

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `style:` UI/styling changes
- `docs:` Documentation updates
- `test:` Test additions/updates
- `chore:` Build/tooling changes

Example: `feat(closet): add outfit generation feature`
```

This section provides clear, actionable guidelines that will help maintain consistency and quality as you clean up and expand your project. It covers the key areas you mentioned (design practices, consistency, visibility) while being specific to your Angular/Material/Supabase stack.

## Deployment

The application is configured for Vercel deployment (see `vercel.json`):
- Build command: `npm run build` (defined in root `package.json`)
- Output directory: `frontend/dist/frontend/browser`
- The build process runs the environment generation script automatically

### Vercel Deployment Steps
1. Ensure environment variables are set in Vercel dashboard (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
2. Push to main branch (auto-deploys if connected)
3. Or use `vercel` CLI for manual deployment

## Important Development Notes

- **TypeScript Strict Mode**: Enabled in `tsconfig.json`
- **Angular CLI**: Use `npx ng` for Angular CLI commands (version 19.2+)
- **Node.js Version**: Requires Node.js 18+ (specified in root `package.json` engines)
- **Package Manager**: npm (not yarn or pnpm) as specified in `angular.json`

### When Adding New Features

1. Define domain models in `app/shared/models/domain/`
2. Create repository interface in `app/core/repositories/`
3. Implement repository in `app/infrastructure/repositories/`
4. Create application service in `app/core/services/`
5. Build UI components in appropriate feature module
6. Update Angular module imports as needed (no standalone components)

### Common Pitfalls

- Don't bypass repository interfaces to access Supabase directly from components
- Don't edit generated environment files manually
- Remember to update both `environment.ts` and `environment.prod.ts` if adding new config (via `.env` file)
- Use `ResultUtils` for consistent error handling, not raw try-catch
- When adding Material components, import modules in `app.module.ts`
