# Requirements Document

## Introduction

根据 Prismo 模板的"柔光晚霞"视觉语言，对八字命理 AI 智能分析系统的前端页面进行全面视觉升级。核心目标是打造一个温暖、神秘、高转化的命理工具，让用户感受到"暮色渐浓，霞光满天"的沉静与神秘感。

## Glossary

- **Prismo_Style**: 参考 Prismo 模板的视觉设计风格，特点是柔和渐变、颗粒质感、暖色神秘
- **Glass_Card**: 毛玻璃效果卡片组件，具有半透明背景和模糊效果
- **Pill_Button**: 胶囊形按钮，圆角为 100px，Prismo 风格的主要 CTA 样式
- **Grain_Overlay**: 颗粒纹理覆盖层，增加印刷品般的触感
- **Blur_Cloud**: 弥散光晕，用于背景的渐变色块
- **Social_Proof**: 社会证明组件，包含用户头像堆叠和评分展示
- **Bento_Grid**: Bento 网格布局，用于展示功能卡片

## Requirements

### Requirement 1: 全局背景系统升级

**User Story:** As a user, I want to see a warm sunset-inspired background, so that I feel the mystical atmosphere of fortune telling.

#### Acceptance Criteria

1. THE Global_Styles SHALL use `#F5F0EB` (暖杏白) as the base background color
2. THE Global_Styles SHALL render four Blur_Cloud layers with deep indigo at top-left, warm coral at top-right, rose violet at bottom-right, and soft violet at bottom-left
3. THE Global_Styles SHALL apply `filter: blur(100px-150px)` to all Blur_Cloud layers
4. THE Global_Styles SHALL overlay a Grain_Overlay texture at 5%-10% opacity across the entire viewport
5. THE Global_Styles SHALL ensure the background remains fixed during page scroll

### Requirement 2: 色彩体系更新

**User Story:** As a user, I want consistent warm colors throughout the app, so that the visual experience feels cohesive and calming.

#### Acceptance Criteria

1. THE Global_Styles SHALL define CSS custom property `--bg-base` as `#F5F0EB`
2. THE Global_Styles SHALL define CSS custom property `--text-primary` as `#1A1A1A`
3. THE Global_Styles SHALL define CSS custom property `--text-muted` as `rgba(0,0,0,0.5)`
4. THE Global_Styles SHALL define CSS custom property `--accent-orange` as `#F97518`
5. THE Global_Styles SHALL define CSS custom property `--card-bg` as `#FFFFFF`
6. THE Global_Styles SHALL define CSS custom property `--border-subtle` as `rgba(0,0,0,0.08)`

### Requirement 3: 胶囊按钮组件

**User Story:** As a user, I want visually appealing call-to-action buttons, so that I am encouraged to interact with the app.

#### Acceptance Criteria

1. THE Pill_Button SHALL have a background color of `#1A1A1A` (near black)
2. THE Pill_Button SHALL have white text color `#FFFFFF`
3. THE Pill_Button SHALL have border-radius of `100px` (capsule shape)
4. WHEN user hovers over Pill_Button, THE Pill_Button SHALL translate upward by 2px and increase shadow
5. THE Secondary_Button SHALL have transparent or white background with `1px solid rgba(0,0,0,0.15)` border

### Requirement 4: Glass Card 组件升级

**User Story:** As a user, I want elegant card containers, so that content is clearly organized and visually appealing.

#### Acceptance Criteria

1. THE Glass_Card SHALL have background `rgba(255,255,255,0.6)`
2. THE Glass_Card SHALL apply `backdrop-filter: blur(12px)`
3. THE Glass_Card SHALL have border `1px solid rgba(255,255,255,0.5)`
4. THE Glass_Card SHALL have border-radius between 16px and 24px
5. THE Glass_Card SHALL have box-shadow `0 8px 32px rgba(0,0,0,0.06)`
6. WHEN user hovers over Glass_Card, THE Glass_Card SHALL scale to 1.02

### Requirement 5: 首页 Hero Section 重构

**User Story:** As a visitor, I want an impressive landing page, so that I understand the value proposition and feel compelled to try the service.

#### Acceptance Criteria

1. THE Hero_Section SHALL display a centered large title with font-size 52px-72px
2. THE Hero_Section SHALL display a subtitle below the main title
3. THE Hero_Section SHALL contain a black Pill_Button with text "立即排盘"
4. THE Hero_Section SHALL display a Social_Proof component with star rating, stacked user avatars, and "X+ 用户信赖" text
5. THE Hero_Section SHALL use the Prismo-style background with Blur_Clouds and Grain_Overlay

