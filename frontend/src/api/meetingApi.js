import axiosClient from './axiosClient';

const meetingApi = {
  scheduleZoomMeet: (meetData) => {
    return axiosClient.post('/meetings/schedule-zoom', meetData);
  },

  scheduleMeeting: (meetingData) => {
    return axiosClient.post('/meetings/schedule', meetingData);
  },

  getAllMeetings: () => {
    return axiosClient.get('/meetings');
  },

  getMyMeetings: () => {
    return axiosClient.get('/meetings/my-meetings');
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

  canJoinMeeting: (meetingId) => {
    return axiosClient.get(`/meetings/${meetingId}/can-join`);
  },
};

export default meetingApi;
