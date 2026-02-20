import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card, Row, Col, Form, Input, Select, Button, DatePicker,
  Table, Space, Tag, message, Modal, Descriptions, Badge,
  Tooltip, Typography, Divider, Alert, Spin, Avatar,
  Tabs, Timeline, Statistic, Progress, List, Calendar,
  Switch, Radio, Rate, Upload, Popconfirm, Dropdown,
  Menu, Checkbox, Collapse, Empty, Pagination
} from 'antd';
import {
  CalendarOutlined, UserOutlined, MailOutlined, ClockCircleOutlined,
  VideoCameraOutlined, PhoneOutlined, TeamOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, SyncOutlined, VideoCameraFilled,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  EyeOutlined, SearchOutlined, BellOutlined, MenuOutlined,
  SettingOutlined, LogoutOutlined, CopyOutlined, HomeOutlined,
  FilterOutlined, MoreOutlined, MessageOutlined, QuestionCircleOutlined,
  DownOutlined, UpOutlined, LeftOutlined, RightOutlined,
  DoubleRightOutlined, EnvironmentOutlined, GlobalOutlined,
  WifiOutlined, DesktopOutlined, MobileOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import meetingApi from '../api/meetingApi';
import userApi from '../api/userApi';
import storageManager from '../utils/storageManager';
import authGuard from '../utils/authGuard';
import '../styles/ImageBasedMeetingScheduler.css';

const TeamIcon = TeamOutlined;

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

function ImageBasedMeetingScheduler() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current user from Redux state
  const currentUser = useSelector((state) => state.auth.user);
  const userRole = currentUser?.role || 'USER';

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCallModalVisible, setIsCallModalVisible] = useState(false);
  const [calendarMeetingModalVisible, setCalendarMeetingModalVisible] = useState(false);
  const [calendarListModalVisible, setCalendarListModalVisible] = useState(false);
  const [selectedDateMeetings, setSelectedDateMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [prefilledTitle, setPrefilledTitle] = useState(null);
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
    console.log('=== MEETING PAGE MOUNT ===');
    console.log('Token exists:', !!storageManager.getAuthToken());
    console.log('Is authenticated:', storageManager.isAuthenticated());

    fetchMeetings();
    fetchUsers();
  }, []);

  // Update stats whenever meetings change
  useEffect(() => {
    calculateStats();
  }, [meetings]);

  // Handle URL parameters for pre-filled meeting title from task navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const taskTitle = searchParams.get('taskTitle');
    const openModal = searchParams.get('openModal');

    if (taskTitle) {
      setPrefilledTitle(taskTitle);
      console.log('Pre-filled title from task:', taskTitle);
    }

    if (openModal === 'true' && taskTitle) {
      // Navigate to meetings tab and open modal with pre-filled title
      setActiveTab('meetings');
      setTimeout(() => {
        setIsModalVisible(true);
      }, 100);
    }
  }, [location]);

  const fetchMeetings = async () => {
    try {
      setError(null);
      setLoading(true);

      // Check authentication first
      if (!authGuard.isAuthenticated()) {
        setError('Please log in to view meetings');
        authGuard.forceLogout();
        return;
      }

      console.log('User authenticated, fetching meetings...');

      // Use different endpoints based on user role
      let response;
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        // Admins and Super Admins can see all meetings
        response = await meetingApi.getAllMeetings();
      } else {
        // Managers and Users can only see their own meetings
        response = await meetingApi.getMyMeetings();
      }

      console.log('Meetings response:', response);

      if (response && response.data) {
        if (response.data.success && response.data.data) {
          console.log('=== MEETINGS RESPONSE DEBUG ===');
          console.log('Meetings received:', response.data.data);
          console.log('First meeting meetLink:', response.data.data[0]?.meetLink);
          console.log('All meetLinks:', response.data.data.map(m => ({ id: m.id, title: m.title, meetLink: m.meetLink })));
          console.log('============================');

          setMeetings(response.data.data);
          calculateStats();
        } else if (response.data.success && response.data.data === null) {
          console.log('No meetings found');
          setMeetings([]);
          calculateStats();
        } else if (!response.data.success) {
          const errorMessage = response.data.error || 'Failed to fetch meetings';
          console.error('API Error:', errorMessage);
          setError(errorMessage);
        }
      } else {
        console.warn('Unexpected response structure:', response);
        setMeetings([]);
        calculateStats();
      }
    } catch (err) {
      console.error('=== FETCH MEETINGS ERROR ===');
      console.error('Error:', err);
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);

      let errorMessage = 'Failed to fetch meetings';

      if (err.response?.status === 401) {
        errorMessage = 'Authentication expired - please login again';
        authGuard.forceLogout();
      } else if (err.response?.status === 403) {
        errorMessage = 'Permission denied - insufficient access';
      } else if (err.response?.status === 404) {
        errorMessage = 'Meetings service not found';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error - please try again later';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error - check your connection';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('=== FETCH USERS START ===');
      const token = storageManager.getAuthToken();

      if (!token) {
        console.log('No token found - redirecting to login');
        authGuard.forceLogout();
        return;
      }

      setUsersLoading(true);
      const response = await userApi.getAllTeamMembers();
      console.log('Users API response:', response);

      if (response.data && response.data.success && response.data.data) {
        setUsers(response.data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('=== FETCH USERS ERROR ===');
      setError('Failed to fetch team members');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const calculateStats = () => {
    console.log('=== CALCULATE STATS DEBUG ===');
    console.log('Current meetings array:', meetings);
    console.log('Meetings length:', meetings.length);

    const total = meetings.length;
    const now = dayjs();

    const upcoming = meetings.filter(m => {
      const isUpcoming = (m.status === 'SCHEDULED' || m.status === 'UPCOMING' || !m.status) &&
        dayjs(m.startDateTime).isAfter(now);
      return isUpcoming;
    }).length;

    const completed = meetings.filter(m =>
      m.status === 'COMPLETED' || m.status === 'DONE'
    ).length;

    const cancelled = meetings.filter(m =>
      m.status === 'CANCELLED' || m.status === 'CANCELED'
    ).length;

    console.log('Calculated stats:', { total, upcoming, completed, cancelled });
    console.log('============================');

    setStats({ total, upcoming, completed, cancelled });
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const meetingData = {
        title: values.title,
        description: values.description,
        meetingType: values.meetingType,
        startDateTime: values.startDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        endDateTime: values.endDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        attendeeIds: values.attendees || [],
        meetLink: 'https://us05web.zoom.us/j/8024876500?pwd=RRqLJvROlv8YY1UVd3dCtylBw4F2o0.1'
      };

      const response = await meetingApi.scheduleMeeting(meetingData);
      setSuccess('Meeting scheduled successfully!');
      setIsModalVisible(false);
      form.resetFields();
      fetchMeetings();
    } catch (err) {
      setError('Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const onEditFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const meetingData = {
        title: values.title,
        description: values.description,
        meetingType: values.meetingType,
        startDateTime: values.startDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        endDateTime: values.endDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        attendeeIds: values.attendees || [],
      };

      const response = await meetingApi.updateMeeting(selectedMeeting.id, meetingData);
      setSuccess('Meeting updated successfully!');
      setIsEditModalVisible(false);
      setSelectedMeeting(null);
      fetchMeetings();
    } catch (err) {
      console.error('Update meeting error:', err);
      setError('Failed to update meeting');
    } finally {
      setLoading(false);
    }
  };

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'ZOOM_MEET': return <VideoCameraFilled style={{ color: '#3b82f6', fontSize: '16px' }} />;
      case 'VIDEO_CALL': return <VideoCameraOutlined style={{ color: '#10b981', fontSize: '16px' }} />;
      case 'PHONE_CALL': return <PhoneOutlined style={{ color: '#f59e0b', fontSize: '16px' }} />;
      case 'IN_PERSON': return <TeamOutlined style={{ color: '#8b5cf6', fontSize: '16px' }} />;
      default: return <CalendarOutlined style={{ color: '#94a3b8', fontSize: '16px' }} />;
    }
  };

  const getMeetingStatusBadge = (record) => {
    if (record.meetLink && (record.status === 'SCHEDULED' || record.status === 'IN_PROGRESS')) {
      return (
        <Space>
          <Badge status="processing" text={<span style={{ color: 'var(--primary-color)' }}>Active</span>} />
          {!record.canJoin && (
            <Tag style={{ borderRadius: '12px', fontSize: '10px' }}>Guest</Tag>
          )}
        </Space>
      );
    }

    switch (record.status) {
      case 'SCHEDULED':
        return <Badge status="default" text="Scheduled" />;
      case 'IN_PROGRESS':
        return <Badge status="processing" text={<span style={{ color: 'var(--primary-color)' }}>In Progress</span>} />;
      case 'COMPLETED':
        return <Badge status="success" text={<span style={{ color: 'var(--success-color)' }}>Completed</span>} />;
      case 'CANCELLED':
        return <Badge status="error" text={<span style={{ color: 'var(--danger-color)' }}>Cancelled</span>} />;
      default:
        return <Badge status="default" text="Unknown" />;
    }
  };

  const handleEditMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setIsEditModalVisible(true);
  };

  const handleCancelMeeting = async (meeting) => {
    try {
      await meetingApi.deleteMeeting(meeting.id);
      setSuccess('Meeting cancelled successfully');
      fetchMeetings();
    } catch (err) {
      console.error('Cancel meeting error:', err);
      setError('Failed to cancel meeting');
    }
  };

  const handleCopyMeetLink = (meetLink) => {
    navigator.clipboard.writeText(meetLink).then(() => {
      message.success('Meeting link copied to clipboard!');
    }).catch(() => {
      message.error('Failed to copy link');
    });
  };

  const handleScheduleWithMember = (member) => {
    // Pre-fill the schedule meeting form with the selected member
    form.setFieldsValue({
      attendees: [member.id]
    });
    setIsModalVisible(true);
    message.info(`Scheduling meeting with ${member.firstName} ${member.lastName}`);
  };

  const handleViewProfile = (member) => {
    message.info(`Viewing profile for ${member.firstName} ${member.lastName}`);
    // You can add more profile viewing logic here
  };

  const handleDeactivateUser = async (user) => {
    try {
      const response = await userApi.deactivateUser(user.id);
      setSuccess(`User ${user.firstName} ${user.lastName} deactivated successfully`);
      fetchUsers(); // Refresh the users list
    } catch (err) {
      console.error('Deactivate user error:', err);
      setError('Failed to deactivate user');
    }
  };

  const canDeactivateUser = (targetUser) => {
    // Admin can deactivate Users and Managers, but not Super Admins
    if (userRole === 'ADMIN') {
      return targetUser.role !== 'SUPER_ADMIN';
    }
    // Super Admin can deactivate anyone except themselves
    if (userRole === 'SUPER_ADMIN') {
      return targetUser.id !== currentUser?.id;
    }
    // Other roles cannot deactivate anyone
    return false;
  };

  const handleScheduleCallFromTask = (taskTitle) => {
    // Navigate to meetings page with pre-filled title and open modal
    navigate(`/meetings?taskTitle=${encodeURIComponent(taskTitle)}&openModal=true`);
  };

  // Calendar cell rendering functions
  const dateCellRender = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayMeetings = meetings.filter(meeting => {
      const meetingDate = dayjs(meeting.startDateTime).format('YYYY-MM-DD');
      return meetingDate === dateStr;
    });

    return (
      <div className={`date-cell ${dayMeetings.length > 0 ? 'has-meetings' : ''}`} style={{
        position: 'relative',
        height: '100%',
        padding: '4px',
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: dayMeetings.length > 0 ? 'var(--primary-color)' : 'var(--text-light)',
          marginBottom: '4px'
        }}>
          {date.date()}
        </div>

        {dayMeetings.length > 0 && (
          <div style={{ maxHeight: '60px', overflowY: 'auto' }}>
            {dayMeetings.slice(0, 3).map((meeting, index) => (
              <div
                key={meeting.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCalendarMeetingClick(meeting);
                }}
                className="calendar-event-pill"
                style={{
                  backgroundColor: 'var(--primary-light)',
                  borderLeft: '2px solid var(--primary-color)',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  marginBottom: '2px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  color: 'var(--primary-700)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis'
                }}
                title={`${meeting.title} - ${dayjs(meeting.startDateTime).format('hh:mm A')}`}
              >
                {meeting.title}
              </div>
            ))}

            {dayMeetings.length > 3 && (
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '9px',
                  textAlign: 'center',
                  marginTop: '2px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewMoreMeetings(dateStr);
                }}
              >
                +{dayMeetings.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const monthCellRender = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const monthMeetings = meetings.filter(meeting => {
      const meetingDate = dayjs(meeting.startDateTime).format('YYYY-MM-DD');
      return meetingDate === dateStr;
    });

    if (monthMeetings.length > 0) {
      return (
        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 'bold',
            }}
            title={`${monthMeetings.length} meetings`}
          >
            {monthMeetings.length}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleCalendarMeetingClick = (meeting) => {
    setSelectedMeeting(meeting);
    setCalendarMeetingModalVisible(true);
  };

  const handleViewMoreMeetings = (dateStr) => {
    const dateMeetings = meetings.filter(meeting => {
      const meetingDate = dayjs(meeting.startDateTime).format('YYYY-MM-DD');
      return meetingDate === dateStr;
    });

    setSelectedDateMeetings(dateMeetings);
    setCalendarListModalVisible(true);
  };

  const filteredMeetings = meetings.filter(meeting => {
    return filterType === 'all' || meeting.meetingType === filterType;
  });

  const meetingColumns = [
    {
      title: 'Meeting',
      dataIndex: 'title',
      key: 'title',
      width: 400,
      render: (text, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
            {getMeetingTypeIcon(record.meetingType)}
            <span style={{ marginLeft: 12 }}>{text}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {record.description || 'No description provided'}
          </div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'startDateTime',
      key: 'startDateTime',
      width: 250,
      render: (dateTime, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
            {dayjs(dateTime).format('MMM DD, YYYY')}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ClockCircleOutlined style={{ fontSize: '12px' }} />
              {dayjs(dateTime).format('hh:mm A')} - {dayjs(record.endDateTime).format('hh:mm A')}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Attendees',
      dataIndex: 'attendees',
      key: 'attendees',
      width: 200,
      render: (attendees) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
            {attendees?.length || 0} attendees
          </div>
          <div style={{ margin: '6px 0 0 0' }}>
            <Avatar.Group maxCount={3} size="small">
              {attendees?.map(a => (
                <Tooltip title={`${a.firstName} ${a.lastName}`} key={a.id}>
                  <Avatar style={{ backgroundColor: '#3b82f6' }}>{a.firstName?.charAt(0)}</Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          </div>
        </div>
      ),
    },
    {
      title: 'Meeting Link',
      dataIndex: 'meetLink',
      key: 'meetLink',
      width: 200,
      render: (meetLink, record) => {
        console.log('Rendering meeting link for record:', record);
        console.log('Meet link:', meetLink);
        return (
          <div style={{ padding: '8px 0' }}>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                console.log('Join button clicked');
                window.open(meetLink || '#', '_blank');
              }}
              icon={<VideoCameraOutlined />}
              style={{ color: '#1890ff', backgroundColor: 'transparent', border: '1px solid #1890ff' }}
            >
              Join Now
            </Button>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'startDateTime',
      key: 'status',
      width: 120,
      render: (dateTime, record) => {
        const now = dayjs();
        const meetingDate = dayjs(dateTime);
        const isCompleted = meetingDate.isBefore(now, 'day');
        
        return (
          <Tag color={isCompleted ? 'success' : 'warning'}>
            {isCompleted ? 'Completed' : 'Yet to start'}
          </Tag>
        );
      },
    },
  ];

  // Dashboard table columns (only Meeting, Date & Time, Attendees)
  const dashboardColumns = [
    {
      title: 'Meeting',
      dataIndex: 'title',
      key: 'title',
      width: 400,
      render: (text, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
            {getMeetingTypeIcon(record.meetingType)}
            <span style={{ marginLeft: 12 }}>{text}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {record.description || 'No description provided'}
          </div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'startDateTime',
      key: 'startDateTime',
      width: 250,
      render: (dateTime, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
            {dayjs(dateTime).format('MMM DD, YYYY')}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ClockCircleOutlined style={{ fontSize: '12px' }} />
              {dayjs(dateTime).format('hh:mm A')} - {dayjs(record.endDateTime).format('hh:mm A')}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Attendees',
      dataIndex: 'attendees',
      key: 'attendees',
      width: 200,
      render: (attendees) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
            {attendees?.length || 0} attendees
          </div>
          <div style={{ margin: '6px 0 0 0' }}>
            <Avatar.Group maxCount={3} size="small">
              {attendees?.map(a => (
                <Tooltip title={`${a.firstName} ${a.lastName}`} key={a.id}>
                  <Avatar style={{ backgroundColor: '#3b82f6' }}>{a.firstName?.charAt(0)}</Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          </div>
        </div>
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
    <>
      <div className="image-based-meeting-scheduler" style={{ margin: '-24px', height: 'calc(100vh - 64px)', width: 'calc(100% + 48px)' }}>
        {/* Sidebar */}
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <div className="logo">
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <CalendarOutlined style={{ fontSize: '18px', color: 'white' }} />
              </div>
              <span className="logo-text">MeetHub</span>
            </div>
            <button
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <MenuOutlined /> : <LeftOutlined />}
            </button>
          </div>

          <div className="sidebar-menu">
            {menuItems.map(item => (
              <div
                key={item.key}
                className={`menu-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px', marginTop: 'auto' }}>
            {!sidebarCollapsed && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '8px' }}>LOGGED IN AS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar style={{ backgroundColor: '#2563eb' }}>{currentUser?.firstName?.charAt(0) || 'U'}</Avatar>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser?.firstName || 'User'} {currentUser?.lastName}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{userRole}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <h1 className="page-title" style={{ color: '#000000' }}>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'meetings' && 'My Meetings'}
                {activeTab === 'team' && 'Team Directory'}
                {activeTab === 'calendar' && 'Calendar'}
              </h1>
            </div>
            <div className="header-right">
              {/* Add any header actions here if needed */}
            </div>
          </div>


          <div className="content-area">
            {activeTab === 'dashboard' && (
              <div className="dashboard-content">
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-icon">
                        <CalendarOutlined style={{ color: '#3b82f6' }} />
                      </div>
                      <div className="stat-info">
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Total Meetings</div>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <CheckCircleOutlined style={{ color: '#10b981' }} />
                      </div>
                      <div className="stat-info">
                        <div className="stat-number">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                        <ClockCircleOutlined style={{ color: '#f59e0b' }} />
                      </div>
                      <div className="stat-info">
                        <div className="stat-number">{stats.upcoming}</div>
                        <div className="stat-label">Upcoming</div>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-content">
                      <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        <CloseCircleOutlined style={{ color: '#ef4444' }} />
                      </div>
                      <div className="stat-info">
                        <div className="stat-number">{stats.cancelled}</div>
                        <div className="stat-label">Cancelled</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="recent-meetings-card">
                  <div className="meetings-header" style={{ marginBottom: '16px', padding: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', background: 'transparent', boxShadow: 'none' }}>
                    <Title level={4} style={{ margin: 0 }}>Recent Meetings</Title>
                    <Button type="link" onClick={() => setActiveTab('meetings')}>View All</Button>
                  </div>
                  <Table
                    dataSource={filteredMeetings.slice(0, 5)}
                    columns={dashboardColumns}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    scroll={{ x: 1000 }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'meetings' && (
              <div className="meetings-content">
                <div className="meetings-header">
                  <div className="meetings-title">
                    <Title level={4} style={{ margin: 0 }}>All Meetings</Title>
                    <Text type="secondary">Manage your upcoming and past meetings</Text>
                  </div>
                  <div className="meetings-actions">
                    <Space>
                      <Select
                        value={filterType}
                        onChange={setFilterType}
                        style={{ width: 180 }}
                        placeholder="Filter by Type"
                      >
                        <Option value="all">All Types</Option>
                        <Option value="ZOOM_MEET">
                          <Space><VideoCameraFilled /> Zoom Meeting</Space>
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
                      {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setIsModalVisible(true)}
                          size="large"
                          style={{ color: '#1890ff', backgroundColor: 'transparent', border: '1px solid #1890ff' }}
                        >
                          Schedule Meeting
                        </Button>
                      )}
                    </Space>
                  </div>
                </div>

                <div className="ant-table-wrapper">
                  <Table
                    dataSource={filteredMeetings}
                    columns={meetingColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      pageSize: 8,
                      showSizeChanger: false,
                      showTotal: (total) => `Showing ${total} meetings`,
                      size: 'default',
                    }}
                    scroll={{ x: 1150 }}
                    size="middle"
                  />
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="team-content">
                <div className="meetings-header" style={{ marginBottom: '24px' }}>
                  <div className="meetings-title">
                    <Title level={4} style={{ margin: 0 }}>Team Members</Title>
                    <Text type="secondary">View and manage team directory</Text>
                  </div>
                  <Tag color="blue" style={{ fontSize: '14px', padding: '6px 12px', borderRadius: '8px' }}>
                    {users.length} active members
                  </Tag>
                </div>

                <div className="ant-table-wrapper">
                  <Table
                    loading={usersLoading}
                    dataSource={users}
                    columns={[
                      {
                        title: 'Name',
                        dataIndex: 'firstName',
                        key: 'name',
                        render: (text, record) => (
                          <Space size="middle">
                            <Avatar size={40} style={{ backgroundColor: '#3b82f6', fontSize: '16px' }}>
                              {record.firstName?.charAt(0)}{record.lastName?.charAt(0)}
                            </Avatar>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                {record.firstName} {record.lastName}
                              </div>
                              <div style={{ fontSize: '13px', color: '#64748b' }}>
                                {record.email}
                              </div>
                              {record.jobTitle && (
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                  {record.jobTitle}
                                </div>
                              )}
                            </div>
                          </Space>
                        ),
                      },
                      {
                        title: 'Role',
                        dataIndex: 'role',
                        key: 'role',
                        render: (role) => (
                          <Tag color={role === 'ADMIN' ? 'red' : role === 'MANAGER' ? 'orange' : 'blue'}>
                            {role}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => (
                          <Tag color={status === 'ACTIVE' ? 'success' : 'default'} style={{ borderRadius: '12px' }}>
                            {status || 'ACTIVE'}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_, record) => (
                          <Space size="small">
                            {canDeactivateUser(record) && (
                              <Tooltip title="Deactivate User">
                                <Button
                                  type="default"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeactivateUser(record)}
                                />
                              </Tooltip>
                            )}
                            <Tooltip title="View Profile">
                              <Button
                                type="default"
                                size="small"
                                icon={<UserOutlined />}
                                onClick={() => handleViewProfile(record)}
                              />
                            </Tooltip>
                          </Space>
                        ),
                      },
                    ]}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Showing ${total} team members`,
                    }}
                    size="middle"
                  />
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="calendar-content">
                <div className="meetings-header" style={{ marginBottom: '24px' }}>
                  <div className="meetings-title">
                    <Title level={4} style={{ margin: 0 }}>Meeting Calendar</Title>
                    <Text type="secondary">View your schedule</Text>
                  </div>
                  <Space>
                    <Tag color="blue" style={{ fontSize: '14px', padding: '6px 12px', borderRadius: '8px' }}>
                      {meetings.length} meetings
                    </Tag>
                    <Select
                      value={calendarView}
                      onChange={setCalendarView}
                      style={{ width: 120 }}
                      size="large"
                    >
                      <Option value="month">Month</Option>
                      <Option value="week">Week</Option>
                      <Option value="day">Day</Option>
                    </Select>
                  </Space>
                </div>

                <div className="calendar-wrapper" style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  <Calendar
                    fullscreen={false}
                    value={calendarDate}
                    onChange={setCalendarDate}
                    mode={calendarView}
                    dateCellRender={dateCellRender}
                    monthCellRender={monthCellRender}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <Modal
        title="Schedule New Meeting"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          // Clear pre-filled title when modal is closed
          setPrefilledTitle(null);
          // Clear URL parameters
          navigate('/meetings', { replace: true });
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            title: prefilledTitle || undefined
          }}
        >
          <Form.Item
            label="Meeting Title"
            name="title"
            rules={[{ required: true, message: 'Please enter meeting title' }]}
          >
            <Input
              placeholder="Enter meeting title"
              size="large"
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
                  <Option value="ZOOM_MEET">Zoom Meeting</Option>
                  <Option value="VIDEO_CALL">Video Call</Option>
                  <Option value="PHONE_CALL">Phone Call</Option>
                  <Option value="IN_PERSON">In Person</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Duration"
                name="duration"
                rules={[{ required: true, message: 'Please select duration' }]}
              >
                <Select placeholder="Select duration" size="large">
                  <Option value={30}>30 minutes</Option>
                  <Option value={60}>1 hour</Option>
                  <Option value={90}>1 hour 30 minutes</Option>
                  <Option value={120}>2 hours</Option>
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
                rules={[{ required: true, message: 'Please select start date and time' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="Select start date and time"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
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
                style={{ color: '#1890ff', backgroundColor: 'transparent', border: '1px solid #1890ff' }}
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

      {/* Edit Meeting Modal */}
      <Modal
        title="Edit Meeting"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedMeeting(null);
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onEditFinish}
          initialValues={selectedMeeting ? {
            title: selectedMeeting.title,
            description: selectedMeeting.description,
            meetingType: selectedMeeting.meetingType,
            startDateTime: selectedMeeting.startDateTime ? dayjs(selectedMeeting.startDateTime) : null,
            endDateTime: selectedMeeting.endDateTime ? dayjs(selectedMeeting.endDateTime) : null,
            attendees: selectedMeeting.attendees?.map(a => a.id) || [],
          } : {}}
        >
          <Form.Item
            label="Meeting Title"
            name="title"
            rules={[{ required: true, message: 'Please enter meeting title' }]}
          >
            <Input
              placeholder="Enter meeting title"
              size="large"
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
                  <Option value="ZOOM_MEET">Zoom Meeting</Option>
                  <Option value="VIDEO_CALL">Video Call</Option>
                  <Option value="PHONE_CALL">Phone Call</Option>
                  <Option value="IN_PERSON">In Person</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Duration"
                name="duration"
                rules={[{ required: true, message: 'Please select duration' }]}
              >
                <Select placeholder="Select duration" size="large">
                  <Option value={30}>30 minutes</Option>
                  <Option value={60}>1 hour</Option>
                  <Option value={90}>1 hour 30 minutes</Option>
                  <Option value={120}>2 hours</Option>
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
                rules={[{ required: true, message: 'Please select start date and time' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="Select start date and time"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
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
                style={{ color: '#1890ff', backgroundColor: 'transparent', border: '1px solid #1890ff' }}
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

      {/* Calendar Meeting Detail Modal */}
      <Modal
        title="Meeting Details"
        open={calendarMeetingModalVisible}
        onCancel={() => setCalendarMeetingModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedMeeting && (
          <div style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#e6f7ff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '20px'
              }}>
                {getMeetingTypeIcon(selectedMeeting.meetingType)}
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#1890ff', fontSize: '18px' }}>
                  {selectedMeeting.title}
                </h3>
                <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                  {selectedMeeting.description || 'No description provided'}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#fafafa',
              borderRadius: '8px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                  <CalendarOutlined style={{ marginRight: '8px' }} />
                  <strong>Date:</strong>
                </div>
                <div style={{ fontSize: '16px', color: '#333', fontWeight: 500 }}>
                  {dayjs(selectedMeeting.startDateTime).format('MMMM DD, YYYY')}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  {dayjs(selectedMeeting.startDateTime).format('hh:mm A')} - {dayjs(selectedMeeting.endDateTime).format('hh:mm A')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                  <TeamOutlined style={{ marginRight: '8px' }} />
                  <strong>Type:</strong>
                </div>
                <div style={{ fontSize: '16px', color: '#333', fontWeight: 500 }}>
                  {selectedMeeting.meetingType === 'ZOOM_MEET' ? 'Zoom Meeting' :
                    selectedMeeting.meetingType === 'VIDEO_CALL' ? 'Video Call' :
                      selectedMeeting.meetingType === 'PHONE_CALL' ? 'Phone Call' : 'In Person'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                <UserOutlined style={{ marginRight: '8px' }} />
                <strong>Attendees ({selectedMeeting.attendees?.length || 0}):</strong>
              </div>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {selectedMeeting.attendees?.map(attendee => (
                  <div key={attendee.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f5f5f5'
                  }}>
                    <Avatar size="small" style={{ backgroundColor: '#1890ff', marginRight: '12px' }}>
                      {attendee.firstName?.charAt(0)}{attendee.lastName?.charAt(0)}
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>
                        {attendee.firstName} {attendee.lastName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {attendee.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedMeeting.meetLink && (
              <div style={{
                padding: '16px',
                backgroundColor: '#f6ffed',
                borderRadius: '8px',
                border: '1px solid #91d5ff'
              }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                  <VideoCameraOutlined style={{ marginRight: '8px' }} />
                  <strong>Meeting Link:</strong>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #d9d9d9'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#1890ff',
                    fontWeight: 500,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    flex: 1
                  }}>
                    {selectedMeeting.meetLink}
                  </span>
                  <Button
                    type="primary"
                    size="small"
                    icon={<VideoCameraOutlined />}
                    onClick={() => window.open(selectedMeeting.meetLink, '_blank')}
                  >
                    Join Meeting
                  </Button>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: '24px' }}>
              <Space>
                <Button onClick={() => setCalendarMeetingModalVisible(false)}>
                  Close
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Calendar Meeting List Modal */}
      <Modal
        title={`Meetings on ${selectedDateMeetings.length > 0 ? dayjs(selectedDateMeetings[0]?.startDateTime).format('MMMM DD, YYYY') : 'Selected Date'}`}
        open={calendarListModalVisible}
        onCancel={() => setCalendarListModalVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {selectedDateMeetings.map(meeting => (
            <div key={meeting.id} style={{
              marginBottom: '12px',
              padding: '12px',
              border: '1px solid #f0f0f0',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
              onClick={() => {
                setSelectedMeeting(meeting);
                setCalendarListModalVisible(false);
                setCalendarMeetingModalVisible(true);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f6ffed';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#f0f0f0';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                {getMeetingTypeIcon(meeting.meetingType)}
                <div style={{ marginLeft: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    {meeting.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {dayjs(meeting.startDateTime).format('hh:mm A')} - {dayjs(meeting.endDateTime).format('hh:mm A')}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {meeting.attendees?.length || 0} attendees
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {error && (
        <Alert
          message="Error"
          description={
            <div>
              <div>{error}</div>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setError(null);
                  fetchMeetings();
                }}
                style={{ padding: 0, marginTop: 8 }}
              >
                Retry
              </Button>
            </div>
          }
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, maxWidth: 400 }}
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
    </>
  );
}

export default ImageBasedMeetingScheduler;
