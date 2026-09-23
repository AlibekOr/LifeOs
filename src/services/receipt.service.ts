import { imageStorageService } from './imageStorage.service.ts';

const RECEIPTS_BUCKET = 'receipts';

export const receiptService = {
  uploadReceipt: (transactionId: string, fileUri: string) =>
    imageStorageService.uploadUserImage(
      RECEIPTS_BUCKET,
      transactionId,
      fileUri,
    ),
  getReceiptUrl: (path: string) =>
    imageStorageService.getSignedImageUrl(RECEIPTS_BUCKET, path),
  deleteReceipt: (path: string) =>
    imageStorageService.deleteImage(RECEIPTS_BUCKET, path),
};
