import axios from 'axios'

const HOSTINGER_API_URL =
  'https://api.mail.hostinger.com/api/v1'

type HostingerAccount = 'DMBB' | 'DBB'

const tokens: Record<HostingerAccount, string | undefined> = {
  DMBB: process.env.HOSTINGER_API_TOKEN,
  DBB: process.env.HOSTINGER_API_TOKEN_DBB,
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
  folder: string = 'INBOX',
  hostingerAccount: HostingerAccount = 'DMBB'
) {

  const response = await axios.get(
    `${HOSTINGER_API_URL}/mailboxes/${mailboxResourceId}/folders/${folder}/messages`,
    {
      headers: getHeaders(hostingerAccount),
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
  folder: string,
  uid: number,
  hostingerAccount: HostingerAccount = 'DMBB'
) {
  // console.log(
  //   '[Hostinger] Fetching message content:',
  //   {
  //     mailboxResourceId,
  //     folder,
  //     uid,
  //     hostingerAccount,
  //   }
  // )

  const response = await axios.get(
    `${HOSTINGER_API_URL}/mailboxes/${mailboxResourceId}/folders/${folder}/messages/${uid}/text`,
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
