import React, { useState, useRef } from 'react';
import { Card, Button, Space, Input, Spin, Empty, Alert, Tag, List } from 'antd';
import { AudioOutlined, StopOutlined } from '@ant-design/icons';
import voiceApi from '../api/voiceApi';
import { useSelector } from 'react-redux';
import storageManager from '../utils/storageManager';

function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const currentUser = useSelector((state) => state.auth.user);

  const handleStartRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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
            const schedulePayload = {
              title: details.title || command.textOutput || 'Scheduled Call',
              startDateTime: details.startDateTime || details.start || new Date().toISOString(),
              endDateTime: details.endDateTime || details.end || new Date(Date.now() + 30 * 60000).toISOString(),
              attendees: details.attendees || details.participants || [],
            };

            const schedResp = await voiceApi.scheduleCall(schedulePayload);
            // Add scheduling response to history
            setCommands(prev => [{ ...command, scheduleResult: schedResp.data.data }, ...prev]);
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
            const createPayload = {
              title: taskDetails.title || command.textOutput || 'Voice Created Task',
              description: taskDetails.description || '',
              priority: taskDetails.priority || 'MEDIUM',
              status: taskDetails.status || 'PENDING',
              deadline: taskDetails.deadline || new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              assignedToId: taskDetails.assignedToId || (currentUser?.id || storageManager.getUser()?.id),
            };

            if (createPayload.title && createPayload.assignedToId) {
              const taskResponse = await voiceApi.createTaskFromVoice({
                text: command.textOutput,
                audioBase64,
                metadata: command.metadata
              });
              
              // Add task creation result to history
              setCommands(prev => [{ 
                ...command, 
                taskResult: taskResponse.data.data,
                intent: 'CREATE_TASK_SUCCESS'
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
                    description={`Confidence: ${(command.confidenceScore * 100).toFixed(1)}% | ${new Date(command.createdAt).toLocaleString()}`}
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
