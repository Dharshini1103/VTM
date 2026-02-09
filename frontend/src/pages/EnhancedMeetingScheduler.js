import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Form, Input, Select, Button, DatePicker, 
  Table, Space, Tag, message, Modal, Descriptions, Badge,
  Tooltip, Typography, Divider, Alert, Spin, Avatar, 
  Tabs, Timeline, Statistic, Progress, List, Calendar,
  Switch, Radio, Rate, Upload, Popconfirm
} from 'antd';
import { 
  CalendarOutlined, UserOutlined, MailOutlined, ClockCircleOutlined,
  VideoCameraOutlined, PhoneOutlined, TeamOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, SyncOutlined, GoogleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  PhoneFilled, VideoCameraFilled, UsergroupAddOutlined,
  ScheduleOutlined, HistoryOutlined, StarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import meetingApi from '../api/meetingApi';
import userApi from '../api/userApi';
import MeetingCalendar from '../components/MeetingCalendar';
import '../styles/EnhancedMeetingScheduler.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

function EnhancedMeetingScheduler() {
  const [form] = Form.useForm();
  const [callForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCallModalVisible, setIsCallModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [syncingCalendars, setSyncingCalendars] = useState(false);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
    calculateStats();
  }, []);

  const fetchMeetings = async () => {
    try {
      console.log('Fetching meetings...');
      const response = await meetingApi.getAllMeetings();
      console.log('Meetings response:', response);
      
      if (response.data) {
        if (response.data.success && response.data.data) {
          setMeetings(response.data.data);
          calculateStats();
        } else if (response.data.success && response.data.data === null) {
          setMeetings([]);
          calculateStats();
        } else if (!response.data.success && response.data.error) {
          setError(response.data.error);
        } else {
          console.warn('Unexpected response structure:', response.data);
          setMeetings([]);
        }
      } else {
        console.warn('No response data');
        setMeetings([]);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      let errorMessage = 'Failed to load meetings';
      if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Permission denied. You do not have access to view meetings.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userApi.getUsers();
      if (response.data && response.data.success && response.data.data) {
        setUsers(response.data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    }
  };

  const calculateStats = () => {
    const total = meetings.length;
    const upcoming = meetings.filter(m => m.status === 'SCHEDULED' && dayjs(m.startDateTime).isAfter(dayjs())).length;
    const completed = meetings.filter(m => m.status === 'COMPLETED').length;
    const cancelled = meetings.filter(m => m.status === 'CANCELLED').length;
    
    setStats({ total, upcoming, completed, cancelled });
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

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
      
      if (response.data?.data?.meetLink) {
        message.success({
          content: 'Google Meet link created!',
          description: (
            <div>
              <Text copyable>{response.data.data.meetLink}</Text>
            </div>
          ),
          duration: 10
        });
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

  const handleScheduleCall = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (values.startDateTime.isAfter(values.endDateTime)) {
        setError('Start time must be before end time');
        return;
      }

      if (values.startDateTime.isBefore(dayjs())) {
        setError('Call cannot be scheduled in the past');
        return;
      }

      const callData = {
        title: values.title || `Call with ${selectedUser.firstName} ${selectedUser.lastName}`,
        description: values.description || 'Individual call',
        meetingType: values.callType,
        startDateTime: values.startDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        endDateTime: values.endDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        attendeeIds: [selectedUser.id],
        teamIds: []
      };

      let response;
      if (values.callType === 'GOOGLE_MEET') {
        response = await meetingApi.scheduleGoogleMeet(callData);
      } else {
        response = await meetingApi.scheduleMeeting(callData);
      }

      setSuccess('Call scheduled successfully!');
      setIsCallModalVisible(false);
      callForm.resetFields();
      setSelectedUser(null);
      fetchMeetings();
      
      if (response.data?.data?.meetLink) {
        message.success({
          content: 'Call link created!',
          description: (
            <div>
              <Text copyable>{response.data.data.meetLink}</Text>
            </div>
          ),
          duration: 10
        });
      }
    } catch (err) {
      console.error('Call scheduling error:', err);
      let errorMessage = 'Failed to schedule call';
      
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
      setError('Failed to sync with Google Calendar');
    } finally {
      setSyncingCalendars(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    Modal.confirm({
      title: 'Delete Meeting',
      content: 'Are you sure you want to delete this meeting?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await meetingApi.deleteMeeting(meetingId);
          setSuccess('Meeting deleted successfully!');
          fetchMeetings();
        } catch (err) {
          setError('Failed to delete meeting');
        }
      }
    });
  };

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'GOOGLE_MEET': return <GoogleOutlined style={{ color: '#4285F4' }} />;
      case 'VIDEO_CALL': return <VideoCameraOutlined style={{ color: '#52c41a' }} />;
      case 'PHONE_CALL': return <PhoneOutlined style={{ color: '#1890ff' }} />;
      case 'IN_PERSON': return <TeamOutlined style={{ color: '#722ed1' }} />;
      default: return <CalendarOutlined />;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'SCHEDULED': { color: 'blue', text: 'Scheduled', icon: <ClockCircleOutlined /> },
      'IN_PROGRESS': { color: 'processing', text: 'In Progress', icon: <SyncOutlined spin /> },
      'COMPLETED': { color: 'success', text: 'Completed', icon: <CheckCircleOutlined /> },
      'CANCELLED': { color: 'error', text: 'Cancelled', icon: <CloseCircleOutlined /> }
    };
    
    const config = statusConfig[status] || statusConfig['SCHEDULED'];
    return <Badge status={config.color} text={config.text} />;
  };

  const teamMemberColumns = [
    {
      title: 'Team Member',
      key: 'member',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            {record.firstName?.charAt(0)}{record.lastName?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.firstName} {record.lastName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.email}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.jobTitle}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept || 'N/A'}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Schedule Video Call">
            <Button 
              type="primary" 
              size="small" 
              icon={<VideoCameraFilled />}
              onClick={() => {
                setSelectedUser(record);
                callForm.setFieldsValue({
                  callType: 'VIDEO_CALL',
                  title: `Video Call with ${record.firstName} ${record.lastName}`
                });
                setIsCallModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Schedule Phone Call">
            <Button 
              type="default" 
              size="small" 
              icon={<PhoneFilled />}
              onClick={() => {
                setSelectedUser(record);
                callForm.setFieldsValue({
                  callType: 'PHONE_CALL',
                  title: `Phone Call with ${record.firstName} ${record.lastName}`
                });
                setIsCallModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Schedule Google Meet">
            <Button 
              type="default" 
              size="small" 
              icon={<GoogleOutlined />}
              onClick={() => {
                setSelectedUser(record);
                callForm.setFieldsValue({
                  callType: 'GOOGLE_MEET',
                  title: `Google Meet with ${record.firstName} ${record.lastName}`
                });
                setIsCallModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const meetingColumns = [
    {
      title: 'Meeting',
      key: 'meeting',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            {getMeetingTypeIcon(record.meetingType)}
            <Text strong>{record.title}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
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
            <Avatar key={attendee.id} size="small" style={{ backgroundColor: '#1890ff' }}>
              {attendee.firstName?.charAt(0)}{attendee.lastName?.charAt(0)}
            </Avatar>
          ))}
          {record.attendees?.length > 3 && (
            <Avatar size="small">+{record.attendees.length - 3}</Avatar>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusBadge(record.status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.meetLink && (
            <Tooltip title="Join Meeting">
              <Button 
                type="primary" 
                size="small" 
                icon={<VideoCameraOutlined />}
                onClick={() => window.open(record.meetLink, '_blank')}
              />
            </Tooltip>
          )}
          {!record.googleCalendarEventId && (
            <Tooltip title="Sync with Google Calendar">
              <Button 
                type="default" 
                size="small" 
                icon={<SyncOutlined />}
                onClick={() => handleSyncWithGoogleCalendar(record.id)}
                loading={syncingCalendars}
              />
            </Tooltip>
          )}
          <Tooltip title="Delete Meeting">
            <Button 
              type="text" 
              danger
              size="small" 
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteMeeting(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="enhanced-meeting-scheduler">
      <div className="scheduler-header">
        <Title level={2} className="page-title">
          <CalendarOutlined /> Professional Meeting & Call Management
        </Title>
        
        <Row gutter={16} className="stats-row">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Meetings"
                value={stats.total}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Upcoming"
                value={stats.upcoming}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Team Members"
                value={users.length}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="meeting-tabs">
        <TabPane tab={<span><ScheduleOutlined /> Schedule Meeting</span>} key="schedule">
          <Card className="schedule-card">
            <Title level={4}>Schedule New Meeting</Title>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              className="meeting-form"
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Meeting Title"
                    name="title"
                    rules={[{ required: true, message: 'Please enter meeting title' }]}
                  >
                    <Input 
                      prefix={<CalendarOutlined />} 
                      placeholder="Enter meeting title"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Meeting Type"
                    name="meetingType"
                    rules={[{ required: true, message: 'Please select meeting type' }]}
                  >
                    <Select placeholder="Select meeting type" size="large">
                      <Option value="GOOGLE_MEET">
                        <Space><GoogleOutlined /> Google Meet</Space>
                      </Option>
                      <Option value="VIDEO_CALL">
                        <Space><VideoCameraOutlined /> Video Call</Space>
                      </Option>
                      <Option value="PHONE_CALL">
                        <Space><PhoneOutlined /> Phone Call</Space>
                      </Option>
                      <Option value="IN_PERSON">
                        <Space><TeamOutlined /> In Person</Space>
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Description"
                name="description"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Enter meeting description"
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Start Date & Time"
                    name="startDateTime"
                    rules={[{ required: true, message: 'Please select start time' }]}
                  >
                    <DatePicker 
                      showTime 
                      size="large"
                      style={{ width: '100%' }}
                      placeholder="Select start time"
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="End Date & Time"
                    name="endDateTime"
                    rules={[{ required: true, message: 'Please select end time' }]}
                  >
                    <DatePicker 
                      showTime 
                      size="large"
                      style={{ width: '100%' }}
                      placeholder="Select end time"
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
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
                  size="large"
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      <Space>
                        <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </Avatar>
                        {user.firstName} {user.lastName} ({user.email})
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                  icon={<PlusOutlined />}
                  block
                >
                  Schedule Meeting
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab={<span><TeamOutlined /> Team Members</span>} key="team">
          <Card>
            <Title level={4}>Team Members - Schedule Individual Calls</Title>
            <Table
              columns={teamMemberColumns}
              dataSource={users}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="team-table"
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><CalendarOutlined /> Calendar View</span>} key="calendar">
          <Card>
            <Title level={4}>Meeting Calendar</Title>
            <MeetingCalendar
              meetings={meetings}
              onDateSelect={(date, dateMeetings) => {
                console.log('Date selected:', date, dateMeetings);
              }}
              onMeetingClick={(meeting) => {
                console.log('Meeting clicked:', meeting);
                // You can add logic here to show meeting details or edit meeting
                message.info(`Meeting: ${meeting.title}`);
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><HistoryOutlined /> All Meetings</span>} key="meetings">
          <Card>
            <Title level={4}>All Meetings</Title>
            <Table
              columns={meetingColumns}
              dataSource={meetings}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="meetings-table"
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Individual Call Modal */}
      <Modal
        title={`Schedule Call with ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        open={isCallModalVisible}
        onCancel={() => {
          setIsCallModalVisible(false);
          setSelectedUser(null);
          callForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={callForm}
          layout="vertical"
          onFinish={handleScheduleCall}
          className="call-form"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Call Type"
                name="callType"
                rules={[{ required: true, message: 'Please select call type' }]}
              >
                <Radio.Group>
                  <Radio.Button value="VIDEO_CALL">
                    <VideoCameraOutlined /> Video Call
                  </Radio.Button>
                  <Radio.Button value="PHONE_CALL">
                    <PhoneOutlined /> Phone Call
                  </Radio.Button>
                  <Radio.Button value="GOOGLE_MEET">
                    <GoogleOutlined /> Google Meet
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Call Title"
            name="title"
            rules={[{ required: true, message: 'Please enter call title' }]}
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="Enter call title"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Enter call description"
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Start Time"
                name="startDateTime"
                rules={[{ required: true, message: 'Please select start time' }]}
              >
                <DatePicker 
                  showTime 
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="Select start time"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="End Time"
                name="endDateTime"
                rules={[{ required: true, message: 'Please select end time' }]}
              >
                <DatePicker 
                  showTime 
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="Select end time"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              icon={<ScheduleOutlined />}
              block
            >
              Schedule Call
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginTop: 16 }}
        />
      )}

      {success && (
        <Alert
          message="Success"
          description={success}
          type="success"
          showIcon
          closable
          onClose={() => setSuccess(null)}
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
}

export default EnhancedMeetingScheduler;
