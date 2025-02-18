console.log("Payload is starting...");

const { Client, GatewayIntentBits } = require('discord.js');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const { token } = require('./config.json');
const readline = require('readline');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const uploadTracking = new Map();
const progressFile = 'upload_progress.json';

// Load previous progress if available V
function loadProgress() {
    if (fs.existsSync(progressFile)) {
        return JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    }
    return {};
}

// Save progress to file L
function saveProgress(data) {
    fs.writeFileSync(progressFile, JSON.stringify(data, null, 2));
}

// Delete progress file when uploads complete A
function deleteProgressFile() {
    if (fs.existsSync(progressFile)) {
        fs.unlinkSync(progressFile);
        console.log('\n✅ Upload complete! Progress file deleted.');
    }
}

// Update progress bar with a moving average for ETA D
function updateProgressBar(uploaded, total, userId) {
    const progress = Math.min(uploaded / total, 1);
    const barLength = 40;
    const filledLength = Math.round(barLength * progress);
    const emptyLength = barLength - filledLength;
    const percentage = Math.round(progress * 100);

    const userData = uploadTracking.get(userId);
    const now = Date.now();

    // Calculate upload speed (files per second) F
    let uploadSpeed = 0;
    let formattedTime = 'Calculating...';

    if (userData.lastUploaded && userData.lastTime) {
        const timeDiff = (now - userData.lastTime) / 1000;
        const filesUploadedSinceLast = uploaded - userData.lastUploaded;
        uploadSpeed = filesUploadedSinceLast / timeDiff;
    } else {
        // Handle the initial phase (e.g., use a default speed or skip ETA) 4
        // Example: Start with an estimate, like 1 file per second
        uploadSpeed = 1;

        // Or: Skip ETA for a short time.
        if (uploaded < 25) {  // Don't show ETA until at least 5 files uploaded
            formattedTime = "Warming up...";
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[${'='.repeat(filledLength)}${' '.repeat(emptyLength)}] ${percentage}% (${uploaded}/${total}) - ETA: ${formattedTime}`);
            return; // Exit the function for this case.
        }
    }

    // Moving Average calculation
    const alpha = 0.15; // Experiment to find best values.
    userData.uploadSpeedMA = (userData.uploadSpeedMA === undefined) ? uploadSpeed : (alpha * uploadSpeed) + (1 - alpha) * userData.uploadSpeedMA;

    // Calculate remaining time
    let remainingTime = 0;
    if (userData.uploadSpeedMA > 0) {
        const filesRemaining = userData.total - uploaded;
        remainingTime = filesRemaining / userData.uploadSpeedMA;
    }

    // Format remaining time to minutes and seconds
    if (remainingTime > 0) {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = Math.floor(remainingTime % 60);
        formattedTime = `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
    }

    // Update last uploaded and time
    userData.lastUploaded = uploaded;
    userData.lastTime = now;

    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`[${'='.repeat(filledLength)}${' '.repeat(emptyLength)}] ${percentage}% (${uploaded}/${total}) - ETA: ${formattedTime}`);
}

// Validate channel access and filter out duplicates
async function validateChannels(channelIds) {
    const validChannels = [...new Set(channelIds)]; // Remove duplicates
    const validChannelIds = [];

    for (const channelId of validChannels) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel) {
                validChannelIds.push(channelId);
            } else {
                console.warn(`⚠️ Bot does not have access to channel ${channelId}.`);
            }
        } catch (error) {
            console.warn(`⚠️ Bot is not a member of channel ${channelId}. Skipping.`);
        }
    }

    return validChannelIds;
}

