import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Statistic, List, Tag, Empty, Spin, Space, Button, Modal } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, AlertOutlined, FileTextOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import taskApi from '../api/taskApi';
import { useSelector } from 'react-redux';

function Dashboard() {
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.auth.user);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const updateStats = (taskList) => {
    const completed = taskList.filter(t => t.status === 'DONE' || t.status === 'Completed' || t.status === 'COMPLETED').length;
    const inProgress = taskList.filter(t => t.status === 'DOING' || t.status === 'In Progress' || t.status === 'IN PROGRESS' || t.status === 'IN_PROGRESS').length;
    const pending = taskList.filter(t => t.status === 'TO_DO' || t.status === 'Pending' || t.status === 'To Do' || t.status === 'PENDING').length;
    
    setStats({
      total: taskList.length,
      completed: completed,
      inProgress: inProgress,
      pending: pending,
    });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Fetch all tasks
      const tasksRes = await taskApi.getAllTasks();
      
      console.log('Tasks response:', tasksRes);
      
      const allTasksData = tasksRes.data?.data || [];
      
      console.log('All tasks:', allTasksData);

      setTasks(allTasksData);
      updateStats(allTasksData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DONE':
      case 'COMPLETED':
        return <CheckCircleOutlined style={{ color: 'green' }} />;
      case 'DOING':
      case 'IN PROGRESS':
      case 'IN_PROGRESS':
        return <ClockCircleOutlined style={{ color: 'blue' }} />;
      case 'TO_DO':
      case 'PENDING':
        return <AlertOutlined style={{ color: 'orange' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DONE':
      case 'COMPLETED':
        return 'Completed';
      case 'DOING':
      case 'IN PROGRESS':
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'TO_DO':
      case 'PENDING':
        return 'Pending';
      default:
        return status;
    }
  };

  const handleDelete = (taskId) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await taskApi.deleteTask(taskId);
          setTasks(tasks.filter(t => t.id !== taskId));
          // Update stats after deletion
          setStats(prev => ({
            ...prev,
            total: prev.total - 1,
            completed: (tasks.find(t => t.id === taskId)?.status === 'DONE' || tasks.find(t => t.id === taskId)?.status === 'COMPLETED') ? prev.completed - 1 : prev.completed,
            inProgress: (tasks.find(t => t.id === taskId)?.status === 'DOING' || tasks.find(t => t.id === taskId)?.status === 'IN PROGRESS' || tasks.find(t => t.id === taskId)?.status === 'IN_PROGRESS') ? prev.inProgress - 1 : prev.inProgress,
            pending: (tasks.find(t => t.id === taskId)?.status === 'TO_DO' || tasks.find(t => t.id === taskId)?.status === 'PENDING') ? prev.pending - 1 : prev.pending,
          }));
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      },
    });
  };

  return (
    <div className="content-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's your task overview</p>
      </div>

      <Spin spinning={loading}>
        <div className="stats-grid animate-slide-in-right">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success-600)' }}>{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary-600)' }}>{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning-600)' }}>{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="task-table-container animate-fade-in-up">
          <div className="ant-card-head">
            <div className="ant-card-head-title">All Tasks</div>
          </div>
          <div className="ant-card-body">
            {tasks.length === 0 ? (
              <Empty
                description="No tasks found"
                style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={tasks}
                renderItem={(task) => (
                  <List.Item
                    style={{
                      padding: 'var(--space-4) 0',
                      borderBottom: '1px solid var(--gray-200)',
                    }}
                  >
                    <List.Item.Meta
                      avatar={getStatusIcon(task.status)}
                      title={
                        <Space>
                          <span className="task-title-link" onClick={() => navigate(`/tasks/${task.id}`)}>
                            {task.title}
                          </span>
                          <Tag className={`tag-priority-${task.priority.toLowerCase()}`}>{task.priority}</Tag>
                          <Tag className={`tag-status-${task.status.toLowerCase().replace('_', '-')}`}>
                            {getStatusText(task.status)}
                          </Tag>
                        </Space>
                      }
                      description={`Assigned to: ${task.assignedToName || 'Unassigned'} ${task.deadline ? `• Deadline: ${new Date(task.deadline).toLocaleDateString()}` : ''}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>
      </Spin>
    </div>
  );
}

export default Dashboard;
