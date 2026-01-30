import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Row, Col, DatePicker, Spin, Alert } from 'antd';
import taskApi from '../api/taskApi';
import userApi from '../api/userApi';

function CreateTask() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  React.useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await userApi.getAllTeamMembers();
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const taskData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
        deadline: values.deadline.format('YYYY-MM-DD'),
        assignedToId: values.assignedToId,
      };

      await taskApi.createTask(taskData);
      navigate('/tasks');
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Create New Task</h1>

      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Card>
            {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

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
                  initialValue="PENDING"
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
                  <DatePicker style={{ width: '100%' }} />
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
