# Test Coverage Report

Generated: 2025-12-28

## Overall Coverage

| Metric | Coverage |
|--------|----------|
| Statements | 68.88% |
| Branches | 60.50% |
| Functions | 67.38% |
| Lines | 68.98% |

## Test Suite Summary

- **Total Test Files:** 68
- **Total Tests:** 1,748 (1,745 passed, 3 skipped)
- **Duration:** 30.45s

## Components with Highest Coverage Improvements

### prayer-search.component.ts
- **Previous Coverage:** 0.58%
- **Current Coverage:** 92.44% statements, 71.66% branches, 83.33% functions, 93.39% lines
- **Improvement:** +159x
- **Tests Added:** 59 tests
- **Coverage Details:**
  - Search and filtering functionality
  - CRUD operations (create, read, update, delete)
  - Pagination and navigation
  - Bulk status updates
  - Prayer updates management
  - Selection management
  - Form validation

### email-subscribers.component.ts
- **Previous Coverage:** 0.84%
- **Current Coverage:** 83.89% statements, 63.15% branches, 83.33% functions, 85.58% lines
- **Improvement:** +100x
- **Tests Added:** 42 tests
- **Coverage Details:**
  - Subscriber management
  - CSV upload and validation
  - Pagination
  - Active/blocked status toggles
  - Admin vs non-admin deletion logic
  - Email validation and duplicate detection

### backup-status.component.ts
- **Previous Coverage:** 1.11%
- **Current Coverage:** 86.66% statements, 74.24% branches, 83.33% functions, 89.22% lines
- **Improvement:** +78x
- **Tests Added:** 27 tests
- **Coverage Details:**
  - Backup log display
  - Manual backup creation
  - Restore functionality
  - Table discovery fallback
  - Error handling
  - Backup summary calculation
  - Log expansion UI

## Components at 100% Coverage

The following components maintain 100% statement coverage:
- app-branding.component.ts
- app-logo.component.ts
- email-settings.component.ts
- email-verification-settings.component.ts
- pending-account-approval-card.component.ts
- pending-deletion-card.component.ts
- pending-prayer-card.component.ts
- pending-update-card.component.ts
- pending-update-deletion-card.component.ts
- prayer-display-card.component.ts
- prayer-filters.component.ts
- prayer-form.component.ts (100% statements, 90.9% branches)
- prayer-types-manager.component.ts
- presentation-settings-modal.component.ts
- presentation-toolbar.component.ts
- prompt-card.component.ts
- security-policy-settings.component.ts
- site-protection-settings.component.ts
- skeleton-loader.component.ts
- theme-toggle.component.ts
- toast-container.component.ts
- user-settings.component.ts
- verification-dialog.component.ts (99.29% statements)

## Areas for Future Improvement

### Low Coverage Components
1. **app.component.ts:** 0% coverage (18-365 lines uncovered)
2. **admin-user-management.component.ts:** 2.56% coverage
3. **email-templates-manager.component.ts:** 2.73% coverage
4. **prayer-card.component.ts:** 9.16% coverage

### Page Components
1. **admin.component.ts:** 2.30% coverage
2. **home.component.ts:** 1.48% coverage
3. **login.component.ts:** 0.82% coverage
4. **presentation.component.ts:** 2.48% coverage

### Services
1. **prayer.service.ts:** 42.12% coverage (largest service with room for improvement)
2. **connection.service.ts:** 71.01% coverage
3. **supabase.service.ts:** 68.04% coverage

## Testing Approach

All tests follow consistent patterns:
- Direct component instantiation for unit tests
- Comprehensive mocking of dependencies
- Test organization by functionality
- Descriptive test names following "should..." convention
- Error case coverage
- Edge case validation

## Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- <filename>
```
