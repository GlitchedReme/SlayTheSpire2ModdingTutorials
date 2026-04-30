---
title: 先古对话
date: 2026-03-28 00:00:00
permalink: docs/08-ancient-dialogue/
categories:
- Basics
---
## 创建文件

创建`{modId}/localization/{Language}/ancients.json`。

先古对话的id遵循`{先古之民ID}.talk.{角色ID}.{对话序号}-{行号}[可选 r].{ancient|char|next}`的格式。

例如达弗对话铁甲战士：

```json
  "DARV.talk.IRONCLAD.0-0.ancient": "啊，冒火的战士回来啦！\n我这儿有东西正适合你！",
  "DARV.talk.IRONCLAD.1-0r.ancient": "看到你还活着四处砸人脑壳，感觉真不错啊！",
  "DARV.talk.IRONCLAD.2-0.ancient": "我还留着你的那把重刃呢……但没能找到可以修好它的人。",
  "DARV.talk.IRONCLAD.2-0.next": "继续",
  "DARV.talk.IRONCLAD.2-1.char": "[i][font_size=22]铁甲战士盯着达弗。[/font_size][/i]",
  "DARV.talk.IRONCLAD.2-1.next": "继续",
  "DARV.talk.IRONCLAD.2-2.ancient": "或许建筑师知道些什么呢。",
  "DARV.talk.firstVisitEver.0-0.ancient": "……我把那东西放哪儿了……喔！\n来看我的收藏的吗！？那边那堆里随便挑一个吧，得好好用上哦！",
  "DARV.title": "达弗", // 先古的名字
  "DARV.epithet": "囤积者", // 先古的绰号
```

## 对话内容

最后一段的`ancient`表示是先古之民说的话，`char`是角色说的话，`next`是继续按钮的文本。

最后第二段`x-y`表示第`x`套对话的第`y`句。

游戏按照遇见次数选取第几套对话：（第一次第0套，第二次第1套，第五次第2套）

```csharp
    [AncientEventModel.CharKey<Ironclad>()] = new global::_003C_003Ez__ReadOnlyArray<AncientDialogue>(new AncientDialogue[3]
    {
        new AncientDialogue("event:/sfx/npcs/darv/darv_introduction")
        {
            VisitIndex = 0
        },
        new AncientDialogue("event:/sfx/npcs/darv/darv_endeared")
        {
            VisitIndex = 1
        },
        new AncientDialogue("", "", "")
        {
            VisitIndex = 4
        }
    }),
```

* 全游戏第一次遇见这个先古之民时，触发`DARV.talk.firstVisitEver.0-0.ancient`对话。
* 那之后，铁甲战士第一次遇见时，触发第`0`套对话。他会先说`DARV.talk.IRONCLAD.0-0.ancient`这句，如果有`0-1`会继续说下去，`0-2`以此类推。
* 铁甲战士第二次遇见时，触发第`1`套对话。
* 铁甲战士第三次遇见时，没有对应的次数的那套对话。（代码中没有`VisitIndex = 2`）。但由于第`1`套对话标记了`r`，说明是可重复的，于是触发第`1`套对话。
* 铁甲战士第四次遇见时，根据上面的逻辑，触发第`1`套对话。
* 铁甲战士第五次遇见时，触发第`2`套对话。（代码中有`VisitIndex = 4`这套对话）
* 铁甲战士第六次及以后遇见时，没有相应的那套对话了，于是只能找可重复对话的。只有第`1`套对话标记了`r`，所以后续重复第`1`套。（如果你定义了`3r`这套对话，会在两套之间随机选择。）

如果你的角色先古之民不认识，那么就触发`ANY`。

```json
  "DARV.talk.ANY.0-0r.ancient": "来来，这里有些被遗忘的宝石，拿一块去吧！",
  "DARV.talk.ANY.1-0r.ancient": "今天我还挺忙的！\n那堆东西里有啥想要的你就自己拿了吧！！",
```
