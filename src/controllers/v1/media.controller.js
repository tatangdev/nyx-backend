const googleapis = require('../../libs/googleapis');
const { Readable } = require('stream');

module.exports = {
    uploadImage: async (req, res, next) => {
        try {
            let response = await googleapis.upload(req.file);
            return res.json({
                status: true,
                message: 'Image uploaded',
                err: null,
                data: response
            });
        } catch (error) {
            next(error);
        }
    },

    listImages: async (req, res) => {
        try {
            let response = await googleapis.list();
            return res.json({
                status: true,
                message: 'List of images',
                err: null,
                data: response
            });
        } catch (error) {
            next(error);
        }
    }
};