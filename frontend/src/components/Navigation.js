import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { LogoutOutlined, UserOutlined, TeamOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';
import { logout } from '../slices/authSlice';

const { Header } = Layout;

function Navigation() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => navigate('/profile')}>
        <UserOutlined /> Profile
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="header-content">
      <div className="logo" onClick={() => navigate('/')}>
        <span className="logo-icon">📋</span>
        Task Manager
      </div>

      <Menu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={['dashboard']}
        className="custom-menu"
      >
        <Menu.Item key="dashboard" onClick={() => navigate('/')}>
          Dashboard
        </Menu.Item>
        <Menu.Item key="tasks" onClick={() => navigate('/tasks')}>
          <FileTextOutlined /> Tasks
        </Menu.Item>
        <Menu.Item key="voice" onClick={() => navigate('/voice')}>
          <CalendarOutlined /> Meetings
        </Menu.Item>
        <Menu.Item key="team" onClick={() => navigate('/team')}>
          <TeamOutlined /> Team
        </Menu.Item>
      </Menu>

      <Dropdown menu={{ items: [
        {
          key: 'profile',
          label: 'Profile',
          icon: <UserOutlined />,
          onClick: () => navigate('/profile'),
        },
        { type: 'divider' },
        {
          key: 'logout',
          label: 'Logout',
          icon: <LogoutOutlined />,
          onClick: handleLogout,
        },
      ] }}>
        <Avatar size="large" icon={<UserOutlined />} className="user-avatar" />
      </Dropdown>
    </Header>
  );
}

export default Navigation;
