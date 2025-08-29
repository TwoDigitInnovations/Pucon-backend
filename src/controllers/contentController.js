const Content = require('../models/Content');
const cloudinary = require('../config/cloudinary');

const contentController = {
  createContent: async (req, res) => {
    try {
      let { language_id, country, super_category_id, category_id, sub_category_id, content, status, logo, } = req.body;

      if (!language_id || !country || !super_category_id || !category_id || !sub_category_id) {
        return res.status(400).json({
          success: false,
          message: 'Language, Country, Super Category, Category, and Sub Category are required',
        });
      }

      let imageUrl = null;
      let carouselImageUrl = [];
      console.log('AA', req.files)
      if (req.files.logo) {
        const imageFile = req.files.logo[0];

        try {
          const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'content',
            resource_type: 'auto',
            timeout: 60000
          });
          imageUrl = result.secure_url;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading image: ' + uploadError.message
          });
        }
      } else {
        // console.log('No image file found in request');
      }

      if (req.files.carouselImage) {
        const imageFile = req.files.carouselImage;
        try {
          await Promise.all(imageFile.map(async (file) => {
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

            const result = await cloudinary.uploader.upload(base64Image, {
              folder: 'content',
              resource_type: 'auto',
              timeout: 60000
            });
            carouselImageUrl.push(result.secure_url)
          }));
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading image: ' + uploadError.message
          });
        }
      } else {
        // console.log('No image file found in request');
      }

      const newContent = new Content({
        language_id,
        country,
        super_category_id,
        category_id,
        sub_category_id,
        content,
        status,
        logo: imageUrl,
        carouselImage: carouselImageUrl,
      });

      await newContent.save();

      // Populate the saved content before sending response
      const populatedContent = await Content.findById(newContent._id)
        .populate('language_id')
        .populate('country')
        .populate('super_category_id')
        .populate('category_id')
        .populate('sub_category_id');

      res.status(201).json({
        success: true,
        message: 'Content created successfully',
        data: populatedContent,
      });
    } catch (error) {
      console.error('Error in createContent:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getAllContent: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count for pagination

      let cond = {}
      if (req.query.subCategory) {
        cond.sub_category_id = req.query.subCategory
      }
      const totalCount = await Content.countDocuments(cond);
      // Get paginated data with populated fields
      const contents = await Content.find(cond)
        .populate('language_id')
        .populate('country')
        .populate('super_category_id')
        .populate('category_id')
        .populate('sub_category_id')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Sort by newest first

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        message: 'Content fetched successfully',
        data: contents,
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
      console.error('Error in getAllContent:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  updateContent: async (req, res) => {
    try {
      const { id } = req.params;
      req.body.carouselImage = JSON.parse(req.body.oldImages)
      let imageUrl = null;
      let carouselImageUrl = [];

      if (req.files.logo) {
        const imageFile = req.files.logo[0];

        try {
          const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'content',
            resource_type: 'auto',
            timeout: 60000
          });
          imageUrl = result.secure_url;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading image: ' + uploadError.message
          });
        }
      } else {
        // console.log('No image file found in request');
      }

      if (req.files.carouselImage) {
        const imageFile = req.files.carouselImage;
        try {
          await Promise.all(imageFile.map(async (file) => {
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

            const result = await cloudinary.uploader.upload(base64Image, {
              folder: 'content',
              resource_type: 'auto',
              timeout: 60000
            });
            carouselImageUrl.push(result.secure_url)
          }));
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading image: ' + uploadError.message
          });
        }
      } else {
        // console.log('No image file found in request');
      }

      if (imageUrl) {
        req.body.logo = imageUrl
      }

      if (carouselImageUrl) {
        // const newcontent = await Content.findById(id)
        req.body.carouselImage = [...req.body.carouselImage, ...carouselImageUrl]
      }

      const updated = await Content.findByIdAndUpdate(id, req.body, { new: true })
        .populate('language_id')
        .populate('country')
        .populate('super_category_id')
        .populate('category_id')
        .populate('sub_category_id');

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }



      res.status(200).json({
        success: true,
        message: 'Content updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error in updateContent:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  deleteContent: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Content.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Content deleted successfully',
        data: deleted,
      });
    } catch (error) {
      console.error('Error in deleteContent:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  contentBySubCategoryId: async (req, res) => {
    try {
      const content = await Content.findOne({ language_id: req.body.language_id, country: req.body.country, sub_category_id: req.body.sub_category_id });
      res.status(200).json({
        success: true,
        // message: "Super Category deleted successfully",
        data: content,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  },
};

module.exports = contentController;
