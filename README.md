# Tavern Floor Floater

紧凑型酒馆楼层导航悬浮窗扩展，面向采用 SillyTavern 扩展结构的 TauriTavern / SillyTavern。

## v1.4.0 更新
- 在发送框扩展按钮区域增加「⌖」启动入口，点击即可打开悬浮窗；酒馆延迟创建发送框时会自动补挂。
- 悬浮窗标题栏新增「×」关闭按钮；关闭只隐藏面板，不停用扩展，可随时从发送框入口重新打开。
- 最小化工具条保留「✦ 最新 AI 回复」「⇣ 聊天末尾」，并增加「×」关闭符号。
- 保留 v1.3.0 的双击展开/收起、图标快捷操作、拖动定位和玻璃质感外观。

## 功能
- 从发送框扩展按钮打开或重新打开悬浮窗
- 可关闭悬浮窗，关闭后可从发送框按钮恢复
- 可拖动悬浮窗并保存位置，支持按钮折叠与双击展开/收起
- 使用聊天消息元素的 `mesid` / `data-mesid` 系统编号进行显示和定位
- 支持编号跳转、上一条/下一条、最新 AI 回复和聊天末尾
- 可按全部消息、用户消息或 AI 消息筛选
- 楼层列表不读取消息正文；最新 AI 预览仅读取最新回复前 420 个字符

## 安装
1. 下载仓库 ZIP：https://github.com/winxwang/Tavern-Floor-Floater/archive/refs/heads/main.zip
2. 解压后将 `Tavern-Floor-Floater` 文件夹放入 TauriTavern 实际使用的扩展目录。常见位置为 `data/default-user/extensions/`，具体以安装版本为准。
3. 重启酒馆，在扩展管理中启用 Tavern Floor Floater。

## 兼容性说明
依赖常见的 `#chat .mes` 消息 DOM 结构，并尝试挂载到 `#send_form` 内的扩展按钮区域。不同 TauriTavern 分支的发送框 DOM 结构可能有差异；如未出现启动按钮，需要针对该版本的发送框容器选择器适配。

当前版本：v1.4.0。
