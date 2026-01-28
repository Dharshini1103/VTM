import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, Card, Row, Col, Alert, Spin, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import authApi from '../api/authApi';
import { loginSuccess, loginFailure } from '../slices/authSlice';

function Login() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, rememberMe, savedEmail, savedPassword } = useSelector(state => state.auth);
  const [rememberMeChecked, setRememberMeChecked] = useState(false);

  useEffect(() => {
    // Auto-fill form if credentials are saved
    if (savedEmail && savedPassword) {
      form.setFieldsValue({
        email: savedEmail,
        password: savedPassword,
      });
      setRememberMeChecked(rememberMe);
    }
  }, [form, rememberMe, savedEmail, savedPassword]);

  const onFinish = async (values) => {
    try {
      const response = await authApi.login(values.email, values.password);
      const { data: responseData } = response.data;
      dispatch(loginSuccess({
        user: responseData.user,
        token: responseData.accessToken,
        email: values.email,
        password: values.password,
        rememberMe: rememberMeChecked,
      }));
      navigate('/');
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.error || 'Login failed'));
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <Row gutter={16} style={{ width: '100%', maxWidth: '1000px' }}>
        <Col xs={24} md={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>📋</h1>
            <h2>Voice-Enabled Task Manager</h2>
            <p style={{ color: '#666', fontSize: '16px', marginTop: '20px' }}>
              Manage your tasks efficiently with voice commands
            </p>
          </div>
        </Col>

        <Col xs={24} md={12}>
          <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Login</h2>

            {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

            <Spin spinning={loading}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
              >
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Invalid email format' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="Enter your email" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
                </Form.Item>

                <Form.Item>
                  <Checkbox 
                    checked={rememberMeChecked}
                    onChange={(e) => setRememberMeChecked(e.target.checked)}
                  >
                    Remember me
                  </Checkbox>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" block size="large">
                    Login
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center' }}>
                <p>
                  Don't have an account? <a onClick={() => navigate('/register')}>Register here</a>
                </p>
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Login;
