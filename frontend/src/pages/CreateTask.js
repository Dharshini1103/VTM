import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Row, Col, DatePicker, TimePicker, Spin, Alert, Avatar, Space, Tag } from 'antd';
import taskApi from '../api/taskApi';
import userApi from '../api/userApi';
import { useSelector } from 'react-redux';

function CreateTask() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState(null);
  const currentUser = useSelector(state => state.auth.user);

  React.useEffect(() => {
    // Check if user is authenticated
    if (!currentUser) {
      navigate('/login');
      return;
    }
    console.log('Current user:', currentUser);
    console.log('Fetching team members...');
    fetchTeamMembers();
  }, [currentUser, navigate]);

  const fetchTeamMembers = async () => {
    try {
      setUsersLoading(true);
      console.log('Fetching all users for create task...');
      const response = await userApi.getAllUsers();
      console.log('Users API response:', response);
      
      // Use the same data extraction logic as meeting scheduler
      if (response.data && response.data.success && response.data.data) {
        console.log('Setting users:', response.data.data);
        setUsers(response.data.data);
      } else if (response.data && response.data.data) {
        console.log('Setting users from direct data:', response.data.data);
        setUsers(response.data.data);
      } else if (Array.isArray(response.data)) {
        console.log('Setting users from array:', response.data);
        setUsers(response.data);
      } else {
        console.log('No users found with getAllUsers, trying getAllTeamMembers...');
        // Try fallback method
        try {
          const teamResponse = await userApi.getAllTeamMembers();
          console.log('Team members API response:', teamResponse);
          if (teamResponse.data && teamResponse.data.data) {
            console.log('Setting team members:', teamResponse.data.data);
            setUsers(teamResponse.data.data);
          } else {
            console.log('No users found, setting empty array');
            setUsers([]);
          }
        } catch (teamError) {
          console.error('Error fetching team members:', teamError);
          setUsers([]);
        }
      }
      
      // Reset form to ensure no default values
      form.resetFields();
    } catch (err) {
      console.error('Error fetching team members:', err);
      console.error('Error response:', err.response);
      
      // Try fallback method
      try {
        console.log('Trying getAllTeamMembers as fallback...');
        const teamResponse = await userApi.getAllTeamMembers();
        console.log('Team members fallback response:', teamResponse);
        if (teamResponse.data && teamResponse.data.data) {
          console.log('Setting team members from fallback:', teamResponse.data.data);
          setUsers(teamResponse.data.data);
        } else {
          setUsers([]);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setUsers([]);
      }
    } finally {
      setUsersLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Form values:', values);
      console.log('Deadline value:', values.deadline);
      console.log('Deadline time value:', deadlineTime);

      // Validate deadline - check if it's a valid dayjs object
      if (!values.deadline) {
        setError('Please select a deadline');
        setLoading(false);
        return;
      }

      let deadline = null;
      let deadlineTimeValue = null;
      
      if (values.deadline) {
        // Backend expects LocalDate (yyyy-MM-dd) for deadline
        deadline = values.deadline.format('YYYY-MM-DD');
        console.log('Formatted deadline:', deadline);
        
        // Backend expects String (HH:mm) for deadlineTime
        if (deadlineTime) {
          deadlineTimeValue = deadlineTime.format('HH:mm');
          console.log('Formatted deadline time:', deadlineTimeValue);
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
      console.log('Task created successfully:', response);
      console.log('Task creation response status:', response.status);
      console.log('Task creation response data:', response.data);
      console.log('Task creation response headers:', response.headers);
      
      // Extract task ID from response if available
      let createdTaskId = null;
      if (response.data?.data?.id) {
        createdTaskId = response.data.data.id;
        console.log('Task ID from response.data.data.id:', createdTaskId);
      } else if (response.data?.id) {
        createdTaskId = response.data.id;
        console.log('Task ID from response.data.id:', createdTaskId);
      } else if (response.data) {
        createdTaskId = response.data.id || response.data.taskId;
        console.log('Task ID from response.data:', createdTaskId);
      }
      
      console.log('Final extracted task ID:', createdTaskId);
      
      // Success message and navigation
      if (createdTaskId) {
        console.log('✅ Task created successfully with ID:', createdTaskId);
        console.log('✅ Navigating to task detail page:', `/tasks/${createdTaskId}`);
        setTimeout(() => {
          navigate(`/tasks/${createdTaskId}`);
        }, 500);
      } else {
        console.log('⚠️ No task ID found in response, navigating to tasks list');
        console.log('⚠️ Full response structure:', JSON.stringify(response, null, 2));
        setTimeout(() => {
          navigate('/tasks');
        }, 500);
      }
    } catch (err) {
      console.error('❌ Error creating task:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error data:', err.response?.data);
      console.error('❌ Error message:', err.message);
      console.error('❌ Full error object:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Error creating task';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
                  label={
                    <Space>
                      <span>Assign To</span>
                      <Tag color="blue" style={{ fontSize: '11px' }}>
                        {users.length} team members
                      </Tag>
                    </Space>
                  }
                  name="assignedToId" 
                  rules={[{ required: false, message: 'Please select a team member' }]}
                >
                  <Select 
                    placeholder="Select team member (all active members)" 
                    showSearch
                    loading={usersLoading}
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    size="large"
                    notFoundContent={
                      usersLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <Spin size="small" />
                          <div style={{ marginTop: '8px', color: '#999' }}>
                            Loading team members...
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <div style={{ fontSize: '24px', color: '#ccc' }}>👥</div>
                          <div style={{ marginTop: '8px', color: '#999' }}>
                            No team members found
                          </div>
                        </div>
                      )
                    }
                  >
                    <Select.Option value={null}>
                      <Space>
                        <span style={{ color: '#999' }}>Unassigned</span>
                      </Space>
                    </Select.Option>
                    {users.map((user) => (
                      <Select.Option key={user.id} value={user.id}>
                        <Space>
                          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </Avatar>
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {user.firstName} {user.lastName}
                            </div>
                            {user.jobTitle && (
                              <div style={{ fontSize: '11px', color: '#999' }}>
                                {user.jobTitle}
                              </div>
                            )}
                          </div>
                        </Space>
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
                      <DatePicker 
                        style={{ width: '100%' }} 
                        format="DD/MM/YYYY"
                        onChange={(date) => {
                          console.log('Deadline date changed:', date);
                          form.setFieldsValue({ deadline: date });
                        }}
                      />
                    </Col>
                    <Col span={8}>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Select time"
                        value={deadlineTime || null}
                        onChange={(time) => {
                          console.log('Deadline time changed:', time);
                          console.log('Deadline time format:', time ? time.format('HH:mm') : null);
                          setDeadlineTime(time);
                        }}
                        format="HH:mm"
                        allowClear={true}
                        showNow={false}
                        use12Hours={false}
                        hourFormat="24"
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
