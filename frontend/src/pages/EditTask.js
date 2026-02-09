import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Row, Col, DatePicker, TimePicker, Spin, Alert } from 'antd';
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
        
        const [taskRes, usersRes] = await Promise.all([
          taskApi.getTaskById(taskId),
          userApi.getAllTeamMembers(),
        ]);
        
        console.log('Task response:', taskRes);
        console.log('Task response data:', taskRes.data);
        console.log('Task response structure:', JSON.stringify(taskRes, null, 2));
        
        const task = taskRes.data?.data || taskRes.data || taskRes;
        const users = usersRes.data?.data || usersRes.data || [];
        
        console.log('Extracted task:', task);
        console.log('Extracted users:', users);
        
        if (!task) {
          console.error('Task not found for ID:', taskId);
          setError('Task not found');
          return;
        }
        
        console.log('Setting form values for task:', task);
        setUsers(users);
        
        // Ensure task data exists before setting form values
        if (task && typeof task === 'object') {
          form.setFieldsValue({
            title: task.title || '',
            description: task.description || '',
            priority: task.priority || 'MEDIUM',
            status: task.status || 'PENDING',
            assignedToId: task.assignedToId || undefined,
            deadline: task.deadline ? dayjs(task.deadline) : null,
          });
          console.log('Form values set successfully');
        } else {
          console.error('Invalid task data:', task);
          setError('Invalid task data received');
        }
        
        // Set time if task has deadlineTime (new backend field)
        if (task.deadlineTime) {
          console.log('Setting deadline time:', task.deadlineTime);
          setDeadlineTime(dayjs(`2023-01-01T${task.deadlineTime}`));
        }
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

                <Form.Item label="Assign To" name="assignedToId" rules={[{ required: true, message: 'Please select a team member' }]}>
                  <Select placeholder="Select team member" showSearch optionFilterProp="children">
                    {users.map((user) => (
                      <Select.Option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
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
                        value={deadlineTime}
                        onChange={(time) => setDeadlineTime(time)}
                        format="HH:mm"
                      />
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
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
