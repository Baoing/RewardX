# RewardX Plugin - 客户端游戏组件

客户端抽奖游戏组件，可以在 Shopify Storefront 和 Admin 预览中使用。

## 📁 项目结构

```
app/plugin/
├── component/
│   └── NineBoxLottery.tsx     # 九宫格抽奖组件
├── assets/                     # 静态资源（图片、字体等）
├── stores/                     # 客户端状态管理（如需）
├── utils/                      # 工具函数
├── index.html                  # 开发预览页面
├── main.tsx                    # 入口文件
└── README.md                   # 本文件
```

## 🚀 开发

### 1. 安装依赖

```bash
# 在项目根目录
npm install
```

### 2. 开发模式

```bash
npm run dev:plugin
```

访问 `http://localhost:5174` 查看预览。

### 3. 构建

```bash
npm run build:plugin
```

构建产物会输出到 `extensions/rewardx-lottery-extension/assets/lottery-game.js`。

## 💡 使用方式

### 方式 1：在 Admin 中预览（推荐）

直接导入组件使用：

```tsx
// app/routes/_app.campaigns.$id/components/PreviewGame.tsx
import { NineBoxLottery } from "@plugin/main"
import { observer } from "mobx-react-lite"
import { campaignEditorStore } from "@/stores/campaignEditorStore"

export const PreviewGame = observer(() => {
  const campaign = campaignEditorStore.editingCampaign

  if (!campaign) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
      <NineBoxLottery
        prizes={campaign.prizes}
        campaignStyles={campaign.styles}
        disabled={!campaign.isActive}
        onComplete={(prize) => {
          console.log("中奖:", prize)
        }}
      />
    </div>
  )
})
```

### 方式 2：在 Storefront 中使用

#### Step 1: 构建插件

```bash
npm run build:plugin
```

#### Step 2: 在 Theme Extension 中使用

创建 `extensions/rewardx-lottery-extension/blocks/app-embed.liquid`:

```liquid
{{ 'lottery-game.js' | asset_url | script_tag }}

<div
  data-rewardx-lottery
  data-campaign-id="{{ block.settings.campaign_id }}"
></div>

{% schema %}
{
  "name": "RewardX Lottery",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "campaign_id",
      "label": "Campaign ID"
    }
  ]
}
{% endschema %}
```

#### Step 3: 部署 Extension

```bash
shopify app deploy
```

## 🎨 组件 API

### NineBoxLottery

九宫格抽奖组件。

**Props:**

```typescript
interface NineBoxLotteryProps {
  // 奖品列表（最多 8 个）
  prizes: Prize[]
  
  // 样式配置
  campaignStyles?: CampaignStyles
  
  // 抽奖完成回调
  onComplete?: (prize: Prize) => void
  
  // 是否禁用
  disabled?: boolean
}
```

**Prize 类型:**

```typescript
interface Prize {
  id: string
  type: "discount_percentage" | "discount_fixed" | "free_gift" | "no_prize"
  label: string              // 奖品名称
  value?: number             // 折扣值
  totalStock: number         // 总库存
  usedStock: number          // 已使用库存
  chancePercentage: number   // 中奖概率
  image?: string             // 奖品图片
}
```

**CampaignStyles 类型:**

```typescript
interface CampaignStyles {
  titleColor?: string                      // 标题颜色
  mainTextColor?: string                   // 主文字颜色
  mainBackgroundColor?: string             // 主背景颜色
  moduleContainerBackgroundColor?: string  // 容器背景颜色（默认#FFCFA7）
  moduleBorderColor?: string               // 边框颜色（默认#FF841F）
  moduleDotsColor?: string                // 点颜色（默认#FFCFA7）
  moduleMainBackgroundColor?: string       // 主背景颜色（默认#1A0202）
  moduleCardBackgroundColor?: string       // 卡片背景颜色
  moduleButtonColor?: string               // 按钮颜色
  footerTextColor?: string                 // 底部文字颜色
  customCSS?: string                       // 自定义 CSS
}
```

## 🔧 配置

### Vite 配置

配置文件：`vite.config.client.ts`

- **输出格式**: IIFE（立即执行函数表达式）
- **输出目录**: `extensions/lottery-game/assets/`
- **入口文件**: `app/plugin/main.tsx`

### 路径别名

在 `vite.config.client.ts` 中配置：

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./app"),
    "@plugin": path.resolve(__dirname, "./app/plugin")
  }
}
```

在代码中使用：

```typescript
import { NineBoxLottery } from "@plugin/component/NineBoxLottery"
import { userInfoStore } from "@/stores"
```

## 📝 开发注意事项

1. **类型定义**：所有类型定义应与后端保持一致，放在 `main.tsx` 中
2. **样式隔离**：使用 inline styles 或 CSS-in-JS 避免样式冲突
3. **Bundle 大小**：注意控制打包体积，生产环境会自动移除 console
4. **兼容性**：代码会被编译为 ES2020，支持主流现代浏览器

## 🐛 调试

### 开发环境

```bash
npm run dev:plugin
```

打开浏览器控制台查看日志。

### 生产环境

在 Storefront 中，打开浏览器控制台查看 `RewardX` 全局对象：

```javascript
console.log(window.RewardX)
```

## 📦 构建产物

运行 `npm run build:plugin` 后，会生成：

- `extensions/lottery-game/assets/lottery-game.js` - 主文件（IIFE 格式）
- `extensions/lottery-game/assets/lottery-game.css` - 样式文件（如果有）

这些文件可以直接在 Shopify Theme Extension 中使用。

## 🔗 与后端集成

### API 接口（需要后端实现）

1. **获取活动数据**
   - `GET /api/campaigns/:id`

2. **执行抽奖**
   - `POST /api/lottery/play`
   - 参数: `{ campaignId, orderId }`

3. **验证订单**
   - `POST /api/lottery/verify-order/:orderId`

## 📄 License

MIT

