// let googleapis = require('../../libs/googleapis');
const imagekit = require('../../libs/imagekit');
const path = require('path');

module.exports = {
    // uploadImage: async (req, res, next) => {
    //     try {
    //         let response = await googleapis.upload(req.file);
    //         return res.json({
    //             status: true,
    //             message: 'Image uploaded',
    //             err: null,
    //             data: response
    //         });
    //     } catch (error) {
    //         next(error);
    //     }
    // },

    // listImages: async (req, res) => {
    //     try {
    //         let response = await googleapis.list();
    //         return res.json({
    //             status: true,
    //             message: 'List of images',
    //             err: null,
    //             data: response
    //         });
    //     } catch (error) {
    //         next(error);
    //     }
    // },

    imageKitUpload: async (req, res, next) => {
        try {
            let strFile = req.file.buffer.toString('base64');
            let { url } = await imagekit.upload({
                fileName: Date.now() + path.extname(req.file.originalname),
                file: strFile,
                folder: process.env.APP_NAME
            });

            return res.json({
                status: true,
                message: 'Image uploaded',
                err: null,
                data: url
            });
        } catch (error) {
            next(error);
        }
    },

    imageKitList: async (req, res, next) => {
        try {
            let files = await imagekit.listFiles({
                path: process.env.APP_NAME
            });

            files = files.map(file => {
                return {
                    name: file.name,
                    url: file.url
                };
            });

            return res.json({
                status: true,
                message: 'List of images',
                err: null,
                data: files
            });
        } catch (error) {
            next(error);
        }
    }
};