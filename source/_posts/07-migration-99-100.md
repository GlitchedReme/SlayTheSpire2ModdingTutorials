---
title: 01 0.99 至 0.103
date: 2026-03-27 00:00:00
permalink: docs/07-migration-99-100/
categories:
- Migration
---

如果你在正式版开发，注意能量表盘问题。

结构从：

```
TestEnergyCounter (Control)
├── BurstBack (CPUParticles2D) %
├── Layers (Control) %
│   ├── Layer1 (TextureRect，或任意)
│   └── RotationLayers (Control) %
├── BurstFront (CPUParticles2D) %
└── Label (Label)
```

改成了：

```
TestEnergyCounter (Control)
├── EnergyVfxBack (NParticlesContainer) %
├── Layers (Control) %
│   ├── Layer1 (TextureRect，或任意)
│   └── RotationLayers (Control) %
├── EnergyVfxFront (NParticlesContainer) %
└── Label (Label)
```

所以如果你在正式版添加人物，需要添加`EnergyVfxBack (Node2D) %`和`EnergyVfxFront (Node2D) %`这两个节点。

如有遗漏，查看`添加新人物`这一章。