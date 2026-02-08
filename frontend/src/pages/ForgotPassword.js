import React, { useState } from 'react';
import { Form, Input, Button, Card, Spin, Alert, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

function ForgotPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setOtpSent(false);

      await authApi.forgotPassword(values.email);

      setSuccess(true);
      setOtpSent(true);
      message.success('OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.error || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const onResetFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await authApi.resetPassword({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
      });

      setSuccess(true);
      message.success('Password reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Forgot Password</h1>
        <p className="page-subtitle">Reset your password using OTP verification</p>
      </div>

      <div className="animate-slide-in-right" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Card>
          {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: '20px' }} />}
          {success && !otpSent && <Alert message="Success" description="OTP sent to your email" type="success" showIcon style={{ marginBottom: '20px' }} />}
          {success && otpSent && <Alert message="OTP Sent" description="Check your email for OTP, then enter it below to reset password" type="info" showIcon style={{ marginBottom: '20px' }} />}

          {!otpSent ? (
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
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Enter your email address" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                  Send OTP
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={onResetFinish}
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Enter your email address" />
              </Form.Item>

              <Form.Item
                label="OTP"
                name="otp"
                rules={[{ required: true, message: 'Please enter OTP' }]}
              >
                <Input placeholder="Enter OTP from your email" />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[
                  { required: true, message: 'Please enter new password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                label="Confirm New Password"
                name="confirmPassword"
                rules={[
                  { required: true, message: 'Please confirm new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords that you entered do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm new password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                  Reset Password
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ForgotPassword;
