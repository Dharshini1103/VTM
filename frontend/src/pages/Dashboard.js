import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Empty, Spin, Space, Button } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, AlertOutlined, FileTextOutlined } from '@ant-design/icons';
import taskApi from '../api/taskApi';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksRes, overdueRes] = await Promise.all([
        taskApi.getUserTasks(),
        taskApi.getOverdueTasks(),
      ]);

      const allTasks = tasksRes.data.data || [];
      const overdueTasks = overdueRes.data.data || [];

      setTasks(allTasks);
      setStats({
        total: allTasks.length,
        completed: allTasks.filter(t => t.status === 'COMPLETED').length,
        inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
        overdue: overdueTasks.length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return 'red';
      case 'MEDIUM':
        return 'orange';
      case 'LOW':
        return 'green';
      default:
        return 'blue';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleOutlined style={{ color: 'green' }} />;
      case 'IN_PROGRESS':
        return <ClockCircleOutlined style={{ color: 'blue' }} />;
      case 'PENDING':
        return <AlertOutlined style={{ color: 'orange' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Dashboard</h1>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Tasks"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={stats.inProgress}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Overdue"
                value={stats.overdue}
                prefix={<AlertOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Recent Tasks" style={{ marginBottom: '30px' }}>
          {tasks.length === 0 ? (
            <Empty description="No tasks found" />
          ) : (
            <List
              dataSource={tasks.slice(0, 5)}
              renderItem={(task) => (
                <List.Item
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <List.Item.Meta
                    avatar={getStatusIcon(task.status)}
                    title={
                      <Space>
                        {task.title}
                        <Tag color={getPriorityColor(task.priority)}>{task.priority}</Tag>
                      </Space>
                    }
                    description={`Assigned to: ${task.assignedToName || 'Unassigned'}`}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Spin>
    </div>
  );
}

export default Dashboard;
