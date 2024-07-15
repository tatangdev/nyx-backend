module.exports = {
    uploadImage: (req, res) => {
        let imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        res.json({
            status: true,
            message: 'Image uploaded',
            err: null,
            data: imageUrl
        });
    }
};