### Requirement 6: 首页功能卡片区域

**User Story:** As a visitor, I want to see the key features clearly, so that I understand what the service offers.

#### Acceptance Criteria

1. THE Feature_Section SHALL use a three-column Bento_Grid layout on desktop
2. WHEN viewport width is less than 768px, THE Feature_Section SHALL switch to single-column layout
3. THE Feature_Card SHALL use Glass_Card styling
4. THE Feature_Card SHALL contain an icon, title, and description

### Requirement 7: 登录页面优化

**User Story:** As a user, I want a clean and inviting login experience, so that I feel comfortable creating an account.

#### Acceptance Criteria

1. THE Login_Page SHALL display a centered Glass_Card form container
2. THE Login_Page SHALL use the same Prismo-style background as the homepage
3. THE Login_Form SHALL provide tab switching between phone login and username/password login
4. THE Login_Form SHALL use Pill_Button style for the submit button
5. THE Input_Fields SHALL have warm-toned styling consistent with the design system

### Requirement 8: 八字排盘页面优化

**User Story:** As a user, I want a clear and organized bazi calculation interface, so that I can easily input my birth information and view results.

#### Acceptance Criteria

1. THE Bazi_Form SHALL be contained in a white Glass_Card
2. THE Bazi_Results SHALL use Bento_Grid layout to display four pillars information
3. THE Five_Elements_Chart SHALL be displayed in a separate Glass_Card
4. THE AI_Analysis_Section SHALL show a blur overlay with orange unlock button when locked
5. WHEN AI analysis is unlocked, THE AI_Analysis_Section SHALL display content in tabbed format

### Requirement 9: 历史记录页面优化

**User Story:** As a user, I want to easily browse and view my past readings, so that I can reference them later.

#### Acceptance Criteria

1. THE History_Page SHALL use a two-column layout with 1:2 ratio (list:detail)
2. THE Report_List SHALL be scrollable with Glass_Card styled items
3. WHEN user selects a report, THE Report_Item SHALL show purple border highlight
4. THE Report_Detail SHALL display lunar date and generation time

### Requirement 10: 积分中心页面优化

**User Story:** As a user, I want a clear view of my points balance and recharge options, so that I can manage my account easily.

#### Acceptance Criteria

1. THE Balance_Card SHALL display current points in large gradient text
2. THE Package_Grid SHALL use four-column layout on desktop
3. WHEN user hovers over Package_Card, THE Package_Card SHALL scale up slightly
4. THE Transaction_List SHALL differentiate recharge (green) and consumption (red) with colors

### Requirement 11: 用户中心页面优化

**User Story:** As a user, I want quick access to my account information and common actions, so that I can manage my profile efficiently.

#### Acceptance Criteria

1. THE Profile_Card SHALL display avatar, username/phone, and three-column statistics
2. THE Quick_Actions SHALL use a four-grid icon button layout
3. THE Quick_Action_Button SHALL include icons for bazi, history, points, and logout

### Requirement 12: 动效系统

**User Story:** As a user, I want smooth animations, so that the interface feels polished and responsive.

#### Acceptance Criteria

1. WHEN page loads, THE Page_Content SHALL animate with staggered fade-in-up effect with 0.5s duration and 0.1s delay per item
2. WHEN user hovers over CTA buttons, THE Button SHALL translate up 2px with enhanced shadow
3. WHEN user hovers over cards, THE Card SHALL scale to 1.02
4. THE Loading_State SHALL display a spinning animation

### Requirement 13: 响应式布局

**User Story:** As a user, I want the app to work well on all devices, so that I can use it on my phone or computer.

#### Acceptance Criteria

1. WHEN viewport width is less than 768px, THE Layout SHALL switch to single-column mobile layout
2. WHEN viewport width is between 768px and 1024px, THE Layout SHALL use two-column tablet layout
3. WHEN viewport width is greater than 1024px, THE Layout SHALL use full multi-column desktop layout

### Requirement 14: 社会证明组件

**User Story:** As a visitor, I want to see that others trust this service, so that I feel confident using it.

#### Acceptance Criteria

1. THE Social_Proof SHALL display 5-star rating visualization
2. THE Social_Proof SHALL show stacked user avatars (3-5 overlapping circles)
3. THE Social_Proof SHALL display user count text like "1000+ 用户信赖"
