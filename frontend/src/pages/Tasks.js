import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Tag, Modal, Input, Select, Row, Col, Card, Spin, Empty, Alert, Form, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined, AudioOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import taskApi from '../api/taskApi';
import voiceApi from '../api/voiceApi';
import userApi from '../api/userApi';
import storageManager from '../utils/storageManager';

function Tasks() {
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.auth.user);
  const loggedUser = currentUser || storageManager.getUser(); // Fallback to persisted user if Redux state lost
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [form] = Form.useForm();
  
  // Voice input local state
  const [viLoading, setViLoading] = useState(false);
  const [viError, setViError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle'); // idle, listening, processing
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  // Listen for navigation events to refresh data when returning from edit page
  useEffect(() => {
    const handleFocus = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Debug: Monitor tasks state changes
  useEffect(() => {
    console.log('=== TASKS STATE CHANGED ===');
    console.log('Current tasks state:', tasks);
    console.log('Tasks length:', tasks.length);
    console.log('Tasks array:', JSON.stringify(tasks));
    console.log('=== TASKS STATE END ===');
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      console.log('=== FETCH TASKS START ===');
      console.log('Current user:', currentUser);
      setLoading(true);
      console.log('Making API call to getAllTasks...');
      
      const response = await taskApi.getAllTasks();
      console.log('=== FETCH RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response status:', response?.status);
      console.log('Response data:', response?.data);
      console.log('Tasks array:', response?.data?.data);
      console.log('Number of tasks:', response?.data?.data?.length || 0);
      
      const tasksArray = response?.data?.data || [];
      console.log('Tasks array to set:', tasksArray);
      console.log('Tasks array length:', tasksArray.length);
      
      setTasks(tasksArray);
      console.log('Tasks set in React state');
      console.log('=== FETCH TASKS END ===');
    } catch (error) {
      console.log('=== FETCH ERROR ===');
      console.error('Error fetching tasks:', error);
      console.error('Error response:', error?.response);
      console.error('Error status:', error?.response?.status);
      console.error('Error data:', error?.response?.data);
      console.error('Error message:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (taskId) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await taskApi.deleteTask(taskId);
          setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      },
    });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Voice helpers
  // Voice helpers - Advanced Web Speech API Integration
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setViError('Speech Recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = 'en-US';

    return recognition;
  };

  const startVoiceProcessing = async () => {
    try {
      setViError(null);
      setVoiceStatus('listening');
      
      const recognition = initializeSpeechRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      let interimTranscript = '';

      recognition.onstart = () => {
        // reset final transcript buffer on each start
        if (recognitionRef.current) recognitionRef.current.finalTranscript = '';
        setVoiceStatus('listening');
        setVoiceTranscript('Listening...');
      };

      recognition.onresult = (event) => {
        // Build final and interim transcripts without duplications
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0].transcript.trim();
          if (res.isFinal) {
            // accumulate only final pieces into a single finalTranscript buffer
            if (!recognitionRef.current) recognitionRef.current = recognition;
            recognitionRef.current.finalTranscript = (recognitionRef.current.finalTranscript || '').trim();
            recognitionRef.current.finalTranscript = recognitionRef.current.finalTranscript
              ? recognitionRef.current.finalTranscript + ' ' + text
              : text;
          } else {
            interim += text + ' ';
          }
        }

        const finalSoFar = (recognitionRef.current && recognitionRef.current.finalTranscript) ? recognitionRef.current.finalTranscript : '';
        const combined = finalSoFar + (interim ? (finalSoFar ? ' ' : '') + interim.trim() + ' (interim)' : '');
        setVoiceTranscript(combined || 'Listening...');
      };

      recognition.onerror = (event) => {
        const errors = {
          'network': 'Network error. Check your internet connection.',
          'audio-capture': 'No microphone found or microphone access denied.',
          'not-allowed': 'Microphone access denied. Please allow mic access.',
          'no-speech': 'No speech detected. Please try again.',
          'service-not-allowed': 'Speech recognition service is disabled.',
        };
        setViError(errors[event.error] || `Error: ${event.error}`);
        setVoiceStatus('idle');
      };

      recognition.onend = async () => {
        setVoiceStatus('processing');
        const finalTranscript = (recognitionRef.current && recognitionRef.current.finalTranscript)
          ? recognitionRef.current.finalTranscript.trim()
          : '';

        if (finalTranscript) {
          // clear interim display and process the final text
          setVoiceTranscript(finalTranscript);
          await processVoiceCommand(finalTranscript);
        } else {
          setViError('No speech detected. Please try again.');
          setVoiceStatus('idle');
        }
      };

      recognition.start();
    } catch (e) {
      setViError(`Error: ${e.message}`);
      setVoiceStatus('idle');
    }
  };

  const stopVoiceProcessing = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceStatus('idle');
  };

  const processVoiceCommand = async (transcript) => {
    try {
      setViLoading(true);
      setVoiceStatus('processing');

      // Parse voice command - Professional patterns
      const taskData = parseVoiceCommand(transcript);

      if (!taskData.title) {
        setViError('Could not extract task title. Please say: "Create task {title}"');
        setVoiceStatus('idle');
        return;
      }

      // Fast path: if we have a clear title, auto-create task to speed up workflow
      const autoCreate = taskData.title && taskData.title.length > 2;
      if (autoCreate) {
        await createTaskFromVoice(taskData);
        return;
      }

      console.log('Voice parsed taskData:', taskData);
      
      // Show confirmation modal with extracted data
      Modal.confirm({
        title: `Confirm Voice ${taskData.action === 'UPDATE' ? 'Task Update' : taskData.action === 'ASSIGN' ? 'Task Assignment' : 'Task Creation'}`,
        content: (
          <div>
            <p><strong>Transcript:</strong> "{transcript}"</p>
            <Form layout="vertical" style={{ marginTop: '20px' }}>
              {taskData.taskId && (
                <Form.Item label="Task ID">
                  <span>{taskData.taskId}</span>
                </Form.Item>
              )}
              <Form.Item label="Task Title">
                <Input value={taskData.title} disabled />
              </Form.Item>
              <Form.Item label="Description">
                <Input.TextArea value={taskData.description} disabled rows={2} />
              </Form.Item>
              <Form.Item label="Priority">
                <Tag color={getPriorityColor(taskData.priority)}>{taskData.priority}</Tag>
              </Form.Item>
              <Form.Item label="Status">
                <Tag color={getStatusColor(taskData.status)}>{taskData.status}</Tag>
              </Form.Item>
              <Form.Item label="Assigned To">
                <span>{taskData.assignedToName || 'You'}</span>
              </Form.Item>
              <Form.Item label="Deadline">
                <span>{taskData.deadline ? new Date(taskData.deadline).toLocaleDateString() : 'No deadline set'}</span>
                {taskData.deadlineTime && <small> at {taskData.deadlineTime}</small>}
                {taskData.deadline && <small> (Raw: {taskData.deadline})</small>}
              </Form.Item>
            </Form>
          </div>
        ),
        okText: taskData.action === 'UPDATE' ? 'Update Task' : taskData.action === 'ASSIGN' ? 'Assign Task' : 'Create Task',
        cancelText: 'Edit Manually',
        onOk: async () => {
          await createTaskFromVoice(taskData);
        },
        onCancel: () => {
          setVoiceModalVisible(false);
          setVoiceStatus('idle');
        },
      });
    } catch (e) {
      setViError(`Error: ${e.message || 'Failed to process voice command'}`);
      setVoiceStatus('idle');
    } finally {
      setViLoading(false);
    }
  };

  const parseVoiceCommand = (transcript) => {
    const lower = transcript.toLowerCase();
    
    // Initialize default values
    const parsed = {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'PENDING',
      deadline: null,
      deadlineTime: null,
      assignedToName: null,
      action: 'CREATE', // CREATE, UPDATE, ASSIGN
      taskId: null,
    };

    console.log('Parsing transcript:', transcript);

    // Extract title - improved patterns: "create task {title}", "add task {title}", "new task {title}", "update task {title}", "change task {title}"
    const titlePatterns = [
      /(?:create|add|new)\s+task\s+(?:for\s+)?(?:about\s+)?(.+?)(?:\s+(?:priority|as|with|deadline|due|assigned|status|to|\d+[:/.-]\d+[:/.-]\d+|\d+:\d+|$))/i,
      /(?:create|add|new)\s+task\s+(?:titled\s+)?(.+?)(?:\s+(?:priority|as|with|deadline|due|assigned|status|to|\d+[:/.-]\d+[:/.-]\d+|\d+:\d+|$))/i,
      /task\s+(?:titled\s+)?(.+?)(?:\s+(?:priority|as|with|deadline|due|assigned|status|to|\d+[:/.-]\d+[:/.-]\d+|\d+:\d+|$))/i,
      /(?:update|change)\s+task\s+(?:titled\s+)?(.+?)(?:\s+(?:priority|as|with|deadline|due|assigned|status|to|\d+[:/.-]\d+[:/.-]\d+|\d+:\d+|$))/i
    ];
    
    for (const pattern of titlePatterns) {
      const titleMatch = transcript.match(pattern);
      if (titleMatch && titleMatch[1]) {
        let title = titleMatch[1].trim();
        // Remove any trailing date patterns or keywords from title
        title = title.replace(/\s+(?:priority|as|with|deadline|due|assigned|status|to)\s+.+$/i, '');
        title = title.replace(/\s+\d+[\/.-]\d+[\/.-]\d+.*$/i, '');
        parsed.title = title.trim();
        break;
      }
    }
    
    // Fallback: use first meaningful part after removing command words, dates, and keywords
    if (!parsed.title) {
      let cleaned = transcript.replace(/\b(?:create|add|new|task|please|today|tomorrow)\b/gi, '');
      // Remove date patterns
      cleaned = cleaned.replace(/\b\d+[\/.-]\d+[\/.-]\d+\b/g, '');
      // Remove keywords
      cleaned = cleaned.replace(/\b(?:priority|high|urgent|medium|low|status|pending|progress|completed|assigned|deadline|due)\b/gi, '');
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      if (cleaned.length > 0) {
        parsed.title = cleaned.substring(0, 100);
      }
    }

    // Extract priority - enhanced patterns
    if (/\b(?:high|urgent|asap|critical|important)\b/i.test(lower)) {
      parsed.priority = lower.includes('urgent') || lower.includes('asap') ? 'URGENT' : 'HIGH';
    } else if (/\b(?:medium|normal|standard|regular)\b/i.test(lower)) {
      parsed.priority = 'MEDIUM';
    } else if (/\b(?:low|minor|casual)\b/i.test(lower)) {
      parsed.priority = 'LOW';
    }

    // Check for action type first
    if (/\b(?:update|change)\s+task\b/i.test(lower)) {
      parsed.action = 'UPDATE';
    } else if (/\b(?:assign|delegate)\s+task\b/i.test(lower)) {
      parsed.action = 'ASSIGN';
    }
    if (/\b(?:in\s+progress|working|started)\b/i.test(lower)) {
      parsed.status = 'IN_PROGRESS';
    } else if (/\b(?:completed|done|finished|closed)\b/i.test(lower)) {
      parsed.status = 'COMPLETED';
    } else if (/\b(?:pending|waiting|hold)\b/i.test(lower)) {
      parsed.status = 'PENDING';
    }

    // Extract deadline - enhanced patterns including specific dates and times
    const now = new Date();
    
    // Check for specific date patterns like "7.2.2026", "7/2/2026", "7-2-2026" (DD/MM/YYYY format)
    const datePatterns = [
      /\b(\d{1,2})[.\/ -](\d{1,2})[.\/ -](\d{4})\b/i,
      /\b(\d{1,2})[.\/ -](\d{1,2})[.\/ -](\d{2})\b/i
    ];
    
    // Check for time patterns like "2:30 PM", "14:30", "at 3 PM"
    const timePatterns = [
      /\bat\s+(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
      /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
      /\b(\d{1,2})\s*(am|pm)\b/i
    ];
    
    // Enhanced deadline patterns - check for "deadline" keyword
    const deadlinePatterns = [
      /(?:deadline|due|by|before)\s+(\d{1,2})[.\/ -](\d{1,2})[.\/ -](\d{2,4})\b/i,
      /(?:deadline|due|by|before)\s+(today|tomorrow|this\s+week|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
    ];
    
    // First check for deadline-specific patterns
    for (const pattern of deadlinePatterns) {
      const deadlineMatch = transcript.match(pattern);
      if (deadlineMatch) {
        console.log('Deadline pattern match:', deadlineMatch);
        
        if (deadlineMatch[1] && !isNaN(deadlineMatch[1])) {
          // It's a date pattern - DD/MM/YYYY format
          let day = parseInt(deadlineMatch[1]);  // Day
          let month = parseInt(deadlineMatch[2]); // Month  
          let year = parseInt(deadlineMatch[3]);  // Year
          
          // Handle 2-digit years
          if (year < 100) {
            year += 2000;
          }
          
          // Validate date
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
            parsed.deadline = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Extract time if present
            for (const timePattern of timePatterns) {
              const timeMatch = transcript.match(timePattern);
              if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                let period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
                
                // Convert to 24-hour format
                if (period === 'pm' && hours < 12) hours += 12;
                if (period === 'am' && hours === 12) hours = 0;
                
                parsed.deadlineTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                break;
              }
            }
            
            console.log('Final deadline set (DD/MM/YYYY):', parsed.deadline, 'Time:', parsed.deadlineTime);
            break;
          }
        } else if (deadlineMatch[1]) {
          // It's a relative date
          const relativeDate = deadlineMatch[1].toLowerCase();
          if (relativeDate === 'today') {
            parsed.deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
          } else if (relativeDate === 'tomorrow') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            parsed.deadline = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).toISOString().split('T')[0];
          } else if (relativeDate === 'this week') {
            const endOfWeek = new Date(now);
            endOfWeek.setDate(endOfWeek.getDate() + (5 - endOfWeek.getDay()));
            parsed.deadline = new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate()).toISOString().split('T')[0];
          } else if (relativeDate === 'next week') {
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);
            parsed.deadline = new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate()).toISOString().split('T')[0];
          } else {
            // Day of week
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDay = days.indexOf(relativeDate);
            if (targetDay >= 0) {
              const currentDay = now.getDay();
              let daysUntilTarget = targetDay - currentDay;
              if (daysUntilTarget <= 0) daysUntilTarget += 7; // Next occurrence
              const targetDate = new Date(now);
              targetDate.setDate(targetDate.getDate() + daysUntilTarget);
              parsed.deadline = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString().split('T')[0];
            }
          }
          
          // Extract time if present
          for (const timePattern of timePatterns) {
            const timeMatch = transcript.match(timePattern);
            if (timeMatch) {
              let hours = parseInt(timeMatch[1]);
              let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
              let period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
              
              // Convert to 24-hour format
              if (period === 'pm' && hours < 12) hours += 12;
              if (period === 'am' && hours === 12) hours = 0;
              
              parsed.deadlineTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              break;
            }
          }
          
          console.log('Final relative deadline set:', parsed.deadline, 'Time:', parsed.deadlineTime);
          break;
        }
      }
    }
    
    // If no deadline-specific patterns found, try general date patterns
    if (!parsed.deadline) {
      // Check for specific date patterns like "7.2.2026", "7/2/2026", "7-2-2026" (DD/MM/YYYY format)
      for (const pattern of datePatterns) {
        const dateMatch = transcript.match(pattern);
        if (dateMatch) {
          let day = parseInt(dateMatch[1]);  // Day (DD)
          let month = parseInt(dateMatch[2]); // Month (MM)
          let year = parseInt(dateMatch[3]);  // Year (YYYY)
          
          // Handle 2-digit years
          if (year < 100) {
            year += 2000;
          }
          
          // Validate date
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
            parsed.deadline = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Extract time if present
            for (const timePattern of timePatterns) {
              const timeMatch = transcript.match(timePattern);
              if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                let period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
                
                // Convert to 24-hour format
                if (period === 'pm' && hours < 12) hours += 12;
                if (period === 'am' && hours === 12) hours = 0;
                
                parsed.deadlineTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                break;
              }
            }
            
            console.log('Final deadline set (DD/MM/YYYY):', parsed.deadline, 'Time:', parsed.deadlineTime);
            break;
          }
        }
      }
      
      // If no specific date found, use relative patterns
      if (!parsed.deadline && /\btoday\b/i.test(lower)) {
        parsed.deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
      } else if (!parsed.deadline && /\btomorrow\b/i.test(lower)) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        parsed.deadline = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).toISOString().split('T')[0];
      } else if (!parsed.deadline && /\bthis\s+week\b/i.test(lower)) {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(endOfWeek.getDate() + (5 - endOfWeek.getDay()));
        parsed.deadline = new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate()).toISOString().split('T')[0];
      } else if (!parsed.deadline && /\bnext\s+(?:week|month)\b/i.test(lower)) {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        parsed.deadline = new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate()).toISOString().split('T')[0];
      } else if (!parsed.deadline && /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(lower)) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
        if (dayMatch) {
          const targetDay = days.indexOf(dayMatch[1].toLowerCase());
          const currentDay = now.getDay();
          let daysUntilTarget = targetDay - currentDay;
          if (daysUntilTarget <= 0) daysUntilTarget += 7; // Next occurrence
          const targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() + daysUntilTarget);
          parsed.deadline = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString().split('T')[0];
        }
      }
    }

    // Don't auto-extract description - keep it empty for manual entry
    parsed.description = '';

    console.log('Final parsed result:', parsed);
    console.log('Parsed deadline:', parsed.deadline);
    console.log('Parsed deadlineTime:', parsed.deadlineTime);
    console.log('Parsed action:', parsed.action);
    console.log('Parsed taskId:', parsed.taskId);
    console.log('Parsed assignedToName:', parsed.assignedToName);
    
    return parsed;
  };

  const createTaskFromVoice = async (taskData) => {
    try {
      setViLoading(true);
      console.log('=== CREATE TASK FROM VOICE START ===');
      console.log('Task data received:', taskData);

      // Handle different actions
      if (taskData.action === 'UPDATE') {
        console.log('=== ACTION: UPDATE ===');
        await updateTaskFromVoice(taskData);
        return;
      } else if (taskData.action === 'ASSIGN') {
        console.log('=== ACTION: ASSIGN ===');
        await assignTaskFromVoice(taskData);
        return;
      }

      console.log('=== ACTION: CREATE ===');
      // Original create task logic
      // Find assigned user ID if name is provided
      let assignedToId = null;
      if (taskData.assignedToName) {
        try {
          const usersResponse = await userApi.getAllTeamMembers();
          const users = usersResponse.data.data || [];
          const assignedUser = users.find(user => {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            const firstName = user.firstName.toLowerCase();
            const lastName = user.lastName.toLowerCase();
            const searchName = taskData.assignedToName.toLowerCase();
            return fullName.includes(searchName) || 
                   firstName.includes(searchName) || 
                   lastName.includes(searchName) ||
                   searchName.includes(firstName) ||
                   searchName.includes(lastName);
          });
          if (assignedUser) {
            assignedToId = assignedUser.id;
          }
        } catch (err) {
          console.warn('Could not fetch users for assignment:', err);
        }
      }

      const createPayload = {
        title: taskData.title,
        description: '', // Always empty for manual entry
        priority: taskData.priority || 'MEDIUM',
        status: taskData.status || 'PENDING',
        deadline: taskData.deadline || new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedToId: assignedToId || (loggedUser && (loggedUser.id || loggedUser.userId || loggedUser.userid || loggedUser._id || loggedUser.uid)),
      };

      if (!createPayload.title) {
        throw new Error('Task title is required');
      }

      if (!createPayload.assignedToId) {
        throw new Error('Task must be assigned to someone');
      }

      console.log('Creating task with taskData:', taskData);
      console.log('Final createPayload deadline:', createPayload.deadline);

      // Optimistic UI: insert a temporary task so user sees it immediately
      const tempId = `temp-${Date.now()}`;
      const tempTask = {
        id: tempId,
        title: createPayload.title,
        priority: createPayload.priority,
        status: createPayload.status,
        assignedToName: taskData.assignedToName || (loggedUser && (loggedUser.name || loggedUser.fullName || loggedUser.username)) || 'You',
        deadline: createPayload.deadline,
        description: createPayload.description,
      };
      setTasks(prev => [tempTask, ...prev]);

      const response = await taskApi.createTask(createPayload);
      if (response.data.success) {
        message.success(`Task "${createPayload.title}" created successfully via voice!`);
        setVoiceTranscript('');
        setVoiceModalVisible(false);
        setVoiceStatus('idle');
        // Refresh from server to replace temp ID with real data
        await fetchTasks();
      } else {
        // rollback optimistic insert
        setTasks(prev => prev.filter(t => t.id !== tempId));
        setViError('Failed to create task via voice. Please try again.');
      }
    } catch (e) {
      setViError(`Failed to create task: ${e.response?.data?.error || e.message}`);
    } finally {
      setViLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red', URGENT: 'purple' };
    return colors[priority] || 'blue';
  };

  const getStatusColor = (status) => {
    const colors = { PENDING: 'warning', IN_PROGRESS: 'processing', COMPLETED: 'success' };
    return colors[status] || 'default';
  };

  const updateTaskFromVoice = async (taskData) => {
    try {
      console.log('=== UPDATE TASK FROM VOICE START ===');
      console.log('Task data for update:', taskData);
      
      if (!taskData.taskId) {
        console.log('ERROR: No task ID provided');
        setViError('Task ID is required for update');
        return;
      }

      const updatePayload = {
        title: taskData.title,
        priority: taskData.priority || 'MEDIUM',
        status: taskData.status || 'PENDING',
        deadline: taskData.deadline,
        deadlineTime: taskData.deadlineTime,
      };

      console.log('=== UPDATE PAYLOAD ===');
      console.log('Task ID:', taskData.taskId);
      console.log('Update payload:', updatePayload);
      console.log('Deadline in payload:', updatePayload.deadline);
      console.log('DeadlineTime in payload:', updatePayload.deadlineTime);
      
      console.log('=== CALLING UPDATE API ===');
      const response = await taskApi.updateTask(taskData.taskId, updatePayload);
      console.log('=== UPDATE RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response success:', response.data.success);
      
      if (response.data.success) {
        console.log('=== UPDATE SUCCESSFUL ===');
        message.success(`Task "${taskData.title}" updated successfully via voice!`);
        setVoiceTranscript('');
        setVoiceStatus('idle');
        console.log('=== REFRESHING TASKS ===');
        await fetchTasks(); // Refresh task list
        console.log('=== TASKS REFRESHED ===');
      } else {
        console.log('=== UPDATE FAILED ===');
        console.log('Failed response:', response.data);
        setViError('Failed to update task via voice. Please try again.');
      }
    } catch (e) {
      console.log('=== UPDATE ERROR ===');
      console.log('Error object:', e);
      console.log('Error response:', e.response);
      console.log('Error message:', e.response?.data?.error || e.message);
      setViError(`Failed to update task: ${e.response?.data?.error || e.message}`);
    } finally {
      setViLoading(false);
      console.log('=== UPDATE TASK FROM VOICE END ===');
    }
  };

  const assignTaskFromVoice = async (taskData) => {
    try {
      if (!taskData.taskId && !taskData.assignedToName) {
        setViError('Task ID or assignee name is required for assignment');
        return;
      }

      // Find assigned user ID
      let assignedToId = null;
      if (taskData.assignedToName) {
        try {
          const usersResponse = await userApi.getAllTeamMembers();
          const users = usersResponse.data.data || [];
          const assignedUser = users.find(user => {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            const firstName = user.firstName.toLowerCase();
            const lastName = user.lastName.toLowerCase();
            const searchName = taskData.assignedToName.toLowerCase();
            return fullName.includes(searchName) || 
                   firstName.includes(searchName) || 
                   lastName.includes(searchName) ||
                   searchName.includes(firstName) ||
                   searchName.includes(lastName);
          });
          if (assignedUser) {
            assignedToId = assignedUser.id;
          }
        } catch (err) {
          console.warn('Could not fetch users for assignment:', err);
        }
      }

      if (!assignedToId) {
        setViError('Could not find user to assign task to');
        return;
      }

      console.log('Assigning task:', taskData.taskId, 'to user:', assignedToId);
      
      const response = await taskApi.assignTask(taskData.taskId, assignedToId);
      if (response.data.success) {
        message.success(`Task assigned to ${taskData.assignedToName} successfully via voice!`);
        setVoiceTranscript('');
        setVoiceStatus('idle');
        await fetchTasks(); // Refresh task list
      } else {
        setViError('Failed to assign task via voice. Please try again.');
      }
    } catch (e) {
      setViError(`Failed to assign task: ${e.response?.data?.error || e.message}`);
    } finally {
      setViLoading(false);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'serial',
      width: '5%',
      render: (_, __, index) => <strong>{index + 1}</strong>,
    },
    {
      title: 'Task Title',
      dataIndex: 'title',
      key: 'title',
      width: '28%',
      render: (text, record) => (
        <a onClick={() => navigate(`/tasks/${record.id}`)} style={{ fontWeight: '500' }}>
          {text}
        </a>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: '10%',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} style={{ fontWeight: '500' }}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status) => (
        <Tag color={getStatusColor(status)} style={{ fontWeight: '500' }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: '18%',
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      width: '15%',
      render: (deadline) => {
        if (!deadline) return '-';
        const date = new Date(deadline);
        const today = new Date();
        const isOverdue = date < today && deadline.indexOf(today.toISOString().split('T')[0]) === -1;
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : 'inherit', fontWeight: isOverdue ? '600' : 'normal' }}>
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '12%',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/tasks/${record.id}`)}
            title="View Task"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/tasks/${record.id}/edit`)}
            title="Edit Task"
          />
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            title="Delete Task"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="content-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Tasks Management</h1>
        <p className="page-subtitle">Manage and track all your tasks efficiently</p>
      </div>

      {/* Filter Section */}
      <div className="filter-section animate-slide-in-right">
        <Row gutter={[16, 16]} className="filter-row">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search tasks by title..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Status"
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
              size="large"
              options={[
                { label: '📋 Pending', value: 'PENDING' },
                { label: '⚙️ In Progress', value: 'IN_PROGRESS' },
                { label: '✅ Completed', value: 'COMPLETED' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Priority"
              allowClear
              value={filterPriority}
              onChange={setFilterPriority}
              size="large"
              options={[
                { label: '🟢 Low', value: 'LOW' },
                { label: '🟡 Medium', value: 'MEDIUM' },
                { label: '🔴 High', value: 'HIGH' },
                { label: '⚡ Urgent', value: 'URGENT' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="stat-card" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <div className="stat-value">{filteredTasks.length}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          {viError && <Alert message={viError} type="error" showIcon style={{ marginBottom: 'var(--space-4)' }} closable={false} />}
          {voiceStatus === 'listening' && (
            <Alert
              message="🎤 Listening... (Say 'Create task [title]')"
              type="info"
              showIcon={false}
              style={{ marginBottom: 'var(--space-4)' }}
            />
          )}
          {voiceStatus === 'processing' && (
            <Alert message="⏳ Processing voice command..." type="info" showIcon={false} style={{ marginBottom: 'var(--space-4)' }} />
          )}
        </div>
        
        <Space wrap>
          <Button
            type={voiceStatus === 'idle' ? 'primary' : 'danger'}
            icon={voiceStatus === 'listening' ? <AudioOutlined /> : <AudioOutlined />}
            size="large"
            onClick={voiceStatus === 'idle' ? startVoiceProcessing : stopVoiceProcessing}
            loading={voiceStatus === 'processing' || viLoading}
            style={{ minWidth: '150px' }}
          >
            {voiceStatus === 'idle' ? 'Voice Input' : voiceStatus === 'listening' ? 'Recording...' : 'Processing...'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/tasks/new')}
          >
            Create Task
          </Button>
        </Space>
      </div>

      {/* Tasks Table */}
      <div className="task-table-container animate-fade-in-up">
        <Spin spinning={loading} tip="Loading tasks...">
          {(() => {
            console.log('=== TABLE RENDERING ===');
            console.log('Original tasks:', tasks);
            console.log('Filtered tasks:', filteredTasks);
            console.log('Search text:', searchText);
            console.log('Priority filter:', filterPriority);
            console.log('Status filter:', filterStatus);
            console.log('=== TABLE RENDERING END ===');
            
            return (
              <Table
                columns={columns}
                dataSource={filteredTasks.map((task, index) => ({ ...task, key: task.id }))}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Showing ${total} tasks`,
                  pageSizeOptions: ['5', '10', '20', '50'],
                }}
                bordered={false}
                size="middle"
                style={{ background: 'transparent' }}
              />
            );
          })()}
        </Spin>
      </div>

      {/* Voice Command Help Modal */}
      <Modal
        title="Voice Commands Guide"
        visible={false}
        onCancel={() => {}}
        onOk={() => {}}
        footer={null}
        style={{ display: 'none' }}
      >
        <div>
          <h4>Supported Voice Commands:</h4>
          <ul style={{ fontSize: '13px', lineHeight: '1.8' }}>
            <li>"Create task review project report"</li>
            <li>"Add task follow up with client as urgent"</li>
            <li>"New task update documentation high priority deadline today"</li>
            <li>"Create task fix bug priority urgent due tomorrow assigned to John"</li>
            <li>"Add task meeting with team this week status in progress"</li>
            <li>"Task complete project deadline Friday assigned to Sarah high priority"</li>
            <li>"Create task presentation slides status pending assigned to Mike deadline 07/02/2026 at 2:30 PM"</li>
            <li>"Add task client meeting deadline 15/03/2026 priority high at 3 PM"</li>
            <li><strong>Update Commands:</strong></li>
            <li>"Update task 123 change priority to high"</li>
            <li>"Change task 456 status to completed"</li>
            <li>"Update task 789 deadline to tomorrow at 5 PM"</li>
            <li>"Change task 101 assign to Sarah"</li>
            <li><strong>Assign Commands:</strong></li>
            <li>"Assign task 234 to Mike"</li>
            <li>"Delegate task 567 to John as urgent"</li>
          </ul>
          <p><strong>Keywords you can use:</strong></p>
          <ul style={{ fontSize: '13px', lineHeight: '1.8' }}>
            <li><strong>Actions:</strong> create, add, new, update, change, assign, delegate</li>
            <li><strong>Priority:</strong> high, urgent, asap, medium, low</li>
            <li><strong>Status:</strong> pending, in progress, completed</li>
            <li><strong>Deadline:</strong> today, tomorrow, this week, next week, Monday, Tuesday, etc. OR specific dates like 07/02/2026, 15/03/2026 (DD/MM/YYYY)</li>
            <li><strong>Time:</strong> at 2:30 PM, 14:30, 3 PM (can be added after date)</li>
            <li><strong>Assignment:</strong> assigned to John, for Sarah, give to Mike, assign to James</li>
            <li><strong>Task ID:</strong> Use task number for updates: "update task 123"</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
