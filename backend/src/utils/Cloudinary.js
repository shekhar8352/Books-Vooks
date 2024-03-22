import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
          
cloudinary.config({ 
  cloud_name: 'dpudpodle', 
  api_key: '258957925128259', 
  api_secret: 'NdSpmFwcrJIb3q4jDstCHiRZQw4' 
});

const uploadOnClodinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
          console.log("No file path provided");
          return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
      console.log("During image upload", error);
      fs.unlinkSync(localFilePath);  
      return null
    }
};

export { uploadOnClodinary }