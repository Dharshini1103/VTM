import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Spin, Empty, Button, Space, Tag, Descriptions, Modal, Form, Input, Select, DatePicker, Alert } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, AudioOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import taskApi from '../api/taskApi';
import userApi from '../api/userApi';

function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingInline, setEditingInline] = useState(false);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    console.log('🔄 TaskDetail useEffect triggered with taskId:', taskId);
    fetchTask();
    fetchTeamMembers();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      console.log('Fetching task with ID:', taskId);
      const response = await taskApi.getTaskById(taskId);
      console.log('Task response:', response);
      console.log('Task response status:', response.status);
      console.log('Task response data:', response.data);
      
      // Try different ways to extract task data (same as EditTask)
      let taskData = null;
      if (response.data?.data) {
        taskData = response.data.data;
        console.log('Using response.data.data');
      } else if (response.data) {
        taskData = response.data;
        console.log('Using response.data');
      } else if (response) {
        taskData = response;
        console.log('Using response directly');
      }
      
      console.log('Final extracted task data:', taskData);
      setTask(taskData);
    } catch (error) {
      console.error('❌ Error fetching task:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      console.log('Fetching team members for task detail...');
      const response = await userApi.getAllUsers();
      console.log('Users API response:', response);
      
      // Use the same data extraction logic as other components
      let usersData = [];
      if (response.data && response.data.success && response.data.data) {
        usersData = response.data.data;
        console.log('Using response.data.success.data');
      } else if (response.data && response.data.data) {
        usersData = response.data.data;
        console.log('Using response.data.data');
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
        console.log('Using response.data array');
      } else {
        console.log('No users found, trying getAllTeamMembers...');
        // Try fallback method
        try {
          const teamResponse = await userApi.getAllTeamMembers();
          console.log('Team members fallback response:', teamResponse);
          if (teamResponse.data && teamResponse.data.data) {
            usersData = teamResponse.data.data;
            console.log('Using team members fallback');
          }
        } catch (teamError) {
          console.error('Team members fallback failed:', teamError);
        }
      }
      
      console.log('Final extracted users:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching team members:', err);
      console.error('Error response:', err.response);
      setUsers([]);
    }
  };

  const handleComplete = async () => {
    Modal.confirm({
      title: 'Complete Task',
      content: 'Mark this task as done?',
      onOk: async () => {
        try {
          const response = await taskApi.completeTask(taskId);
          setTask(response.data.data);
        } catch (error) {
          console.error('Error completing task:', error);
        }
      },
    });
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okType: 'danger',
      onOk: async () => {
        try {
          await taskApi.deleteTask(taskId);
          navigate('/tasks');
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      },
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'green';
      case 'MEDIUM':
        return 'orange';
      case 'HIGH':
        return 'red';
      case 'URGENT':
        return 'purple';
      default:
        return 'blue';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'processing';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) return <Spin />;
  if (!task) return <Empty description="Task not found" />;

  return (
    <div>
      <Button onClick={() => navigate('/tasks')} style={{ marginBottom: '20px' }}>
        ← Back to Tasks
      </Button>

      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Card>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h1>{task.title}</h1>
                <div style={{ marginTop: '10px' }}>
                  <Tag color={getPriorityColor(task.priority)}>{task.priority}</Tag>
                  <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                </div>
              </div>
              <Space>
                <Button icon={<AudioOutlined />} onClick={() => navigate('/voice')} />
                <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleComplete}
                disabled={task.status === 'COMPLETED'}
                >
                Complete
                </Button>
                <Button 
                icon={<EditOutlined />} 
                onClick={() => {
                  console.log('Editing task with ID:', taskId);
                  console.log('Navigating to:', `/tasks/${taskId}/edit`);
                  navigate(`/tasks/${taskId}/edit`);
                }} 
              />
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete} />
              </Space>
            </div>

            <Descriptions column={1} bordered style={{ marginTop: '20px' }}>
              <Descriptions.Item label="Description">
                {task.description || 'No description'}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {task.createdByName}
              </Descriptions.Item>
              <Descriptions.Item label="Assigned To">
                {task.assignedToName || 'Unassigned'}
              </Descriptions.Item>
              <Descriptions.Item label="Deadline">
                {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                {task.deadlineTime && (
                  <span style={{ marginLeft: '8px', color: '#1890ff', fontWeight: '500' }}>
                    {task.deadlineTime}
                  </span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {new Date(task.createdAt).toLocaleString()}
              </Descriptions.Item>
              {task.callScheduled && (
                <>
                  <Descriptions.Item label="Call Type">
                    {task.callType}
                  </Descriptions.Item>
                  {task.meetingLink && (
                    <Descriptions.Item label="Meeting Link">
                      <a href={task.meetingLink} target="_blank" rel="noopener noreferrer">
                        {task.meetingLink}
                      </a>
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Schedule Meeting" style={{ marginBottom: '20px' }}>
            <Button block type="primary" onClick={() => navigate('/meetings?schedule=true')}>
              Schedule Call/Meet
            </Button>
          </Card>

          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                danger
                onClick={handleDelete}
              >
                Delete Task
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default TaskDetail;
