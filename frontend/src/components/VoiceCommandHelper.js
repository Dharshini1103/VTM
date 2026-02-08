import React, { useState } from 'react';
import { Card, Button, Tag, Tooltip, Row, Col, Collapse, Space, Alert, Empty } from 'antd';
import { AudioOutlined, CopyOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';

const VOICE_COMMAND_EXAMPLES = [
  {
    command: 'Create task review project report',
    description: 'Basic task creation',
    priority: 'MEDIUM',
    deadline: 'None',
  },
  {
    command: 'Add task fix critical bug as urgent',
    description: 'High priority task',
    priority: 'URGENT',
    deadline: 'None',
  },
  {
    command: 'New task update documentation high priority deadline today',
    description: 'Task with priority and deadline',
    priority: 'HIGH',
    deadline: 'Today',
  },
  {
    command: 'Create task prepare quarterly report due tomorrow',
    description: 'Task with tomorrow deadline',
    priority: 'MEDIUM',
    deadline: 'Tomorrow',
  },
  {
    command: 'Add task schedule client meeting this week low priority',
    description: 'Low priority task with week deadline',
    priority: 'LOW',
    deadline: 'This Week',
  },
  {
    command: 'Create task code review urgent deadline tomorrow',
    description: 'Urgent task with immediate deadline',
    priority: 'URGENT',
    deadline: 'Tomorrow',
  },
];

function VoiceCommandHelper({ onCommandSelect, isRecording }) {
  const [copiedCommand, setCopiedCommand] = useState(null);
  const [historyCommands, setHistoryCommands] = useState([]);

  const copyToClipboard = (command) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const addToHistory = (command) => {
    setHistoryCommands([command, ...historyCommands.slice(0, 4)]);
  };

  const getPriorityColor = (priority) => {
    const colors = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red', URGENT: 'volcano' };
    return colors[priority] || 'blue';
  };

  const getDeadlineColor = (deadline) => {
    const colors = { Today: 'red', Tomorrow: 'orange', 'This Week': 'blue', None: 'default' };
    return colors[deadline] || 'default';
  };

  const handleCommandClick = (command) => {
    if (onCommandSelect) {
      onCommandSelect(command);
    }
    addToHistory(command);
  };

  const items = [
    {
      key: '1',
      label: (
        <div>
          <AudioOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          <strong>Speech Command Examples</strong>
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
            ({VOICE_COMMAND_EXAMPLES.length} examples)
          </span>
        </div>
      ),
      children: (
        <div>
          {VOICE_COMMAND_EXAMPLES.length === 0 ? (
            <Empty description="No examples available" />
          ) : (
            <Row gutter={[12, 12]}>
              {VOICE_COMMAND_EXAMPLES.map((item, index) => (
                <Col key={index} xs={24} sm={12} md={24} lg={24}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => handleCommandClick(item.command)}
                    style={{
                      cursor: 'pointer',
                      borderLeft: '4px solid #1890ff',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '500' }}>
                        🎤 "{item.command}"
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {item.description}
                      </div>
                      <Space size="small" wrap>
                        <Tag color={getPriorityColor(item.priority)} style={{ cursor: 'pointer' }}>
                          {item.priority}
                        </Tag>
                        {item.deadline !== 'None' && (
                          <Tag color={getDeadlineColor(item.deadline)}>
                            📅 {item.deadline}
                          </Tag>
                        )}
                      </Space>
                      <Space size="small" style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Tooltip title="Copy command">
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.command);
                            }}
                          />
                        </Tooltip>
                      </Space>
                      {copiedCommand === item.command && (
                        <div style={{ fontSize: '11px', color: '#52c41a', fontWeight: 'bold' }}>
                          ✓ Copied!
                        </div>
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
  ];

  if (historyCommands.length > 0) {
    items.unshift({
      key: '0',
      label: (
        <div>
          <ClearOutlined style={{ marginRight: '8px', color: '#faad14' }} />
          <strong>Recent Commands</strong>
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
            ({historyCommands.length} commands)
          </span>
        </div>
      ),
      children: (
        <Row gutter={[12, 12]}>
          {historyCommands.map((command, index) => (
            <Col key={index} xs={24} sm={12} md={24} lg={24}>
              <Card
                size="small"
                style={{ borderLeft: '4px solid #faad14' }}
                hoverable
                onClick={() => handleCommandClick(command)}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    "{command}"
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHistoryCommands(historyCommands.filter((_, i) => i !== index));
                    }}
                  >
                    Remove from history
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ),
    });
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <Alert
        message="💡 Voice Command Tips"
        description="Say 'Create task' followed by the task details. Examples: Priority (high, urgent, low), Deadline (today, tomorrow, this week)"
        type="info"
        showIcon
        closable
        style={{ marginBottom: '16px' }}
      />
      <Collapse items={items} />
    </div>
  );
}

export default VoiceCommandHelper;
