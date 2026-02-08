import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Form, Input, Select, Button, DatePicker, Spin, Alert, 
  Space, Table, Tag, Modal, message, Row, Col, Divider, 
  Tooltip, Popconfirm, Typography, Badge, Timeline
} from 'antd';
import { 
  CalendarOutlined, VideoCameraOutlined, PhoneOutlined, 
  TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  GoogleOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, SyncOutlined, MailOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import meetingApi from '../api/meetingApi';
import userApi from '../api/userApi';
import { useSelector } from 'react-redux';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function MeetingScheduler() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [syncingCalendars, setSyncingCalendars] = useState(false);

  // Check if user has permission to schedule meetings
  const canScheduleMeetings = currentUser?.role === 'ADMIN' || 
                           currentUser?.role === 'SUPER_ADMIN' || 
                           currentUser?.role === 'MANAGER';

  useEffect(() => {
    if (!canScheduleMeetings) {
      setError('You do not have permission to schedule meetings. Only Admins, Super Admins, and Managers can schedule meetings.');
      return;
    }
    fetchMeetings();
    fetchUsers();
  }, [currentUser]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await meetingApi.getAllMeetings();
      setMeetings(response.data?.data || []);
    } catch (err) {
      setError('Failed to fetch meetings: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userApi.getAllTeamMembers();
      setUsers(response.data?.data || []);
      
      // Group users by department to create teams
      const groupedTeams = {};
      response.data?.data?.forEach(user => {
        const dept = user.department || 'General';
        if (!groupedTeams[dept]) {
          groupedTeams[dept] = [];
        }
        groupedTeams[dept].push(user);
      });
      setTeams(Object.entries(groupedTeams).map(([name, members]) => ({ name, members })));
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate date times
      if (values.startDateTime.isAfter(values.endDateTime)) {
        setError('Start time must be before end time');
        return;
      }

      if (values.startDateTime.isBefore(dayjs())) {
        setError('Meeting cannot be scheduled in the past');
        return;
      }

      const meetingData = {
        title: values.title,
        description: values.description,
        meetingType: values.meetingType,
        startDateTime: values.startDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        endDateTime: values.endDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        attendeeIds: values.attendees || [],
        teamIds: values.teamIds || []
      };

      let response;
      if (values.meetingType === 'GOOGLE_MEET') {
        response = await meetingApi.scheduleGoogleMeet(meetingData);
      } else {
        response = await meetingApi.scheduleMeeting(meetingData);
      }

      setSuccess('Meeting scheduled successfully!');
      setIsModalVisible(false);
      form.resetFields();
      fetchMeetings();
      
      // Show meet link if Google Meet
      if (response.data?.data?.meetLink) {
        message.success(`Google Meet link: ${response.data.data.meetLink}`, 10);
      }
    } catch (err) {
      console.error('Meeting scheduling error:', err);
      let errorMessage = 'Failed to schedule meeting';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWithGoogleCalendar = async (meetingId) => {
    try {
      setSyncingCalendars(true);
      const response = await meetingApi.syncWithGoogleCalendar(meetingId);
      setSuccess('Meeting synced with Google Calendar successfully!');
      fetchMeetings();
    } catch (err) {
      setError('Failed to sync with Google Calendar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncingCalendars(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      setLoading(true);
      await meetingApi.deleteMeeting(meetingId);
      setSuccess('Meeting deleted successfully!');
      fetchMeetings();
    } catch (err) {
      setError('Failed to delete meeting: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'GOOGLE_MEET': return <GoogleOutlined style={{ color: '#4285F4' }} />;
      case 'VIDEO_CALL': return <VideoCameraOutlined style={{ color: '#1976D2' }} />;
      case 'PHONE_CALL': return <PhoneOutlined style={{ color: '#388E3C' }} />;
      default: return <CalendarOutlined />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      case 'IN_PROGRESS': return 'orange';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Meeting',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <Space direction="vertical" size="small">
          <Space>
            {getMeetingTypeIcon(record.meetingType)}
            <Text strong>{title}</Text>
            <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
          </Space>
          {record.meetLink && (
            <Tooltip title="Click to copy meet link">
              <Button 
                type="link" 
                size="small" 
                icon={<VideoCameraOutlined />}
                onClick={() => navigator.clipboard.writeText(record.meetLink)}
              >
                Copy Meet Link
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Date & Time',
      key: 'dateTime',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>{dayjs(record.startDateTime).format('MMM DD, YYYY')}</Text>
          <Space>
            <ClockCircleOutlined />
            <Text>{dayjs(record.startDateTime).format('HH:mm')} - {dayjs(record.endDateTime).format('HH:mm')}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Attendees',
      key: 'attendees',
      render: (_, record) => (
        <Space wrap>
          {record.attendees?.slice(0, 3).map(attendee => (
            <Tag key={attendee.id} color="blue">
              {attendee.firstName} {attendee.lastName}
            </Tag>
          ))}
          {record.attendees?.length > 3 && (
            <Tag>+{record.attendees.length - 3} more</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Calendar Sync',
      key: 'sync',
      render: (_, record) => (
        <Space>
          {record.googleCalendarEventId ? (
            <Badge status="success" text="Synced" />
          ) : (
            <Tooltip title="Sync with Google Calendar">
              <Button 
                type="primary" 
                size="small" 
                icon={<SyncOutlined />}
                onClick={() => handleSyncWithGoogleCalendar(record.id)}
                loading={syncingCalendars}
              >
                Sync
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              setEditingMeeting(record);
              form.setFieldsValue({
                ...record,
                startDateTime: dayjs(record.startDateTime),
                endDateTime: dayjs(record.endDateTime),
                attendees: record.attendees?.map(a => a.id),
              });
              setIsModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this meeting?"
            onConfirm={() => handleDeleteMeeting(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
              loading={loading}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!canScheduleMeetings) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <ExclamationCircleOutlined style={{ fontSize: '64px', color: '#faad14', marginBottom: '20px' }} />
        <Title level={3}>Access Restricted</Title>
        <Paragraph>{error}</Paragraph>
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Meeting Scheduler</Title>
          <Text type="secondary">Schedule and manage team meetings with Google Calendar integration</Text>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingMeeting(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Schedule Meeting
        </Button>
      </div>

      {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}
      {success && <Alert message="Success" description={success} type="success" showIcon style={{ marginBottom: '20px' }} />}

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Scheduled Meetings">
            <Spin spinning={loading}>
              <Table 
                columns={columns} 
                dataSource={meetings} 
                rowKey="id"
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'No meetings scheduled yet' }}
              />
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Stats" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Total Meetings:</Text>
                <Text strong>{meetings.length}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Today:</Text>
                <Text strong>
                  {meetings.filter(m => dayjs(m.startDateTime).isSame(dayjs(), 'day')).length}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>This Week:</Text>
                <Text strong>
                  {meetings.filter(m => dayjs(m.startDateTime).isSame(dayjs(), 'week')).length}
                </Text>
              </div>
            </Space>
          </Card>

          <Card title="Upcoming Meetings">
            <Timeline>
              {meetings
                .filter(m => dayjs(m.startDateTime).isAfter(dayjs()))
                .sort((a, b) => dayjs(a.startDateTime).diff(dayjs(b.startDateTime)))
                .slice(0, 5)
                .map(meeting => (
                  <Timeline.Item key={meeting.id} dot={getMeetingTypeIcon(meeting.meetingType)}>
                    <div>
                      <Text strong>{meeting.title}</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(meeting.startDateTime).format('MMM DD, HH:mm')}
                      </Text>
                    </div>
                  </Timeline.Item>
                ))}
              {meetings.filter(m => dayjs(m.startDateTime).isAfter(dayjs())).length === 0 && (
                <Timeline.Item>
                  <Text type="secondary">No upcoming meetings</Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingMeeting(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Meeting Title"
                name="title"
                rules={[{ required: true, message: 'Please enter meeting title' }]}
              >
                <Input placeholder="Enter meeting title" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Meeting Type"
                name="meetingType"
                rules={[{ required: true, message: 'Please select meeting type' }]}
              >
                <Select placeholder="Select meeting type">
                  <Option value="GOOGLE_MEET">
                    <Space><GoogleOutlined /> Google Meet</Space>
                  </Option>
                  <Option value="VIDEO_CALL">
                    <Space><VideoCameraOutlined /> Video Call</Space>
                  </Option>
                  <Option value="PHONE_CALL">
                    <Space><PhoneOutlined /> Phone Call</Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} placeholder="Enter meeting description" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Start Date & Time"
                name="startDateTime"
                rules={[{ required: true, message: 'Please select start date and time' }]}
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="Select start date and time"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="End Date & Time"
                name="endDateTime"
                rules={[{ required: true, message: 'Please select end date and time' }]}
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="Select end date and time"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Attendees"
            name="attendees"
          >
            <Select
              mode="multiple"
              placeholder="Select attendees"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  <Space>
                    <MailOutlined />
                    {user.firstName} {user.lastName} ({user.email})
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MeetingScheduler;
