# Tavern Floor Floater

紧凑型酒馆楼层导航悬浮窗扩展，面向采用 SillyTavern 扩展结构的 TauriTavern / SillyTavern。

## 功能
- 可拖动悬浮窗并保存位置，支持折叠与展开
- 使用聊天消息元素的 `mesid` 系统编号；点击跳转时按系统编号查找目标消息
- 支持输入编号跳转、首条/上一条/下一条/最新 AI 回复快捷导航
- 搜索系统编号、消息角色与文本
- 消息列表可切换“全部预览 / 用户文本 / AI文本”，列表显示对应角色的文本摘要
- 定位时将目标消息滚动到视口首行附近（`block: start`）

## 安装
1. 下载仓库 ZIP：https://github.com/winxwang/Tavern-Floor-Floater/archive/refs/heads/main.zip
2. 解压后将 `Tavern-Floor-Floater` 文件夹放入 TauriTavern 实际使用的扩展目录。常见位置为 `data/default-user/extensions/`，具体以安装版本为准。
3. 重启酒馆，在扩展管理中启用 Tavern Floor Floater。
4. 打开聊天页面检查悬浮窗。

## 编号说明
扩展优先读取每条消息 DOM 元素上的 `mesid` / `data-mesid`，并用该系统编号进行显示、搜索和定位；不会把结果列表的显示序号当作楼层号。如果某条消息没有系统编号，才会临时回退到页面消息顺序。不同 TauriTavern 分支的 DOM 结构可能有差异。

## 兼容性说明
扩展依赖常见的 `#chat .mes` 消息 DOM 结构。建议更新后在副本或测试聊天中验证，尤其要确认当前 TauriTavern 版本的消息元素是否包含 `mesid` 属性。该项目尚未在你的本机 TauriTavern 环境中进行实机运行测试。

当前发布版本：v1.2.0。
