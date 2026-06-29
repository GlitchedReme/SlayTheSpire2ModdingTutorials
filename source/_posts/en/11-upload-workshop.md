---
title: Workshop Upload
date: 2026-06-20 10:02:51
permalink: en/docs/11-upload-workshop/
categories:
- Basics
---
## Download the Uploader

Download the official mod uploader: https://github.com/megacrit/sts2-mod-uploader

## Create a New Mod

1. Double-click `ModUploader.exe`. It generates a folder called `NewModWorkspace` (the workspace).
2. Rename `NewModWorkspace` to whatever you want.
3. Put your mod's content into the workspace's `Content` directory. Don't zip it — just drop your mod files (json, dll, pck) in directly.
4. Fill in the workspace's `workspace.json`. It's fine to leave everything empty except the `tags` field. Tags can't be changed later on the Workshop. If you fill in other fields here, they'll overwrite what's on the Workshop on upload.
5. Replace the workspace's `image.jpg` with your own mod preview image (keep the filename as `image.jpg`).
6. Open a terminal inside the workspace folder. (Right-click → open in terminal.)
7. Run `ModUploader.exe upload -w <your folder name>` to upload the mod. (No `<>` characters needed.)

## Update an Existing Mod

1. Put the updated mod files into the workspace's `Content` directory.
2. (Optional) Fill in the `changeNotes` field in `workspace.json` with the update notes.
3. Open a terminal inside the workspace folder.
4. Run `ModUploader.exe upload -w <your folder name>` to update the mod. The mod ID is automatically read from `mod_id.txt` in the directory.
5. Save the upload command in a bat, cmd, or sh script. Then updating is just running that script. Or script it into CI.

## Additional Notes

- Mod preview images must be under 1 MB. Otherwise the upload fails.
- It's recommended to delete the description, changelog, and everything except tags — you can edit those on the Workshop later. Or use the uploader mod (subscribe on Workshop).
- For `dependencies`, use the target project's Workshop ID. No quotes needed. See the uploader README for instructions.
- Tags can't be changed on the Workshop. Check what common tags exist first. (Common: `Characters`, `QoL`, `Cards`, `Relics`, `schinese` (Simplified Chinese), `English`, etc.)
- Don't forget to change visibility.
- All fields in the JSON overwrite Workshop content on upload, unless you leave them out or delete them.
