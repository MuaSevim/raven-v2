import { storage } from './firebaseConfig';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const buildShipmentImagePath = (shipmentId: string, fileName: string) =>
  `shipments/${shipmentId}/${fileName}`;

const buildAvatarImagePath = (userId: string, fileName: string) =>
  `avatars/${userId}/${fileName}`;

const createFileName = (uri: string) => {
  const baseName = uri.split('/').pop() || `image-${Date.now()}.jpg`;
  const hasExtension = baseName.includes('.');
  return hasExtension ? baseName : `${baseName}.jpg`;
};

const fetchBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Unable to read image data for upload');
  }
  return response.blob();
};

export const uploadShipmentImage = async (
  shipmentId: string,
  imageUri: string,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const fileName = createFileName(imageUri);
  const storageRef = ref(storage, buildShipmentImagePath(shipmentId, fileName));
  const blob = await fetchBlob(imageUri);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (!onProgress || snapshot.totalBytes === 0) {
          return;
        }
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(percent);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      },
    );
  });
};

export const uploadAvatarImage = async (
  userId: string,
  imageUri: string,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const fileName = createFileName(imageUri);
  const storageRef = ref(storage, buildAvatarImagePath(userId, fileName));
  const blob = await fetchBlob(imageUri);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (!onProgress || snapshot.totalBytes === 0) {
          return;
        }
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(percent);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      },
    );
  });
};
