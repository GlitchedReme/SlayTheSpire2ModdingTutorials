---
title: Texture Atlas
date: 2026-05-18 17:28:25
permalink: en/docs/09-02-texture-atlas/
author: vitechliu
categories:
- Basics
---

## Texture Atlas

A texture atlas (also called a sprite sheet or material sheet) is when your assets are not multiple separate images, but a single image containing all parts arranged in a rectangular grid.

For example, the vanilla slash effect (vfx_slash):
![fx_atlas_1.png](../../../images/fx_atlas_1.webp)

The advantage of texture atlases is relatively good performance and small file size, but they aren't suitable for large-scale effects.


### 1. Import the Sprite Sheet
The process is nearly identical to frame animation, except at the import step. Click "Add Frames from Sprite Sheet" and import the image you prepared.
![fx_atlas_2.png](../../../images/fx_atlas_2.webp)


### 2. Load the Atlas and Auto-Slice

![fx_atlas_3.png](../../../images/fx_atlas_3.webp)
The atlas now appears in the preview area. We need to turn it into individual animation frames.

Horizontal count: how many frames per row in the atlas.

Vertical count: how many rows in the atlas.

Check "Trim" to auto-remove blank edges.

For this image, select Horizontal: 3, Vertical: 2, and click through 6 times to select each frame, then add.

![fx_atlas_4.png](../../../images/fx_atlas_4.webp)
