# 企业管理工作台（Admin Workbench）

简约风 B 端企业内部管理工作台，基于 **Vue 3 + ECharts**，零 UI 库 / 零路由库 / 零状态管理库。

> 技术约束已全部遵守：`<script setup>` 写法；不引入 Element Plus / Ant Design Vue / Vant / vue-router / pinia / vuex；原生 CSS（主色 `#165DFF`）；仅引入 ECharts 做可视化；本地 mock 数据；原生组件切换模拟路由；PC 端优先自适应；手写弹窗 / 表格 / 分页 / 筛选 / 确认框 / Toast。

---

## 一、工程目录结构

```
workbench/
├── index.html                 # 入口 HTML
├── package.json               # 依赖与脚本
├── vite.config.js            # Vite 构建配置（base 相对路径，便于静态托管）
├── public/
│   └── _redirects             # Cloudflare Pages SPA 回退规则
└── src/
    ├── main.js                # 应用入口（createApp）
    ├── App.vue                # 登录状态控制 + 页面切换 + 全局组件挂载
    ├── mock.js                # 全量本地模拟数据（角色/任务/订单/项目/客户/通知/资源/权限）
    ├── store.js               # 轻量全局状态（reactive，非 pinia/vuex）
    ├── composables/
    │   └── useToast.js        # Toast 组合式函数
    ├── styles/
    │   └── global.css         # 全局样式（按钮/卡片/标签/表单等基础类）
    ├── components/            # 可复用基础组件
    │   ├── Icon.vue           # 内联 SVG 图标
    │   ├── SideNav.vue        # 左侧固定导航（按角色权限过滤菜单）
    │   ├── TopBar.vue         # 顶部栏（全局搜索 / 通知 / 用户菜单）
    │   ├── Breadcrumb.vue     # 面包屑
    │   ├── Modal.vue          # 原生弹窗
    │   ├── ConfirmDialog.vue  # 全局二次确认框
    │   ├── Toast.vue          # 全局轻提示
    │   ├── DataTable.vue      # 原生表格（排序/隔行/高亮/具名插槽）
    │   ├── Pagination.vue     # 原生分页
    │   └── FilterBar.vue      # 配置驱动筛选条
    └── pages/                 # 业务页面
        ├── Login.vue          # 登录页
        ├── Dashboard.vue      # 首页概览（指标卡 + 3 个 ECharts）
        ├── TaskList.vue       # 任务与待办（增删改查/批量/筛选/分页）
        ├── OrderList.vue      # 订单管理（筛选/排序/分页/导出 CSV）
        ├── ProjectList.vue    # 项目管理（进度/风险预警/关联任务）
        ├── CustomerList.vue   # 客户管理（回访记录/提醒标红）
        ├── NotificationCenter.vue # 通知中心（已读/全部已读/分类）
        ├── ResourceCenter.vue # 资源中心（分类/模拟下载）
        ├── PermissionManager.vue  # 系统权限管理（角色-模块矩阵，仅管理员）
        └── PersonalSettings.vue  # 个人设置（改密/个性化/提醒开关）
```

---

## 二、运行命令

```bash
# 1. 安装依赖
npm install

# 2. 本地开发（默认 http://localhost:5173）
npm run dev

# 3. 生产构建（输出 dist/）
npm run build

# 4. 本地预览构建产物
npm run preview
```

---

## 三、演示账号（密码统一为 `123456`）

登录页已内置「一键填充」按钮，点击即可登录对应角色。

| 账号 | 密码 | 角色 | 可见模块差异 |
| --- | --- | --- | --- |
| `superadmin` | 123456 | 超级管理员 | 全部模块 + 系统权限管理 |
| `pm` | 123456 | 项目经理 | 首页/任务/订单/项目/客户/通知/资源/设置 |
| `sales` | 123456 | 销售 | 首页/任务/订单/客户/通知/资源/设置 |
| `finance` | 123456 | 财务 | 首页/订单/通知/资源/设置 |
| `employee` | 123456 | 普通员工 | 首页/任务/通知/资源/设置 |

---

## 四、如何切换角色测试

1. 启动 `npm run dev` 并打开浏览器。
2. 在登录页点击左下角对应的角色「演示账号」标签（如「项目经理」），账号密码自动填入。
3. 点击「登录」进入后台。
4. **切换另一个角色**：点击右上角用户头像 → 「退出登录」，回到登录页后选择其他角色标签重新登录即可。
5. 重点对比：
   - **左侧导航**：不同角色看到的菜单数量不同（财务看不到「项目管理/客户管理」等；普通员工看不到「订单/项目/客户」）。
   - **首页指标卡**：每个角色展示的 4 个 KPI 各不相同（见 `mock.js` 的 `metricsByRole`）。
   - **系统权限管理**：仅 `superadmin` 在左侧导航可见，进入后可勾选每个角色可访问的模块，保存后刷新对应角色账号即可看到菜单实时变化。

---

## 五、部署到 Cloudflare Pages

1. 执行 `npm run build`，生成 `dist/` 目录。
2. 在 Cloudflare Pages 创建项目，构建命令填 `npm run build`，输出目录填 `dist`。
3. 上传/连接仓库或直接拖拽 `dist/` 上传。
4. `public/_redirects` 已被复制到 `dist/`，保证所有路径回退到 `index.html`（本项目为单页原生组件切换，无需真实路由，但保留该规则更稳妥）。

---

## 六、可扩展点

- 对接真实后端：将 `mock.js` 中各模块数据替换为 API 调用即可，页面逻辑无需改动。
- 权限联动：`store.js` 的 `canAccess()` 统一权限判定，`SideNav` 菜单与 `PermissionManager` 矩阵配置共用 `store.roles`。
- 图表：仅引入 ECharts，新增图表参考 `Dashboard.vue` 的 `renderCharts()` 写法。

---

## 七、安全说明（演示项目定位）

本项目为**纯前端 Mock 演示**，登录与权限均为前端模拟，**不可直接用于生产环境**。已完成的前端加固：

- 密码改为摘要存储/比较，账号表不保存明文；localStorage 会话附加签名并校验结构，防止手改 `role` 提权；
- `canAccess()` 统一权限判定 + `navigate()` 守卫 + `App.vue` 的 `watch` 兜底，越权跳转一律回退首页；
- 权限管理页仅超级管理员可进入；顶栏全局搜索按角色过滤数据源，避免跨角色读数据；
- `public/_headers` 提供 CSP / X-Frame-Options / nosniff / Referrer-Policy 等安全响应头（随构建进入 `dist/`）；
- 开发服务器仅监听 `127.0.0.1`；CSV 导出防公式注入；上传有扩展名白名单、20MB 上限与文件名净化。

**如需上线生产，必须**：接入后端鉴权（服务端密码哈希 + HttpOnly 会话或短期 token）、由服务端执行权限判定与数据过滤、移除演示账号入口、移除前端 mock 中的业务数据。完整审计与修复记录见 `安全审计报告.md`。

当前依赖：Vue 3.5.44 / Vite 6.4.6 / ECharts 6.1.0，`npm audit`（官方源）为 **0 漏洞**。

> 提示：安全加固后，旧的 localStorage 会话（无签名）会被判为无效并自动清除，**重新登录一次即可**。
