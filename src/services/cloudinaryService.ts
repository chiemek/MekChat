interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
class CloudinaryService {
  private cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo-cloud';
  private uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'chat-app-preset';

  async uploadImage(file: File, onProgress?: (progress: UploadProgress) => void): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'chat-app/images');
    formData.append('quality', 'auto');
    formData.append('fetch_format', 'auto');

    try {
      const response = await this.uploadWithProgress(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        formData,
        onProgress
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Fallback to local URL for demo
      return {
        secure_url: URL.createObjectURL(file),
        public_id: 'demo-' + Date.now(),
        resource_type: 'image',
        format: file.type.split('/')[1]
      };
    }
  }

  async uploadVideo(file: File, onProgress?: (progress: UploadProgress) => void): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'chat-app/videos');
    formData.append('resource_type', 'video');
    formData.append('quality', 'auto');

    try {
      const response = await this.uploadWithProgress(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
        formData,
        onProgress
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Fallback to local URL for demo
      return {
        secure_url: URL.createObjectURL(file),
        public_id: 'demo-' + Date.now(),
        resource_type: 'video',
        format: file.type.split('/')[1]
      };
    }
  }

  async uploadAudio(blob: Blob, onProgress?: (progress: UploadProgress) => void): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', blob, 'voice-message.webm');
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'chat-app/audio');
    formData.append('resource_type', 'video'); // Cloudinary treats audio as video

    try {
      const response = await this.uploadWithProgress(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
        formData,
        onProgress
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Fallback to local URL for demo
      return {
        secure_url: URL.createObjectURL(blob),
        public_id: 'demo-' + Date.now(),
        resource_type: 'video',
        format: 'webm'
      };
    }
  }

  // DELETE - Delete uploaded asset
  async deleteAsset(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
    try {
      // Note: This requires server-side implementation for security
      // Client-side deletion is not recommended for production
      console.warn('Asset deletion should be implemented server-side for security');
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  }

  // Helper method for upload with progress
  private uploadWithProgress(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            };
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            ok: true,
            json: () => Promise.resolve(JSON.parse(xhr.responseText))
          } as Response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', url);
      xhr.send(formData);
    });
  }
  getOptimizedImageUrl(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
    crop?: string;
  } = {}): string {
    const { width = 400, height = 400, quality = 'auto', format = 'auto', crop = 'fill' } = options;
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
  }

  // Generate thumbnail for video
  getVideoThumbnail(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: string;
  } = {}): string {
    const { width = 400, height = 300, quality = 'auto' } = options;
    return `https://res.cloudinary.com/${this.cloudName}/video/upload/w_${width},h_${height},c_fill,q_${quality},f_jpg,so_0/${publicId}.jpg`;
  }
}

export const cloudinaryService = new CloudinaryService();