import axios from 'axios'

// const API_BASE_URL = 'http://127.0.0.1:8000'
const API_BASE_URL = 'http://192.168.1.6:8000'
const UPLOAD_ENDPOINT = `${API_BASE_URL}/upload`

/**
 * Upload a credit-risk dataset and run backend analysis.
 *
 * @param {File} file - CSV or XLSX file selected by the user.
 * @returns {Promise<object>} API response containing validation, metrics, and segments.
 */
export async function uploadDataset(file) {
  if (!(file instanceof File)) {
    throw new Error('A valid file must be provided for upload.')
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await axios.post(UPLOAD_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg ?? JSON.stringify(item)).join(', ')
        : typeof detail === 'string'
          ? detail
          : error.message

      throw new Error(message || 'Failed to upload dataset.')
    }

    throw new Error('An unexpected error occurred while uploading the dataset.')
  }
}
