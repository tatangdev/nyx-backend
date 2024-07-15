const googleapis = require('../../libs/googleapis');
const { Readable } = require('stream');

module.exports = {
    uploadImage: async (req, res) => {
        // let imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        // return res.send(req.file);
        let response = await googleapis.upload(req.file);
        res.json({
            status: true,
            message: 'Image uploaded',
            err: null,
            data: response
        });
    },

    listImages: async (req, res) => {
        let response = await googleapis.list();
        res.json({
            status: true,
            message: 'List of images',
            err: null,
            data: response
        });
    }
};