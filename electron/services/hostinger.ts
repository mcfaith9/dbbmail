import axios from 'axios'

export async function getHostingerMe() {
  const token = process.env.HOSTINGER_API_TOKEN

  if (!token) {
    throw new Error('HOSTINGER_API_TOKEN is missing')
  }

  const response = await axios.get(
    'https://api.mail.hostinger.com/api/v1/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  )

  return response.data
}