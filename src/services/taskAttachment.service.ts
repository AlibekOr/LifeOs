import {
  MAX_IMAGE_BYTES,
  imageStorageService,
} from './imageStorage.service.ts';

export const TASK_ATTACHMENTS_BUCKET = "Today's Schedule";
export const MAX_ATTACHMENT_BYTES = MAX_IMAGE_BYTES;

export const taskAttachmentService = {
  uploadTaskAttachment: (taskId: string, fileUri: string) =>
    imageStorageService.uploadUserImage(
      TASK_ATTACHMENTS_BUCKET,
      taskId,
      fileUri,
    ),
  getTaskAttachmentUrl: (path: string) =>
    imageStorageService.getSignedImageUrl(TASK_ATTACHMENTS_BUCKET, path),
  deleteTaskAttachment: (path: string) =>
    imageStorageService.deleteImage(TASK_ATTACHMENTS_BUCKET, path),
};
