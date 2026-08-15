import axios from 'axios'

const HOSTINGER_API_URL =
  'https://api.mail.hostinger.com/api/v1'

type HostingerAccount = 'DMBB' | 'DBB'
import type { MailFolder } from '@/types/mail'

const tokens: Record<HostingerAccount, string | undefined> = {
  DMBB: 'dc8b477effe663b4d309e98dcccec8646dae3653ad4f86eb72cefe028ec375e0',
  DBB: '99ee5c9718ecd052f48aca1dbfd346893351b73645561c4210cab654b1f07dd7',
}

function getToken(account: HostingerAccount) {
  const token = tokens[account]

  if (!token) {
    throw new Error(
      `HOSTINGER API token for ${account} is missing`
    )
  }

  return token
}

function getHeaders(account: HostingerAccount) {
  return {
    Authorization: `Bearer ${getToken(account)}`,
    Accept: 'application/json',
  }
}

/*
|--------------------------------------------------------------------------
| Get mailboxes
|--------------------------------------------------------------------------
*/

async function getMailboxesByToken(
  account: HostingerAccount
) {

  const response = await axios.get(
    `${HOSTINGER_API_URL}/me`,
    {
      headers: getHeaders(account),
    }
  )

  return response.data
}

export async function getMailboxes() {
  const accounts: HostingerAccount[] = [
    'DMBB',
    'DBB',
  ]

  const results = await Promise.all(
    accounts.map(async (account) => {
      const response =
        await getMailboxesByToken(account)

      const mailboxes =
        response?.data?.mailboxes ?? []

      return mailboxes.map((mailbox: any) => ({
        resourceId: mailbox.resourceId,
        address: mailbox.address,
        hostingerAccount: account,
      }))
    })
  )

  const combined = results.flat()

  return {
    data: combined,
  }
}

/*
|--------------------------------------------------------------------------
| Get mailbox messages
|--------------------------------------------------------------------------
*/

export async function getUserInbox(
  mailboxResourceId: string,
  folder: MailFolder = 'INBOX',
  hostingerAccount: HostingerAccount = 'DMBB',
  page = 1,
  perPage = 10
) {

  const response = await axios.get(
    `${HOSTINGER_API_URL}/mailboxes/${encodeURIComponent(
      mailboxResourceId
    )}/folders/${encodeURIComponent(folder)}/messages`,
    {
      headers: getHeaders(hostingerAccount),
      params: {
        page,
        perPage,
      },
    }
  )

  return response.data
}

/*
|--------------------------------------------------------------------------
| Get message content
|--------------------------------------------------------------------------
*/

export async function getUserMessageContent(
  mailboxResourceId: string,
  folder: MailFolder,
  uid: number,
  hostingerAccount: HostingerAccount = 'DMBB'
) {
  const response = await axios.get(
    `${HOSTINGER_API_URL}/mailboxes/${encodeURIComponent(mailboxResourceId)}/folders/${encodeURIComponent(folder)}/messages/${uid}/text`,
    {
      headers: getHeaders(hostingerAccount),
    }
  )

  return response.data
}

/*
|--------------------------------------------------------------------------
| Get mailbox quota
|--------------------------------------------------------------------------
*/

export async function getMailboxQuota(
  mailboxResourceId: string,
  hostingerAccount: HostingerAccount,
) {
  const response = await axios.get(
    `${HOSTINGER_API_URL}/mailboxes/${encodeURIComponent(
      mailboxResourceId,
    )}/quota`,
    {
      headers: getHeaders(hostingerAccount),
    },
  )

  return response.data
}

/*
|--------------------------------------------------------------------------
| Get message attachment
|--------------------------------------------------------------------------
*/

export async function getMessageAttachment(
  mailboxResourceId: string,
  folder: string = 'INBOX',
  uid: number,
  attachmentId: string,
  hostingerAccount: HostingerAccount = 'DMBB'
) {
  const response = await axios.get(
    `${HOSTINGER_API_URL}/mailboxes/${mailboxResourceId}/folders/${folder}/messages/${uid}/attachments/${encodeURIComponent(attachmentId)}`,
    {
      headers: getHeaders(hostingerAccount),
      responseType: 'arraybuffer',
    }
  )

  return response.data
}
