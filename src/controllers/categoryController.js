const Category = require("../models/Category");
const cloudinary = require("../config/cloudinary");

const categoryController = {
  create: async (req, res) => {
    try {
      console.log('=== CREATE CATEGORY DEBUG ===');
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('req.file:', req.file);
      console.log('req.files:', req.files);
      console.log('=== END DEBUG ===');

      const { language_id, super_category_id, name, order, status, country } = req.body;
      let imageUrl = null;

      // Validate required fields
      if (!language_id || !super_category_id || !name || !country) {
        console.log('Validation failed:', {
          super_category_id,
          name,
          language_id,
          country
        });
        return res.status(400).json({
          success: false,
          message: "Language ID, super category ID, name and country are required",
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
            folder: 'categories',
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

      const newCategory = new Category({
        language_id,
        super_category_id,
        name: name,
        order,
        status,
        image: imageUrl,
        country
      });
      await newCategory.save();

      console.log('Saved category with image:', newCategory.image);

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: newCategory,
      });
    } catch (error) {
      console.error("Error in create category:", error);
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
      const totalCount = await Category.countDocuments(cond);

      // Get paginated data with populated fields
      const data = await Category.find(cond)
        .populate("super_category_id", "name")
        .populate("language_id")
        .populate("country")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
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
      console.error("Error in getAll category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      let imageUrl = null;

      // Parse name if it's a string
      // if (req.body.name && typeof req.body.name === 'string') {
      //   try {
      //     updateData.name = JSON.parse(req.body.name);
      //   } catch (parseError) {
      //     console.error('Error parsing name:', parseError);
      //     return res.status(400).json({
      //       success: false,
      //       message: 'Invalid name format',
      //     });
      //   }
      // }

      // Handle image upload if file is present
      if (req.file) {
        try {
          // Delete old image if exists
          const existingCategory = await Category.findById(id);
          if (existingCategory && existingCategory.image) {
            const publicId = existingCategory.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }

          // Convert buffer to base64 for Cloudinary
          const imageFile = req.file;
          const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'categories',
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

      const updated = await Category.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error in update category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Delete image from Cloudinary if exists
      const category = await Category.findById(id);
      if (category && category.image) {
        try {
          const publicId = category.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
        }
      }

      const deleted = await Category.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
        data: deleted,
      });
    } catch (error) {
      console.error("Error in delete category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  getCategoryBySuperCategoryId: async (req, res) => {
    try {
      const category = await Category.find({ super_category_id: req.body.super_category_id, language_id: req.body.language_id });
      res.status(200).json({
        success: true,
        // message: "Super Category deleted successfully",
        data: category,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  },

  getAllCategory: async (req, res) => {
    try {
      const data = await Category.find().populate("super_category_id", "name").populate("language_id").populate("country").sort({ createdAt: -1 })
      res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data,
      });
    } catch (error) {
      console.error("Error in getAll category:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};

module.exports = categoryController;
