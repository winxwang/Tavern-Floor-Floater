# Tavern Floor Floater

紧凑型酒馆楼层导航悬浮窗扩展，适用于采用 SillyTavern 扩展结构的 TauriTavern / SillyTavern。

## 功能
- 可拖动悬浮窗并保存位置
- 折叠与展开
- 按聊天页面消息顺序显示楼层编号
- 输入楼层号跳转，支持 Enter
- 搜索楼层编号、消息内容
- 全部 / 用户 / AI 消息筛选
- 消息列表显示用户、AI、系统标识及文本预览
- 一键跳转到最后一条 AI 回复
- 首楼、上一条、下一条快捷导航

## 安装
1. 下载本仓库 ZIP 或将仓库克隆到本地。
2. 将 Tavern-Floor-Floater 文件夹放入 TauriTavern 实际使用的扩展目录。常见位置为 data/default-user/extensions/，具体以安装版本为准。
3. 重启酒馆，在扩展管理中启用 Tavern Floor Floater。
4. 打开聊天页面检查悬浮窗。

## 文件结构
- manifest.json：扩展清单
- index.js：导航、搜索、拖动与跳转逻辑
- style.css：紧凑型悬浮窗样式

## 兼容性说明
扩展使用常见的 #chat .mes 消息 DOM 结构，并优先读取 data-is_user 识别用户消息。不同 TauriTavern 分支可能调整 DOM 结构，建议先在副本或测试聊天中验证。楼层序号按页面当前渲染的消息顺序计算，不是聊天文件中的永久记录 ID。

当前发布版本：v1.1.0。