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
    fetchTask();
    fetchTeamMembers();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await taskApi.getTaskById(taskId);
      setTask(response.data.data);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await userApi.getAllTeamMembers();
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  const handleComplete = async () => {
    Modal.confirm({
      title: 'Complete Task',
      content: 'Mark this task as completed?',
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
                <Button icon={<EditOutlined />} onClick={() => navigate(`/tasks/${taskId}/edit`)} />
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
                {new Date(task.deadline).toLocaleString()}
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
            <Button block type="primary" onClick={() => navigate('/meetings/schedule')}>
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