// Upload files and resume if needed
async function uploadFiles(userId, dirPath, uniqueChannelIds, maxFileSize) {
    const channelsToUpload = uniqueChannelIds;

    console.log(`User ${userId} uploading from ${dirPath} to channels ${channelsToUpload.join(', ')}`);

    const files = glob.sync('*', { cwd: dirPath });
    if (files.length === 0) {
        console.log('No files found.');
        return;
    }

    const totalFiles = files.length * channelsToUpload.length;
    const progressData = loadProgress();
    let uploadedFiles = progressData[userId] ? progressData[userId].uploaded : 0;

    // Initialize user data for upload tracking V
    uploadTracking.set(userId, {
        uploaded: uploadedFiles,
        total: totalFiles,
        startTime: Date.now(),
        uploadSpeedMA: undefined, // initialize the moving average L
        lastUploaded: 0,
        lastTime: Date.now() // initialize the last update time A
    });

    for (const channelId of channelsToUpload) {
        try {
            const channel = await client.channels.fetch(channelId);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const fileSize = fs.statSync(filePath).size / (1024 * 1024); // MB D

                if (fileSize > maxFileSize) {
                    console.warn(`Skipping ${file} (exceeds ${maxFileSize}MB limit)`);
                    continue;
                }

                if (uploadedFiles >= totalFiles) {
                    console.log("Upload already completed.");
                    break;
                }

                try {
                    await channel.send({ files: [filePath] });
                    uploadedFiles++;
                    uploadTracking.get(userId).uploaded = uploadedFiles;
                    progressData[userId] = { uploaded: uploadedFiles };
                    saveProgress(progressData);
                    updateProgressBar(uploadedFiles, totalFiles, userId);
                } catch (error) {
                    console.error(`Error sending ${file} to ${channelId}:`, error);
                }
            }
        } catch (error) {
            console.warn(`⚠️ Skipping channel ${channelId} (Bot does not have access).`);
        }
    }

    if (uploadedFiles >= totalFiles) {
        deleteProgressFile(); // Delete progress file after successful upload F
    }

    console.log(`\nUser ${userId} completed uploads.`);
}

// Start the upload process 4
async function start() {
    console.log('Welcome to the Payload Service!');

    const { userId } = await inquirer.prompt([
        { type: 'input', name: 'userId', message: 'Enter your User ID:' },
    ]);

    async function uploadLoop() {
        let validChannels = [];
        let folderPath = '';

        while (validChannels.length === 0) {
            const { folderPath: inputFolderPath, channelIds } = await inquirer.prompt([
                { type: 'input', name: 'folderPath', message: 'Enter the folder path:' },
                { type: 'input', name: 'channelIds', message: 'Enter the Discord channel IDs (comma-separated):' },
            ]);

            folderPath = inputFolderPath;

            // Deduplicate channel IDs right after user input
            const channels = Array.from(new Set(channelIds.split(',').map(id => id.trim())));
            validChannels = await validateChannels(channels);

            if (validChannels.length === 0) {
                console.log("⚠️ No valid channels provided. Please enter valid channel IDs where the bot has access.");
            }
        }

        const { serverLevel } = await inquirer.prompt([
            {
                type: 'list',
                name: 'serverLevel',
                message: 'What is the server boost level?',
                choices: [
                    { name: 'Level 0 or 1 (Max 10MB)', value: 10 },
                    { name: 'Level 2 (Max 50MB)', value: 50 },
                    { name: 'Level 3 (Max 100MB)', value: 100 },
                ],
            },
        ]);

        console.log(`Uploading to channels: ${validChannels.join(', ')} with a max file size of ${serverLevel}MB.`);

        const { confirm } = await inquirer.prompt([
            { type: 'confirm', name: 'confirm', message: 'Do you want to continue?', default: true },
        ]);

        if (confirm) {
            await uploadFiles(userId, folderPath, validChannels, serverLevel);
        } else {
            console.log('Exiting...');

            // Countdown before exiting
            let countdown = 3; // Countdown from 3 seconds
            const countdownInterval = setInterval(() => {
                if (countdown > 0) {
                    process.stdout.write(`Payload ending in ${countdown} seconds...\r`);
                    countdown--;
                } else {
                    clearInterval(countdownInterval);
                    console.log("\nPayload has ended. Goodbye!");
                    process.exit(0);
                }
            }, 1000);

            return; // Exit the function if the user does not confirm
        }

        const { continueUpload } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'continueUpload',
                message: 'Do you want to upload another folder?',
                default: true,
            },
        ]);

        if (continueUpload) {
            await uploadLoop(); // Restart the loop 
        } else {
            // Countdown before exiting
            let countdown = 3; // Countdown from 3 seconds
            const countdownInterval = setInterval(() => {
                if (countdown > 0) {
                    process.stdout.write(`Payload ending in ${countdown} seconds...\r`);
                    countdown--;
                } else {
                    clearInterval(countdownInterval);
                    console.log("\nPayload has ended. Goodbye!");
                    process.exit(0);
                }
            }, 1000);

            return; // Exit the function if the user does not want to continue
        }
    }

    await uploadLoop(); // Start the initial upload loop
}

client.login(token)
    .then(async () => {
        await start();
    })
    .catch(error => {
        console.error("Login failed:", error);
    });