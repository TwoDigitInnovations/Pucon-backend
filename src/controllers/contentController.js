const Content = require('../models/Content');

const contentController = {
  createContent: async (req, res) => {
    try {
      console.log('=== CREATE CONTENT DEBUG ===');
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('=== END DEBUG ===');

      let {
        language_id,
        // country_id,
        country,
        super_category_id,
        category_id,
        sub_category_id,
        content,
        status
      } = req.body;

      console.log('Extracted values:', {
        language_id,
        // country_id,
        country,
        super_category_id,
        category_id,
        sub_category_id,
        content: content ? 'present' : 'missing',
        status
      });

      if (!language_id || !country || !super_category_id || !category_id || !sub_category_id) {
        console.log('Validation failed - missing fields:', {
          hasLanguageId: !!language_id,
          // hasCountryId: !!country_id,
          hasCountryId: !!country,
          hasSuperCategoryId: !!super_category_id,
          hasCategoryId: !!category_id,
          hasSubCategoryId: !!sub_category_id,
          hasContent: !!content,
          contentLength: content ? content.length : 0,
          contentTrimmed: content ? content.trim() : ''
        });
        return res.status(400).json({
          success: false,
          message: 'Language, Country, Super Category, Category, and Sub Category are required',
        });
      }

      // Optional content validation
      if (!content || content.trim() === '') {
        console.log('Content is empty, but continuing...');
        // Set default content if empty
        content = '<p>No content provided</p>';
      }

      const newContent = new Content({
        language_id,
        // country_id,
        country,
        super_category_id,
        category_id,
        sub_category_id,
        content,
        status
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
      const totalCount = await Content.countDocuments();

      // Get paginated data with populated fields
      const contents = await Content.find()
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
      console.log('AAAAAAA', req.body.sub_category_id);

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
