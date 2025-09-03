const Carousel = require("../models/Carousel");
const cloudinary = require("../config/cloudinary");

const carouselController = {
    createCarousel: async (req, res) => {
        try {
            const { logo, image, language_id, title, description, order, status } = req.body;
            let logoUrl = null;
            let imageUrl = null;

            // if (!logo || !image || !title) {
            //     return res.status(400).json({
            //         success: false,
            //         message: 'Logo, image and title are required',
            //     });
            // }

            // const exists = await Country.findOne({ country_code });
            // if (exists) {
            //   return res.status(400).json({
            //     success: false,
            //     message: 'Country code already exists',
            //   });
            // }

            if (req.files && req.files.logo && req.files.logo[0]) {
                const logoFile = req.files.logo[0];

                try {
                    const base64Image = `data:${logoFile.mimetype};base64,${logoFile.buffer.toString('base64')}`;
                    const result = await cloudinary.uploader.upload(base64Image, {
                        folder: 'carousel/logo',
                        resource_type: 'auto',
                        timeout: 60000 // 60 second timeout
                    });
                    logoUrl = result.secure_url;
                } catch (uploadError) {
                    console.error('Cloudinary upload error for flag:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error uploading logo image: ' + uploadError.message
                    });
                }
            }

            if (req.files && req.files.image && req.files.image[0]) {
                const imageFile = req.files.image[0];

                try {
                    const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
                    const result = await cloudinary.uploader.upload(base64Image, {
                        folder: 'carousel/image',
                        resource_type: 'auto',
                        timeout: 60000 // 60 second timeout
                    });
                    imageUrl = result.secure_url;
                } catch (uploadError) {
                    console.error('Cloudinary upload error for map:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error uploading image: ' + uploadError.message
                    });
                }
            }

            const newCountry = new Carousel({
                logo: logoUrl,
                image: imageUrl,
                language_id,
                title,
                description,
                order,
                status,
            });
            await newCountry.save();

            res.status(201).json({
                success: true,
                message: 'Carousel created successfully',
                data: newCountry,
            });
        } catch (error) {
            console.error('Error in createCarousel:', error);
            res.status(500).json({ success: false, message: 'Server error: ' + error.message });
        }
    },

    getAllCarousel: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            let cond = {}
            if (req.query.search) {
                cond['$or'] = [
                    { title: { $regex: req.query.search, $options: "i" } },
                ]
            }

            // Get total count for pagination
            const totalCount = await Carousel.countDocuments(cond);

            // Get paginated data with populated language
            const carousel = await Carousel.find(cond)
                .populate('language_id')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            res.status(200).json({
                success: true,
                message: 'Carousel fetched successfully',
                data: carousel,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage,
                    hasPrevPage,
                    limit
                }
            });
        } catch (error) {
            console.error('Error in getAllCarousel:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    updateCarousel: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };

            // Extract country_name if it exists
            const { title } = req.body;
            if (title) {
                updateData.title = title;
            }

            let logoUrl = null;
            let imageUrl = null;

            // Handle flag image upload if file is present
            if (req.files && req.files.logo && req.files.logo[0]) {
                try {
                    // Delete old image if exists
                    const existingCountry = await Carousel.findById(id);
                    if (existingCountry && existingCountry.logo) {
                        const publicId = existingCountry.logo.split('/').pop().split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                    }

                    // Convert buffer to base64 for Cloudinary
                    const flagFile = req.files.logo[0];
                    const base64Image = `data:${flagFile.mimetype};base64,${flagFile.buffer.toString('base64')}`;

                    const result = await cloudinary.uploader.upload(base64Image, {
                        folder: 'carousel/logo',
                        resource_type: 'auto',
                        timeout: 60000 // 60 second timeout
                    });
                    logoUrl = result.secure_url;
                    updateData.logo = logoUrl;
                } catch (uploadError) {
                    console.error('Cloudinary upload error for flag:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error uploading logo image: ' + uploadError.message
                    });
                }
            }

            // Handle map image upload if file is present
            if (req.files && req.files.image && req.files.image[0]) {
                try {
                    // Delete old map image if exists
                    const existingCountry = await Carousel.findById(id);
                    if (existingCountry && existingCountry.image) {
                        const publicId = existingCountry.image.split('/').pop().split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                    }

                    // Convert buffer to base64 for Cloudinary
                    const mapFile = req.files.image[0];
                    const base64Image = `data:${mapFile.mimetype};base64,${mapFile.buffer.toString('base64')}`;

                    const result = await cloudinary.uploader.upload(base64Image, {
                        folder: 'carousel/image',
                        resource_type: 'auto',
                        timeout: 60000 // 60 second timeout
                    });
                    imageUrl = result.secure_url;
                    updateData.image = imageUrl;
                } catch (uploadError) {
                    console.error('Cloudinary upload error for map:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error uploading image: ' + uploadError.message
                    });
                }
            }

            const updated = await Carousel.findByIdAndUpdate(id, updateData, { new: true });
            if (!updated) {
                return res.status(404).json({ success: false, message: 'Carousel not found' });
            }
            res.status(200).json({ success: true, message: 'Carousel updated', data: updated });
        } catch (error) {
            console.error('Error in updateCarousel:', error);
            res.status(500).json({ success: false, message: 'Server error: ' + error.message });
        }
    },

    deleteCarousel: async (req, res) => {
        try {
            const { id } = req.params;

            // Delete images from Cloudinary if exists
            const carousel = await Carousel.findById(id);
            if (carousel) {
                try {
                    if (carousel.logo) {
                        const publicId = carousel.logo.split('/').pop().split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                    }
                    if (carousel.image) {
                        const publicId = carousel.image.split('/').pop().split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                    }
                } catch (deleteError) {
                    console.error('Error deleting images from Cloudinary:', deleteError);
                }
            }

            const deleted = await Carousel.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Carousel not found' });
            }
            res.status(200).json({ success: true, message: 'Carousel deleted', data: deleted });
        } catch (error) {
            console.error('Error in deleteCarousel:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    getAllCarouse: async (req, res) => {
        try {
            const carousel = await Carousel.find({ language_id: req.query.language_id, status: "active" }).sort({ order: 1 });

            // console.log('AAAAAA', countries)

            res.status(200).json({
                success: true,
                message: 'Carousel fetched successfully',
                data: carousel,
            });
        } catch (error) {
            console.error('Error in getAllCarousel:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },
};

module.exports = carouselController;