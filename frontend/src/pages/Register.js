import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, Card, Row, Col, Alert, Spin, Select, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import authApi from '../api/authApi';
import { registerFailure } from '../slices/authSlice';
import storageManager from '../utils/storageManager';

function Register() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  const onFinish = async (values) => {
    try {
      const response = await authApi.register({
        email: values.gmailId, // Use gmailId as email
        gmailId: values.gmailId,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber,
        password: values.password,
        role: values.role,
      });
      
      // Save credentials to localStorage for auto-fill in login
      storageManager.setCredentials(values.gmailId, values.password);
      
      // Show success message
      message.success('Registration successful! Please login with your credentials.');
      
      // Redirect to login page
      navigate('/login');
    } catch (err) {
      dispatch(registerFailure(err.response?.data?.error || 'Registration failed'));
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <Row gutter={16} style={{ width: '100%', maxWidth: '1000px' }}>
        <Col xs={24} md={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>📋</h1>
            <h2>Create Account</h2>
            <p style={{ color: '#666', fontSize: '16px', marginTop: '20px' }}>
              Join our task management system
            </p>
          </div>
        </Col>

        <Col xs={24} md={12}>
          <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Register</h2>

            {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

            <Spin spinning={loading}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
              >
                <Form.Item
                  label="Gmail ID"
                  name="gmailId"
                  rules={[
                    { required: true, message: 'Please enter your Gmail ID' },
                    { type: 'email', message: 'Invalid Gmail format' },
                    { pattern: /@gmail\.com$/, message: 'Must be a valid Gmail address' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="your.email@gmail.com" />
                </Form.Item>

                <Form.Item
                  label="Role"
                  name="role"
                  rules={[{ required: true, message: 'Please select a role' }]}
                >
                  <Select placeholder="Select your role">
                    <Select.Option value="USER">USER (Employee)</Select.Option>
                    <Select.Option value="MANAGER">MANAGER</Select.Option>
                    <Select.Option value="ADMIN">ADMIN</Select.Option>
                    <Select.Option value="SUPER_ADMIN">SUPER_ADMIN</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: 'Please enter your first name' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="First name" />
                </Form.Item>

                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true, message: 'Please enter your last name' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Last name" />
                </Form.Item>

                <Form.Item
                  label="Phone Number"
                  name="phoneNumber"
                  rules={[
                    { required: true, message: 'Please enter your phone number' },
                    { pattern: /^[0-9]{10}$/, message: 'Phone number must be 10 digits' }
                  ]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="Enter 10-digit phone number" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: 'Please enter your password' },
                    { min: 6, message: 'Password must be at least 6 characters' },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
                </Form.Item>

                <Form.Item
                  label="Confirm Password"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm your password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    size="large"
                    className="register-submit-btn"
                    style={{
                      background: '#3b82f6 !important',
                      borderColor: '#3b82f6 !important',
                      color: '#ffffff !important',
                      fontWeight: '700 !important',
                      height: '48px !important',
                      fontSize: '16px !important',
                      borderRadius: '8px !important',
                      display: 'inline-flex !important',
                      alignItems: 'center !important',
                      justifyContent: 'center !important',
                      opacity: '1 !important',
                      visibility: 'visible !important'
                    }}
                  >
                    Register
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center' }}>
                <p>
                  Already have an account? <a onClick={() => navigate('/login')}>Login here</a>
                </p>
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Register;
