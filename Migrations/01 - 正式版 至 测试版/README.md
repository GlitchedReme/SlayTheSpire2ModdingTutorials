## 0.103 至 0.104测试版

### 函数签名变动

* 一些函数开始传入`PlayerChoiceContext`参数，与下面的进行配合。

* 一些效果执行函数，例如`PowerCmd.Apply`等，需要一个`PlayerChoiceContext`参数。如果你的函数传入参数有对应类型添加即可。如果你找不到这个类型的参数，传入`new ThrowingPlayerChoiceContext()`。

* `CardPileCmd.AddGeneratedCardToCombat`等，之前传入`addedByPlayer`的`bool`类型的参数的位置，改成了`Player? creator`。所以如果之前是`false`的现在填`null`，是`true`的话填`cardPlay.card.Owner`（卡牌里）或者`Owner`（能力里），根据语境。

