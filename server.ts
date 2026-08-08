// import express from 'express'
// import path from 'path'
// import { createServer as createViteServer } from 'vite'
// import dotenv from 'dotenv'
// import axios from 'axios'

// dotenv.config()

// async function startServer() {
//   const app = express()
//   const PORT = 3000

//   app.use(express.json())

//   // Hostinger API Proxy: Get Mailboxes
//   app.get('/api/hostinger/me', async (_req, res) => {
//     const token = process.env.HOSTINGER_API_TOKEN

//     if (!token) {
//       console.log('[Server] HOSTINGER_API_TOKEN not provided, returning mock mailboxes')
//       return res.json({
//         data: {
//           mailboxes: [
//             { resourceId: 'mbx-101', address: 'admin@dbb.com' },
//             { resourceId: 'mbx-102', address: 'support@dbb.com' },
//             { resourceId: 'mbx-103', address: 'sales@dbb.com' },
//           ]
//         }
//       })
//     }

//     try {
//       const response = await axios.get('https://api.mail.hostinger.com/api/v1/me', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: 'application/json',
//         },
//       })
//       return res.json(response.data)
//     } catch (error: any) {
//       console.error('[Server] Hostinger API error (me):', error.response?.data || error.message)
//       return res.json({
//         data: {
//           mailboxes: [
//             { resourceId: 'mbx-101', address: 'admin@dbb.com' },
//             { resourceId: 'mbx-102', address: 'support@dbb.com' },
//             { resourceId: 'mbx-103', address: 'sales@dbb.com' },
//           ]
//         }
//       })
//     }
//   })

//   // Hostinger API Proxy: Get Inbox Messages
//   app.get('/api/hostinger/userinbox', async (req, res) => {
//     const token = process.env.HOSTINGER_API_TOKEN
//     const mailboxResourceId = (req.query.mailboxResourceId as string) || 'mbx-101'
//     const folder = (req.query.folder as string) || 'INBOX'
//     const page = parseInt((req.query.page as string) || '1', 10)
//     const perPage = parseInt((req.query.perPage as string) || '10', 10)

