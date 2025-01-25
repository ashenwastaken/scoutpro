// agenda.js
const Agenda = require("agenda");
const { uploader } = require("cloudinary").v2;
const wrapAsync = require("../utils/wrapAsync");
const mongoose = require("mongoose");
const Player = mongoose.model("Player");
const generateTemplate = require("./template");



// --- NEW: import playwright
const { chromium } = require("playwright");

async function htmlToImage(player) {
    try {
        const htmlContent = await generateTemplate(player);

        // 1. Launch Playwright and open a new page
        const browser = await chromium.launch({
            headless: true,
            // You can also provide extra launch options here
            // e.g., executablePath, etc.
        });
        const page = await browser.newPage();

        // 2. Set the page content to your HTML
        await page.setContent(htmlContent, { waitUntil: "networkidle" });

        await page.setViewportSize({ width: 640, height: 840 });


        // 3. Take a screenshot as a PNG
        const imageBuffer = await page.screenshot({ fullPage: false });

        // 4. Close the browser
        await browser.close();

        // If there is a previous image, delete it from Cloudinary
        if (player.pdfPreview && player.pdfPreview.filename) {
            const publicId = player.pdfPreview.filename.split("/").pop().split(".")[0];
            await uploader.destroy(publicId, { resource_type: "image" });
        }

        // Upload the new image to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = uploader.upload_stream(
                { resource_type: "image" },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            // End the stream with the screenshot buffer
            uploadStream.end(imageBuffer);
        });

        return { filename: result.public_id, path: result.secure_url };
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
}

// Promisify uploader.upload_stream for cleaner code (optional)
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
