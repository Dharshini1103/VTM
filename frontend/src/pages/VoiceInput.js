import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Input, Spin, Empty, Alert, Tag, List, Select, DatePicker, TimePicker, Modal } from 'antd';
import { AudioOutlined, StopOutlined, UserOutlined } from '@ant-design/icons';
import voiceApi from '../api/voiceApi';
import { useSelector } from 'react-redux';
import storageManager from '../utils/storageManager';
import userApi from '../api/userApi';
import dayjs from 'dayjs';

function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [liveTranscript, setLiveTranscript] = useState(''); // New state for live transcription
  const [teamMembers, setTeamMembers] = useState([]);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState({
    title: '',
    description: '',
    startDateTime: null,
    endDateTime: null,
    attendees: []
  });
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null); // For speech recognition
  const currentUser = useSelector((state) => state.auth.user);

  // Fetch team members on component mount
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await userApi.getAllTeamMembers();
        setTeamMembers(response.data.data || []);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError('Failed to load team members');
      }
    };
    
    fetchTeamMembers();
  }, []);

  const handleStartRecording = async () => {
    try {
      setError(null);
      setLiveTranscript(''); // Clear previous transcript
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initialize speech recognition for live transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          setLiveTranscript(finalTranscript + interimTranscript);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setLiveTranscript(prev => prev + '\n[Speech recognition error: ' + event.error + ']');
        };
        
        recognition.start();
        console.log('Speech recognition started');
      } else {
        console.log('Speech recognition not supported in this browser');
        setLiveTranscript('Speech recognition not supported in this browser. Audio recording will continue.');
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          await processVoiceCommand(base64Audio);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied: ' + err.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setLiveTranscript(''); // Clear live transcript when stopping
  };

  const processVoiceCommand = async (audioBase64) => {
    try {
      setLoading(true);
      const response = await voiceApi.processVoiceCommand({
        text: manualInput || 'Voice input processed',
        audioBase64,
      });
      const command = response.data.data;
      setCommands([command, ...commands]);
      // If the command indicates scheduling a call, call schedule endpoint
      if (command.intent === 'SCHEDULE_CALL' || command.intent === 'SCHEDULE_MEETING') {
        try {
          // Determine role: try redux store first, then local storage fallback
          const loggedUser = currentUser || storageManager.getUser();
          const role = loggedUser?.role || loggedUser?.role?.name;

          if (!(role === 'ADMIN' || role === 'MANAGER' || role === 'SUPER_ADMIN')) {
            setError('You do not have permission to schedule calls.');
            throw new Error('Forbidden');
          }
          if (command.metadata) {
            const details = JSON.parse(command.metadata);
            
            // Show meeting dialog for team member selection
            setMeetingDetails({
              title: details.title || command.textOutput || 'Scheduled Meeting',
              description: details.description || '',
              startDateTime: details.startDateTime || new Date().toISOString(),
              endDateTime: details.endDateTime || new Date(Date.now() + 60 * 60000).toISOString(),
              attendees: details.attendees || details.participants || []
            });
            setShowMeetingDialog(true);
          }
        } catch (schedErr) {
          setError('Error scheduling call: ' + (schedErr?.message || schedErr));
        }
      }
      
      // If the command indicates task creation, create the task
      if (command.intent === 'CREATE_TASK') {
        try {
          if (command.metadata) {
            const taskDetails = JSON.parse(command.metadata);
            
            console.log('🎤 Raw voice command text:', command.textOutput);
            console.log('📋 Parsed taskDetails:', taskDetails);
            
            // Enhanced role mapping for better assignment
            let assignedToId = taskDetails.assignedToId;
            let assignedToName = null;
            
            // If assignedToId contains role names, try to find matching user
            if (taskDetails.assignedToId && typeof taskDetails.assignedToId === 'string') {
              const roleMapping = {
                'admin': 'admin',
                'manager': 'manager', 
                'super admin': 'super_admin',
                'superadmin': 'super_admin',
                'user': 'user'
              };
              
              const normalizedRole = taskDetails.assignedToId.toLowerCase().trim();
              console.log('🔍 Looking for role:', normalizedRole);
              
              // Try to find user by role name
              if (roleMapping[normalizedRole]) {
                console.log('✅ Role recognized:', normalizedRole, '→ mapped to:', roleMapping[normalizedRole]);
                // This would need backend user lookup - for now, keep the original
                assignedToId = taskDetails.assignedToId;
                assignedToName = taskDetails.assignedToId;
              } else {
                console.log('⚠️ Role not recognized, using as-is:', taskDetails.assignedToId);
                assignedToId = taskDetails.assignedToId;
                assignedToName = taskDetails.assignedToId;
              }
            }
            
            // Format date to DD.MM.YYYY if deadline exists
            let formattedDeadline = taskDetails.deadline;
            if (taskDetails.deadline) {
              const date = new Date(taskDetails.deadline);
              if (!isNaN(date)) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                formattedDeadline = `${day}.${month}.${year}`;
                console.log('Formatted deadline:', formattedDeadline);
              }
            }
            
            const createPayload = {
              title: taskDetails.title || command.textOutput || 'Voice Created Task',
              description: taskDetails.description || null, // Only if provided
              priority: taskDetails.priority || null, // Only if provided
              status: taskDetails.status || null, // Only if provided
              deadline: taskDetails.deadline || null, // Only if provided
              deadlineTime: taskDetails.deadlineTime || null, // Only if provided
              assignedToId: assignedToId || null, // Use processed assignment
            };

            console.log('Voice task payload:', createPayload);
            console.log('Original taskDetails:', taskDetails);
            console.log('🎯 Final assignedToId:', createPayload.assignedToId);
            console.log('👤 Final assignedToName:', assignedToName);

            if (createPayload.title) {
              const taskResponse = await voiceApi.createTaskFromVoice({
                text: command.textOutput,
                audioBase64,
                metadata: command.metadata
              });
              
              console.log('Task creation response:', taskResponse.data.data);
              console.log('Assigned To in response:', taskResponse.data.data.assignedToId);
              
              // Add task creation result to history
              setCommands(prev => [{ 
                ...command, 
                taskResult: taskResponse.data.data,
                intent: 'CREATE_TASK_SUCCESS',
                formattedDeadline: formattedDeadline
              }, ...prev]);
            }
          }
        } catch (taskErr) {
          setError('Error creating task from voice: ' + (taskErr?.message || taskErr));
        }
      }
      setManualInput('');
    } catch (err) {
      setError('Error processing voice command: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      setError('Please enter text');
      return;
    }
    await processVoiceCommand('');
  };

  const getIntentColor = (intent) => {
    const colors = {
      SCHEDULE_CALL: 'blue',
      SCHEDULE_MEETING: 'green',
      CREATE_TASK: 'orange',
      CREATE_TASK_SUCCESS: 'green',
      UPDATE_TASK: 'cyan',
      MARK_COMPLETE: 'purple',
      ASSIGN_TASK: 'magenta',
      NONE: 'default',
    };
    return colors[intent] || 'default';
  };

  const handleScheduleMeeting = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const schedulePayload = {
        title: meetingDetails.title,
        description: meetingDetails.description,
        startDateTime: meetingDetails.startDateTime,
        endDateTime: meetingDetails.endDateTime,
        attendees: meetingDetails.attendees
      };

      const response = await voiceApi.scheduleCall(schedulePayload);
      
      // Add to commands history
      setCommands(prev => [{ 
        ...commands[commands.length - 1], // Update the last command with result
        scheduleResult: response.data.data,
        intent: 'SCHEDULE_MEETING_SUCCESS'
      }, ...prev.slice(0, -1)]);
      
      // Reset dialog
      setShowMeetingDialog(false);
      setMeetingDetails({
        title: '',
        description: '',
        startDateTime: null,
        endDateTime: null,
        attendees: []
      });
      
    } catch (err) {
      setError('Error scheduling meeting: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMeeting = () => {
    setShowMeetingDialog(false);
    setMeetingDetails({
      title: '',
      description: '',
      startDateTime: null,
      endDateTime: null,
      attendees: []
    });
  };

  const handleAttendeeChange = (value) => {
    setMeetingDetails(prev => ({
      ...prev,
      attendees: value
    }));
  };

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Voice Commands</h1>

      <Card style={{ marginBottom: '20px' }}>
        <h2>Voice Input</h2>
        <div style={{ marginBottom: '20px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <p style={{ color: '#666' }}>
              Click the microphone button to start recording, or manually enter text below.
            </p>

            <Space>
              {!isRecording ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<AudioOutlined />}
                  onClick={handleStartRecording}
                  loading={loading}
                >
                  Start Recording
                </Button>
              ) : (
                <Button
                  danger
                  size="large"
                  icon={<StopOutlined />}
                  onClick={handleStopRecording}
                >
                  Stop Recording
                </Button>
              )}
            </Space>
          </Space>
        </div>

        {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

        {/* Live Transcript Display */}
        {isRecording && (
          <Card style={{ marginBottom: '20px', backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
            <h3 style={{ color: '#52c41a', marginBottom: '10px' }}>
              Live Transcription
            </h3>
            <div style={{ 
              minHeight: '80px', 
              padding: '15px', 
              backgroundColor: '#fff', 
              borderRadius: '6px',
              border: '1px solid #d9d9d9',
              fontSize: '16px',
              lineHeight: '1.5',
              color: '#262626'
            }}>
              {liveTranscript || 'Listening...'}
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              Speak clearly and the system will transcribe in real-time
            </div>
          </Card>
        )}

        <div style={{ marginTop: '20px' }}>
          <p>Or enter text manually:</p>
          <Input.TextArea
            rows={3}
            placeholder="Enter voice command as text..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <Button type="primary" onClick={handleManualSubmit} loading={loading}>
            Process Command
          </Button>
        </div>
      </Card>

      <Modal
        title="Schedule Meeting with Team Members"
        open={showMeetingDialog}
        onCancel={handleCancelMeeting}
        footer={[
          <Button key="cancel" onClick={handleCancelMeeting}>
            Cancel
          </Button>,
          <Button key="schedule" type="primary" onClick={handleScheduleMeeting} loading={loading}>
            Schedule Meeting
          </Button>
        ]}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label><strong>Meeting Title:</strong> {meetingDetails.title}</label>
          </div>
          
          <div>
            <label><strong>Description:</strong></label>
            <Input.TextArea 
              value={meetingDetails.description}
              onChange={(e) => setMeetingDetails(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter meeting description"
              rows={3}
            />
          </div>
          
          <div>
            <label><strong>Start Date & Time:</strong></label>
            <DatePicker 
              showTime 
              value={meetingDetails.startDateTime ? dayjs(meetingDetails.startDateTime) : null}
              onChange={(date) => setMeetingDetails(prev => ({ ...prev, startDateTime: date ? date.toISOString() : null }))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label><strong>End Date & Time:</strong></label>
            <DatePicker 
              showTime 
              value={meetingDetails.endDateTime ? dayjs(meetingDetails.endDateTime) : null}
              onChange={(date) => setMeetingDetails(prev => ({ ...prev, endDateTime: date ? date.toISOString() : null }))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label><strong>Team Members:</strong></label>
            <Select
              mode="multiple"
              placeholder="Select team members to invite"
              value={meetingDetails.attendees}
              onChange={handleAttendeeChange}
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {teamMembers.map(member => (
                <Select.Option key={member.id} value={member.id}>
                  <Space>
                    <UserOutlined />
                    {member.firstName} {member.lastName} ({member.email})
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </div>
          
          <Space style={{ marginTop: '20px' }}>
            <Button type="primary" onClick={handleScheduleMeeting} loading={loading}>
              Schedule Meeting
            </Button>
            <Button onClick={handleCancelMeeting}>
              Cancel
            </Button>
          </Space>
        </Space>
      </Modal>

      <Card title="Command History">
        {commands.length === 0 ? (
          <Empty description="No commands processed yet" />
        ) : (
          <Spin spinning={loading}>
            <List
              dataSource={commands}
              renderItem={(command) => (
                <List.Item
                  actions={[
                    <Button danger onClick={async () => {
                      try {
                        setLoading(true);
                        await voiceApi.deleteVoiceCommand(command.id);
                        setCommands(prev => prev.filter(c => c.id !== command.id));
                      } catch (e) {
                        setError('Error deleting command: ' + (e?.message || e));
                      } finally {
                        setLoading(false);
                      }
                    }}>
                      Delete
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {command.intent === 'CREATE_TASK_SUCCESS' 
                          ? `Task Created: ${command.taskResult?.title || command.textOutput || 'Voice Task'}`
                          : command.textOutput || 'Voice input'
                        }
                        <Tag color={getIntentColor(command.intent)}>
                          {command.intent === 'CREATE_TASK_SUCCESS' ? 'Task Created' : command.intent}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>Confidence: {(command.confidenceScore * 100).toFixed(1)}% | {new Date(command.createdAt).toLocaleString()}</div>
                        {command.intent === 'CREATE_TASK_SUCCESS' && command.taskResult && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                            <div>📅 Deadline: {command.formattedDeadline || command.taskResult.deadline || 'Not set'}</div>
                            <div>👤 Assigned to: {command.taskResult.assignedToName || command.taskResult.assignedToId ? 'User ID: ' + command.taskResult.assignedToId : 'Not assigned'}</div>
                            {command.taskResult.priority && (
                              <div>🎯 Priority: {command.taskResult.priority}</div>
                            )}
                            {command.taskResult.status && (
                              <div>📋 Status: {command.taskResult.status}</div>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Spin>
        )}
      </Card>
    </div>
  );
}

export default VoiceInput;
