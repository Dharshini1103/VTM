import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Row, Col, DatePicker, TimePicker, Spin, Alert } from 'antd';
import taskApi from '../api/taskApi';
import userApi from '../api/userApi';
import { useSelector } from 'react-redux';

function CreateTask() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [deadlineTime, setDeadlineTime] = useState(null);
  const currentUser = useSelector(state => state.auth.user);

  React.useEffect(() => {
    // Check if user is authenticated
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchTeamMembers();
  }, [currentUser, navigate]);

  const fetchTeamMembers = async () => {
    try {
      const response = await userApi.getAllTeamMembers();
      setUsers(response.data.data || []);
      // Reset form to ensure no default values
      form.resetFields();
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);

      // Validate deadline
      if (!values.deadline) {
        setError('Deadline is required');
        setLoading(false);
        return;
      }

      let deadline = null;
      let deadlineTimeValue = null;
      
      if (values.deadline) {
        // Backend expects LocalDate (yyyy-MM-dd) for deadline
        deadline = values.deadline.format('YYYY-MM-DD');
        
        // Backend expects String (HH:mm) for deadlineTime
        if (deadlineTime) {
          deadlineTimeValue = deadlineTime.format('HH:mm');
        }
      }

      const taskData = {
        title: values.title,
        description: values.description || '',
        priority: values.priority,
        status: values.status || 'PENDING',
        deadline: deadline,
        deadlineTime: deadlineTimeValue,
        assignedToId: values.assignedToId,
      };

      console.log('Creating task with data:', taskData);
      const response = await taskApi.createTask(taskData);
      console.log('Task created successfully:', response.data);
      
      // Success message and navigation
      setTimeout(() => {
        navigate('/tasks');
      }, 500);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Create New Task</h1>
        <p className="page-subtitle">Add a new task to your project</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card className="animate-slide-in-right">
            {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 'var(--space-5)' }} />}

            <Spin spinning={loading}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
              >
                <Form.Item
                  label="Task Title"
                  name="title"
                  rules={[
                    { required: true, message: 'Please enter task title' },
                    { min: 3, message: 'Title must be at least 3 characters' },
                  ]}
                >
                  <Input placeholder="Enter task title" />
                </Form.Item>

                <Form.Item
                  label="Description"
                  name="description"
                >
                  <Input.TextArea rows={4} placeholder="Enter task description" />
                </Form.Item>

                <Form.Item
                  label="Priority"
                  name="priority"
                  rules={[{ required: true, message: 'Please select priority' }]}
                >
                  <Select placeholder="Select priority">
                    <Select.Option value="LOW">Low</Select.Option>
                    <Select.Option value="MEDIUM">Medium</Select.Option>
                    <Select.Option value="HIGH">High</Select.Option>
                    <Select.Option value="URGENT">Urgent</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Status"
                  name="status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select placeholder="Select status">
                    <Select.Option value="PENDING">Pending</Select.Option>
                    <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
                    <Select.Option value="COMPLETED">Completed</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Assign To"
                  name="assignedToId"
                  rules={[{ required: true, message: 'Please select a team member' }]}
                >
                  <Select placeholder="Select team member">
                    {users.map(user => (
                      <Select.Option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Deadline"
                  name="deadline"
                  rules={[{ required: true, message: 'Please select deadline' }]}
                >
                  <Row gutter={8}>
                    <Col span={16}>
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Col>
                    <Col span={8}>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Select time"
                        value={deadlineTime}
                        onChange={(time) => setDeadlineTime(time)}
                        format="HH:mm"
                      />
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block size="large">
                    Create Task
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default CreateTask;
