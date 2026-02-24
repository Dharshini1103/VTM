import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import '../styles/LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-icon">📋</span>
            <span className="logo-text">Task Management with Voice Integration</span>
          </div>
        </div>
        
        <div className="header-right">
          <Button 
            type="default" 
            className="header-btn"
            style={{
              background: 'transparent !important',
              border: '2px solid #3b82f6 !important',
              color: '#3b82f6 !important',
              fontWeight: '600 !important',
              borderRadius: '8px !important',
              height: '40px !important',
              padding: '0 20px !important'
            }}
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
          <Button 
            type="primary" 
            className="header-btn"
            style={{
              background: '#3b82f6 !important',
              borderColor: '#3b82f6 !important',
              color: 'white !important',
              fontWeight: '600 !important',
              borderRadius: '8px !important',
              height: '40px !important',
              padding: '0 20px !important'
            }}
            onClick={() => navigate('/register')}
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Turning <span className="highlight">Smart Ideas</span> into Seamless Task Execution
            </h1>
            <p className="hero-description">
              Experience the power of intelligent task management with voice integration. 
              Our system helps you plan, assign, and achieve more—faster and easier than ever before.
              Transform your workflow with both manual input and advanced voice commands,
              plus seamless meeting scheduling for ultimate productivity.
            </p>
          </div>
          
          <div className="hero-illustration">
            <div className="illustration-container">
              <div className="illustration-item collaboration">
                <div className="illustration-icon">👥</div>
                <div className="illustration-label">Team Collaboration</div>
              </div>
              <div className="illustration-item productivity">
                <div className="illustration-icon">📊</div>
                <div className="illustration-label">Productivity</div>
              </div>
              <div className="illustration-item management">
                <div className="illustration-icon">📋</div>
                <div className="illustration-label">Task Management</div>
              </div>
              <div className="illustration-item technology">
                <div className="illustration-icon">⚡</div>
                <div className="illustration-label">Smart Technology</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Our Platform?</h2>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <div className="feature-card">
                <div className="feature-icon">🎤</div>
                <h3 className="feature-title">Voice Commands</h3>
                <p className="feature-description">
                  Create and manage tasks using natural voice commands for hands-free productivity.
                </p>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <h3 className="feature-title">Smart Scheduling</h3>
                <p className="feature-description">
                  Schedule meetings effortlessly with voice-enabled calendar integration and automated reminders.
                </p>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3 className="feature-title">Productivity Analytics</h3>
                <p className="feature-description">
                  Track your progress with detailed insights and performance metrics.
                </p>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Workflow?</h2>
            <p className="cta-description">
              Join thousands of professionals who have already streamlined their task management with our intelligent voice-powered platform.
            </p>
            <div className="cta-buttons">
              <Button 
                type="primary" 
                size="large"
                className="cta-btn"
                onClick={() => navigate('/register')}
                icon={<ArrowRightOutlined />}
              >
                Get Started Free
              </Button>
              <Button 
                type="default" 
                size="large"
                className="cta-btn secondary"
                onClick={() => navigate('/login')}
              >
                Login to Account
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
