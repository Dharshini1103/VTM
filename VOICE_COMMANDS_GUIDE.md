# Voice Commands Guide - Task Management System

## Overview
The Voice Input feature allows you to create, manage, and assign tasks using natural speech commands. The system uses professional voice recognition with intelligent command parsing.

---

## Basic Voice Command Structure

### Format Template
```
[ACTION] task [TITLE] [MODIFIERS]
```

**ACTION**: create, add, new  
**TITLE**: Task description or name  
**MODIFIERS**: Priority, deadline, assignee (optional)

---

## Voice Command Examples

### 1. Basic Task Creation
```
"Create task review project report"
```
- **Result**: Creates a task titled "review project report" with MEDIUM priority and default deadline

### 2. Task with Priority
```
"Add task fix critical bug as urgent"
```
- **Result**: Creates task with HIGH/URGENT priority

### 3. Task with Deadline
```
"Create task update documentation deadline today"
```
- **Result**: Creates task with today's deadline

### 4. Complex Task
```
"New task prepare quarterly report high priority due tomorrow for team meeting"
```
- **Result**: Multiple properties extracted from natural language

### 5. Meeting-Related Task
```
"Create task schedule client meeting this week"
```
- **Result**: Creates task with deadline set to end of week

---

## Supported Priority Levels

| Voice Input | System Priority | Color |
|---|---|---|
| "high" / "urgent" / "asap" / "critical" | URGENT | Purple |
| "high" | HIGH | Red |
| "medium" / "medium" / "normal" | MEDIUM | Orange |
| "low" / "minor" | LOW | Green |

**Default**: MEDIUM (if not specified)

---

## Supported Deadline Patterns

| Phrase | Result |
|---|---|
| "today" | Today's date |
| "tomorrow" | Next day |
| "this week" | Friday of current week |
| "next week" | One week from today |
| "next month" | One month from today |
| (Not specified) | +7 days from today |

---

## Voice Recognition Features

### Real-Time Feedback
- 🎤 **Listening**: Microphone is active and recording
- ⏳ **Processing**: Voice is being analyzed and processed
- ✅ **Confirmation Modal**: Shows extracted task details before creation

### Supported Languages
- English (US) - Primary language
- Can be configured for other languages via browser settings

### Browser Requirements
- **Chrome/Chromium**: Full support ✅
- **Safari**: Full support ✅
- **Edge**: Full support ✅
- **Firefox**: Limited support (may require additional setup)

---

## Advanced Voice Patterns

### Multi-Part Tasks
```
"Create task update documentation and send to team deadline this week"
```
- **Extracted**: Title, Priority (if mentioned), Deadline

### Natural Conversational Style
```
"Hey, can you add a task for me to follow up with the client about the proposal high priority"
```
- **Extracted**: Task title from conversational context

### With Task Description
```
"Create task complete project phase two high priority review code changes deadline tomorrow"
```
- **Extracted**: Title + Description + Priority + Deadline

---

## Voice Command Accuracy Tips

### ✅ DO:
- Speak clearly and at normal pace
- Wait for "Listening..." indicator before speaking
- Use complete task titles (avoid single words)
- Mention key date references explicitly
- Example: "Create task review code changes high priority deadline tomorrow"

### ❌ DON'T:
- Speak too fast or too slow
- Use ambiguous task titles
- Include irrelevant background noise
- Give commands without the action word
- Example: "review code changes" (missing "create task")

---

## Troubleshooting

### "No speech detected"
- Check microphone is not muted
- Check browser microphone permissions
- Speak louder and clearer
- Ensure microphone device is working

### "Microphone access denied"
- Grant microphone permission to the browser
- Check System > Privacy settings
- Refresh the page and try again

### "Could not extract task title"
- Rephrase with "Create task [title]"
- Make title more specific
- Avoid special characters except spaces

### Text Not Recognizing Correctly
- Clear background noise
- Speak each word distinctly
- Use standard English pronunciation
- Slower speech helps with accuracy

---

## Integration with Manual Entry

### Dual Input Mode
The system supports both voice and manual input:
1. Click "Voice Input" button to activate voice recognition
2. Alternatively, use "Create Task" for manual form entry
3. Voice-created tasks appear in same table with manual tasks

### Hybrid Workflow
```
Voice Input → Review Confirmation Modal → Edit if needed → Create Task
```

---

## Keyboard Shortcuts (When Mic is Active)

| Key | Action |
|---|---|
| Space | Hold to continue recording |
| ESC | Cancel voice input |

---

## Data Processing

### What Gets Extracted
✅ Task Title (required)
✅ Priority Level (optional)
✅ Deadline/Due Date (optional)  
✅ Description (optional)
✅ Status (always PENDING initially)

### What Doesn't Get Extracted
❌ Assigned person name (requires manual selection)
❌ Team member details (use Create Task form)
❌ Complex conditional logic
❌ Multiple tasks from single command

---

## Voice Command Statistics

After creating tasks via voice, view statistics:
- Total voice-created tasks
- Most common voice commands
- Voice recognition accuracy rate
- Average processing time

---

## Testing Voice Commands

For testing purposes, use these examples:

1. **Simple**: "Create task testing voice commands"
2. **With Priority**: "Add task urgent bug fix"
3. **With Deadline**: "New task review code today"
4. **Full**: "Create task complete module testing high priority deadline tomorrow"

Expected behavior:
- Command processed in 1-5 seconds
- Confirmation modal shows extracted details
- After confirmation, task appears in table with serial number

---

## Support & Limitations

### Current Limitations
- One task per voice command
- English language only (configurable)
- No user specification in voice (manual required)
- No deadline modification mid-command

### Future Enhancements
- Multi-language support
- Advanced NLP parsing
- Task assignment via voice
- Meeting scheduling integration
- Voice notes & descriptions

---

## Privacy & Security

✅ Voice data is processed locally in browser  
✅ No permanent voice recording stored  
✅ Audio converted to text immediately  
✅ Transcript cleared after task creation  
✅ No third-party voice API calls (Web Speech API native)

---

## Practice Commands

Try these commands to get started:

```
1. "Create task implement new feature"
2. "Add task fix bug as urgent"
3. "New task prepare presentation deadline today"
4. "Create task code review high priority due tomorrow"
5. "Add task update documentation this week"
6. "Create task client follow-up urgent deadline tomorrow"
7. "New task testing feature asap"
8. "Add task deploy to production critical priority"
```

Each command will:
- Show confirmation modal with extracted details
- Allow you to confirm or manually edit
- Create task with proper categorization
- Display in table with serial number

---

## Keyboard Controls While Recording

| Action | Method |
|---|---|
| Start Recording | Click "Voice Input" button |
| Stop Recording | Click "Stop Recording" button |
| Cancel | Press ESC key |
| Clear Transcript | Automatic on success |

---

**Last Updated**: February 6, 2026  
**Version**: 1.0 - Professional Voice Commands Implementation
