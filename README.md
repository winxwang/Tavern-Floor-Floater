# Tavern Floor Floater

紧凑型酒馆楼层导航悬浮窗扩展，面向采用 SillyTavern 扩展结构的 TauriTavern / SillyTavern。

## 功能
- 可拖动悬浮窗并保存位置，支持折叠与展开
- 使用聊天消息元素的 `mesid` / `data-mesid` 系统编号进行显示和定位
- 支持编号跳转、最早消息、上一条/下一条、最新 AI 回复
- 可按全部消息、用户消息或 AI 消息筛选
- **为避免长篇聊天文本导致界面卡顿，已移除正文预览和正文搜索**；列表仅显示系统编号和角色标识
- 消息 DOM 变更使用短延迟合并刷新，减少连续更新时的重复扫描

## 安装
1. 下载仓库 ZIP：https://github.com/winxwang/Tavern-Floor-Floater/archive/refs/heads/main.zip
2. 解压后将 `Tavern-Floor-Floater` 文件夹放入 TauriTavern 实际使用的扩展目录。常见位置为 `data/default-user/extensions/`，具体以安装版本为准。
3. 重启酒馆，在扩展管理中启用 Tavern Floor Floater。

## 编号说明
扩展优先读取消息 DOM 元素的 `mesid` / `data-mesid` 属性；若当前版本没有该属性，则回退为页面消息顺序。不同 TauriTavern 分支的 DOM 结构可能有差异。

## 兼容性说明
依赖常见的 `#chat .mes` 消息 DOM 结构。尚未在用户本机 TauriTavern 环境中进行实机运行测试。

- 悬浮窗新增最新 AI 回复预览，展示最新一条 AI 消息的前 420 个字符，点击预览可跳转到对应楼层；仅在聊天内容更新时刷新预览，避免滚动时重复读取正文。\n\n- 将「最新 AI 回复」跳转按钮移至悬浮窗标题栏，折叠/最小化后仍可直接点击；最小化状态保留按钮并适当调整窗口宽度。\n\n当前版本：v1.2.4。\n\n悬浮窗标题栏会显示当前扩展版本号。
