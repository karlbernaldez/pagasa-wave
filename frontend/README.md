# DOST-MECO-TECO-VOTE III: Establishment of Seamless Prediction Capability on Typhoon, Marine Meteorology, and Short-Range Climate (PROJECT 1)

## 🌍 Overview
This web application provides an interactive weather forecasting platform using **React** and **Mapbox**. It allows users to visualize weather data, overlay model outputs, and manually draw annotations for weather events such as storms or typhoons.

## 🚀 Features
- **🗺 Interactive Map** (Mapbox integration)
- **📊 Weather Model Overlay** (Future implementation)
- **✏️ User Annotations** (Draw on the map with customizable tools)
- **✏️ Drawing Controls** (Start, Stop, and Clear drawings)

## 📂 Project Structure
```
📦 wave-app
 ┣ 📂 public
 ┃ ┣ 📜 index.html
 ┃ ┣ ⚡ map-pin.png 
 ┃ ┗ ⚡ pagasa-logo.png
 ┣ 📂 src
 ┃ ┣ 📂 api
 ┃ ┣ 📂 assets
 ┃ ┃ ┣ 📂 features_cover_images
 ┃ ┃ ┣ 🖼️ chart_sample.png
 ┃ ┃ ┣ 🖼️ colorImpairedImage.png
 ┃ ┃ ┣ 🖼️ combo_chart.png
 ┃ ┃ ┣ 📄 Copyright.svg
 ┃ ┃ ┣ 📄 Facebook.svg
 ┃ ┃ ┣ 🖼️ Instagram.png
 ┃ ┃ ┣ 📄 Line.png
 ┃ ┃ ┣ 📄 line1.png
 ┃ ┃ ┣ 🖼️ Linkedin.png
 ┃ ┃ ┣ 🖼️ meteorologist.png
 ┃ ┃ ┣ 🖼️ meteorologist_dark.png
 ┃ ┃ ┣ 📄 Twitter.svg
 ┃ ┣ 📂 components
 ┃ ┃ ┣ 📂 Edit
 ┃ ┃ ┃ ┣ 📂 draw
 ┃ ┃ ┃ ┃ ┣ 📜 canvas.jsx
 ┃ ┃ ┃ ┃ ┣ 📜 circle.js
 ┃ ┃ ┃ ┃ ┣ 📜 control.js
 ┃ ┃ ┃ ┃ ┣ 📜 linestring.js
 ┃ ┃ ┃ ┃ ┣ 📜 rectangle.js
 ┃ ┃ ┃ ┃ ┣ 📜 simple_select.js
 ┃ ┃ ┃ ┃ ┣ 📜 styles.js
 ┃ ┃ ┃ ┃ ┣ 📜 util.js
 ┃ ┃ ┃ ┗ 📂 styles
 ┃ ┃ ┃ ┣ 📜 LayerpanelStyles.js
 ┃ ┃ ┃ ┣ 📜 ToolBarStyles.js
 ┃ ┃ ┃ ┗ 📂 utils
 ┃ ┃ ┃ ┃ ┣ 📜 ToolBarUtils.js
 ┃ ┃ ┃ ┃ ┣ 📜 layerUtils.js
 ┃ ┃ ┃ ┣ 📜 LayerItem.jsx
 ┃ ┃ ┃ ┣ 📜 LayerPanel.jsx
 ┃ ┃ ┃ ┣ 📜 MapComponent.jsx
 ┃ ┃ ┃ ┣ 📜 Toolbar.jsx
 ┃ ┃ ┣ 📂 Home
 ┃ ┃ ┃ ┣ 📜 Feature.jsx
 ┃ ┃ ┃ ┣ 📜 HeroSection.jsx
 ┃ ┃ ┣ 📂 Marine
 ┃ ┃ ┃ ┣ 📜 Chart.jsx
 ┃ ┃ ┃ ┣ 📜 MarineStyle.jsx
 ┃ ┃ ┃ ┣ 📜 OptionBox.jsx
 ┃ ┃ ┃ ┣ 📜 toggleSelection.jsx
 ┃ ┃ ┗ 📂 modals
 ┃ ┃ ┃ ┣ 📜 MarkerTitleModal.jsx
 ┃ ┃ ┃ ┣ 📜 MobileAccessModal.jsx
 ┃ ┃ ┣ 📜 Footer.jsx
 ┃ ┃ ┣ 📜 Header.jsx
 ┃ ┃ ┣ 📜 Logo.jsx
 ┃ ┣ 📂 hooks
 ┃ ┃ ┣ 📜 useIsMobile.jsx
 ┃ ┣ 📂 pages
 ┃ ┃ ┣ 📜 Edit.jsx
 ┃ ┃ ┣ 📜 Home.jsx
 ┃ ┃ ┣ 📜 Marine.jsx
 ┃ ┣ 📂 styles
 ┃ ┃ ┣ 📜 index.css
 ┃ ┃ ┗ 📜 theme.jsx
 ┃ ┣ 📂 utils
 ┃ ┃ ┣ 📜 mapSetup.js
 ┃ ┃ ┣ 📜 mapUtils.js
 ┃ ┣ 📜 App.jsx
 ┃ ┗ 📜 index.js
 ┣ 📜 .env
 ┣ 📜 package.json
 ┣ 📜 README.md
 ┣ 📜 LICENSE
```

## 🛠 Installation & Setup
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/karlbernaldez/VOTE.git
cd wave-app
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Add Mapbox Access Token
1. Create a `.env` file in the root directory
2. Add your **Mapbox Token**:
   ```sh
   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   ```

### 4️⃣ Start the Development Server
```sh
npm run dev
```

## 🎨 Usage
1. Navigate to the **Sidebar** to select different tools.
2. Use the **Map** to interact with weather models and overlays.
3. Click **Start Drawing** to annotate potential storm areas.
4. Click **Clear All** to remove all annotations.

## 🛠 Technologies Used
- **React** (Frontend Framework)
- **Mapbox GL JS** (Interactive Mapping)
- **Tailwind CSS** (Styling)
- **Vite** (Bundler)

## 📝 To-Do List
- [ ] Integrate live weather model data
- [ ] Improve drawing tools (e.g., different colors, shapes).
- [ ] Add export/save functionality for drawings

## 📜 License
This project is licensed under the **[MIT license](https://github.com/karlbernaldez/Vote-wave/blob/main/LICENSE)**.

## 🙌 Contributing
Feel free to submit issues or pull requests to improve the app!

## Modules / Component
