import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, Card, Row, Col, Alert, Spin, Checkbox, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import authApi from '../api/authApi';
import { loginSuccess, loginFailure } from '../slices/authSlice';

function Login() {
  const [form] = Form.useForm();
  const [forgotPasswordForm] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, rememberMe, savedEmail, savedPassword } = useSelector(state => state.auth);
  const [rememberMeChecked, setRememberMeChecked] = useState(false);
  
  // Forgot password states
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState(null);

  useEffect(() => {
    // Auto-fill form if credentials are saved
    if (savedEmail && savedPassword) {
      form.setFieldsValue({
        gmailId: savedEmail,
        password: savedPassword,
      });
      setRememberMeChecked(rememberMe);
    }
  }, [form, rememberMe, savedEmail, savedPassword]);

  const fetchTask = async () => {
    // This function can be used for future task fetching
  };

  const onFinish = async (values) => {
    try {
      const response = await authApi.login(values.gmailId, values.password);
      const { data: responseData } = response.data;
      dispatch(loginSuccess({
        user: responseData.user,
        token: responseData.accessToken,
        email: values.gmailId,
        password: values.password,
        rememberMe: rememberMeChecked,
      }));
      navigate('/dashboard');
    } catch (err) {
      let errorMessage = 'Login failed';
      
      // Provide specific error messages based on the error response
      if (err.response?.data?.error) {
        const errorText = err.response.data.error.toLowerCase();
        
        if (errorText.includes('user not found') || errorText.includes('email address')) {
          errorMessage = 'User not found with this email address. Please check your email and try again.';
        } else if (errorText.includes('incorrect password') || errorText.includes('password')) {
          errorMessage = 'Incorrect password. Please check your password and try again.';
        } else if (errorText.includes('deactivated') || errorText.includes('account')) {
          errorMessage = 'Your account has been deactivated. Please contact your administrator.';
        } else {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch(loginFailure(errorMessage));
    }
  };

  // Forgot password functions
  const showForgotPasswordModal = () => {
    setIsForgotPasswordModalVisible(true);
    setForgotPasswordError(null);
    forgotPasswordForm.resetFields();
  };

  const handleForgotPasswordCancel = () => {
    setIsForgotPasswordModalVisible(false);
    forgotPasswordForm.resetFields();
    setForgotPasswordError(null);
  };

  const onForgotPasswordSubmit = async (values) => {
    try {
      setForgotPasswordLoading(true);
      setForgotPasswordError(null);
      
      if (values.newPassword !== values.confirmPassword) {
        setForgotPasswordError('Passwords do not match');
        setForgotPasswordLoading(false);
        return;
      }
      
      await authApi.resetPassword(values.gmailId, values.newPassword);
      
      // Show success message and close modal
      setIsForgotPasswordModalVisible(false);
      forgotPasswordForm.resetFields();
      
      // Show success message
      dispatch(loginSuccess({}));
      setTimeout(() => {
        dispatch(loginFailure('Password reset successful! Please login with your new password.'));
      }, 100);
    } catch (err) {
      setForgotPasswordError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setForgotPasswordLoading(false);
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
                  <Button type="primary" htmlType="submit" block size="large" style={{ 
                    color: '#1890ff',
                    backgroundColor: 'transparent',
                    border: '1px solid #1890ff',
                    fontWeight: '600'
                  }}>
                    Login
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center' }}>
                <p>
                  Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Register here</a>
                </p>
                <p>
                  <a href="#" onClick={(e) => { e.preventDefault(); showForgotPasswordModal(); }}>Forgot Password?</a>
                </p>
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Forgot Password Modal */}
      <Modal
        title="Reset Password"
        open={isForgotPasswordModalVisible}
        onCancel={handleForgotPasswordCancel}
        footer={null}
        width={400}
      >
        {forgotPasswordError && (
          <Alert message="Error" description={forgotPasswordError} type="error" showIcon style={{ marginBottom: '16px' }} />
        )}

        <Form
          form={forgotPasswordForm}
          layout="vertical"
          onFinish={onForgotPasswordSubmit}
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
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be at least 6 characters long' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            rules={[
              { required: true, message: 'Please confirm new password' },
              { min: 6, message: 'Password must be at least 6 characters long' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={forgotPasswordLoading} block>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Login;
