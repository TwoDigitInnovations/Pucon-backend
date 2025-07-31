const fs = require('fs');
const path = require('path');


const cleanupUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log('Uploaded file cleaned up successfully:', filePath);
    } catch (err) {
      console.error('Error deleting uploaded file:', err);
    }
  }
};

module.exports = { cleanupUploadedFile }; 