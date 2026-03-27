主要是关于人物能量表盘的问题。

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

改成：

```
TestEnergyCounter (Control)
├── EnergyVfxBack (NParticlesContainer) %
├── Layers (Control) %
│   ├── Layer1 (TextureRect，或任意)
│   └── RotationLayers (Control) %
├── EnergyVfxFront (NParticlesContainer) %
└── Label (Label)
```

同时需要反射设置`_particles`的值，因为其是export，无法在自己的编辑器修改。

```csharp
public partial class NTestParticlesContainer : NParticlesContainer
{
    public override void _Ready()
    {
        base._Ready();
        Traverse.Create(this).Field("_particles").SetValue(new Array<GpuParticles2D>());
    }
}
```

如有遗漏，查看`添加新人物`这一章。