# Mentor Request System API

## Overview
The mentor allocation system has been changed from admin-controlled to student-initiated requests.

## Student Endpoints

### GET /student/mentors
Get list of available mentors for requesting mentorship.
- **Auth**: Required (Student)
- **Response**: List of mentors sorted by student count (ascending)

### POST /student/mentor-request
Send a mentor request to a specific mentor.
- **Auth**: Required (Student)
- **Body**: 
  ```json
  {
    "mentorId": "mentor_object_id",
    "message": "optional message"
  }
  ```

### GET /student/mentor-requests
Get student's own mentor requests and their status.
- **Auth**: Required (Student)
- **Response**: List of requests with mentor details

## Mentor Endpoints

### GET /mentor/requests
Get pending mentor requests for the logged-in mentor.
- **Auth**: Required (Mentor)
- **Response**: List of pending requests with student details

### POST /mentor/requests/accept
Accept a mentor request from a student.
- **Auth**: Required (Mentor)
- **Body**: 
  ```json
  {
    "requestId": "request_object_id"
  }
  ```

### POST /mentor/requests/reject
Reject a mentor request from a student.
- **Auth**: Required (Mentor)
- **Body**: 
  ```json
  {
    "requestId": "request_object_id"
  }
  ```

## Changes Made

1. **Removed Admin Allocation**: Admin can no longer manually assign students to mentors
2. **Student-Initiated**: Students can now browse available mentors and send requests
3. **Mentor Control**: Mentors can accept or reject requests from their dashboard
4. **Automatic Assignment**: When a mentor accepts a request, the student is automatically assigned
5. **Request Management**: All other pending requests from the same student are automatically rejected when one is accepted

## Database Schema

### MentorRequest Model
```javascript
{
  student: ObjectId (ref: Student),
  mentor: ObjectId (ref: Mentor),
  status: String (enum: ['pending', 'accepted', 'rejected']),
  message: String,
  timestamps: true
}
```