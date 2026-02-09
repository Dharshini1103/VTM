import React, { useState } from 'react';
import { Calendar, Badge, Modal, Typography, Space, Tag, Button, Divider } from 'antd';
import { 
  CalendarOutlined, ClockCircleOutlined, VideoCameraOutlined, 
  PhoneOutlined, TeamOutlined, GoogleOutlined, UserOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

function MeetingCalendar({ meetings, onDateSelect, onMeetingClick }) {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedMeetings, setSelectedMeetings] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'GOOGLE_MEET': return <GoogleOutlined style={{ color: '#4285F4' }} />;
      case 'VIDEO_CALL': return <VideoCameraOutlined style={{ color: '#52c41a' }} />;
      case 'PHONE_CALL': return <PhoneOutlined style={{ color: '#1890ff' }} />;
      case 'IN_PERSON': return <TeamOutlined style={{ color: '#722ed1' }} />;
      default: return <CalendarOutlined />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'blue';
      case 'IN_PROGRESS': return 'processing';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getListData = (value) => {
    const dateMeetings = meetings.filter(meeting => 
      dayjs(meeting.startDateTime).format('YYYY-MM-DD') === value.format('YYYY-MM-DD')
    );

    return dateMeetings.map(meeting => ({
      type: getStatusColor(meeting.status),
      content: meeting.title,
      meeting: meeting
    }));
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.slice(0, 3).map((item, index) => (
          <li key={index} style={{ marginBottom: 2 }}>
            <Badge 
              status={item.type} 
              text={
                <span 
                  style={{ 
                    fontSize: '12px', 
                    cursor: 'pointer',
                    color: '#666'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMeetingClick(item.meeting);
                  }}
                >
                  {item.content}
                </span>
              } 
            />
          </li>
        ))}
        {listData.length > 3 && (
          <li style={{ fontSize: '12px', color: '#999' }}>
            +{listData.length - 3} more
          </li>
        )}
      </ul>
    );
  };

  const monthCellRender = (value) => {
    const monthMeetings = meetings.filter(meeting => 
      dayjs(meeting.startDateTime).format('YYYY-MM') === value.format('YYYY-MM')
    );
    
    return (
      <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
        {monthMeetings.length} meetings
      </div>
    );
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const dateMeetings = meetings.filter(meeting => 
      dayjs(meeting.startDateTime).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );
    setSelectedMeetings(dateMeetings);
    setIsModalVisible(true);
    
    if (onDateSelect) {
      onDateSelect(date, dateMeetings);
    }
  };

  const handleMeetingClick = (meeting) => {
    if (onMeetingClick) {
      onMeetingClick(meeting);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedMeetings([]);
  };

  return (
    <div className="meeting-calendar">
      <div className="calendar-legend" style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 16, 
        padding: 12, 
        background: '#fafafa', 
        borderRadius: 8 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GoogleOutlined style={{ color: '#4285F4' }} />
          <Text style={{ fontSize: 12 }}>Google Meet</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <VideoCameraOutlined style={{ color: '#52c41a' }} />
          <Text style={{ fontSize: 12 }}>Video Call</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PhoneOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: 12 }}>Phone Call</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined style={{ color: '#722ed1' }} />
          <Text style={{ fontSize: 12 }}>In Person</Text>
        </div>
      </div>

      <Calendar
        dateCellRender={dateCellRender}
        monthCellRender={monthCellRender}
        onSelect={handleDateSelect}
        value={selectedDate}
        style={{ 
          border: '1px solid #f0f0f0', 
          borderRadius: 8,
          background: 'white'
        }}
      />

      <Modal
        title={
          <Space>
            <CalendarOutlined />
            {selectedDate.format('MMMM DD, YYYY')}
            <Badge count={selectedMeetings.length} />
          </Space>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {selectedMeetings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <CalendarOutlined style={{ fontSize: 48, color: '#ccc' }} />
              <div style={{ marginTop: 16, color: '#999' }}>
                No meetings scheduled for this date
              </div>
            </div>
          ) : (
            selectedMeetings.map((meeting, index) => (
              <div 
                key={meeting.id}
                style={{
                  background: '#fafafa',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleMeetingClick(meeting)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fafafa';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <Space style={{ marginBottom: 8 }}>
                      {getMeetingTypeIcon(meeting.meetingType)}
                      <Text strong>{meeting.title}</Text>
                      <Badge status={getStatusColor(meeting.status)} />
                    </Space>
                    
                    <div style={{ marginBottom: 8 }}>
                      <Space>
                        <ClockCircleOutlined />
                        <Text type="secondary">
                          {dayjs(meeting.startDateTime).format('HH:mm')} - 
                          {dayjs(meeting.endDateTime).format('HH:mm')}
                        </Text>
                      </Space>
                    </div>

                    {meeting.description && (
                      <Paragraph 
                        ellipsis={{ rows: 2 }} 
                        style={{ 
                          marginBottom: 8, 
                          fontSize: 12, 
                          color: '#666' 
                        }}
                      >
                        {meeting.description}
                      </Paragraph>
                    )}

                    {meeting.attendees && meeting.attendees.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <Space wrap>
                          {meeting.attendees.slice(0, 3).map(attendee => (
                            <Tag key={attendee.id} style={{ fontSize: 11 }}>
                              <UserOutlined style={{ marginRight: 4 }} />
                              {attendee.firstName} {attendee.lastName}
                            </Tag>
                          ))}
                          {meeting.attendees.length > 3 && (
                            <Tag style={{ fontSize: 11 }}>
                              +{meeting.attendees.length - 3} more
                            </Tag>
                          )}
                        </Space>
                      </div>
                    )}

                    {meeting.meetLink && (
                      <div>
                        <Tag color="blue" style={{ fontSize: 11 }}>
                          <VideoCameraOutlined style={{ marginRight: 4 }} />
                          Meeting Link Available
                        </Tag>
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(meeting.startDateTime).format('MMM DD')}
                    </Text>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

export default MeetingCalendar;
