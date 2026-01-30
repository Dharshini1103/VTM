import React, { useEffect, useState } from 'react';
import { Table, Card, Empty, Spin, Row, Col, Statistic, Avatar, Tag, Space } from 'antd';
import { UserOutlined, TeamOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined, CrownOutlined } from '@ant-design/icons';
import userApi from '../api/userApi';
import { useSelector } from 'react-redux';

function TeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = useSelector(state => state.auth.user);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    console.log('Current user changed:', currentUser);
  }, [currentUser]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      console.log('Fetching team members...');
      console.log('Current user from Redux:', currentUser);
      
      const response = await userApi.getAllTeamMembers();
      console.log('Team members response:', response);
      const members = response.data?.data || [];
      console.log('Team members:', members);
      
      // Log each member's ID for comparison
      members.forEach((member, index) => {
        console.log(`Member ${index + 1}:`, {
          id: member.id,
          email: member.email,
          name: `${member.firstName} ${member.lastName}`,
          isCurrentUser: currentUser && member.id === currentUser.id
        });
      });
      
      setMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'red';
      case 'MANAGER':
        return 'blue';
      case 'USER':
        return 'green';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'S.No',
      key: 'serialNumber',
      render: (_, __, index) => (
        <span style={{ fontWeight: 'bold' }}>
          {index + 1}
        </span>
      ),
      width: '8%',
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => {
        const isCurrentUser = currentUser && (
          record.id === currentUser.id || 
          record.email === currentUser.email ||
          (record.gmailId && record.gmailId === currentUser.email)
        );
        return (
          <Space>
            <Avatar 
              size="large" 
              icon={isCurrentUser ? <CrownOutlined /> : <UserOutlined />} 
              src={record.profilePhoto}
              style={{ 
                backgroundColor: isCurrentUser ? '#faad14' : '#1890ff',
                border: isCurrentUser ? '2px solid #faad14' : 'none'
              }}
            />
            <div>
              <div style={{ fontWeight: 'bold', color: isCurrentUser ? '#faad14' : 'inherit' }}>
                {record.firstName} {record.lastName}
                {isCurrentUser && (
                  <Tag color="gold" style={{ marginLeft: '8px', fontSize: '10px' }}>
                    YOU
                  </Tag>
                )}
              </div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                ID: {record.id}
              </div>
              {isCurrentUser && (
                <div style={{ color: '#faad14', fontSize: '11px', fontWeight: 'bold' }}>
                  Current User: {currentUser.email}
                </div>
              )}
            </div>
          </Space>
        );
      },
      width: '28%',
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <MailOutlined style={{ marginRight: '8px', color: '#666' }} />
            <span>{record.email}</span>
          </div>
          {record.gmailId && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Gmail: {record.gmailId}
            </div>
          )}
        </div>
      ),
      width: '30%',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {role}
        </Tag>
      ),
      width: '15%',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Space>
          {isActive ? (
            <>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a' }}>Active</span>
            </>
          ) : (
            <>
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              <span style={{ color: '#ff4d4f' }}>Inactive</span>
            </>
          )}
        </Space>
      ),
      width: '15%',
    },
    {
      title: 'Calendar Sync',
      dataIndex: 'calendarSynced',
      key: 'calendarSynced',
      render: (calendarSynced) => (
        <Tag color={calendarSynced ? 'green' : 'orange'}>
          {calendarSynced ? 'Synced' : 'Not Synced'}
        </Tag>
      ),
      width: '15%',
    },
  ];

  const activeMembers = members.filter(m => m.isActive).length;
  const inactiveMembers = members.filter(m => !m.isActive).length;
  const adminCount = members.filter(m => m.role === 'ADMIN').length;
  const managerCount = members.filter(m => m.role === 'MANAGER').length;
  const userCount = members.filter(m => m.role === 'USER').length;

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Team Members</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Members"
              value={members.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active"
              value={activeMembers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Inactive"
              value={inactiveMembers}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Users"
              value={userCount}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="All Team Members">
        <Spin spinning={loading}>
          {members.length === 0 ? (
            <Empty 
              description="No team members found" 
              style={{ margin: '40px 0' }}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={members}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} members`
              }}
              scroll={{ x: 800 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}

export default TeamMembers;
