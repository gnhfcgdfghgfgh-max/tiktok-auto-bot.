const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const config = require("./config.json");

const VIDEO_FOLDER = path.join(__dirname, "videos");

async function sendWhatsAppMessage(message) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${config.phone}&text=${encodeURIComponent(
    message
  )}&apikey=${config.callmebot_api_key}`;
  try {
    await fetch(url);
    console.log("✅ WhatsApp message sent.");
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error);
  }
}

async function uploadToTikTok() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  // Navigate to TikTok login page
  await page.goto("https://www.tiktok.com/login");

  console.log("🔐 Please manually log in to your TikTok account.");

  await page.waitForTimeout(60000); // Wait 60 seconds for manual login

  // Navigate to upload page
  await page.goto("https://www.tiktok.com/upload");

  await page.waitForSelector("input[type='file']", { timeout: 60000 });

  // Get the first video in folder
  const files = fs.readdirSync(VIDEO_FOLDER).filter(f => f.endsWith(".mp4"));
  if (files.length === 0) {
    console.log("⚠️ No video files found.");
    await browser.close();
    return;
  }

  const videoPath = path.join(VIDEO_FOLDER, files[0]);

  const fileInput = await page.$("input[type='file']");
  await fileInput.uploadFile(videoPath);
  console.log("🎥 Video uploaded.");

  // Wait for upload to process
  await page.waitForSelector('[data-e2e="video-desc"]', { timeout: 60000 });

  // Set caption
  const captionInput = await page.$('[data-e2e="video-desc"]');
  await captionInput.type(`🔥 New drop! Grab it here 👉 ${config.payhip_link}`);

  // Wait and click post
  await page.waitForTimeout(3000);
  const postButton = await page.$x("//button[contains(text(), 'Post')]");
  if (postButton.length > 0) {
    await postButton[0].click();
    console.log("🚀 Video posted.");
  } else {
    console.error("❌ Could not find the post button.");
    await browser.close();
    return;
  }

  // Wait for post confirmation
  await page.waitForTimeout(10000);

  // Send message via WhatsApp
  await sendWhatsAppMessage("✅ New TikTok video was just posted with your Payhip link!");

  // Optionally delete the uploaded video from local
  fs.unlinkSync(videoPath);

  await browser.close();
}

uploadToTikTok();
