import axiosClient from './axiosClient';

const meetingApi = {
  scheduleGoogleMeet: (meetData) => {
    return axiosClient.post('/meetings/schedule-meet', meetData);
  },

  scheduleMeeting: (meetingData) => {
    return axiosClient.post('/meetings/schedule', meetingData);
  },

  getAllMeetings: () => {
    return axiosClient.get('/meetings');
  },

  getMeetings: () => {
    return axiosClient.get('/meetings');
  },

  updateMeeting: (meetingId, meetingData) => {
    return axiosClient.put(`/meetings/${meetingId}`, meetingData);
  },

  deleteMeeting: (meetingId) => {
    return axiosClient.delete(`/meetings/${meetingId}`);
  },

  syncWithGoogleCalendar: (meetingId) => {
    return axiosClient.post(`/meetings/${meetingId}/sync-calendar`);
  },

  syncTaskWithCalendar: (taskId) => {
    return axiosClient.post(`/meetings/sync/${taskId}`);
  },
};

export default meetingApi;
