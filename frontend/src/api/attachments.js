import client from './client';

// Upload uses multipart/form-data, so it bypasses the default JSON content-type.
export const uploadAttachment = (requestId, file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post(`/attachments/${requestId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const attachmentDownloadUrl = (attachmentId) => `/api/attachments/${attachmentId}/download`;
