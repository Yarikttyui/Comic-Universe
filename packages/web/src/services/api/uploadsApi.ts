import api from './client';

export const uploadsApi = {
  uploadFile: (file: File, context?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (context) formData.append('context', context);
    return api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
