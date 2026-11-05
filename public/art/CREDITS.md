# 画作来源与处理

取用日期：2026-11-05。运行时加载本地文件，不依赖外部图床。

## 克劳德·莫奈《睡莲》（1906）

- 来源页：https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Water_Lilies_-_1906,_Ryerson.jpg
- 下载原文件：https://upload.wikimedia.org/wikipedia/commons/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg
- 来源标记：公版二维艺术品的忠实复制，PD-Art / Public Domain Mark。
- 画作收藏：芝加哥艺术博物馆。
- `monet-original.webp`：按原比例缩放至 1041 × 1000，WebP 质量 88，用于原画查看。
- `monet-pixel.png`：按原比例缩小至 117 × 112，96 色量化，用于像素查看及墙上画框。

## 文森特·梵高《卧室》（1889，芝加哥版本）

- 来源页：https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_The_Bedroom_-_Google_Art_Project.jpg
- 下载原文件：https://upload.wikimedia.org/wikipedia/commons/0/0b/Vincent_van_Gogh_-_The_Bedroom_-_Google_Art_Project.jpg
- 来源标记：公版二维艺术品的忠实复制，PD-Art / Public Domain Mark。
- 图像来源：Google Art Project；画作收藏：芝加哥艺术博物馆。
- `van-gogh-original.webp`：按原比例缩放至 1200 × 936，WebP 质量 88，用于原画查看。
- `van-gogh-pixel.png`：按原比例缩小至 144 × 112，96 色量化，用于像素查看。

“原画”指绘画的数字复制图像，与本项目制作的像素衍生版区分，不表示提供未压缩的全尺寸馆藏扫描。

衍生处理使用 Pillow：原比例 LANCZOS 缩放、BOX 缩小、MEDIANCUT 96 色量化。没有裁掉画面或拉伸长宽比例。客厅和厨房家具、食物插画与人物仍由项目代码绘制。
