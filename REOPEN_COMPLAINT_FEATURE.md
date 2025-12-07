# Reopen Complaint After Resolution - Feature Implementation

## Overview
A comprehensive feature enabling users to reopen resolved complaints with comments, notify admins, and manage the reopened workflow through a notification system with timeline UI.

## Features Implemented

### 1. User-Side Features
- **"Issue Not Fixed?" Button**: Appears only on Resolved complaints in UserDashboard
- **ReopenComplaintModal**: Modal dialog for entering comment (minimum 5 characters required)
- **Auto-Status Change**: Complaint status automatically changes to "Reopened"
- **Student Anonymity**: Comments stored with role="student" (not actual email)
- **Email Notification**: Async email sent to category admins when complaint is reopened

### 2. Admin-Side Features
- **NotificationBell Component**: 
  - Bell icon (🔔) with red badge showing count of reopened complaints
  - Dropdown list showing recent reopened complaints in admin's categories
  - Polls backend every 30 seconds for updates
  - Click on notification navigates to complaint details
  - Shows timestamp in relative format (e.g., "5m ago", "2h ago")

- **Integrated into AdminPage Header**: NotificationBell appears alongside "Admin Requests Dashboard" title

- **Timeline Comments UI** in ComplaintsDetails:
  - Role-based display: "Student" (anonymous) vs admin email
  - Emoji indicators: 🎓 for student, 👨‍💼 for admin
  - Color-coded: Red (#ff6b6b) for students, Blue (#4c63d2) for admins
  - Timeline format with connecting lines
  - Timestamp display for each comment

### 3. Backend Endpoints

#### POST `/user-api/reopen-complaint/:complaint_id`
- **Purpose**: User reopens a resolved complaint with comment
- **Validation**:
  - Comment minimum 5 characters
  - No offensive language (via sentiment analysis)
  - Meaningful content (no gibberish)
- **Actions**:
  - Creates comment: `{ id, text, role: "student", timestamp }`
  - Updates complaint: adds comment, sets status="Reopened", updates lastCommentAt
  - Sends async email to category admins with complaint details
- **Response**: Success message with reopened complaint

#### GET `/admin-api/get-reopened-complaints`
- **Purpose**: Fetch reopened complaints for admin's categories (used by NotificationBell)
- **Query Parameters**:
  - `categories`: Comma-separated list of admin's categories
- **Returns**: 
  - Top 10 most recent reopened complaints
  - Sorted by lastCommentAt descending
  - Includes: complaint_id, title, category, student_name, lastCommentAt
- **Used By**: NotificationBell component for polling

#### Updated POST `/complaints/:id/comment` (Admin)
- **Previous**: Stored `{ id, text, date, email }`
- **Now**: Stores `{ id, text, role: "admin", timestamp, email }`
- **Backward Compatible**: Email field retained for legacy support

## File Structure

### Backend
```
backend/be1-complaints/APIs/
├── user-api.js          (NEW: POST /user-api/reopen-complaint/:complaint_id)
└── admin-api.js         (UPDATED: GET /admin-api/get-reopened-complaints, modified comment endpoint)
```

### Frontend
```
frontend/fe1-complaints/src/components/
├── ReopenComplaintModal/
│   ├── ReopenComplaintModal.js    (NEW)
│   └── ReopenComplaintModal.css   (NEW)
├── NotificationBell/
│   ├── NotificationBell.js        (NEW)
│   └── NotificationBell.css       (NEW)
├── UserDashboard/
│   └── UserDashboard.js           (UPDATED: Added button, modal integration, callback)
├── ComplaintsDetails/
│   ├── ComplaintsDetails.js       (UPDATED: Timeline UI, role-based styling)
│   └── ComplaintsDetails.css      (UPDATED: Timeline classes)
└── AdminPage/
    └── AdminPage.js               (UPDATED: Added NotificationBell to header)
```

## Comment Structure

```javascript
{
  id: "1701234567890",           // Timestamp-based ID
  text: "The issue still persists", // Comment content
  role: "student" | "admin",     // Who made the comment
  timestamp: "2024-01-15T10:30:00Z", // ISO 8601 timestamp
  email: "student@example.com"   // For backward compatibility (admins only)
}
```

## Data Flow

### Reopening a Complaint
1. User clicks "❓ Issue Not Fixed?" button on Resolved complaint
2. ReopenComplaintModal opens
3. User enters comment (5+ characters)
4. Submits to `POST /user-api/reopen-complaint/:complaint_id`
5. Backend:
   - Validates comment
   - Creates comment with role="student"
   - Updates complaint status to "Reopened"
   - Sends async email to category admins
6. Frontend shows success toast
7. UserDashboard refreshes complaints list via `GET /user-api/view-complaints`

### Admin Notification
1. NotificationBell polls `GET /admin-api/get-reopened-complaints` every 30 seconds
2. Backend returns reopened complaints in admin's categories
3. Badge updates with count
4. Admin clicks notification → navigates to ComplaintsDetails
5. Sees timeline with:
   - Original complaint details
   - Student's reopening comment (anonymously as "Student")
   - Any admin responses with email attribution

## UI Components

### ReopenComplaintModal
- Large textarea for comment input
- Real-time character count validation
- Disabled submit button until 5+ characters
- Success/error toast notifications
- Loading state during submission

### NotificationBell
- Bell icon with red badge showing count
- Dropdown with recent reopened complaints
- Timestamp display (relative format)
- Click to navigate to complaint details
- Auto-polling every 30 seconds

### Timeline Comments
- Vertical timeline with dots and connecting lines
- Role-based colors and labels
- Emoji indicators
- Full timestamp display
- Student anonymization

## Security & Privacy

- **Student Anonymity**: Comments show "Student" instead of email
- **Comment Validation**: Prevents spam, offensive language, gibberish
- **Role-Based Display**: Students can't see other student comments (only timeline in their own complaints)
- **Category Access**: Admins only see reopened complaints in their assigned categories
- **Email Privacy**: Admin emails visible to other admins; student emails never exposed in UI

## Testing Checklist

- [ ] User can click "Issue Not Fixed?" on Resolved complaint
- [ ] Modal validates 5+ character minimum
- [ ] Complaint status changes to "Reopened" after submission
- [ ] Student comment appears with role="student" in timeline
- [ ] Email sent to category admins successfully
- [ ] Admin sees NotificationBell badge increment
- [ ] Admin clicks notification and navigates to complaint
- [ ] Timeline shows student comment as "Student" (anonymous)
- [ ] Admin can add response (shows with admin email)
- [ ] NotificationBell polling updates every 30 seconds
- [ ] Multiple reopened complaints appear in dropdown
- [ ] Clicking different notifications navigates correctly
- [ ] Mobile responsive: Timeline, modal, bell all work on small screens

## Configuration

### Environment Variables
No new env vars needed. Uses existing:
- `REACT_APP_COMPLAINTS_APP_BE_URL`: Backend API URL

### Dependencies
- axios: HTTP requests
- react-toastify: Toast notifications
- Bootstrap: UI styling
- lucide-react: Icons (for bell)
- sentiment: Comment sentiment analysis
- natural: NLP for meaningful content detection

## Notes

- Comments are stored with timestamps to track when they were added
- The 30-second polling in NotificationBell can be adjusted via poll interval constant
- Email notifications are sent asynchronously to avoid blocking the API response
- Timeline UI automatically handles both student and admin comments with proper styling
- The "Reopened" status is distinct from other statuses for easy filtering
