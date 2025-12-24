const SubCategory = require('../models/SubCategory');
const cloudinary = require('../config/cloudinary');

const subCategoryController = {
  createSubCategory: async (req, res) => {
    try {
      // console.log('=== CREATE SUB CATEGORY DEBUG ===');
      // console.log('Full request body:', JSON.stringify(req.body, null, 2));
      // console.log('req.file:', req.file);
      // console.log('req.files:', req.files);
      // console.log('=== END DEBUG ===');

      const { language_id, country, super_category_id, category_id, name, status, order } = req.body;
      let imageUrl = null;

      if (!language_id || !country || !super_category_id || !category_id || !name) {
        return res.status(400).json({
          success: false,
          message: 'Language ID, country, super category ID, Category ID and name are required',
        });
      }



      // Handle image upload if file is present
      if (req.file) {
        const imageFile = req.file;
        // console.log('Processing image upload:', imageFile.originalname);

        try {
          // Convert buffer to base64 for Cloudinary
          const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'subcategories',
            resource_type: 'auto',
            timeout: 60000
          });
          imageUrl = result.secure_url;
          // console.log('Image uploaded successfully:', imageUrl);
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

      // console.log('Final imageUrl before saving:', imageUrl);

      const newSubCategory = new SubCategory({
        language_id,
        country,
        super_category_id,
        category_id,
        name: name,
        status,
        order,
        image: imageUrl
      });
      await newSubCategory.save();

      // Populate the category_id before sending response
      const populatedSubCategory = await SubCategory.findById(newSubCategory._id)
        .populate('category_id', 'name');

      // console.log('Saved sub category with image:', populatedSubCategory.image);

      res.status(201).json({
        success: true,
        message: 'Sub Category created successfully',
        data: populatedSubCategory,
      });
    } catch (error) {
      console.error('Error in createSubCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },

  getAllSubCategories: async (req, res) => {
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
      const totalCount = await SubCategory.countDocuments(cond);

      // Get paginated data with populated fields
      const subCategories = await SubCategory.find(cond)
        .populate('category_id', 'name')
        .populate('language_id')
        .populate('super_category_id')
        .populate('country')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        message: 'Sub Categories fetched successfully',
        data: subCategories,
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
      console.error('Error in getAllSubCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },

  updateSubCategory: async (req, res) => {
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
          const existingSubCategory = await SubCategory.findById(id);
          if (existingSubCategory && existingSubCategory.image) {
            const publicId = existingSubCategory.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }

          // Convert buffer to base64 for Cloudinary
          const imageFile = req.file;
          const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'subcategories',
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

      const updated = await SubCategory.findByIdAndUpdate(id, updateData, { new: true })
        .populate('category_id', 'name');

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Sub Category not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Sub Category updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error in updateSubCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },

  deleteSubCategory: async (req, res) => {
    try {
      const { id } = req.params;

      // Delete image from Cloudinary if exists
      const subCategory = await SubCategory.findById(id);
      if (subCategory && subCategory.image) {
        try {
          const publicId = subCategory.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
        }
      }

      const deleted = await SubCategory.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Sub Category not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Sub Category deleted successfully',
        data: deleted,
      });
    } catch (error) {
      console.error('Error in deleteSubCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },

  getAllSubCategory: async (req, res) => {
    try {
      const subCategories = await SubCategory.find().populate('category_id', 'name').populate('language_id').populate('super_category_id').populate('country').sort({ createdAt: -1 })
      res.status(200).json({
        success: true,
        message: 'Sub Categories fetched successfully',
        data: subCategories,
      });
    } catch (error) {
      console.error('Error in getAllSubCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },

  getSubCategoryBySuperCategoryById: async (req, res) => {
    console.log('DDD', req.body)
    try {
      const subCategories = await SubCategory.find({ super_category_id: req.body.super_category_id, language_id: req.body.language_id, status: "active" }).populate('category_id', 'name')
        .populate('language_id')
        .populate('super_category_id')
        .populate('country')
        .sort({ order: 1 });
      res.status(200).json({
        success: true,
        // message: "Super Category deleted successfully",
        data: subCategories,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  },

};

module.exports = subCategoryController;
