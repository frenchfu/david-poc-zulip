# 關貿通訊 (Tradevan Chat - Next-Gen Flutter) - App 打包與發布標準作業指南

本指南專為管理者、維運團隊與開發工程師編寫，詳細說明如何建置、打包與發布 **關貿通訊 Zulip Flutter 次世代（Next-Gen）行動應用程式**（支援 Android APK 與 iOS App）。

---

## 🔒 核心資安原則：機敏資訊保護（零外洩警戒）

> [!CAUTION] 嚴禁將任何機敏憑證或金鑰推送到公開或未授權的 Git 倉儲！
> 本專案 `.gitignore` 已嚴格配置下列排除規則，任何開發者或管理者均**不可**強制（`-f`）提交：
> 1. `android/app/google-services.json`（Google Firebase Android 金鑰）
> 2. `ios/Runner/GoogleService-Info.plist`（Google Firebase iOS 憑證）
> 3. `*.keystore` / `*.jks`（Android 生產環境簽署私鑰）
> 4. `release-keystore.properties`（簽名密鑰庫帳號密碼檔）
> 5. `*.p12` / `*.mobileprovision`（Apple Developer 企業簽章憑證與描述檔）
> 6. `local.properties` / `android/local.properties`（個人本機 SDK 路徑）

---

## 一、 系統與開發環境需求

次世代 Zulip Flutter 採用最新 Flutter/Dart 架構與底層 Native C/C++（端到端加密庫 libsodium），請確保打包伺服器或工作站具備以下環境：

| 工具 / 元件 | 建議版本 | 說明 |
| :--- | :--- | :--- |
| **作業系統** | macOS Sequoia / Sonoma | 支援同時打包 Android APK 與 iOS IPA |
| **Flutter SDK** | `>= 3.49.0` (建議 `3.50.0-0.1.pre` 以上) | 需支援 Dart 3.15+ |
| **Java JDK** | **OpenJDK 17** (`17.0.x`) | Gradle 9.3+ 與 AGP 9.1+ 必須使用 Java 17 |
| **Android SDK** | API 34 / 35 / 36 | 需安裝 Build-Tools 與 Command-line Tools |
| **Android NDK** | `28.2.13676358` | 編譯 libsodium 與 native JNI 模組必備 |
| **CMake** | `3.22.1` 以上 | Android NDK C++ 編譯器 |
| **Xcode** | Xcode 15 / 16 | 包含 iOS SDK 17+ 及 Command Line Tools |
| **CocoaPods** | `1.16+` | 管理 iOS Pod 依賴套件 |

### 環境變數設定範例 (`~/.zshrc` 或 CI/CD Script)
```bash
export JAVA_HOME="/opt/homebrew/Cellar/openjdk@17/17.0.20.1/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$HOME/flutter/bin:$ANDROID_HOME/platform-tools:$PATH"
```

---

## 二、 關貿通訊專屬客製化配置說明

本專案已完成以下關貿企業形象與連線專屬客製：

1. **伺服器預設連線位置**：
   - 檔案：`lib/widgets/login.dart`
   - 預設預填為：`https://david-poc-zulip.ccwu.cc`
   - 使用者開啟 App 登入時無需手動輸入網址，可直接點擊下一步進行 LDAP 或 Email 驗證。
2. **App 顯示名稱**：
   - Android (`android/app/src/main/AndroidManifest.xml`)：`android:label="關貿通訊"`
   - iOS (`ios/Runner/Info.plist`)：`CFBundleDisplayName` 與 `CFBundleName` 設為 `關貿通訊`
3. **企業圖示（App Icons）**：
   - Android：`android/app/src/main/res/mipmap-*` 內嵌關貿深藍底色（`#172347`）高解析向量圖示
   - iOS：`ios/Runner/Assets.xcassets/AppIcon.appiconset` 內嵌全尺寸關貿官方圖示（20x20 至 1024x1024）
4. **AGP 9 與 Kotlin 相容性修正（核心關鍵）**：
   - `packages/zulip_plugin/android/build.gradle.kts`：命名空間獨立設為 `com.zulip.flutter.shim`，解決 AGP 9 禁止命名空間重複的限制。
   - `android/app/build.gradle.kts`：設置 `ndkVersion = "28.2.13676358"`，避免多架構加密庫版號不相容。

