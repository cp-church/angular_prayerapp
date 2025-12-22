# Testing Guide

This project uses **Jasmine** and **Karma** for unit and integration testing (Angular default testing framework), with automated testing via GitHub Actions CI/CD pipeline.

## Table of Contents
- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Mocking](#mocking)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Quick Start

### Install Dependencies
Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Run Tests

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once
npm run test -- --watch=false

# Run tests with code coverage
npm run test -- --code-coverage

# Run tests for specific file
npm test -- --include='**/prayer.service.spec.ts'
```

## Running Tests

### Watch Mode
Best for development - automatically reruns tests when files change:
```bash
npm test
```

### Single Run
Used in CI/CD pipelines:
```bash
npm run test -- --watch=false
```

### Coverage Report
Generates HTML coverage report in `coverage/` directory:
```bash
npm run test -- --code-coverage
```
Open `coverage/index.html` to view detailed coverage.

### Debugging Tests
Run tests and open Chrome DevTools for debugging:
```bash
ng test --browsers=Chrome --watch=true
```

## Writing Tests

### Test File Location
Place test files next to the components/services they test:
```
src/
  app/
    services/
      prayer.service.ts
      prayer.service.spec.ts  ← Test file
    components/
      prayer-form/
        prayer-form.component.ts
        prayer-form.component.spec.ts  ← Test file
```

### Basic Test Structure

```typescript
import { TestBed } from '@angular/core/testing'
import { ComponentFixture } from '@angular/core/testing'
import { MyComponent } from './my.component'

describe('MyComponent', () => {
  let component: MyComponent
  let fixture: ComponentFixture<MyComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]
    }).compileComponents()

    fixture = TestBed.createComponent(MyComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should render correctly', () => {
    expect(component).toBeTruthy()
  })

  it('should display text', () => {
    const compiled = fixture.nativeElement
    expect(compiled.querySelector('h1').textContent).toContain('Hello')
  })
})
```

### Service Testing

```typescript
import { TestBed } from '@angular/core/testing'
import { MyService } from './my.service'

describe('MyService', () => {
  let service: MyService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(MyService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should return expected data', () => {
    const result = service.getData()
    expect(result).toEqual(expectedValue)
  })
})
```

## Mocking

### Mocking Services

```typescript
import { of } from 'rxjs'

describe('PrayerComponent', () => {
  let mockPrayerService: jasmine.SpyObj<PrayerService>

  beforeEach(async () => {
    mockPrayerService = jasmine.createSpyObj('PrayerService', ['getPrayers', 'addPrayer'])
    mockPrayerService.getPrayers.and.returnValue(of([]))

    await TestBed.configureTestingModule({
      imports: [PrayerComponent],
      providers: [
        { provide: PrayerService, useValue: mockPrayerService }
      ]
    }).compileComponents()
  })

  it('should load prayers on init', () => {
    fixture.detectChanges()
    expect(mockPrayerService.getPrayers).toHaveBeenCalled()
  })
})
```

### Mocking HTTP Requests

```typescript
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'

describe('DataService with HTTP', () => {
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataService]
    })
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should fetch data', () => {
    const mockData = { id: 1, name: 'Test' }
    service.getData().subscribe(data => {
      expect(data).toEqual(mockData)
    })

    const req = httpMock.expectOne('/api/data')
    expect(req.request.method).toBe('GET')
    req.flush(mockData)
  })
})
```

### Testing Async Operations

```typescript
import { fakeAsync, tick, flush } from '@angular/core/testing'

describe('Async Tests', () => {
  it('should handle async operations', fakeAsync(() => {
    let result = ''
    
    asyncFunction().then(value => {
      result = value
    })

    // Simulate passage of time
    tick(1000)
    expect(result).toBe('expected value')
  }))

  it('should complete all async tasks', fakeAsync(() => {
    // Run all pending timers
    flush()
    expect(component.loaded).toBe(true)
  }))
})
```

## Test Structure

### Best Practices

```typescript
describe('PrayerService', () => {
  let service: PrayerService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PrayerService]
    })
    service = TestBed.inject(PrayerService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  // Arrange, Act, Assert pattern
  it('should add prayer and return the result', () => {
    // Arrange
    const mockPrayer = { title: 'Test', description: 'Test prayer' }
    
    // Act
    service.addPrayer(mockPrayer).subscribe(result => {
      // Assert
      expect(result.id).toBeDefined()
    })

    const req = httpMock.expectOne('/api/prayers')
    req.flush({ id: 1, ...mockPrayer })
  })
})
```

## What to Test

✅ **Do Test**
- Service methods and logic
- Component initialization
- User interactions (clicks, input)
- Error handling
- Data transformations
- Edge cases
- API calls (mocked)

❌ **Don't Test**
- Angular framework code
- Third-party library code
- Implementation details
- Private methods (test through public API)
- CSS styling

## Example Tests

See the following test files for complete examples:
- `src/app/services/prayer.service.spec.ts` - Service testing with HTTP mocks
- `src/app/components/prayer-form/prayer-form.component.spec.ts` - Component testing
- `src/app/services/admin-auth.service.spec.ts` - Auth service with complex logic

Examples include:
- Mocking Supabase/HTTP
- Testing async data fetching
- Testing user interactions
- Testing form validation
- Testing dependency injection
- Testing RxJS observables

## Common Issues

### Issue: "Cannot find module"
**Solution**: Make sure imports are correct. Check that spec file is in the same directory as the source file.

### Issue: "Cannot read property of undefined"
**Solution**: Mock dependencies properly using TestBed's `providers`. Make sure all required services are provided.

### Issue: "Timeout of X ms exceeded"
**Solution**: Use `fakeAsync` and `tick()` for timing, or increase timeout: `it('test', () => {...}, 5000)`

### Issue: "NullInjectorError: No provider for X"
**Solution**: Add the service to TestBed configuration:
```typescript
TestBed.configureTestingModule({
  providers: [YourService]
})
```

## Resources

- [Angular Testing Guide](https://angular.io/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Test Runner](https://karma-runner.github.io/)
- [Angular TestBed API](https://angular.io/api/core/testing/TestBed)
- [Angular Component Testing](https://angular.io/guide/testing-components-scenarios)
- [Testing Best Practices](https://angular.io/guide/testing-code-coverage)
- [Playwright Documentation](https://playwright.dev/)

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled runs

View results in GitHub Actions tab.

### E2E Tests

End-to-end tests use **Playwright** to test the app in a real browser:

```bash
# Start the dev server in one terminal
npm run start

# Run e2e tests in another terminal
npx playwright test

# Run specific test file
npx playwright test e2e/home.spec.ts

# Run with UI mode
npx playwright test --ui

# Debug tests
npx playwright test --debug

# View test report
npx playwright show-report
```

#### E2E Test Configuration
- **Timeout**: 60 seconds per test (increased for CI stability)
- **Retries**: 1 retry on failure in CI
- **Browsers**: Chromium in CI, Chrome/Firefox/Safari locally
- **Base URL**: `http://localhost:4200`

#### E2E Test Updates (December 2025)
- Updated routes: `/admin/login` → `/login`
- Tests now handle auth redirects gracefully
- Tests work with or without Supabase data
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

#### Running Tests Locally
The recommended approach is to run the dev server separately:

```bash
# Terminal 1: Start dev server
npm run start

# Terminal 2: Run tests
npx playwright test
```

The dev server will be reused for all test runs, avoiding startup overhead.
