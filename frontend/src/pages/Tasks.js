import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Tag, Modal, Input, Select, Row, Col, Card, Spin, Empty, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined, AudioOutlined, StopOutlined } from '@ant-design/icons';
import taskApi from '../api/taskApi';
import voiceApi from '../api/voiceApi';

function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Voice input local state
  const [viLoading, setViLoading] = useState(false);
  const [viError, setViError] = useState(null);
  const [manualVoiceText, setManualVoiceText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getUserTasks();
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
  const startRecording = async () => {
    try {
      setViError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];
            await processVoice(base64Audio);
          };
          reader.readAsDataURL(audioBlob);
        } finally {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
          }
        }
      };
      mr.start();
      setIsRecording(true);
    } catch (e) {
      setViError('Microphone access denied: ' + e.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoice = async (audioBase64) => {
    try {
      setViLoading(true);
      setViError(null);
      await voiceApi.processVoiceCommand({ text: manualVoiceText || 'Voice input', audioBase64 });
      setManualVoiceText('');
      await fetchTasks();
    } catch (e) {
      setViError(e.response?.data?.error || e.message || 'Error processing voice');
    } finally {
      setViLoading(false);
    }
  };

  const submitManualVoice = async () => {
    if (!manualVoiceText.trim()) {
      setViError('Please enter a command');
      return;
    }
    await processVoice('');
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '30%',
      render: (text, record) => (
        <a onClick={() => navigate(`/tasks/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: '12%',
      render: (priority) => {
        const colors = {
          LOW: 'green',
          MEDIUM: 'orange',
          HIGH: 'red',
          URGENT: 'purple',
        };
        return <Tag color={colors[priority] || 'blue'}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => {
        const colors = {
          PENDING: 'warning',
          IN_PROGRESS: 'processing',
          COMPLETED: 'success',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: '15%',
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      width: '15%',
      render: (deadline) => new Date(deadline).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/tasks/${record.id}`)}
            title="View Task"
          />
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/tasks/${record.id}/edit`)}
            title="Update Task"
          />
          <Button
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
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Tasks</h1>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/tasks/new')}
            >
              Create Task
            </Button>
          </div>
        </Col>
      </Row>

      <Card style={{ marginBottom: '20px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search tasks..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Status"
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { label: 'Pending', value: 'PENDING' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Completed', value: 'COMPLETED' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Priority"
              allowClear
              value={filterPriority}
              onChange={setFilterPriority}
              options={[
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Urgent', value: 'URGENT' },
              ]}
            />
          </Col>
          <Col xs={24} sm={24} md={6}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!isRecording ? (
                <Button icon={<AudioOutlined />} onClick={startRecording} loading={viLoading}>
                  Voice
                </Button>
              ) : (
                <Button danger icon={<StopOutlined />} onClick={stopRecording}>
                  Stop
                </Button>
              )}
              <Input
                placeholder="e.g., Assign task 42 to John"
                value={manualVoiceText}
                onChange={(e) => setManualVoiceText(e.target.value)}
              />
              <Button type="primary" onClick={submitManualVoice} loading={viLoading}>
                Go
              </Button>
            </div>
            {viError && <Alert type="error" showIcon style={{ marginTop: 8 }} message={viError} />}
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {filteredTasks.length === 0 ? (
          <Empty description="No tasks found" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTasks}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Spin>
    </div>
  );
}

export default Tasks;
