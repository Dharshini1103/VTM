Google Calendar / Meet Integration (scaffold)
===========================================

This project includes a scaffold `GoogleCalendarService` to schedule Google Meet events and optionally send reminders. To enable real scheduling you must provide Google API credentials and configuration.

Steps to enable:

1. Create a Google Cloud project and enable the "Google Calendar API" and "Gmail API" if you want to send reminders.
2. Create a service account, grant appropriate scopes, and create a JSON key OR implement OAuth2 flow for delegated access.
3. If using a service account to manage a G Suite calendar, you may need domain-wide delegation and to impersonate a user.

Required configuration (suggested application.yml entries):

```yaml
google:
  client:
    email: your-service-account-email@project.iam.gserviceaccount.com
  project:
    id: your-google-project-id
  credentials:
    file: /path/to/service-account.json
```

Environment variables alternative (recommended for production):

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PROJECT_ID`
- `GOOGLE_CREDENTIALS_FILE`

Implementation notes:

- `backend/src/main/java/com/taskmanager/service/GoogleCalendarService.java` is a scaffold that currently returns a fake meet link. Replace the TODO block with real Google Calendar API calls.
- Use the Google API Java client: `com.google.apis:google-api-services-calendar` and `com.google.auth:google-auth-library-oauth2-http` or use `google-api-client` bundles.
- Ensure service account or OAuth client has Calendar scope `https://www.googleapis.com/auth/calendar` and Gmail scope `https://www.googleapis.com/auth/gmail.send` if you plan to send emails.
- For reminders, either create event reminders in Calendar (attendee notifications) or send a separate email via Gmail API.

Security:

- Never commit service account JSON files or client secrets to source control.
- Use environment variables or a secrets manager in production.

If you want, I can implement the actual Google API integration here once you provide details about whether you will use a service account (with domain delegation) or OAuth2 delegated credentials.
