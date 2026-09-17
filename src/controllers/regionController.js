const mongoose = require('mongoose');
const Region = require('../models/Region');
const Country = require('../models/Country');
const cloudinary = require('../config/cloudinary');

const uploadImage = async (file) => {
  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: 'regions',
    resource_type: 'auto',
    timeout: 60000
  });
  return result.secure_url;
};

const destroyImage = async (url) => {
  if (!url) return;
  const publicId = url.split('/').pop().split('.')[0];
  await cloudinary.uploader.destroy(publicId);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const duplicateResponse = (res) => res.status(400).json({
  success: false,
  message: 'A region with this name already exists for the selected language',
});

const regionController = {

  createRegion: async (req, res) => {
    try {
      const { region_name, order, status, language_id } = req.body;

      if (!region_name || !region_name.trim() || !language_id) {
        return res.status(400).json({
          success: false,
          message: 'Region name and language are required',
        });
      }

      const exists = await Region.findOne({
        language_id,
        region_name: { $regex: `^${escapeRegex(region_name.trim())}$`, $options: 'i' },
      });
      if (exists) return duplicateResponse(res);

      let imageUrl = null;
      if (req.file) {
        try {
          imageUrl = await uploadImage(req.file);
        } catch (uploadError) {
          console.error('Cloudinary upload error for region:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading region image: ' + uploadError.message
          });
        }
      }

      const newRegion = new Region({
        language_id,
        region_name: region_name.trim(),
        order: order || 0,
        status,
        image: imageUrl,
      });
      await newRegion.save();
      await newRegion.populate('language_id');

      res.status(201).json({
        success: true,
        message: 'Region created successfully',
        data: newRegion,
      });
    } catch (error) {
      if (error.code === 11000) return duplicateResponse(res);
      console.error('Error in createRegion:', error);
      res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
  },

  getAllRegions: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const cond = {};
      if (req.query.search) {
        cond.region_name = { $regex: escapeRegex(req.query.search), $options: 'i' };
      }
      if (req.query.language_id) {
        cond.language_id = req.query.language_id;
      }

      const totalCount = await Region.countDocuments(cond);

      const regions = await Region.find(cond)
        .populate('language_id')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Number of cities in each region, shown in the admin table
      const counts = await Country.aggregate([
        { $match: { region_id: { $in: regions.map((r) => r._id) } } },
        { $group: { _id: '$region_id', count: { $sum: 1 } } },
      ]);
      const countById = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
      regions.forEach((r) => { r.city_count = countById[String(r._id)] || 0; });

      const totalPages = Math.ceil(totalCount / limit);

      res.status(200).json({
        success: true,
        message: 'Regions fetched successfully',
        data: regions,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      });
    } catch (error) {
      console.error('Error in getAllRegions:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Unpaginated list for admin dropdowns
  getAllRegion: async (req, res) => {
    try {
      const regions = await Region.find().populate('language_id').sort({ order: 1, region_name: 1 });
      res.status(200).json({
        success: true,
        message: 'Regions fetched successfully',
        data: regions,
      });
    } catch (error) {
      console.error('Error in getAllRegion:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getRegionsByLang: async (req, res) => {
    try {
      const { lang_id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(lang_id)) {
        return res.status(400).json({ success: false, message: 'Invalid language id' });
      }

      const regionIds = await Country.distinct('region_id', {
        language_id: lang_id,
        status: 'active',
        region_id: { $ne: null },
      });

      const regions = await Region.find({
        _id: { $in: regionIds },
        language_id: lang_id,
        status: 'active',
      }).sort({ order: 1, region_name: 1 });

      res.status(200).json({
        success: true,
        message: 'Regions fetched successfully',
        data: regions,
      });
    } catch (error) {
      console.error('Error in getRegionsByLang:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getRegionById: async (req, res) => {
    try {
      const region = await Region.findById(req.params.id).populate('language_id');
      if (!region) {
        return res.status(404).json({ success: false, message: 'Region not found' });
      }
      res.status(200).json({ success: true, message: 'Region fetched', data: region });
    } catch (error) {
      console.error('Error in getRegionById:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  updateRegion: async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await Region.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Region not found' });
      }

      const updateData = {};
      ['region_name', 'language_id', 'order', 'status'].forEach((key) => {
        if (req.body[key] !== undefined && req.body[key] !== '') updateData[key] = req.body[key];
      });
      if (updateData.region_name) updateData.region_name = updateData.region_name.trim();

      const languageId = updateData.language_id || existing.language_id;
      const regionName = updateData.region_name || existing.region_name;
      const duplicate = await Region.findOne({
        _id: { $ne: id },
        language_id: languageId,
        region_name: { $regex: `^${escapeRegex(regionName)}$`, $options: 'i' },
      });
      if (duplicate) return duplicateResponse(res);

      // Cities must share their region's language, so a region with cities can't switch language
      if (updateData.language_id && String(updateData.language_id) !== String(existing.language_id)) {
        const cityCount = await Country.countDocuments({ region_id: id });
        if (cityCount > 0) {
          return res.status(400).json({
            success: false,
            message: `This region has ${cityCount} city(ies) assigned. Move them to another region before changing its language.`,
          });
        }
      }

      if (req.file) {
        try {
          if (existing.image) await destroyImage(existing.image);
          updateData.image = await uploadImage(req.file);
        } catch (uploadError) {
          console.error('Cloudinary upload error for region:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading region image: ' + uploadError.message
          });
        }
      }

      const updated = await Region.findByIdAndUpdate(id, updateData, { new: true }).populate('language_id');
      res.status(200).json({ success: true, message: 'Region updated', data: updated });
    } catch (error) {
      if (error.code === 11000) return duplicateResponse(res);
      console.error('Error in updateRegion:', error);
      res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
  },

  deleteRegion: async (req, res) => {
    try {
      const { id } = req.params;

      // Deleting a region in use would silently orphan its cities
      const cityCount = await Country.countDocuments({ region_id: id });
      if (cityCount > 0) {
        return res.status(400).json({
          success: false,
          message: `This region has ${cityCount} city(ies) assigned. Move or delete them before deleting the region.`,
        });
      }

      const deleted = await Region.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Region not found' });
      }

      try {
        await destroyImage(deleted.image);
      } catch (deleteError) {
        console.error('Error deleting region image from Cloudinary:', deleteError);
      }

      res.status(200).json({ success: true, message: 'Region deleted', data: deleted });
    } catch (error) {
      console.error('Error in deleteRegion:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};

module.exports = regionController;
