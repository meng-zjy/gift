# 房间与故事扩展说明

## 配置入口

- `src/content/livingRoom.ts`：客厅和最初两段故事。
- `src/content/world.ts`：房间注册表、厨房、开场与食物故事。
- `src/content/upperHall.ts`：二楼过道、照片展板与下楼楼梯。
- `src/content/achievementHall.ts`：负一楼、成就展柜与返回楼梯。
- `src/content/bedroom.ts`：卧室与独立梵高画框。
- `src/content/artworks.ts`：本地画作与来源，通过稳定 `artworkId` 引用。
- `src/game/types.ts`：房间、家具和互动类型。
- `src/game/validateWorld.ts`：跨房间引用与入口检查。

目前使用 TypeScript 配置，固定 480 × 320 逻辑地图。Tiled 和可视化后台不在本次范围内。

## 增加房间

1. 添加 `RoomDefinition`，指定唯一 ID、名字、楼层 `floor: -1 | 1 | 2`、主题、行走区域和默认出生点。
2. 在 `entrances` 中增加命名入口，入口必须完整可通行，且不在家具碰撞区域内。
3. 配置家具，ID 在整个世界中唯一。
4. 在 `rooms` 注册该房间。
5. 为现有房间的门配置 `travel` 动作，引用新房间与入口；同时配置返回门。
6. 运行配置测试，启动后验证往返与出生点。

房门通过互动键触发，单纯走到门边不会自动传送，返回后也不会自动弹回。首次版本统一使用固定图层，不根据人物 Y 坐标排序。

动作示例：

```ts
interaction: {
  label: "去厨房",
  range: 40,
  action: { type: "travel", roomId: "kitchen", spawnId: "from-living" },
}
```

## 增加故事

v0.4.0 起，个人日记、话语、相册通过手账台维护，发布后由内容适配器加入运行时目录。书桌、小人与照片展板使用 `collection` 动作，例如 `{ type: "collection", collection: "album" }`。物件只引用内容分类，不保存私人正文或图片；庭院等新场景可复用同一分类入口。

以下 `story` 配置适用于随代码提供的示例、画作和固定剧情。运行时个人故事不写进 `src/content/world.ts`；阅读器和回忆册接收合并后的目录。

1. 在 `stories` 增加唯一 ID、标题、类型、说话人和非空段落数组。
2. 家具互动用 `story` 动作引用 ID。
3. 未触发的故事不显示在回忆册；触发后保存段落与阅读状态。
4. 段落顺序变化可能改变旧阅读进度的含义；较大重写应使用新的故事 ID。

```ts
interaction: {
  label: "翻开日记",
  action: { type: "story", storyId: "first-page" },
}
```

## 能复用的部分与边界

家具边界默认同时用于实心碰撞和交互距离。`solid: false` 用于墙面画框与门洞，不为可见地板增加隐形障碍；房间边界仍阻止角色出界。门配置 `doorSide: "left" | "right" | "bottom"`，贴合对应墙边。

互动默认测量角色与物件矩形边缘的距离（28 逻辑像素），不限制朝向。可用 `range` 调整距离；墙上画框使用 `interaction.area` 把可接近区域投影到墙下地板。选择距离最近且不被其他实心家具遮挡的对象。

上方通路至少要容纳角色 12 像素宽的碰撞箱，并留余量。不要通过关闭家具碰撞来掩盖狭窄通道。画框与 gallery 故事分别填写相同的 `artworkId`，每次只查看对应画作。

场景生命周期、键盘触屏输入、移动碰撞、最近互动选择、阅读器、回忆册和进度保存均为通用能力。

当前可复用家具：沙发、书桌、书架、植物、固定角色、门洞、冰箱、橱柜、蛋糕餐桌、画框与床。已有主题是客厅、厨房和卧室。新增不同尺寸的家具、新画风或小游戏需要相应的美术绘制或互动处理器；不承诺仅靠配置完成任意玩法。

配置校验覆盖：房间 ID、固定画布规格、物件 ID 重复、故事引用、门的目标入口、入口可通行性及非空故事。配置错误会阻止游戏初始化并显示重试界面，开发者应查看终端与配置测试获得具体原因。

## 楼梯与成就扩展（v0.5.2 更新）

房间 `stairs` 数组配置独立 ID、方向 `up/down`、开放端 `entry: { x, y }`、末端 `exit: { x, y }` 及 `destination: { roomId, spawnId }`。踏面与连续坡线碰撞由入口与出口推导，美术台阶不再逐级生成矩形碰撞；横向跨度至少 72，屏幕纵向高差至少 24，up 的出口 Y 更小、down 更大。沿斜向通道行走到末端触发换层，保持固定图层，不添加高度轴。房间出生点必须避开末端触发区与护栏，开放端留出角色通道；布局调整后需验证实际往返，不能只检查目标引用。v0.5.2 的配置校验检查中线与两侧边缘的完整上楼通路，测试另外覆盖退回；半宽由 `STAIR_LANE_HALF_WIDTH` 统一定义。楼梯布局与碰撞修复见 [v0.5.2 记录](./stair-layout-and-collision.md)。旧版矩形楼梯配置已替换，详见 [横向侧面楼梯](./side-staircases.md)。

家具 `photo-board` 配合 album collection 打开展板；`achievement-wall` 配合 `{ type: "achievements" }` 打开成就长廊。当前主题增加 hallway、achievements。探索定义在 `src/achievements/definitions.ts`，房间条件使用固定 ID 列表，扩建不会改动旧徽章条件。

生活里程碑属于内容模型 `kind: "milestone"`，预设 key 或 custom，可选 relatedId 引用已发布普通回忆。生活日期由手账台记录；探索使用访客事件时间。关联删除或撤为草稿只移除可见链接，保留里程碑故事。备份 v2 不携带访客阅读和探索记录，继续支持导入 v1。
