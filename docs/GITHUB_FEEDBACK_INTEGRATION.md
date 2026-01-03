# GitHub Feedback Integration

## Overview

This feature allows users to submit feedback, bug reports, and feature requests directly from the application. These submissions are automatically created as GitHub issues in a configured repository, providing a seamless way to gather user feedback.

## Features

### User-Facing Features
- **Feedback Form**: Located in user settings under "Send Feedback"
- **Three Types of Feedback**:
  - 💡 Suggestions
  - ✨ Feature Requests
  - 🐛 Bug Reports
- **Automatic GitHub Issue Creation**: Submitted feedback becomes a GitHub issue with:
  - Auto-generated title with emoji prefix
  - Formatted body with user email and feedback details
  - Automatic labels based on feedback type
  - Link to view on GitHub after successful submission

### Admin-Facing Features
- **GitHub Settings Panel**: Located in Admin Portal → Settings → Content tab
- **Configuration Options**:
  - Enable/Disable GitHub feedback integration
  - GitHub repository owner (username or organization)
  - GitHub repository name
  - Personal Access Token (encrypted storage)
  - Connection test functionality
- **Security**:
  - Tokens are encrypted in the database
  - Only admins can modify settings
  - Test connection button to verify configuration

## Implementation Details

### Components Created

#### 1. GitHubFeedbackFormComponent
**Location**: `src/app/components/github-feedback-form/github-feedback-form.component.ts`

**Purpose**: User-facing feedback submission form

**Features**:
- Form validation (title and description required)
- Character limits (100 for title, 1000 for description)
- Loading states during submission
- Success/error feedback with optional GitHub issue link
- Auto-reset form after successful submission
- Dark mode support

**Usage**:
```html
<app-github-feedback-form [userEmail]="userEmail"></app-github-feedback-form>
```

#### 2. GitHubSettingsComponent
**Location**: `src/app/components/github-settings/github-settings.component.ts`

**Purpose**: Admin configuration panel for GitHub integration

**Features**:
- Enable/disable toggle for the feature
- Repository owner and name input fields
- Secure token input with show/hide functionality
- Test connection button
- Save functionality with validation
- Error and success messages
- Dark mode support

**Usage**:
```html
<app-github-settings (onSave)="handleGitHubSettingsSave()"></app-github-settings>
```

#### 3. GitHubFeedbackService
**Location**: `src/app/services/github-feedback.service.ts`

**Purpose**: Backend service for GitHub API integration

**Key Methods**:
- `getGitHubConfig()`: Fetch GitHub configuration from database
- `saveGitHubConfig()`: Save GitHub configuration to database
- `createGitHubIssue()`: Create a new GitHub issue via API
- `testGitHubConnection()`: Verify GitHub configuration is valid

**Configuration Storage**:
- Stored in `admin_settings` table
- Fields:
  - `github_token`: Encrypted personal access token
  - `github_repo_owner`: Repository owner username/org
  - `github_repo_name`: Repository name
  - `enabled`: Boolean to enable/disable feature

### Integration Points

#### User Settings Component
- `src/app/components/user-settings/user-settings.component.ts`
- Imports and displays `GitHubFeedbackFormComponent`
- Added after notification subscription section
- Passes current user email to feedback form

#### Admin Component
- `src/app/pages/admin/admin.component.ts`
- Imports and displays `GitHubSettingsComponent`
- Located in "Settings" tab → "Content" subtab
- Added above branding and prompt manager components

## Setup Instructions

### 1. Database Migration

Run the migration to add GitHub configuration columns to the admin_settings table:

```bash
# Using Supabase CLI
supabase migration up

# Or manually run:
# supabase/migrations/20260103_add_github_settings.sql
```

### 2. GitHub Personal Access Token

To enable GitHub feedback integration:

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Prayer App Feedback")
4. Select required scopes:
   - `repo` (Full control of private repositories)
   - `issues` (Full control of issues)
