interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
}

class CloudinaryService {
  private cloudName = 'your-cloud-name'; // Replace with your Cloudinary cloud name
  private uploadPreset = 'chat-app-preset'; // Replace with your upload preset

  async uploadImage(file: File): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'chat-app/images');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
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
        resource_type: 'image',
        format: file.type.split('/')[1]
      };
    }
  }

  async uploadVideo(file: File): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'chat-app/videos');
    formData.append('resource_type', 'video');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
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

  async uploadAudio(blob: Blob): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', blob, 'voice-message.webm');
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'chat-app/audio');
    formData.append('resource_type', 'video'); // Cloudinary treats audio as video

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
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

  getOptimizedImageUrl(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}): string {
    const { width = 400, height = 400, quality = 'auto', format = 'auto' } = options;
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
  }
}

export const cloudinaryService = new CloudinaryService();