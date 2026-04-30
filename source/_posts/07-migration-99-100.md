---
title: 正式版 至 测试版
date: 2026-03-27 00:00:00
permalink: docs/07-migration-99-100/
categories:
- Migration
---
## 0.103 至 0.104测试版

### 函数签名变动

* 一些函数开始传入`PlayerChoiceContext`参数，与下面的进行配合。

* 一些效果执行函数，例如`PowerCmd.Apply`等，需要一个`PlayerChoiceContext`参数。如果你的函数传入参数有对应类型添加即可。如果你找不到这个类型的参数，传入`new ThrowingPlayerChoiceContext()`。

* `CardPileCmd.AddGeneratedCardToCombat`等，之前传入`addedByPlayer`的`bool`类型的参数的位置，改成了`Player? creator`。所以如果之前是`false`的现在填`null`，是`true`的话填`cardPlay.card.Owner`（卡牌里）或者`Owner`（能力里），根据语境。

### 接口变动

* 一些参数的类型从`CombatState`改成了`ICombatState`

### 函数名变动

旧版 `AbstractModel` 里有：

- `BeforePlayPhaseStart(PlayerChoiceContext choiceContext, Player player)`
- `BeforePlayPhaseStartLate(PlayerChoiceContext choiceContext, Player player)`

0.104 版这两个点被移除了，换成了：

- `AfterAutoPrePlayPhaseEnteredEarly(PlayerChoiceContext choiceContext, Player player)`
- `AfterAutoPrePlayPhaseEntered(PlayerChoiceContext choiceContext, Player player)`
- `AfterAutoPrePlayPhaseEnteredLate(PlayerChoiceContext choiceContext, Player player)`
- `AfterAutoPostPlayPhaseEntered(PlayerChoiceContext choiceContext, Player player)`

## 0.99 至 0.103

主要是能量表盘问题。

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

所以如果你在正式版添加人物，需要添加`BurstBack (CPUParticles2D) %`和`BurstFront (CPUParticles2D) %`这两个节点。