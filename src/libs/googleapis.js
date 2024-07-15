const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL, GOOGLE_ACCESS_TOKEN, DEFAULT_FOLDER_ID } = process.env;

const { google } = require('googleapis');
const { Readable } = require('stream');

const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL);
oauth2Client.setCredentials({ access_token: GOOGLE_ACCESS_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});

function grantPermission(fileId) {
    return new Promise((resolve, reject) => {
        drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            }
        }, (err, permission) => {
            if (err) {
                reject(err);
            } else {
                resolve(permission.data.id);
            }
        });
    });
}

// https://drive.google.com/file/d/168Kewn52MSvp5nIGj-l5RNQcsEdUD_DM/view
module.exports = {
    upload: ({ originalname, mimetype, buffer }) => {
        return new Promise((resolve, reject) => {
            drive.files.create({
                resource: {
                    name: originalname,
                    parents: [DEFAULT_FOLDER_ID]
                },
                media: {
                    mimeType: mimetype,
                    body: Readable.from(buffer)
                },
                fields: 'id'
            }, (err, file) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(file.data.id);
                }
            });
        });
    },

    list: () => {
        return new Promise((resolve, reject) => {
            drive.files.list({
                pageSize: 10,
                q: `'${DEFAULT_FOLDER_ID}' in parents and trashed = false`,
                fields: 'nextPageToken, files(id, name)',
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    res.data.files.forEach(file => {
                        grantPermission(file.id);
                    });
                    resolve(res.data.files);
                }
            });
        });
    },

    grantPermission
}

