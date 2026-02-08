import React, { useEffect, useState } from 'react';
import { Table, Card, Empty, Spin, Row, Col, Statistic, Avatar, Tag, Space, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { UserOutlined, TeamOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined, CrownOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import userApi from '../api/userApi';
import { useSelector } from 'react-redux';
import storageManager from '../utils/storageManager';

function TeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [updateForm] = Form.useForm();
  const currentUser = useSelector(state => state.auth.user);
  const loggedUser = currentUser || storageManager.getUser();

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
      const storedUser = storageManager.getUser();
      console.log('Persisted user from storage:', storedUser);
      
      // Only ADMIN or SUPER_ADMIN can see all users, others can only see active team members
      const role = currentUser?.role || storedUser?.role;
      const response = (role === 'ADMIN' || role === 'SUPER_ADMIN')
        ? await userApi.getAllUsers()
        : await userApi.getAllTeamMembers();
      
      console.log('Team members response:', response);
      const members = response.data?.data || [];
      console.log('Team members:', members);
      
      // Log each member's ID for comparison
      members.forEach((member, index) => {
        console.log(`Member ${index + 1}:`, {
          id: member.id,
          email: member.email,
          name: `${member.firstName} ${member.lastName}`,
          isCurrentUser: (currentUser || storageManager.getUser()) && member.id === (currentUser || storageManager.getUser()).id
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

  const handleUpdate = (member) => {
    setSelectedMember(member);
    updateForm.setFieldsValue({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      isActive: member.isActive,
    });
    setUpdateModalVisible(true);
  };

  const handleUpdateSubmit = async (values) => {
    try {
      setLoading(true);
      const loggedUser = currentUser || storageManager.getUser();
      const isCurrentUser = loggedUser && (
        selectedMember.id === loggedUser.id || 
        selectedMember.email === loggedUser.email ||
        (selectedMember.gmailId && selectedMember.gmailId === loggedUser.email)
      );
      
      // For self-updates, pass current user ID for RBAC validation
      const updateData = isCurrentUser ? { ...values, currentUserId: loggedUser.id } : values;
      
      await userApi.updateUser(selectedMember.id, updateData);
      message.success(isCurrentUser ? 'Profile updated successfully' : 'User updated successfully');
      setUpdateModalVisible(false);
      fetchTeamMembers();
    } catch (error) {
      console.error('Error updating user:', error);
      // Prefer detailed backend error where available
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to update user';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = (user) => {
    if (!user) return false;
    // Role may be serialized as a string ("SUPER_ADMIN") or an object with `name`
    return user.role === 'SUPER_ADMIN' || user.role?.name === 'SUPER_ADMIN';
  };

  const isAdminLike = (user) => {
    if (!user) return false;
    return user.role === 'ADMIN' || isSuperAdmin(user) || user.role?.name === 'ADMIN';
  };

  const handleDelete = async (memberId) => {
    try {
      setLoading(true);
      const loggedUser = currentUser || storageManager.getUser();
      const isCurrentUser = loggedUser && (
        memberId === loggedUser.id || 
        members.find(m => m.id === memberId)?.email === loggedUser.email ||
        members.find(m => m.id === memberId)?.gmailId === loggedUser.email
      );
      
      if (isCurrentUser) {
        // User is deleting their own account - use permanent delete regardless of role
        await userApi.deleteUserPermanently(memberId);
        message.success('Your account has been deleted successfully');
        
        // Logout the user and redirect to login
        setTimeout(() => {
          // Clear local storage and Redux state
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        return; // Don't fetch team members after self-deletion
      } else if (isSuperAdmin(currentUser || storageManager.getUser())) {
        // SUPER_ADMIN deleting other users
        await userApi.deleteUserPermanently(memberId);
        message.success('User deleted permanently');
      } else {
        // For ADMINs do a soft delete (deactivate)
        await userApi.deactivateUser(memberId);
        message.success('User deactivated successfully');
      }
      fetchTeamMembers();
    } catch (error) {
      console.error('Error deleting user:', error);
      // Prefer detailed backend error if provided (ApiResponse.error puts details in `error` field)
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to delete user';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'red';
      case 'SUPER_ADMIN':
        return 'purple';
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
                  Current User: {(currentUser || storageManager.getUser()).email}
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const loggedUser = currentUser || storageManager.getUser();
        const isCurrentUser = loggedUser && (
          record.id === loggedUser.id || 
          record.email === loggedUser.email ||
          (record.gmailId && record.gmailId === loggedUser.email)
        );
        
        // ADMIN and SUPER_ADMIN can update/delete other users
        const canEditOthers = isAdminLike(loggedUser) && !isCurrentUser;
        
        // Users can always update their own profile
        const canEditSelf = isCurrentUser;
        
        // Users can delete their own account (with confirmation)
        const canDeleteSelf = isCurrentUser;
        
        return (
          <Space>
            {(canEditOthers || canEditSelf) && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleUpdate(record)}
                title={isCurrentUser ? "Update your profile" : "Update user"}
              >
                {isCurrentUser ? "Edit Profile" : "Update"}
              </Button>
            )}
            {(canEditOthers || canDeleteSelf) && (
              <Popconfirm
                title={isCurrentUser 
                  ? "Are you sure you want to delete your account? This will log you out immediately!" 
                  : (isSuperAdmin(currentUser || storageManager.getUser()) 
                    ? "Are you sure you want to permanently delete this user?" 
                    : "Are you sure you want to deactivate this user?")
                }
                description={isCurrentUser 
                  ? "This action will permanently delete your account and cannot be undone. You will be logged out immediately."
                  : (isSuperAdmin(currentUser || storageManager.getUser()) 
                    ? "This action will permanently delete the user account and cannot be undone." 
                    : "This action will deactivate the user account; an ADMIN cannot permanently delete users.")
                }
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  title={isCurrentUser 
                    ? "Delete your account" 
                    : (isSuperAdmin(currentUser || storageManager.getUser()) ? "Permanently delete user" : "Deactivate user")
                  }
                >
                  {isCurrentUser ? "Delete Account" : "Delete"}
                </Button>
              </Popconfirm>
            )}
            {!canEditOthers && !canEditSelf && !canDeleteSelf && (
              <span style={{ color: '#999', fontSize: '12px' }}>
                No Actions
              </span>
            )}
          </Space>
        );
      },
      width: '25%',
    },
  ];

 const activeMembers = members.filter(m => m.isActive).length;
const inactiveMembers = members.filter(m => !m.isActive).length;

const superAdminCount = members.filter(m => m.role === 'SUPER_ADMIN').length;
const adminCount = members.filter(m => m.role === 'ADMIN').length;
const managerCount = members.filter(m => m.role === 'MANAGER').length;
const userCount = members.filter(m => m.role === 'USER').length;

  return (
    <div className="content-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Team Members</h1>
        <p className="page-subtitle">Manage your team and user roles</p>
      </div>
      
      {/* Current User Info Card */}
      {(currentUser || storageManager.getUser()) && (
        <Card className="user-profile-card animate-slide-in-right">
          <Row align="middle" gutter={16}>
            <Col>
              <Avatar 
                size={64} 
                icon={<CrownOutlined />} 
                src={(currentUser || storageManager.getUser()).profilePhoto}
                className="user-avatar"
              />
            </Col>
            <Col flex="auto">
              <div className="user-info">
                <h2 className="user-name">
                  {(currentUser || storageManager.getUser()).firstName} {(currentUser || storageManager.getUser()).lastName}
                </h2>
                <p className="user-email">
                  <MailOutlined className="user-email-icon" />
                  {(currentUser || storageManager.getUser()).email}
                </p>
                <Space className="user-tags">
                  <Tag className="tag-current-user">
                    <CrownOutlined className="tag-icon" />
                    CURRENT USER
                  </Tag>
                  <Tag className={`tag-role-${(currentUser || storageManager.getUser()).role?.toLowerCase()}`}>
                    {(currentUser || storageManager.getUser()).role}
                  </Tag>
                </Space>
              </div>
            </Col>
            <Col>
              <Button 
                type="primary" 
              />
            </Col>
          </Row>
        </Card>
      )}
      
      {/* Team Members Table */}
      <div className="task-table-container animate-slide-in-right">
        <div className="ant-card-head">
          <div className="ant-card-head-title">All Team Members</div>
        </div>
        <div className="ant-card-body">
          <Spin spinning={loading}>
            {members.length === 0 ? (
              <Empty
                description="No team members found"
                style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
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
        </div>
      </div>

      {/* Update User Modal */}
      <Modal
        title={selectedMember && currentUser && (
          (selectedMember.id === currentUser.id || 
           selectedMember.email === currentUser.email ||
           (selectedMember.gmailId && selectedMember.gmailId === currentUser.email))
          ? "Edit Your Profile" 
          : `Update User: ${selectedMember?.firstName} ${selectedMember?.lastName}`
        )}
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={updateForm}
          layout="vertical"
          onFinish={handleUpdateSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'Please input first name!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Please input last name!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input />
          </Form.Item>

          {/* Show role and status only when editing other users, not self */}
          {!(selectedMember && currentUser && (
            (selectedMember.id === currentUser.id || 
             selectedMember.email === currentUser.email ||
             (selectedMember.gmailId && selectedMember.gmailId === currentUser.email))
          )) && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Role"
                  name="role"
                  rules={[{ required: true, message: 'Please select a role!' }]}
                >
                  <Select>
                    <Select.Option value="USER">USER</Select.Option>
                    <Select.Option value="MANAGER">MANAGER</Select.Option>
                    <Select.Option value="ADMIN">ADMIN</Select.Option>
                    {isSuperAdmin(currentUser) && (
                      <Select.Option value="SUPER_ADMIN">SUPER_ADMIN</Select.Option>
                    )}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Status"
                  name="isActive"
                  rules={[{ required: true, message: 'Please select status!' }]}
                >
                  <Select>
                    <Select.Option value={true}>Active</Select.Option>
                    <Select.Option value={false}>Inactive</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {selectedMember && currentUser && (
                  (selectedMember.id === currentUser.id || 
                   selectedMember.email === currentUser.email ||
                   (selectedMember.gmailId && selectedMember.gmailId === currentUser.email))
                  ? "Update Profile" : "Update User"
                )}
              </Button>
              <Button onClick={() => setUpdateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TeamMembers;
