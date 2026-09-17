
const mongoose = require('mongoose');
const Country = require('../models/Country');
const Region = require('../models/Region');
const cloudinary = require('../config/cloudinary');

const resolveRegionId = async (regionId, languageId) => {
  if (regionId === undefined) return { value: undefined };
  if (!regionId || regionId === 'null') return { value: null };
  if (!mongoose.Types.ObjectId.isValid(regionId)) return { error: 'Invalid region' };

  const region = await Region.findById(regionId);
  if (!region) return { error: 'Selected region does not exist' };
  if (languageId && String(region.language_id) !== String(languageId)) {
    return { error: 'Selected region belongs to a different language than the city' };
  }
  return { value: region._id };
};


const countryController = {


  createCountry: async (req, res) => {
    try {
      // console.log('=== CREATE COUNTRY DEBUG ===');
      // console.log('Full request body:', JSON.stringify(req.body, null, 2));
      // console.log('Request body keys:', Object.keys(req.body));
      // console.log('country_name type:', typeof req.body.country_name);
      // console.log('country_name value:', req.body.country_name);

      if (req.body.country_name) {
        // console.log('country_name.en:', req.body.country_name.en);
        // console.log('country_name.hi:', req.body.country_name.hi);
      }

      // console.log('country_code:', req.body.country_code);
      // console.log('status:', req.body.status);
      // console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
      // console.log('=== END DEBUG ===');

      // Extract country_name and other fields
      const { country_name, region_id, order, status, language_id } = req.body;
      let imageUrl = null;
      let mapImageUrl = null;

      // country_code

      // Validate required fields
      if (!country_name || !language_id) {
        // console.log('Validation failed:', {
        //   country_name,
        //   language_id
        // });
        return res.status(400).json({
          success: false,
          message: 'City name, and language are required',
        });
      }

      const regionResult = await resolveRegionId(region_id, language_id);
      if (regionResult.error) {
        return res.status(400).json({ success: false, message: regionResult.error });
      }

      // const exists = await Country.findOne({ country_code });
      // if (exists) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'Country code already exists',
      //   });
      // }

      // Handle flag image upload if file is present
      if (req.files && req.files.image && req.files.image[0]) {
        const flagFile = req.files.image[0];
        // console.log('Processing flag image upload:', flagFile.originalname);

        try {
          // Convert buffer to base64 for Cloudinary
          const base64Image = `data:${flagFile.mimetype};base64,${flagFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'countries/flags',
            resource_type: 'auto',
            timeout: 60000 // 60 second timeout
          });
          imageUrl = result.secure_url;
          // console.log('Flag image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Cloudinary upload error for flag:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading flag image: ' + uploadError.message
          });
        }
      }

      // Handle map image upload if file is present
      if (req.files && req.files.map_image && req.files.map_image[0]) {
        const mapFile = req.files.map_image[0];
        // console.log('Processing map image upload:', mapFile.originalname);

        try {
          // Convert buffer to base64 for Cloudinary
          const base64Image = `data:${mapFile.mimetype};base64,${mapFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'countries/maps',
            resource_type: 'auto',
            timeout: 60000 // 60 second timeout
          });
          mapImageUrl = result.secure_url;
          // console.log('Map image uploaded successfully:', mapImageUrl);
        } catch (uploadError) {
          console.error('Cloudinary upload error for map:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading map image: ' + uploadError.message
          });
        }
      }

      const newCountry = new Country({
        language_id,
        country_name: country_name,
        region_id: regionResult.value || null,
        // country_code,
        order,
        status,
        image: imageUrl,
        map_image: mapImageUrl
      });
      await newCountry.save();
      await newCountry.populate(['language_id', 'region_id']);

      // console.log('Country created successfully:', newCountry._id);

      res.status(201).json({
        success: true,
        message: 'Country created successfully',
        data: newCountry,
      });
    } catch (error) {
      console.error('Error in createCountry:', error);
      res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
  },

  getAllCountries: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let cond = {}
      if (req.query.search) {
        const matchingRegions = await Region.find({
          region_name: { $regex: req.query.search, $options: "i" },
        }).distinct('_id');
        cond['$or'] = [
          { country_name: { $regex: req.query.search, $options: "i" } },
          { region_id: { $in: matchingRegions } },
        ]
      }
      if (req.query.region_id) {
        cond.region_id = req.query.region_id;
      }

      // Get total count for pagination
      const totalCount = await Country.countDocuments(cond);

      // Get paginated data with populated language
      const countries = await Country.find(cond)
        .populate('language_id')
        .populate('region_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        message: 'Countries fetched successfully',
        data: countries,
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
      console.error('Error in getAllCountries:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getAllCountriesByLang: async (req, res) => {
    // console.log(req.params)
    try {

      // Get paginated data with populated language
      const cond = { language_id: req.params.lang_id, status: "active" };
      // Optional second filter: only the comunas inside the chosen region
      if (req.query.region_id) {
        if (!mongoose.Types.ObjectId.isValid(req.query.region_id)) {
          return res.status(400).json({ success: false, message: 'Invalid region id' });
        }
        cond.region_id = req.query.region_id;
      }

      const countries = await Country.find(cond).populate('region_id').sort({ order: 1 });

      res.status(200).json({
        success: true,
        message: 'Countries fetched successfully',
        data: countries,

      });
    } catch (error) {
      console.error('Error in getAllCountries:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getCountryById: async (req, res) => {
    try {
      const { id } = req.params;
      const country = await Country.findById(id).populate('language_id').populate('region_id');
      if (!country) {
        return res.status(404).json({ success: false, message: 'Country not found' });
      }
      res.status(200).json({ success: true, message: 'Country fetched', data: country });
    } catch (error) {
      console.error('Error in getCountryById:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  updateCountry: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      delete updateData.region;

      if (req.body.region_id !== undefined || req.body.language_id) {
        const existing = await Country.findById(id);
        if (!existing) {
          return res.status(404).json({ success: false, message: 'Country not found' });
        }
        const languageId = req.body.language_id || existing.language_id;
        // Changing only the language re-validates the region the city already has
        const regionId = req.body.region_id !== undefined ? req.body.region_id : existing.region_id;
        const regionResult = await resolveRegionId(regionId ? String(regionId) : '', languageId);
        if (regionResult.error) {
          return res.status(400).json({ success: false, message: regionResult.error });
        }
        updateData.region_id = regionResult.value;
      }

      // Extract country_name if it exists
      const { country_name } = req.body;
      if (country_name) {
        updateData.country_name = country_name;
      }

      let imageUrl = null;
      let mapImageUrl = null;

      // Handle flag image upload if file is present
      if (req.files && req.files.image && req.files.image[0]) {
        try {
          // Delete old image if exists
          const existingCountry = await Country.findById(id);
          if (existingCountry && existingCountry.image) {
            const publicId = existingCountry.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }

          // Convert buffer to base64 for Cloudinary
          const flagFile = req.files.image[0];
          const base64Image = `data:${flagFile.mimetype};base64,${flagFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'countries/flags',
            resource_type: 'auto',
            timeout: 60000 // 60 second timeout
          });
          imageUrl = result.secure_url;
          updateData.image = imageUrl;
        } catch (uploadError) {
          console.error('Cloudinary upload error for flag:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading flag image: ' + uploadError.message
          });
        }
      }

      // Handle map image upload if file is present
      if (req.files && req.files.map_image && req.files.map_image[0]) {
        try {
          // Delete old map image if exists
          const existingCountry = await Country.findById(id);
          if (existingCountry && existingCountry.map_image) {
            const publicId = existingCountry.map_image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }

          // Convert buffer to base64 for Cloudinary
          const mapFile = req.files.map_image[0];
          const base64Image = `data:${mapFile.mimetype};base64,${mapFile.buffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'countries/maps',
            resource_type: 'auto',
            timeout: 60000 // 60 second timeout
          });
          mapImageUrl = result.secure_url;
          updateData.map_image = mapImageUrl;
        } catch (uploadError) {
          console.error('Cloudinary upload error for map:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Error uploading map image: ' + uploadError.message
          });
        }
      }

      const updated = await Country.findByIdAndUpdate(id, updateData, { new: true })
        .populate('language_id')
        .populate('region_id');
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Country not found' });
      }
      res.status(200).json({ success: true, message: 'Country updated', data: updated });
    } catch (error) {
      console.error('Error in updateCountry:', error);
      res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
  },

  deleteCountry: async (req, res) => {
    try {
      const { id } = req.params;

      // Delete images from Cloudinary if exists
      const country = await Country.findById(id);
      if (country) {
        try {
          if (country.image) {
            const publicId = country.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }
          if (country.map_image) {
            const publicId = country.map_image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (deleteError) {
          console.error('Error deleting images from Cloudinary:', deleteError);
        }
      }

      const deleted = await Country.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Country not found' });
      }
      res.status(200).json({ success: true, message: 'Country deleted', data: deleted });
    } catch (error) {
      console.error('Error in deleteCountry:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getAllCountry: async (req, res) => {
    try {
      const countries = await Country.find().populate('language_id').populate('region_id').sort({ createdAt: -1 })

      res.status(200).json({
        success: true,
        message: 'Countries fetched successfully',
        data: countries,
      });
    } catch (error) {
      console.error('Error in getAllCountries:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};


module.exports = countryController;
