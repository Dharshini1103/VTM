import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Avatar, Tag, Button, Space, Tooltip, 
  Form, Input, DatePicker, Modal, Radio, message, Spin,
  Select, Typography, Divider, Badge
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

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

function ImageBasedTeamMembers({ users, onScheduleCall }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCallModalVisible, setIsCallModalVisible] = useState(false);
  const [callForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const departments = [...new Set(users.map(user => user.department).filter(Boolean))];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleScheduleCall = async (user, callType) => {
    setSelectedUser(user);
    callForm.setFieldsValue({
      callType: 'GOOGLE_MEET',
      title: `Google Meet with ${user.firstName} ${user.lastName}`
    });
    setIsCallModalVisible(true);
  };

  const handleCallSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Create meeting data for API call
      const meetingData = {
        title: values.title,
        description: values.description || 'Google Meet call',
        meetingType: 'GOOGLE_MEET',
        startDateTime: values.startDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        endDateTime: values.endDateTime.format('YYYY-MM-DDTHH:mm:ss'),
        attendeeIds: [selectedUser.id],
        teamIds: []
      };

      // Make actual API call to schedule meeting
      const response = await meetingApi.createMeeting(meetingData);
      
      if (response.data && response.data.success) {
        const createdMeeting = response.data.data;
        
        message.success({
          content: 'Google Meet scheduled successfully!',
          description: createdMeeting.meetLink ? 'Meeting link is ready' : 'Meeting will be synced with Google Calendar',
          duration: 3
        });
        
        setIsCallModalVisible(false);
        callForm.resetFields();
        setSelectedUser(null);
        
        if (onScheduleCall) {
          onScheduleCall(createdMeeting);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Failed to schedule Google Meet:', error);
      message.error({
        content: 'Failed to schedule Google Meet',
        description: error.response?.data?.error || error.message || 'Please try again',
        duration: 4
      });
    } finally {
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
      <div className="team-header">
        <div className="team-title">
          <Title level={4} style={{ margin: 0 }}>
            <TeamOutlined /> Team Members
          </Title>
          <Text type="secondary">
            {filteredUsers.length} members available
          </Text>
        </div>
        <div className="team-actions">
          <Space>
            <Search
              placeholder="Search team members..."
              allowClear
              style={{ width: 250 }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={filterDepartment}
              onChange={setFilterDepartment}
              style={{ width: 150 }}
              placeholder="Department"
            >
              <Option value="all">All Departments</Option>
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Member
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]} className="team-grid">
        {filteredUsers.map(user => (
          <Col xs={24} sm={12} md={8} lg={6} key={user.id}>
            <Card
              className="team-member-card"
              hoverable
              actions={[
                <Tooltip title="Schedule Google Meet">
                  <GoogleOutlined 
                    key="meet"
                    onClick={() => handleScheduleCall(user, 'GOOGLE_MEET')}
                  />
                </Tooltip>,
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
                    <Text strong style={{ fontSize: '16px' }}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      {getStatusBadge('online')}
                    </div>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {user.jobTitle}
                      </Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Space>
                        <MailOutlined style={{ color: '#666' }} />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {user.email}
                        </Text>
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
                      <Button 
                        type="primary" 
                        size="small"
                        icon={<GoogleOutlined />}
                        onClick={() => handleScheduleCall(user, 'GOOGLE_MEET')}
                      >
                        Google Meet
                      </Button>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
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
                icon={<CalendarOutlined />}
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
    </div>
  );
}

export default ImageBasedTeamMembers;
