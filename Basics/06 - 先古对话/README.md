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

* 全游戏第一次遇见这个先古之民时，触发`DARV.talk.firstVisitEver.0-0.ancient`对话。
* 那之后，铁甲战士第一次遇见时，触发第`0`套对话。他会先说`DARV.talk.IRONCLAD.0-0.ancient`这句，如果有`0-1`会继续说下去，`0-2`以此类推。（对于每一个`x-y`里的`y`，可以有一条对话和一个`next`，next是来指定按钮的文字的）
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

## 攻击建筑师

由于建筑师原版是在代码里指定攻击动画的，两个基础库都改成json里可以添加`-attack`后缀指定攻击动画。

值可以填`Both`、`Architect`、`Player`或`None`指定谁来攻击。

```json
  "THE_ARCHITECT.talk.TEST_CHARACTER.0-attack": "Both"
```

特别的，baselib可以指定`-startattack`和`-endattack`在对话开始前或者之后攻击（静默猎手如此），值可以填`Both`、`Architect`、`Player`或`None`指定谁来攻击。

## 基础库扩展

两个基础库都可以指定第几次遇到先古时触发本套对话。

```json
  "TEST_ANCIENT.talk.TEST_CHARACTER.1-visit": "3"
```

ritsulib可以指定`.sfx`来播放一个fmod音效：

```json
  "TEST_ANCIENT.talk.ANY.0-0r.ancient.sfx": "event:/sfx/ui/enchant_simple"
```