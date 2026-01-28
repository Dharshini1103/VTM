import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, DatePicker, Spin, Alert } from 'antd';
import dayjs from 'dayjs';
import meetingApi from '../api/meetingApi';
import taskApi from '../api/taskApi';
import userApi from '../api/userApi';

function ScheduleMeeting() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        taskApi.getUserTasks(),
        userApi.getAllTeamMembers(),
      ]);
      setTasks(tasksRes.data.data || []);
      setUsers(usersRes.data.data || []);

      // Pre-fill task if taskId in URL params
      const taskId = searchParams.get('taskId');
      if (taskId) {
        form.setFieldValue('taskId', parseInt(taskId));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);

      const meetingData = {
        taskId: values.taskId,
        callType: values.callType,
        scheduledDateTime: values.scheduledDateTime.toISOString(),
        meetingTitle: values.meetingTitle,
        description: values.description,
      };

      let response;
      if (values.callType === 'GOOGLE_MEET') {
        response = await meetingApi.scheduleGoogleMeet(meetingData);
      } else {
        response = await meetingApi.scheduleCall(meetingData);
      }

      navigate('/tasks');
    } catch (err) {
      setError(err.response?.data?.error || 'Error scheduling meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Schedule Call/Meeting</h1>

      <Card style={{ maxWidth: '800px' }}>
        {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              label="Select Task"
              name="taskId"
              rules={[{ required: true, message: 'Please select a task' }]}
            >
              <Select placeholder="Select task">
                {tasks.map(task => (
                  <Select.Option key={task.id} value={task.id}>
                    {task.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Call Type"
              name="callType"
              rules={[{ required: true, message: 'Please select call type' }]}
            >
              <Select placeholder="Select call type">
                <Select.Option value="GOOGLE_MEET">Google Meet</Select.Option>
                <Select.Option value="ZOOM_CALL">Zoom Call</Select.Option>
                <Select.Option value="PHONE_CALL">Phone Call</Select.Option>
                <Select.Option value="TEAMS_CALL">Teams Call</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Meeting Title"
              name="meetingTitle"
              rules={[{ required: true, message: 'Please enter meeting title' }]}
            >
              <Input placeholder="Enter meeting title" />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
            >
              <Input.TextArea rows={3} placeholder="Enter meeting description" />
            </Form.Item>

            <Form.Item
              label="Scheduled Date & Time"
              name="scheduledDateTime"
              rules={[{ required: true, message: 'Please select date and time' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Schedule Meeting
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}

export default ScheduleMeeting;