//     const allMockMessages = [
//       {
//         uid: 18,
//         id: 'msg-18',
//         path: 'INBOX',
//         date: '2026-08-01T08:33:39Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'Marc Louie Cabigas', address: 'marclouiecabigas9@gmail.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         inReplyTo: '<CAPP3wyW5sYiaaHZTzkPkC9o3+n7c1Y+DFPiSj_Rw5aZ-kOL1eg@mail.gmail.com>',
//         messageId: '<CAPP3wyWruNe3UGgASyHqE+3PLPq8FbsRCeRS8aM7G+fy=t8z3A@mail.gmail.com>',
//         size: 22231,
//         subject: 'Re: Test Email',
//         snippet: 'Here is the attached document with updated email guidelines and compliance policies.',
//         body: 'Hello team,\n\nI have reviewed the guidelines. Please find the attached document for full details.\n\nBest regards,\nMarc Louie',
//         attachments: [
//           {
//             id: 'YXR0YWNobWVudDpJTkJPWDoxODoy',
//             contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//             sizeBytes: 11790,
//             inline: false,
//             filename: 'New email guidelines.docx'
//           }
//         ]
//       },
//       {
//         uid: 17,
//         id: 'msg-17',
//         path: 'INBOX',
//         date: '2026-08-01T08:12:45Z',
//         flags: [],
//         unseen: true,
//         from: { name: 'Hostinger Operations', address: 'no-reply@hostinger.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: 'Hostinger Mail Service Status Update',
//         snippet: 'All Hostinger API mail nodes are operating at optimal performance and low latency.',
//         body: 'Dear Hostinger Customer,\n\nAll mail services are healthy. No scheduled maintenance is expected for this node.\n\nThank you for choosing Hostinger Mail Services.',
//         attachments: []
//       },
//       {
//         uid: 14,
//         id: 'msg-14',
//         path: 'INBOX',
//         date: '2026-07-30T08:59:58Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'System Auditor', address: 'audit@dbb.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: 'Weekly Infrastructure & Audit Log',
//         snippet: 'Routine diagnostic complete: zero security anomalies detected across all accounts.',
//         body: 'System Audit Summary:\n- 0 Authentication failures\n- PIN session validated\n- Hostinger API Sync: Operational',
//         attachments: []
//       },
//       {
//         uid: 13,
//         id: 'msg-13',
//         path: 'INBOX',
//         date: '2026-07-30T08:56:27Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'GitHub Notifications', address: 'notifications@github.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: '[GitHub] New release published in mcfaith9/dbbmail',
//         snippet: 'Release v1.2.0 is live with enhanced Vue table and pagination components.',
//         body: 'A new release v1.2.0 was created in repository mcfaith9/dbbmail.\n\nChanges include table pagination and Hostinger API integration.',
//         attachments: []
//       },
//       {
//         uid: 12,
//         id: 'msg-12',
//         path: 'INBOX',
//         date: '2026-07-30T08:53:02Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'DBB Security Team', address: 'security@dbb.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: 'Security Alert: New Sign-in from Desktop Client',
//         snippet: 'New desktop application session initiated successfully.',
//         body: 'A new session was authenticated using PIN authorization.\n\nIf this was not you, please rotate your security credentials immediately.',
//         attachments: []
//       },
//       {
//         uid: 11,
//         id: 'msg-11',
//         path: 'INBOX',
//         date: '2026-07-30T08:52:13Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'Billing Department', address: 'billing@hostinger.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: 'Hostinger Business Mail Renewal Confirmation',
//         snippet: 'Your subscription for DBB Mail domain hosting has been renewed.',
//         body: 'Thank you for your payment. Your Hostinger mailboxes remain active with unlimited storage quotas.',
//         attachments: []
//       },
//       {
//         uid: 10,
//         id: 'msg-10',
//         path: 'INBOX',
//         date: '2026-07-30T08:48:26Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'DevOps Team', address: 'devops@dbb.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: 'Deployment Success: Cloud Run Container Updated',
//         snippet: 'Production deployment completed in 1.4 seconds.',
//         body: 'Container build succeeded. All health check probes returned HTTP 200 OK.',
//         attachments: []
//       },
//       {
//         uid: 9,
//         id: 'msg-9',
//         path: 'INBOX',
//         date: '2026-07-30T08:48:11Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'Support Desk', address: 'support@dbb.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: 'Customer Inquiry #8820: Mailbox setup guidance',
//         snippet: 'User requested assistance with custom SMTP settings.',
//         body: 'Inquiry details attached. Ticket status marked as resolved.',
//         attachments: []
//       },
//       {
//         uid: 8,
//         id: 'msg-8',
//         path: 'INBOX',
//         date: '2026-07-29T05:14:23Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'Analytics Service', address: 'no-reply@analytics.dbb.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: 'Monthly Email Analytics Summary',
//         snippet: 'Total incoming messages: 142. Response rate: 98.4%.',
//         body: 'Monthly performance metrics are compiled for your active Hostinger mailboxes.',
//         attachments: []
//       },
//       {
//         uid: 7,
//         id: 'msg-7',
//         path: 'INBOX',
//         date: '2026-07-29T05:12:58Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'Design Team', address: 'design@dbb.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: 'Updated UI Assets & Typography Specs',
//         snippet: 'Review the latest designs for the Mail Index interface.',
//         body: 'Hi Marc,\n\nPlease review the updated Shadcn table styling with interactive pagination controls.',
//         attachments: []
//       },
//       {
//         uid: 6,
//         id: 'msg-6',
//         path: 'INBOX',
//         date: '2026-07-29T05:10:40Z',
//         flags: ['\\Seen'],
//         unseen: false,
//         from: { name: 'Hostinger API Bot', address: 'api-bot@hostinger.com' },
//         to: [{ name: 'Marc Louie', address: mailboxResourceId }],
//         subject: 'Welcome to Hostinger Mailbox API v1',
//         snippet: 'API key successfully provisioned and scopes verified.',
//         body: 'Your API token has read/write permissions for mailboxes, folders, and message retrieval.',
//         attachments: []
//       }
//     ]

//     function getPagedData(items: typeof allMockMessages) {
//       const startIndex = (page - 1) * perPage
//       const endIndex = startIndex + perPage
//       const pagedData = items.slice(startIndex, endIndex)
//       const totalPages = Math.ceil(items.length / perPage) || 1

//       return {
//         data: pagedData,
//         pagination: {
//           page: page,
//           perPage: perPage,
//           total: items.length,
//           totalPages: totalPages
//         }
//       }
//     }

//     if (!token) {
//       console.log(`[Server] HOSTINGER_API_TOKEN not provided, returning mock paginated messages for ${mailboxResourceId}`)
//       return res.json(getPagedData(allMockMessages))
//     }

//     try {
//       const response = await axios.get(
//         `https://api.mail.hostinger.com/api/v1/mailboxes/${mailboxResourceId}/folders/${folder}/messages`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: 'application/json',
//           },
//           params: { page, perPage },
//         }
//       )
//       return res.json(response.data)
//     } catch (error: any) {
//       console.error('[Server] Hostinger API error (userinbox):', error.response?.data || error.message)
//       return res.json(getPagedData(allMockMessages))
//     }
//   })

//   // Vite middleware in dev mode
//   if (process.env.NODE_ENV !== 'production') {
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: 'spa',
//     })
//     app.use(vite.middlewares)
//   } else {
//     const distPath = path.join(process.cwd(), 'dist')
//     app.use(express.static(distPath))
//     app.get('*all', (_req, res) => {
//       res.sendFile(path.join(distPath, 'index.html'))
//     })
//   }

//   app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server running on http://0.0.0.0:${PORT}`)
//   })
// }

// startServer()