---

## 三、 Android APK 打包標準作業程序

### 步驟 1：取得專案並更新依賴
```bash
cd appdev/zulip-flutter
flutter pub get
```

### 步驟 2：確認 Firebase 設定檔存在
請將公司專屬的 `google-services.json` 放置於：
```
appdev/zulip-flutter/android/app/google-services.json
```
*(注意：此檔案受 `.gitignore` 保護，切勿提交至 Git)*

### 步驟 3：執行 Release 打包指令
```bash
flutter build apk --release --android-skip-build-dependency-validation
```

* 產出檔案位置：`build/app/outputs/flutter-apk/app-release.apk`
* 檔案大小約：80 ~ 83 MB（內含全架構 Native libsodium 庫）

### 步驟 4：自訂企業生產簽名（可選）
若需簽署正式 Keystore：
1. 建立 `android/release-keystore.properties`（受 `.gitignore` 保護）：
   ```properties
   storeFile=/path/to/tradevan.keystore
   storePassword=YourStorePassword
   keyAlias=tradevan
   keyPassword=YourKeyPassword
   ```
2. 打包時加上 `-Psigned` 參數：
   ```bash
   flutter build apk --release -- -Psigned
   ```

---

## 四、 iOS App 打包標準作業程序

### 步驟 1：下載 iOS Engine 依賴
在初次或全新工作站建置時，先執行預載入：
```bash
cd appdev/zulip-flutter
flutter precache --ios
```

### 步驟 2：安裝 CocoaPods 依賴
```bash
cd ios
pod install
cd ..
```

### 步驟 3：建置 iOS Release 套件
若為內部測試或免簽名建置：
```bash
flutter build ios --no-codesign
```
* 產出位置：`build/ios/iphoneos/Runner.app`

若透過 Xcode 進行正式企業簽名或 TestFlight 發布：
```bash
open ios/Runner.xcworkspace
```
1. 於 Xcode 選取 `Runner` Target ➡ **Signing & Capabilities**。
2. 選擇關貿 Apple Developer Team 憑證。
3. 頂部選單選擇 **Product** ➡ **Archive**。
4. 在 Organizer 點擊 **Distribute App** 匯出 `.ipa` 或直接上傳 TestFlight。

---

## 五、 發布到下載專區門戶（Download Portal）

本 PoC 環境設有專屬的下載入口網站，建置完成後可透過以下方式部署：

1. **複製 APK 到靜態網站目錄**：
   ```bash
   cp build/app/outputs/flutter-apk/app-release.apk /Users/Developer/zulip-poc/download-portal/www/apk/TradevanChat-Flutter.apk
   ```
2. **驗證下載連結與 QR Code**：
   - 瀏覽器打開：`https://download.david-poc-zulip.ccwu.cc/flutter/`
   - Android 直接下載連結：`https://download.david-poc-zulip.ccwu.cc/flutter/android`
   - 驗證 HTTP 標頭：
     ```bash
     curl -sI https://download.david-poc-zulip.ccwu.cc/apk/TradevanChat-Flutter.apk
     # 應回傳 HTTP/2 200，Content-Type: application/vnd.android.package-archive
     ```

---

## 六、 常見問題排除（Troubleshooting）

| 錯誤現象 | 原因說明 | 排除方式 |
| :--- | :--- | :--- |
| `cannot find symbol class FilePickerPlugin` | AGP 9 與外掛 plugin 判定脫鉤 | 確保 `file_picker` 的 `build.gradle` 有套用 `org.jetbrains.kotlin.android`。 |
| `Namespace 'com.zulip.flutter' is used in multiple modules` | 主 App 與 shim plugin 命名空間相同 | 確保 `packages/zulip_plugin/android/build.gradle.kts` 的 namespace 設為 `com.zulip.flutter.shim`。 |
| `requires Android NDK 28.2.13676358` | libsodium native 需要較新 NDK | 於 `android/app/build.gradle.kts` 的 `android {}` 區塊明確指定 `ndkVersion = "28.2.13676358"`。 |
| `Flutter.xcframework must exist` | 未快取 iOS Flutter 引擎 | 於專案根目錄執行 `flutter precache --ios` 即可修復。 |
