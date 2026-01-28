import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import { LogoutOutlined, UserOutlined, TeamOutlined, FileTextOutlined, AudioOutlined } from '@ant-design/icons';
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
    <Header
      style={{
        background: '#001529',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 50px',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}
           onClick={() => navigate('/')}>
        📋 Task Manager
      </div>

      <Menu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={['dashboard']}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Menu.Item key="dashboard" onClick={() => navigate('/')}>
          Dashboard
        </Menu.Item>
        <Menu.Item key="tasks" onClick={() => navigate('/tasks')}>
          <FileTextOutlined /> Tasks
        </Menu.Item>
        <Menu.Item key="voice" onClick={() => navigate('/voice')}>
          <AudioOutlined /> Voice
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
        <Avatar size="large" icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
      </Dropdown>
    </Header>
  );
}

export default Navigation;
