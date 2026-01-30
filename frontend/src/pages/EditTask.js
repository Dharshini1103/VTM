import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Row, Col, DatePicker, Spin, Alert } from 'antd';
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

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [taskRes, usersRes] = await Promise.all([
          taskApi.getTaskById(taskId),
          userApi.getAllTeamMembers(),
        ]);
        console.log('Task response:', taskRes);
        console.log('Users response:', usersRes);
        
        const task = taskRes.data?.data;
        const users = usersRes.data?.data || [];
        
        console.log('Task data:', task);
        console.log('Users data:', users);
        
        if (!task) {
          setError('Task not found');
          return;
        }
        
        setUsers(users);
        form.setFieldsValue({
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          assignedToId: task.assignedToId,
          deadline: task.deadline ? dayjs(task.deadline) : null,
        });
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
      const payload = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
        assignedToId: values.assignedToId,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : null,
      };
      await taskApi.updateTask(taskId, payload);
      navigate(`/tasks/${taskId}`);
    } catch (err) {
      console.error('Error updating task:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || err.response?.data?.error || 'Error updating task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Edit Task</h1>

      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Card>
            {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}
            <Spin spinning={loading}>
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
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
                    Update Task
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

export default EditTask;
