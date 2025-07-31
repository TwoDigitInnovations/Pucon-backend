const Language = require('../models/Language');
const cloudinary = require('../config/cloudinary');

const languageController = {

  createLanguage: async (req, res) => {
    try {
      console.log('=== CREATE LANGUAGE DEBUG ===');
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('req.file:', req.file);
      console.log('req.files:', req.files);
      console.log('=== END DEBUG ===');

      const { language_name, language_code, status } = req.body;
      let imageUrl = null;

      if (!language_name || !language_code) {
        console.log('Validation failed for language_name:', language_name);
        return res.status(400).json({
          success: false,
          message: 'language_name and language_code are required',
        });
      }

      const existingLang = await Language.findOne({ language_code });
      if (existingLang) {
        return res.status(400).json({
          success: false,
          message: 'Language code already exists',
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
            folder: 'languages',
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

      const newLanguage = new Language({ 
        language_name, 
        language_code, 
        status,
        image: imageUrl
      });
      await newLanguage.save();

      console.log('Saved language with image:', newLanguage.image);

      res.status(201).json({
        success: true,
        message: 'Language created successfully',
        data: newLanguage,
      });
    } catch (error) {
      console.error('Error in createLanguage:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },

  getAllLanguages: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await Language.countDocuments();
      
      // Get paginated data
      const languages = await Language.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        message: 'Languages fetched successfully',
        data: languages,
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
      console.error('Error in getAllLanguages:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },

  getLanguageById: async (req, res) => {
    try {
      const { id } = req.params;
      const language = await Language.findById(id);
      if (!language) {
        return res.status(404).json({
          success: false,
          message: 'Language not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Language fetched successfully',
        data: language,
      });
    } catch (error) {
      console.error('Error in getLanguageById:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },

  updateLanguage: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      let imageUrl = null;

      // Parse language_name if it's a string
      if (req.body.language_name && typeof req.body.language_name === 'string') {
        try {
          updateData.language_name = JSON.parse(req.body.language_name);
        } catch (parseError) {
          console.error('Error parsing language_name:', parseError);
          return res.status(400).json({
            success: false,
            message: 'Invalid language_name format',
          });
        }
      }

      // Handle image upload if file is present
      if (req.file) {
        try {
          // Delete old image if exists
          const existingLanguage = await Language.findById(id);
          if (existingLanguage && existingLanguage.image) {
            const publicId = existingLanguage.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }

          // Convert buffer to base64 for Cloudinary
          const imageFile = req.file;
          const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
          
          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'languages',
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

      const updatedLanguage = await Language.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!updatedLanguage) {
        return res.status(404).json({
          success: false,
          message: 'Language not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Language updated successfully',
        data: updatedLanguage,
      });
    } catch (error) {
      console.error('Error in updateLanguage:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },


  deleteLanguage: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedLanguage = await Language.findByIdAndDelete(id);

      if (!deletedLanguage) {
        return res.status(404).json({
          success: false,
          message: 'Language not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Language deleted successfully',
        data: deletedLanguage,
      });
    } catch (error) {
      console.error('Error in deleteLanguage:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },




};

module.exports = languageController;