5. Click "Generate token"
6. Copy the token immediately (you won't be able to see it again)

### 3. Configure in Admin Portal

1. Go to Admin Portal (https://yoursite.com/admin)
2. Click "Settings" tab
3. Click "Content" subtab
4. Scroll to "GitHub Feedback Settings"
5. Enable the feature with the toggle
6. Enter:
   - **Repository Owner**: Your GitHub username or organization name
   - **Repository Name**: Name of the repository where issues will be created
   - **Personal Access Token**: The token you generated in step 2
7. Click "Test Connection" to verify the settings
8. Click "Save Settings"

## Security Considerations

### Token Encryption
- GitHub tokens are encrypted at rest in the database using Supabase's encryption features
- Use `ENCRYPTED WITH KEY 'pgsodium'` in migrations
- Never log or display the full token after creation

### Row-Level Security (RLS)
- Admin settings are protected by RLS policies
- Only authenticated admin users can read/modify settings
- Service role can access via service key for server-side operations

### Rate Limiting
- GitHub API has rate limits: 5,000 requests/hour per authenticated token
- Consider implementing rate limiting for feedback submissions
- Future enhancement: implement exponential backoff on API failures

### Token Permissions
- Use a token with minimal required permissions (repo + issues scopes only)
- Consider using a bot account instead of personal account
- Rotate tokens periodically (GitHub allows token rotation)

## User Flow

### Submit Feedback
1. User opens Settings modal
2. Scrolls to "Send Feedback" section
3. Selects feedback type (suggestion/feature/bug)
4. Enters title (max 100 chars)
5. Enters description (max 1000 chars)
6. Clicks "Send Feedback"
7. Form shows loading state
8. On success:
   - Success message appears
   - "View on GitHub" link displayed
   - Form resets after 5 seconds
9. On error:
   - Error message with details
   - Form remains filled for retry

### Admin Configuration
1. Admin opens Admin Portal
2. Navigates to Settings → Content
3. Scrolls to "GitHub Feedback Settings"
4. Enables feature and enters repository details
5. Optionally tests connection
6. Saves settings
7. Success message confirms save

## API Integration

### GitHub Issue Creation
When a user submits feedback, the service creates an issue with:

**Title Format**:
```
{emoji} {user_title}
```
Example: `🐛 Login button not working on mobile`

**Body Format**:
```
**Type:** {feedback_type}
**User Email:** {user_email}

---

{user_description}

_This issue was automatically created from the feedback form._
```

**Labels**: Auto-applied based on feedback type
- `suggestion` → "suggestion" label
- `feature` → "feature" label  
- `bug` → "bug" label

### Error Handling
- Invalid token: "GitHub token is not configured"
- Invalid repository: "Failed to access repository"
- Network errors: "Network error message"
- API errors: GitHub API response error message

## Testing

### Manual Testing
1. Configure GitHub settings with test repository
2. Test connection button should succeed
3. Submit feedback from user account
4. Verify issue appears in GitHub repository
5. Verify issue details (title, body, labels)
6. Test error scenarios:
   - Invalid token
   - Invalid repository
   - Network disconnect

### Unit Testing
Components include:
- Form validation tests
- API response mocking
- Error state handling
- Loading state transitions
- Success message display

## Future Enhancements

1. **Feedback Templates**: Pre-filled templates based on feedback type
2. **Attachments**: Allow users to attach screenshots
3. **Email Notifications**: Notify users when their issue is updated
4. **Analytics**: Track feedback submission metrics
5. **Categories**: Add custom categories beyond suggestion/feature/bug
6. **Webhooks**: Sync GitHub issue comments back to the app
7. **Multiple Repositories**: Allow feedback routing to different repos
8. **Auto-tagging**: Automatically tag issues based on content analysis

## Troubleshooting

### "Failed to save GitHub settings"
- Check that admin_settings table has the new columns
- Verify RLS policies allow writes
- Check browser console for detailed error

### "Test connection failed"
- Verify token is valid (check GitHub settings page)
- Verify repository owner and name are correct
- Verify token has `repo` and `issues` scopes
- Check GitHub API status page

### "Failed to create GitHub issue"
- Verify GitHub is accessible (check network)
- Verify token hasn't expired
- Verify repository still exists
- Check token rate limits (5,000/hour)

### Token appears blank in form
- This is intentional - tokens are masked
- Check "Show token" checkbox to view (masked part)
- If truly blank, re-enter and save

## Code References

### Key Files
- Service: `src/app/services/github-feedback.service.ts`
- User Form: `src/app/components/github-feedback-form/github-feedback-form.component.ts`
- Admin Panel: `src/app/components/github-settings/github-settings.component.ts`
- User Settings: `src/app/components/user-settings/user-settings.component.ts` (line 350)
- Admin Component: `src/app/pages/admin/admin.component.ts` (line 640)
- Database Migration: `supabase/migrations/20260103_add_github_settings.sql`

### Dependencies
- RxJS: Observable patterns, async handling
- Angular FormsModule: Form inputs and validation
- Supabase Client: Database access
- Fetch API: GitHub REST API calls

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review GitHub API documentation: https://docs.github.com/en/rest
3. Check Supabase documentation: https://supabase.com/docs
4. Review component source code for inline comments
