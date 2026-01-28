import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, Form, Input, Button, Spin, Alert, Upload, Space, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, CameraOutlined } from '@ant-design/icons';
import userApi from '../api/userApi';

function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const currentUser = useSelector(state => state.auth.user);

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        gmailId: currentUser.gmailId,
      });
    }
  }, [currentUser, form]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await userApi.updateUser(currentUser.id, {
        firstName: values.firstName,
        lastName: values.lastName,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <Spin />;

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>My Profile</h1>

      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Card title="Profile Information">
            {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}
            {success && <Alert message="Success" description="Profile updated successfully" type="success" showIcon style={{ marginBottom: '20px' }} />}

            <Spin spinning={loading}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
              >
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: 'Please enter first name' }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>

                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true, message: 'Please enter last name' }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                >
                  <Input prefix={<MailOutlined />} disabled />
                </Form.Item>

                <Form.Item
                  label="Gmail ID"
                  name="gmailId"
                >
                  <Input prefix={<MailOutlined />} disabled />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Update Profile
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Account Settings">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Role</p>
                <p>{currentUser.role}</p>
              </div>
              <div>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Member Since</p>
                <p>{new Date(currentUser.createdAt).toLocaleDateString()}</p>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Profile;
