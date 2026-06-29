---
title: In-Run Saving
date: 2026-05-04 13:57:41
permalink: en/docs/03-baselib/03-09-run-save/
categories:
- Basics
---
## SavedProperty

Add a `SavedProperty` attribute to properties in the `Model` of cards, relics, enchantments, or Modifiers (daily challenge effects) to save them.

* Must be a [*property*](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties).

```csharp
[Pool(typeof(SharedRelicPool))]
public class TestRelic : CustomRelicModel
{
    // This property will be saved. Use a prefix to avoid ID collisions.
    // Different SerializationConditions control when the property is saved. AlwaysSave (default) saves regardless of the value.
    [SavedProperty]
    public int Test_GameTurns { get; set; } = 0;

    // Add new dynamic variables
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(1), new DynamicVar("GameTurns", Test_GameTurns)];

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        // At the start of each turn, increment Test_GameTurns and update {GameTurns} in the description
        Test_GameTurns++;
        DynamicVars["GameTurns"].BaseValue = Test_GameTurns;
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

```json
{
  "TEST-TEST_RELIC.title": "Test Relic",
  "TEST-TEST_RELIC.description": "At the start of your turn, draw [blue]{Cards}[/blue] card(s).\n[blue]{GameTurns}[/blue] turns have passed.",
  "TEST-TEST_RELIC.flavor": "Looks familiar?"
}
```

## SavedSpireField

A static variable `SavedSpireField<TType, TVal>` adds a saveable field to a class without needing to modify the class itself. For example, you can add a field to all relics.

* `TType` is currently limited to cards, relics, enchantments, and Modifiers (daily challenge effects).
* `TVal` is limited to supported types (see bottom).

Usage:

```csharp
[Pool(typeof(TestRelicPool))]
public class TestRelic : CustomRelicModel
{
    public override RelicRarity Rarity => RelicRarity.Common;

    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(1)];

    // Add an int field to the TestRelic type. First parameter is the default value factory. Second is the save ID — make it unique.
    public static SavedSpireField<TestRelic, int> GameTurnsField = new(() => 0, "Test_GameTurns");

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        // Increment GameTurns each turn
        // Use Set to write, Get to read. Or use GameTurnsField[this].
        GameTurnsField.Set(this, GameTurnsField.Get(this) + 1);
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

Supported types:

```csharp
    protected static readonly HashSet<Type> SupportedTypes =
    [
        typeof(int),
        typeof(bool),
        typeof(string),
        typeof(ModelId),
        typeof(int[]),
        typeof(SerializableCard),
        typeof(SerializableCard[]),
        typeof(List<SerializableCard>),
    ];
    
    protected static bool IsTypeSupported(Type t) =>
        SupportedTypes.Contains(t) || t.IsEnum || (t.IsArray && t.GetElementType()!.IsEnum);
```

There's also `SpireField<TType, TVal>` for adding fields that don't need to be saved.
