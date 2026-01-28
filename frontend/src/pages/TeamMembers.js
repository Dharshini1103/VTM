import React, { useEffect, useState } from 'react';
import { Table, Card, Empty, Spin } from 'antd';
import userApi from '../api/userApi';

function TeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAllTeamMembers();
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      width: '25%',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '25%',
    },
    {
      title: 'Gmail ID',
      dataIndex: 'gmailId',
      key: 'gmailId',
      width: '25%',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: '15%',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => isActive ? 'Active' : 'Inactive',
      width: '10%',
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Team Members</h1>

      <Card>
        <Spin spinning={loading}>
          {members.length === 0 ? (
            <Empty description="No team members found" />
          ) : (
            <Table
              columns={columns}
              dataSource={members}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}

export default TeamMembers;
