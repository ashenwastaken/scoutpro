// agenda.js
const Agenda = require("agenda");
const nodeHtmlToImage = require("node-html-to-image");
const { uploader } = require("cloudinary").v2;
const wrapAsync = require("../utils/wrapAsync");
const mongoose = require("mongoose");
const Player = mongoose.model("Player");
const generateTemplate = require("./template");

const axios = require('axios'); // Make sure axios is installed and imported

async function htmlToImage(player) {
    try {
        const htmlContent = await generateTemplate(player);

        // Use the htmlcsstoimage.com API to generate the image
        const apiUserId = '7e4ce98e-8b81-44c3-a9c5-5f04f154a5f2';
        const apiKey = 'c4cbf26a-6a99-4f4f-a412-a66560febfdb';

        const auth = Buffer.from(`${apiUserId}:${apiKey}`).toString('base64');

        const response = await axios.post(
            'https://hcti.io/v1/image',
            {
                html: htmlContent,
                width: 294
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`,
                },
            }
        );

        const imageUrl = response.data.url;

        // Download the image data from imageUrl
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
        });

        const imageBuffer = Buffer.from(imageResponse.data, 'binary');

        // If there is a previous image, delete it from Cloudinary
        if (player.pdfPreview && player.pdfPreview.filename) {
            const publicId = player.pdfPreview.filename.split('/').pop().split('.')[0];
            await uploader.destroy(publicId, { resource_type: 'image' });
        }

        // Upload the new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = uploader.upload_stream(
                { resource_type: 'image' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(imageBuffer);
        });

        return { filename: result.public_id, path: result.secure_url };
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}


// Promisify uploader.upload_stream for cleaner code
uploader.upload_stream_promise = (options) => {
  return {
    end: (buffer) =>
      new Promise((resolve, reject) => {
        const stream = uploader.upload_stream(options, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        stream.end(buffer);
      }),
  };
};

const agenda = new Agenda({ db: { address: process.env.MONGODB_URI } });

agenda.define(
  "generate player image",
  wrapAsync(async (job) => {
    const { player } = job.attrs.data;
    try {
      const pdf = await htmlToImage(player);
      await Player.findByIdAndUpdate(player._id, { pdfPreview: pdf });
    } catch (error) {
      console.error('Error in "generate player image" job:', error);
    }
  })
);

agenda.define(
  "deleteFileFromCloudinary",
  wrapAsync(async (job) => {
    const { publicId } = job.attrs.data;

    try {
      await uploader.destroy(publicId, { resource_type: "image" });
    } catch (error) {
      console.error("Failed to delete image from Cloudinary:", error);
    }
  })
);

module.exports = agenda;
