import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Card, Row, Col, Avatar, Tag, Button, Space, Tooltip, 
  Form, Input, DatePicker, Modal, Radio, message, Spin,
  Select, Typography, Divider, Badge, Table
} from 'antd';
import { 
  UserOutlined, GoogleOutlined, MailOutlined, PhoneOutlined,
  CalendarOutlined, TeamOutlined, SearchOutlined, FilterOutlined,
  MoreOutlined, ClockCircleOutlined, CheckCircleOutlined,
  CopyOutlined, VideoCameraOutlined, PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import meetingApi from '../api/meetingApi';
import userApi from '../api/userApi';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

function ImageBasedTeamMembers({ users, onScheduleCall, meetings }) {
  console.log('=== TEAM MEMBERS COMPONENT DEBUG ===');
  console.log('Users prop received:', users);
  console.log('Users prop length:', users?.length || 0);
  console.log('Users prop type:', typeof users);
  console.log('Is users an array?', Array.isArray(users));
  
  // Get current user role from Redux state
  const currentUser = useSelector((state) => state.auth.user);
  const userRole = currentUser?.role || 'USER';
  console.log('Current user role:', userRole);
  console.log('Current user:', currentUser);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCallModalVisible, setIsCallModalVisible] = useState(false);
  const [callForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];
  console.log('Safe users after array check:', safeUsers);
  console.log('Safe users length:', safeUsers.length);

  const departments = [...new Set(safeUsers.map(user => user.department).filter(Boolean))];
  console.log('Departments:', departments);

  const filteredUsers = safeUsers.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment;
    
    // TEMPORARY: Show all users regardless of active status for debugging
    const showAll = true; // Set to false to filter active users only
    const matchesActive = showAll || user.isActive !== false;
    
    const passesFilter = matchesSearch && matchesDepartment && matchesActive;
    
    console.log(`Filtering user ${user.firstName} ${user.lastName}:`, {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      matchesSearch,
      matchesDepartment,
      matchesActive,
      passesFilter,
      searchTerm,
      filterDepartment
    });
    
    return passesFilter;
  });
  
  console.log('=== FILTERING RESULTS ===');
  console.log('Total safe users:', safeUsers.length);
  console.log('Filtered users:', filteredUsers.length);
  console.log('Filtered users list:', filteredUsers.map(u => `${u.firstName} ${u.lastName} (${u.role})`));

  const handleScheduleCall = async (user, callType) => {
    setSelectedUser(user);
    callForm.setFieldsValue({
      callType: 'ZOOM_CALL',
      title: `Zoom Call with ${user.firstName} ${user.lastName}`
    });
    setIsCallModalVisible(true);
  };

  const handleCallSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Create meeting data for API call
      const meetingData = {
        title: values.title,
        description: values.description || 'Zoom call',
        meetingType: 'ZOOM_CALL',
        startDateTime: values.startDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        endDateTime: values.endDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        attendeeIds: [selectedUser.id],
        teamIds: []
      };

      console.log('=== SCHEDULING CALL ===');
      console.log('Selected user:', selectedUser);
      console.log('Meeting data:', meetingData);

      // Make actual API call to schedule Zoom meeting
      const response = await meetingApi.scheduleZoomMeet(meetingData);
        
      console.log('API Response:', response);
        
      if (response.data && response.data.success) {
        const createdMeeting = response.data.data;
          
        message.success({
          content: 'Zoom Call scheduled successfully!',
          description: createdMeeting.meetLink ? 'Meeting link is ready' : 'Meeting will be synced with Zoom',
          duration: 3
        });
          
        setIsCallModalVisible(false);
        callForm.resetFields();
        setSelectedUser(null);
          
        if (onScheduleCall) {
          onScheduleCall(createdMeeting);
        }
      } else {
        console.error('API Error:', response);
        message.error({
          content: 'Failed to schedule call',
          description: response.data?.error || 'Unknown error occurred',
          duration: 5
        });
      }
    } catch (error) {
      console.error('Schedule Call Error:', error);
      message.error({
        content: 'Failed to schedule call',
        description: error.message || 'Network error occurred',
        duration: 5
      });
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'online': { color: 'success', text: 'Online' },
      'offline': { color: 'default', text: 'Offline' },
      'busy': { color: 'warning', text: 'Busy' },
      'away': { color: 'error', text: 'Away' }
    };
    
    const config = statusConfig[status] || statusConfig['offline'];
    return <Badge status={config.color} text={config.text} />;
  };

  return (
    <div className="image-based-team-members">
      <div className="team-header" style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>Team Members</Title>
        <Typography.Text type="secondary">Manage your team and schedule calls</Typography.Text>
      </div>

      <Row gutter={[16, 16]} className="team-grid">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <Col xs={24} sm={12} md={8} lg={6} key={user.id}>
              <Card
                className="team-member-card"
                hoverable
                actions={[
                  ...(userRole === 'ADMIN' || userRole === 'MANAGER' ? [
                    <Tooltip title="Schedule Zoom Call">
                      <VideoCameraOutlined 
                        key="zoom"
                        onClick={() => handleScheduleCall(user, 'ZOOM_CALL')}
                      />
                    </Tooltip>
                  ] : []),
                  <MoreOutlined key="more" />
                ]}
              >
                <Card.Meta
                  avatar={
                    <Avatar 
                      size={64} 
                      style={{ 
                        backgroundColor: '#1890ff',
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }}
                    >
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </Avatar>
                  }
                  title={
                    <div>
                      <Typography.Text strong style={{ fontSize: '16px' }}>
                        {user.firstName} {user.lastName}
                      </Typography.Text>
                      <div style={{ marginTop: 4 }}>
                        {getStatusBadge('online')}
                      </div>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                          {user.jobTitle || 'Team Member'}
                        </Typography.Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Space>
                          <MailOutlined style={{ color: '#666' }} />
                          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                            {user.email}
                          </Typography.Text>
                        </Space>
                      </div>
                      {user.department && (
                        <div style={{ marginBottom: 8 }}>
                          <Tag color="blue" style={{ fontSize: '12px' }}>
                            {user.department}
                          </Tag>
                        </div>
                      )}
                      <div>
                        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                          <Button 
                            type="primary" 
                            size="small"
                            icon={<VideoCameraOutlined />}
                            onClick={() => handleScheduleCall(user, 'ZOOM_CALL')}
                          >
                            Zoom Call
                          </Button>
                        )}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Typography.Text type="secondary">
                {searchTerm || filterDepartment !== 'all' 
                  ? 'No team members found matching your filters'
                  : 'No team members available'
                }
              </Typography.Text>
            </div>
          </Col>
        )}
      </Row>

      {/* Schedule Call Modal */}
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
          onFinish={handleCallSubmit}
          className="call-form"
        >
          <Form.Item
            label="Call Type"
            name="callType"
            rules={[{ required: true, message: 'Please select call type' }]}
          >
            <Radio.Group>
              <Radio.Button value="ZOOM_CALL">
                <VideoCameraOutlined /> Zoom Call
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
            <Input 
              type="textarea"
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
                icon={<PhoneOutlined />}
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

      {/* Scheduled Individual Calls Table */}
      <Card title="Scheduled Individual Calls with Team Members" style={{ marginTop: '24px' }}>
        <Table
          dataSource={(meetings || []).filter(meeting => 
            meeting.attendeeIds && meeting.attendeeIds.length === 1 && 
            (meeting.meetingType === 'PHONE_CALL' || meeting.meetingType === 'ZOOM_CALL')
          )}
          columns={[
            { 
              title: 'Team Member', 
              dataIndex: 'attendeeName', 
              key: 'attendeeName',
              render: (text, record) => (
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>{text || 'Unknown'}</span>
                </Space>
              )
            },
            { 
              title: 'Meeting Title', 
              dataIndex: 'title', 
              key: 'title',
              render: (text) => (
                <Typography.Text strong>{text}</Typography.Text>
              )
            },
            { 
              title: 'Meeting Type', 
              dataIndex: 'meetingType', 
              key: 'meetingType',
              render: (type) => (
                <Tag color={type === 'ZOOM_CALL' ? 'blue' : 'green'}>
                  {type === 'ZOOM_CALL' ? (
                    <Space>
                      <VideoCameraOutlined />
                      Zoom Call
                    </Space>
                  ) : (
                    <Space>
                      <PhoneOutlined />
                      Phone Call
                    </Space>
                  )}
                </Tag>
              )
            },
            { 
              title: 'Date & Time', 
              dataIndex: 'startDateTime', 
              key: 'startDateTime',
              render: (time) => (
                <Typography.Text>{dayjs(time).format('YYYY-MM-DD HH:mm')}</Typography.Text>
              )
            },
            { 
              title: 'Status', 
              dataIndex: 'status', 
              key: 'status',
              render: (status) => (
                <Tag color={status === 'SCHEDULED' ? 'blue' : status === 'COMPLETED' ? 'green' : 'orange'}>
                  {status}
                </Tag>
              )
            }
          ]}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} meetings`
          }}
          rowKey="id"
          locale={{
            emptyText: 'No scheduled individual calls found'
          }}
        />
      </Card>
    </div>
  );
}

export default ImageBasedTeamMembers;
