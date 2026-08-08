import axios from 'axios'

const HOSTINGER_API_URL =
  'https://api.mail.hostinger.com/api/v1'

function getToken() {
  const token = process.env.HOSTINGER_API_TOKEN

  if (!token) {
    throw new Error('HOSTINGER_API_TOKEN is missing')
  }

  return token
}

function getHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/json',
  }
}

export async function getMailboxes() {
  const response = await axios.get(
    `${HOSTINGER_API_URL}/me`,
    {
      headers: getHeaders(),
    }
  )

  return response.data
}

export async function getUserInbox(
  mailboxResourceId: string,
  folder: string = 'INBOX',
  page: number = 1,
  perPage: number = 10
) {
  const response = await axios.get(
    `${HOSTINGER_API_URL}/mailboxes/${mailboxResourceId}/folders/${folder}/messages`,
    {
      headers: getHeaders(),
      params: {
        page,
        perPage,
      },
    }
  )

  return response.data
}

export async function getUserMessageContent(
  mailboxResourceId: string,
  folder: string = 'INBOX',
  uid: number
) {
  const response = await axios.get(
    `${HOSTINGER_API_URL}/mailboxes/${mailboxResourceId}/folders/${folder}/messages/${uid}/text`,
    {
      headers: getHeaders(),
    }
  )

  return response.data
}