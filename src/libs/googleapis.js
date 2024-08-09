// const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL, GOOGLE_ACCESS_TOKEN, DEFAULT_FOLDER_ID } = process.env;

// const { google } = require('googleapis');
// const { Readable } = require('stream');

// const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL);
// oauth2Client.setCredentials({ access_token: GOOGLE_ACCESS_TOKEN });

// const drive = google.drive({
//     version: 'v3',
//     auth: oauth2Client
// });

// async function grantPermission(fileId) {
//     try {
//         await drive.permissions.create({
//             fileId: fileId,
//             requestBody: {
//                 role: 'reader',
//                 type: 'anyone',
//             }
//         });
//         console.log('fileId', fileId);
//         return;
//     } catch (error) {
//         throw new Error(`Failed to grant permission: ${error.message}`);
//     }
// }

// async function upload({ originalname, mimetype, buffer }) {
//     try {
//         let file = await drive.files.create({
//             resource: {
//                 name: originalname,
//                 parents: [DEFAULT_FOLDER_ID]
//             },
//             media: {
//                 mimeType: mimetype,
//                 body: Readable.from(buffer)
//             },
//             fields: 'id'
//         });
//         grantPermission(file.data.id);
//         return {
//             file_id: file.data.id,
//             file_name: originalname,
//             file_url: `https://drive.google.com/file/d/${file.data.id}/view`,
//             thumbnail_url: `https://drive.google.com/thumbnail?id=${file.data.id}&sz=w1000`
//         };
//     } catch (error) {
//         throw new Error(`Failed to upload file: ${error.message}`);
//     }
// }

// async function list() {
//     try {
//         let res = await drive.files.list({
//             pageSize: 10,
//             q: `'${DEFAULT_FOLDER_ID}' in parents and trashed = false`,
//             fields: 'nextPageToken, files(id, name)',
//         });
//         let files = res.data.files;
//         if (files.length) {
//             let filesWithUrls = await Promise.all(files.map(async (file) => {
//                 return {
//                     file_id: file.id,
//                     file_name: file.name,
//                     file_url: `https://drive.google.com/file/d/${file.id}/view`,
//                     thumbnail_url: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`
//                 };
//             }));
//             return filesWithUrls;
//         } else {
//             return [];
//         }
//     } catch (error) {
//         throw new Error(`Failed to list files: ${error.message}`);
//     }
// }

// module.exports = { upload, list, };