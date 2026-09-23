import { supabase } from '../shared/utils/supabase.ts';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const SIGNED_URL_TTL_SECONDS = 60 * 60;

function extensionFromUri(uri: string, fallback = 'jpg') {
  const match = /\.([a-zA-Z0-9]+)$/.exec(uri.split('?')[0]);
  return match ? match[1].toLowerCase() : fallback;
}

// Stores the image at "<user_id>/<objectId>.<ext>"; bucket RLS policies rely on
// the first path segment being the owner's id.
async function uploadUserImage(
  bucket: string,
  objectId: string,
  fileUri: string,
): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? 'Not authenticated');
  }

  const response = await fetch(fileUri);
  const blob = await response.blob();

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Please choose a photo under 2MB.');
  }

  const path = `${userData.user.id}/${objectId}.${extensionFromUri(fileUri)}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: blob.type || 'image/jpeg',
  });

  if (error) {
    throw new Error(error.message);
  }
  return path;
}

async function getSignedImageUrl(
  bucket: string,
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to load image.');
  }
  return data.signedUrl;
}

async function deleteImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

export const imageStorageService = {
  uploadUserImage,
  getSignedImageUrl,
  deleteImage,
};
