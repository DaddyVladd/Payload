# Payload

## Automate Your Uploads

A command-line tool for autonomously uploading files to Discord.

## Description

Payload is a powerful Discord Bot designed to simplify the process of uploading files to your Discord channels. Whether you need to upload a large batch of files or just one, Payload ensures smooth uploads, progress tracking, and handles potential issues like file size limits.  It's designed to be user-friendly, guiding you through the upload process with clear prompts.

## Installation

You'll need to install the dependencies if you haven't already. You'll also need to set up the Discord Bot token:

1.  **Prerequisites:**
    *   Node.js (version 18.20.6)
    *   npm (comes with Node.js)
    *   inquirer (version 8.0.0)
    *   A Discord Bot Token (you'll create one through the Discord Developer Portal - see Setup)

2.  **Installing Dependencies:**
    *   If you've downloaded the files (e.g., from GitHub or Discord), navigate into the project directory in your terminal.
    *   Run the command: `npm install`  This will install all necessary dependencies defined in `package.json`.
    *   run the command: `npm install inquirer@8.0.0` This will install inquirer into the proejct directory

3.  **Creating an Executable (Optional):**
    *   To create an executable for easier running (no need for command-line `node` calls):
        1.  Install `pkg` globally: `npm install -g pkg`
        2.  Run `pkg .` (or `pkg . --targets node16-win-x64,node16-linux-x64,node16-macos-x64` for cross-platform executables). This will create an executable in the project root directory.

4.  **Setup & Configuration:**
    1.  **Create a Discord Bot:**
        *   Go to the [Discord Developer Portal](https://discord.com/developers/applications).
        *   Create a new application.
        *   In the "Bot" section, add a bot to your application.
        *   Copy your bot's token.  **Keep this token secret!**
    2.  **Configure the Bot Token:**
        *   Payload uses a `config.json` file to store your bot token.
        *   Locate the `config.json` file in the project. (If it does not exist, create one in the root directory).
        *   Paste your bot token into the `token` field:

            ```json
            {
              "token": "YOUR_BOT_TOKEN_HERE"
            }
            ```

            **Replace `YOUR_BOT_TOKEN_HERE` with your actual bot token.**
    3.  **Invite Your Bot:**
        *   In the Discord Developer Portal, go to "OAuth2" -> "URL Generator."
        *   Select the "bot" scope and grant it the "Send Messages" permission (and any other required permissions).
        *   Copy the generated URL and paste it into your browser.
        *   Select the server where you want your bot to be active and authorize the bot.

## Usage

1.  **Running from command line:**
    *   Navigate to the project directory in your terminal.
    *   Run the command: `node payload.js`
2.  **Running the executable:**
    *   Navigate to the directory where the executable was created (e.g., the project root).
    *   Run the executable by double-clicking it (if on Windows, or if you've configured the OS to execute it).
    *   Or run the executable from the command line (e.g., `./payload` on Linux/macOS or `payload.exe` on Windows).

3.  **Follow the Prompts:**  Payload will guide you through the upload process.
    *   **Username:** The username in discord
    *   **Folder Location:** Paste the path to the folder containing the files you want to upload.
    *   **Channel ID:** Paste the ID of the Discord channel where you want to upload the files. You can find the channel ID by enabling Developer Mode in Discord (Settings -> Advanced) and right-clicking the channel to copy the ID.
    *   **Server Size:**  Select the server size from the prompt.
4.  **Upload:** Payload will begin uploading the files, displaying progress information in the terminal.

## Dependencies

*   discord.js - Library for interacting with the Discord API.
*   node-fetch -  For making HTTP requests.
*   fs - For file system operations.
*   path - For manipulating file paths.
*   readline-sync - For getting user input.
*   pkg - For creating executables

## Contributing

Contributions are welcome! You can contribute in the following ways:

*   **GitHub:** Open issues to report bugs, suggest features, or request improvements. Submit pull requests with code changes.
*   **Discord:**  Engage in discussions and share ideas in the forum section of my Discord server (Discord name: VladF4).

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Contact

For questions or support, contact VladF4 on Discord.
