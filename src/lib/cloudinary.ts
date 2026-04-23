const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

type CloudinaryUploadOptions = {
  folder?: string
}

export const uploadFileToCloudinary = async (
  file: File,
  { folder = 'products' }: CloudinaryUploadOptions = {},
): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary unsigned upload is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json()

  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed.')
  }

  return payload.secure_url as string
}

export const uploadImageToCloudinary = async (file: File): Promise<string> =>
  uploadFileToCloudinary(file, { folder: 'products' })
