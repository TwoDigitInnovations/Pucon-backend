const HomeScreen = require("../models/HomeScreen");
const cloudinary = require("../config/cloudinary");

const IMAGE_FOLDER = 'homescreen';

const publicIdFromUrl = (url) => {
    const fileName = url.split('/').pop().split('.')[0];
    return `${IMAGE_FOLDER}/${fileName}`;
};

const homeScreenController = {
    getHomeScreen: async (req, res) => {
        try {
            // Only one home screen setting exists, create it lazily the first time.
            let homeScreen = await HomeScreen.findOne();
            if (!homeScreen) {
                homeScreen = await HomeScreen.create({});
            }

            res.status(200).json({
                success: true,
                message: 'Home screen fetched successfully',
                data: homeScreen,
            });
        } catch (error) {
            console.error('Error in getHomeScreen:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    updateHomeScreen: async (req, res) => {
        try {
            let homeScreen = await HomeScreen.findOne();
            if (!homeScreen) {
                homeScreen = new HomeScreen();
            }

            if (req.file) {
                try {
                    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                    const result = await cloudinary.uploader.upload(base64Image, {
                        folder: IMAGE_FOLDER,
                        resource_type: 'auto',
                        timeout: 60000 // 60 second timeout
                    });

                    const oldImage = homeScreen.image;
                    homeScreen.image = result.secure_url;

                    // Remove the replaced image only after the new one is stored.
                    if (oldImage) {
                        try {
                            await cloudinary.uploader.destroy(publicIdFromUrl(oldImage));
                        } catch (deleteError) {
                            console.error('Error deleting old home screen image:', deleteError);
                        }
                    }
                } catch (uploadError) {
                    console.error('Cloudinary upload error for home screen:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error uploading image: ' + uploadError.message
                    });
                }
            }

            if (req.body.status) {
                homeScreen.status = req.body.status;
            }

            await homeScreen.save();

            res.status(200).json({
                success: true,
                message: 'Home screen updated',
                data: homeScreen,
            });
        } catch (error) {
            console.error('Error in updateHomeScreen:', error);
            res.status(500).json({ success: false, message: 'Server error: ' + error.message });
        }
    },
};

module.exports = homeScreenController;
