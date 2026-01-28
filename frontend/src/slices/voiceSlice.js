import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  commands: [],
  isRecording: false,
  lastCommand: null,
  loading: false,
  error: null,
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
      state.error = null;
    },
    stopRecording: (state) => {
      state.isRecording = false;
    },
    processCommandStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    processCommandSuccess: (state, action) => {
      state.lastCommand = action.payload;
      state.commands.push(action.payload);
      state.loading = false;
    },
    processCommandFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    fetchCommandsSuccess: (state, action) => {
      state.commands = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  startRecording,
  stopRecording,
  processCommandStart,
  processCommandSuccess,
  processCommandFailure,
  fetchCommandsSuccess,
  clearError,
} = voiceSlice.actions;

export default voiceSlice.reducer;
