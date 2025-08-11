const SuperCategory = require("../models/SuperCategory");
const cloudinary = require("../config/cloudinary");

const superCategoryController = {
  create: async (req, res) => {
    try {
      console.log('=== CREATE SUPER CATEGORY DEBUG ===');
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('req.file:', req.file);
      console.log('req.files:', req.files);
      console.log('=== END DEBUG ===');

      const { language_id, name, status, country } = req.body;
      let imageUrl = null;

      // Validate required fields
      if (!language_id || !name || !country) {
        console.log('Validation failed for name:', name);
        return res.status(400).json({
          success: false,
          message: "Language ID, Name and country are required",
        });
      }

      // Handle image upload if file is present
      if (req.file) {
        const imageFile = req.file;
        console.log('Processing image upload:', imageFile.originalname);

        try {
          // Convert buffer to base64 for Cloudinary
          const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'supercategories',
            resource_type: 'auto',
            timeout: 60000
          });
          imageUrl = result.secure_url;
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading image: ' + uploadError.message
          });
        }
      } else {
        console.log('No image file found in request');
      }

      console.log('Final imageUrl before saving:', imageUrl);

      const newSuperCategory = new SuperCategory({
        language_id,
        name: name,
        // description: description,
        status,
        country,
        image: imageUrl
      });
      await newSuperCategory.save();

      console.log('Saved super category with image:', newSuperCategory.image);

      res.status(201).json({
        success: true,
        message: "Super Category created successfully",
        data: newSuperCategory,
      });
    } catch (error) {
      console.error("Error in create super category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let cond = {}
      if (req.query.search) {
        cond['$or'] = [
          { name: { $regex: req.query.search, $options: "i" } },
        ]
      }

      // Get total count for pagination
      const totalCount = await SuperCategory.countDocuments(cond);

      // Get paginated data with populated language
      const data = await SuperCategory.find(cond)
        .populate('language_id')
        .populate('country')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        message: "Super Categories fetched successfully",
        data,
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
      console.error("Error in getAll super category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      let imageUrl = null;



      // Handle image upload if file is present
      if (req.file) {
        try {
          // Delete old image if exists
          const existingSuperCategory = await SuperCategory.findById(id);
          if (existingSuperCategory && existingSuperCategory.image) {
            const publicId = existingSuperCategory.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }

          // Convert buffer to base64 for Cloudinary
          const imageFile = req.file;
          const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'supercategories',
            resource_type: 'auto',
            timeout: 60000
          });
          imageUrl = result.secure_url;
          updateData.image = imageUrl;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading image: ' + uploadError.message
          });
        }
      }

      const updated = await SuperCategory.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Super Category not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Super Category updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error in update super category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Delete image from Cloudinary if exists
      const superCategory = await SuperCategory.findById(id);
      if (superCategory && superCategory.image) {
        try {
          const publicId = superCategory.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
        }
      }

      const deleted = await SuperCategory.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Super Category not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Super Category deleted successfully",
        data: deleted,
      });
    } catch (error) {
      console.error("Error in delete super category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  superCategoryById: async (req, res) => {
    try {
      const superCategory = await SuperCategory.find({ language_id: req.body.language_id, country: req.body.country });
      res.status(200).json({
        success: true,
        // message: "Super Category deleted successfully",
        data: superCategory,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  },

  getAllSuperCategory: async (req, res) => {
    try {
      const data = await SuperCategory.find().populate('language_id').populate('country').sort({ createdAt: -1 })

      res.status(200).json({
        success: true,
        message: "Super Categories fetched successfully",
        data,
      });
    } catch (error) {
      console.error("Error in getAll super category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};

module.exports = superCategoryController;
