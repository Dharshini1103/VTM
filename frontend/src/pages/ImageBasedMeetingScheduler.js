import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Card, Row, Col, Form, Input, Select, Button, DatePicker, 
  Table, Space, Tag, message, Modal, Descriptions, Badge,
  Tooltip, Typography, Divider, Alert, Spin, Avatar, 
  Tabs, Timeline, Statistic, Progress, List, Calendar,
  Switch, Radio, Rate, Upload, Popconfirm, Dropdown,
  Menu, Checkbox, Collapse, Empty, Pagination
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { 
  CalendarOutlined, UserOutlined, MailOutlined, ClockCircleOutlined,
  VideoCameraOutlined, PhoneOutlined, TeamOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, SyncOutlined, GoogleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  PhoneFilled, VideoCameraFilled, UsergroupAddOutlined,
  ScheduleOutlined, HistoryOutlined, StarOutlined, SearchOutlined,
  FilterOutlined, MoreOutlined, SettingOutlined, BellOutlined,
  HomeOutlined, TeamOutlined as TeamIcon,
  MessageOutlined, QuestionCircleOutlined, LogoutOutlined, MenuOutlined,
  DownOutlined, UpOutlined, LeftOutlined, RightOutlined,
  DoubleRightOutlined, EnvironmentOutlined, GlobalOutlined,
  WifiOutlined, DesktopOutlined, MobileOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import meetingApi from '../api/meetingApi';
import userApi from '../api/userApi';
import ImageBasedCalendar from '../components/ImageBasedCalendar';
import ImageBasedTeamMembers from '../components/ImageBasedTeamMembers';
import '../styles/ImageBasedMeetingScheduler.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

function ImageBasedMeetingScheduler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [callForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCallModalVisible, setIsCallModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncingCalendars, setSyncingCalendars] = useState(false);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [calendarView, setCalendarView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(dayjs());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
    calculateStats();
  }, []);

  // Check for URL parameter to auto-open schedule meeting modal
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('schedule') === 'true') {
      setActiveTab('meetings');
      setIsModalVisible(true);
      // Clean up the URL
      navigate('/meetings', { replace: true });
    }
  }, [location.search, navigate]);

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
      setUsersLoading(true);
      const response = await userApi.getAllUsers();
      console.log('Users API response:', response);
      if (response.data && response.data.success && response.data.data) {
        console.log('Setting users:', response.data.data);
        setUsers(response.data.data);
      } else {
        console.log('No users found, setting empty array');
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('Calendar synced successfully!');
      fetchMeetings();
    } catch (error) {
      message.error('Failed to sync calendar');
    } finally {
      setSyncingCalendars(false);
    }
  };

  const handleCopyMeetLink = (meetLink) => {
    navigator.clipboard.writeText(meetLink).then(() => {
      message.success({
        content: 'Google Meet link copied!',
        description: 'Link is ready to share',
        duration: 2
      });
    }).catch(() => {
      message.error('Failed to copy link');
    });
  };

  const handleEditMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    form.setFieldsValue({
      title: meeting.title,
      description: meeting.description,
      meetingType: meeting.meetingType,
      startDateTime: dayjs(meeting.startDateTime),
      endDateTime: dayjs(meeting.endDateTime),
      attendees: meeting.attendees?.map(attendee => attendee.id) || [],
      teamIds: meeting.teamIds || []
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateMeeting = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (values.startDateTime.isAfter(values.endDateTime)) {
        setError('Start time must be before end time');
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
        response = await meetingApi.updateMeeting(selectedMeeting.id, meetingData);
      } else {
        response = await meetingApi.updateMeeting(selectedMeeting.id, meetingData);
      }

      setSuccess('Meeting updated successfully!');
      setIsEditModalVisible(false);
      setSelectedMeeting(null);
      form.resetFields();
      fetchMeetings();
      
      if (response.data?.data?.meetLink) {
        message.success({
          content: 'Google Meet link updated!',
          description: (
            <div>
              <Text copyable>{response.data.data.meetLink}</Text>
            </div>
          ),
          duration: 10
        });
      }
    } catch (err) {
      let errorMessage = 'Failed to update meeting';
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

  const handleDeleteMeeting = async (meetingId) => {
    try {
      setLoading(true);
      await meetingApi.deleteMeeting(meetingId);
      setSuccess('Meeting deleted successfully!');
      fetchMeetings();
    } catch (err) {
      let errorMessage = 'Failed to delete meeting';
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

  const getMeetingStatusBadge = (record) => {
    if (record.meetLink && (record.status === 'SCHEDULED' || record.status === 'IN_PROGRESS')) {
      return (
        <Space>
          <Badge status="processing" text="Active" />
          <Tag color="green" style={{ fontSize: '11px' }}>
            <GoogleOutlined style={{ marginRight: 4 }} />
            Google Meet Ready
          </Tag>
        </Space>
      );
    }
    return getStatusBadge(record.status);
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (meeting.description && meeting.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || meeting.meetingType === filterType;
    return matchesSearch && matchesFilter;
  });

  const teamMemberColumns = [
    {
      title: 'Team Member',
      key: 'member',
      render: (_, record) => (
        <Space>
          <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
            {record.firstName?.charAt(0)}{record.lastName?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>
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
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Badge status="success" text="Available" />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Schedule Google Meet">
            <Button 
              type="primary" 
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
          <MoreOutlined key="more" />
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
      render: (_, record) => getMeetingStatusBadge(record),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.meetLink && (
            <Space>
              <Tooltip title="Join Google Meet">
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<GoogleOutlined />}
                  onClick={() => {
                    message.success({
                      content: 'Joining Google Meet...',
                      description: 'Opening meeting link in new tab',
                      duration: 2
                    });
                    window.open(record.meetLink, '_blank');
                  }}
                >
                  Join Meet
                </Button>
              </Tooltip>
              <Tooltip title="Copy Google Meet Link">
                <Button 
                  type="default" 
                  size="small" 
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyMeetLink(record.meetLink)}
                />
              </Tooltip>
            </Space>
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
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => handleEditMeeting(record)}>
                  Edit Meeting
                </Menu.Item>
                <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => {
                  Modal.confirm({
                    title: 'Are you sure you want to delete this meeting?',
                    content: 'This action cannot be undone.',
                    okText: 'Delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    onOk: () => handleDeleteMeeting(record.id)
                  });
                }}>
                  Delete Meeting
                </Menu.Item>
              </Menu>
            }
          >
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'Dashboard' },
    { key: 'meetings', icon: <CalendarOutlined />, label: 'Meetings' },
    { key: 'team', icon: <TeamIcon />, label: 'Team Members' },
    { key: 'calendar', icon: <CalendarOutlined />, label: 'Calendar' },
  ];

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="image-based-meeting-scheduler">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            {!sidebarCollapsed && <span className="logo-text">MeetHub</span>}
          </div>
          <Button 
            type="text" 
            icon={<MenuOutlined />} 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="collapse-btn"
          />
        </div>
        
        <div className="sidebar-menu">
          {menuItems.map(item => (
            <div 
              key={item.key}
              className={`menu-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
              JD
            </Avatar>
            {!sidebarCollapsed && (
              <div className="user-info">
                <div className="user-name">John Doe</div>
                <div className="user-role">Admin</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <Title level={3} className="page-title">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'meetings' && 'Meetings'}
              {activeTab === 'team' && 'Team Members'}
              {activeTab === 'calendar' && 'Calendar'}
            </Title>
          </div>
          
          <div className="header-right">
            <Space>
              <Input
                placeholder="Search meetings..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 250 }}
              />
              <Button icon={<BellOutlined />} />
              <Dropdown overlay={userMenu} placement="bottomRight">
                <Avatar style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}>
                  JD
                </Avatar>
              </Dropdown>
            </Space>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {activeTab === 'dashboard' && (
            <div className="dashboard-content">
              {/* Stats Cards */}
              <Row gutter={[16, 16]} className="stats-row">
                <Col xs={24} sm={12} md={6}>
                  <Card className="stat-card">
                    <div className="stat-content">
                      <div className="stat-icon">
                        <CalendarOutlined />
                      </div>
                      <div className="stat-info">
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Total Meetings</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card className="stat-card">
                    <div className="stat-content">
                      <div className="stat-icon upcoming">
                        <ClockCircleOutlined />
                      </div>
                      <div className="stat-info">
                        <div className="stat-number">{stats.upcoming}</div>
                        <div className="stat-label">Upcoming</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card className="stat-card">
                    <div className="stat-content">
                      <div className="stat-icon completed">
                        <CheckCircleOutlined />
                      </div>
                      <div className="stat-info">
                        <div className="stat-number">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card className="stat-card">
                    <div className="stat-content">
                      <div className="stat-icon">
                        <TeamIcon />
                      </div>
                      <div className="stat-info">
                        <div className="stat-number">{users.length}</div>
                        <div className="stat-label">Team Members</div>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Recent Meetings */}
              <Card title="Recent Meetings" className="recent-meetings">
                <Table
                  columns={meetingColumns}
                  dataSource={filteredMeetings.slice(0, 5)}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="meetings-content">
              <Card>
                <div className="meetings-header">
                  <div className="meetings-title">
                    <Title level={4}>All Meetings</Title>
                  </div>
                  <div className="meetings-actions">
                    <Space>
                      <Select
                        value={filterType}
                        onChange={setFilterType}
                        style={{ width: 150 }}
                      >
                        <Option value="all">All Types</Option>
                        <Option value="GOOGLE_MEET">Google Meet</Option>
                        <Option value="VIDEO_CALL">Video Call</Option>
                        <Option value="PHONE_CALL">Phone Call</Option>
                        <Option value="IN_PERSON">In Person</Option>
                      </Select>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                      >
                        Schedule Meeting
                      </Button>
                    </Space>
                  </div>
                </div>
                
                <Table
                  columns={meetingColumns}
                  dataSource={filteredMeetings}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="team-content">
              <ImageBasedTeamMembers
                users={users}
                onScheduleCall={(callData) => {
                  console.log('Call scheduled:', callData);
                  fetchMeetings(); // Refresh meetings after scheduling a call
                  message.success('Meeting added to calendar and dashboard!');
                }}
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="calendar-content">
              <ImageBasedCalendar
                meetings={meetings}
                onDateSelect={(date, dateMeetings) => {
                  console.log('Date selected:', date, dateMeetings);
                }}
                onMeetingClick={(meeting) => {
                  console.log('Meeting clicked:', meeting);
                  message.info(`Meeting: ${meeting.title}`);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <Modal
        title="Schedule New Meeting"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="meeting-form"
        >
          <Row gutter={16}>
            <Col span={24}>
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
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Meeting Type"
                name="meetingType"
                rules={[{ required: true, message: 'Please select meeting type' }]}
              >
                <Select placeholder="Select meeting type" size="large">
                  <Option value="GOOGLE_MEET">
                    <Space><GoogleOutlined /> Google Meet</Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Duration"
                name="duration"
              >
                <Select placeholder="Select duration" size="large">
                  <Option value="30">30 minutes</Option>
                  <Option value="60">1 hour</Option>
                  <Option value="90">1.5 hours</Option>
                  <Option value="120">2 hours</Option>
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
            <Col span={12}>
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
            <Col span={12}>
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
            label={
              <Space>
                <span>Attendees</span>
                <Tag color="blue" style={{ fontSize: '11px' }}>
                  {users.length} team members
                </Tag>
              </Space>
            }
            name="attendees"
            rules={[{ required: false, message: 'Please select at least one attendee' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select attendees (all team members)"
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
                    <UserOutlined style={{ fontSize: '24px', color: '#ccc' }} />
                    <div style={{ marginTop: '8px', color: '#999' }}>
                      No team members found
                    </div>
                  </div>
                )
              }
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {user.email}
                      </div>
                      {user.jobTitle && (
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {user.jobTitle}
                        </div>
                      )}
                    </div>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                icon={<ScheduleOutlined />}
              >
                Schedule Meeting
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
          <Form.Item
            label="Call Type"
            name="callType"
            rules={[{ required: true, message: 'Please select call type' }]}
          >
            <Radio.Group>
              <Radio.Button value="GOOGLE_MEET">
                <GoogleOutlined /> Google Meet
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

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
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                icon={<ScheduleOutlined />}
              >
                Schedule Call
              </Button>
              <Button onClick={() => setIsCallModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Meeting Modal */}
      <Modal
        title="Edit Meeting"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedMeeting(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        className="meeting-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateMeeting}
          className="meeting-form"
        >
          <Form.Item
            label="Meeting Title"
            name="title"
            rules={[{ required: true, message: 'Please enter meeting title' }]}
          >
            <Input 
              size="large"
              placeholder="Enter meeting title"
              showCount
              maxLength={100}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Meeting Type"
                name="meetingType"
                rules={[{ required: true, message: 'Please select meeting type' }]}
              >
                <Select placeholder="Select meeting type" size="large">
                  <Option value="GOOGLE_MEET">
                    <Space><GoogleOutlined /> Google Meet</Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Duration"
                name="duration"
              >
                <Select placeholder="Select duration" size="large">
                  <Option value="30">30 minutes</Option>
                  <Option value="60">1 hour</Option>
                  <Option value="90">1.5 hours</Option>
                  <Option value="120">2 hours</Option>
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
            <Col span={12}>
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
            <Col span={12}>
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
            label={
              <Space>
                <span>Attendees</span>
                <Tag color="blue" style={{ fontSize: '11px' }}>
                  {users.length} team members
                </Tag>
              </Space>
            }
            name="attendees"
            rules={[{ required: false, message: 'Please select at least one attendee' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select attendees (all team members)"
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
                    <UserOutlined style={{ fontSize: '24px', color: '#ccc' }} />
                    <div style={{ marginTop: '8px', color: '#999' }}>
                      No team members found
                    </div>
                  </div>
                )
              }
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {user.email}
                      </div>
                      {user.jobTitle && (
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {user.jobTitle}
                        </div>
                      )}
                    </div>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
              >
                Update Meeting
              </Button>
              <Button onClick={() => setIsEditModalVisible(false)}>
                Cancel
              </Button>
            </Space>
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
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}
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
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}
        />
      )}
    </div>
  );
}

export default ImageBasedMeetingScheduler;
