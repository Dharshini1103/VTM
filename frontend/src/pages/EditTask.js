import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Row, Col, DatePicker, TimePicker, Spin, Alert, Avatar, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import taskApi from '../api/taskApi';
import userApi from '../api/userApi';

function EditTask() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [deadlineTime, setDeadlineTime] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        console.log('Loading task with ID:', taskId);
        
        // First try to get task data
        let taskRes;
        try {
          taskRes = await taskApi.getTaskById(taskId);
          console.log('Task response:', taskRes);
          console.log('Task response status:', taskRes.status);
          console.log('Task response data:', taskRes.data);
        } catch (taskError) {
          console.error('Error fetching task:', taskError);
          console.error('Task error response:', taskError.response);
          setError(`Failed to load task: ${taskError.response?.data?.message || taskError.message}`);
          return;
        }
        
        // Then try to get users - use the same method as meeting scheduler
        let usersRes;
        try {
          console.log('Fetching all users (same as meeting scheduler)...');
          usersRes = await userApi.getAllUsers();
          console.log('Users response:', usersRes);
          console.log('Users response status:', usersRes.status);
          console.log('Users response data:', usersRes.data);
        } catch (usersError) {
          console.error('Error fetching users with getAllUsers:', usersError);
          console.error('Users error response:', usersError.response);
          console.error('Users error status:', usersError.response?.status);
          console.error('Users error data:', usersError.response?.data);
          
          // Try getAllTeamMembers as fallback (same as meeting scheduler)
          try {
            console.log('Trying getAllTeamMembers as fallback...');
            usersRes = await userApi.getAllTeamMembers();
            console.log('Team members response:', usersRes);
          } catch (teamError) {
            console.error('Error fetching team members too:', teamError);
            console.error('Team error response:', teamError.response);
            // Continue with empty users if this fails
            usersRes = { data: { data: [] } };
          }
        }
        
        // Try different ways to extract task data
        let task = null;
        if (taskRes.data?.data) {
          task = taskRes.data.data;
          console.log('Using taskRes.data.data');
        } else if (taskRes.data) {
          task = taskRes.data;
          console.log('Using taskRes.data');
        } else if (taskRes) {
          task = taskRes;
          console.log('Using taskRes directly');
        }
        
        // Use the same data extraction logic as meeting scheduler for users
        let users = [];
        if (usersRes.data && usersRes.data.success && usersRes.data.data) {
          console.log('Using meeting scheduler data extraction logic for users');
          users = usersRes.data.data;
        } else if (usersRes.data && usersRes.data.data) {
          console.log('Using direct data.data extraction for users');
          users = usersRes.data.data;
        } else if (usersRes.data) {
          console.log('Using direct data extraction for users');
          users = usersRes.data;
        } else if (Array.isArray(usersRes)) {
          console.log('Using direct array for users');
          users = usersRes;
        } else {
          console.log('No users found, trying getAllTeamMembers as fallback...');
          // Try fallback method
          try {
            const teamResponse = await userApi.getAllTeamMembers();
            console.log('Team members fallback response:', teamResponse);
            if (teamResponse.data && teamResponse.data.data) {
              users = teamResponse.data.data;
              console.log('Using team members fallback');
            }
          } catch (teamError) {
            console.error('Team members fallback failed:', teamError);
          }
        }
        
        console.log('Final extracted users:', users);
        console.log('Users array length:', users.length);
        
        // Debug: Show first few users if available
        if (users.length > 0) {
          console.log('First user:', users[0]);
          console.log('Sample users:', users.slice(0, 3));
        } else {
          console.log('No users found - checking response structure');
          console.log('Full usersRes:', JSON.stringify(usersRes, null, 2));
        }
        
        console.log('Final extracted task:', task);
        console.log('Final extracted users:', users);
        
        if (!task) {
          console.error('Task not found for ID:', taskId);
          setError('Task not found');
          return;
        }
        
        console.log('Setting form values for task:', task);
        setUsers(users);
        
        // Ensure task data exists before setting form values
        if (task && typeof task === 'object') {
          console.log('📝 Setting form values with actual task data:', task);
          
          const formValues = {
            title: task.title || '',
            description: task.description || '',
            priority: task.priority || 'MEDIUM',
            status: task.status || 'PENDING',
            assignedToId: task.assignedToId || undefined,
            deadline: task.deadline ? dayjs(task.deadline) : null,
          };
          
          console.log('📋 Form values to be set:', formValues);
          form.setFieldsValue(formValues);
          console.log('✅ Form values set successfully with original task data');
        } else {
          console.error('❌ Invalid task data:', task);
          setError('Invalid task data received');
        }
        
        // Set time if task has deadlineTime (new backend field)
        if (task.deadlineTime) {
          console.log('Setting deadline time:', task.deadlineTime);
          // Parse the time string more reliably
          const timeParts = task.deadlineTime.split(':');
          const hours = parseInt(timeParts[0]) || 0;
          const minutes = parseInt(timeParts[1]) || 0;
          const timeValue = dayjs().hour(hours).minute(minutes).second(0).millisecond(0);
          console.log('Parsed time value:', timeValue.format('HH:mm'));
          setDeadlineTime(timeValue);
        }
        
        console.log('✅ Task data loaded successfully into form');
        console.log('✅ Ready for user to edit task details');
        
      } catch (err) {
        console.error('Error loading task:', err);
        console.error('Error details:', err.response?.data);
        setError(err.response?.data?.message || err.response?.data?.error || 'Error loading task');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [taskId]);

  const onFinish = async (values) => {
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Edit task form values:', values);
      console.log('Task ID being updated:', taskId);
      console.log('Selected deadline time:', deadlineTime);
      
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
      
      console.log('Final deadline value:', deadline);
      console.log('Final deadlineTime value:', deadlineTimeValue);
      
      const payload = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
        assignedToId: values.assignedToId,
        deadline: deadline,
        deadlineTime: deadlineTimeValue,
      };
      
      console.log('Payload being sent:', payload);
      console.log('Making API call to update task...');
      
      await taskApi.updateTask(taskId, payload);
      navigate(`/tasks/${taskId}`);
    } catch (err) {
      console.error('Error updating task:', err);
      console.error('Error response:', err.response);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Error updating task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Edit Task</h1>
        <p className="page-subtitle">Update task details and save changes</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card className="animate-slide-in-right">
            {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 'var(--space-5)' }} />}
            <Spin spinning={loading}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px' }}>Loading task data...</div>
                </div>
              ) : (
                <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item label="Task Title" name="title" rules={[{ required: true, message: 'Please enter task title' }, { min: 3, message: 'Title must be at least 3 characters' }]}>
                  <Input placeholder="Enter task title" />
                </Form.Item>

                <Form.Item label="Description" name="description">
                  <Input.TextArea rows={4} placeholder="Enter task description" />
                </Form.Item>

                <Form.Item label="Priority" name="priority" rules={[{ required: true, message: 'Please select priority' }]}> 
                <Select placeholder="Select priority">
                <Select.Option value="LOW">Low</Select.Option>
                <Select.Option value="MEDIUM">Medium</Select.Option>
                <Select.Option value="HIGH">High</Select.Option>
                <Select.Option value="URGENT">Urgent</Select.Option>
                </Select>
                </Form.Item>
                
                <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Please select status' }]}>
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
                      loading={loading}
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      size="large"
                      notFoundContent={
                        loading ? (
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

                <Form.Item label="Deadline" name="deadline" rules={[{ required: true, message: 'Please select deadline' }]}>
                  <Row gutter={8}>
                    <Col span={16}>
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Col>
                    <Col span={8}>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Select time"
                        value={deadlineTime || null}
                        onChange={(time) => {
                          console.log('Edit form deadline time changed:', time);
                          console.log('Edit form deadline time format:', time ? time.format('HH:mm') : null);
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
                  <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ 
                    color: '#1890ff',
                    backgroundColor: 'transparent',
                    border: '1px solid #1890ff',
                    fontWeight: '600'
                  }}>
                    Update Task
                  </Button>
                </Form.Item>
              </Form>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default EditTask;
